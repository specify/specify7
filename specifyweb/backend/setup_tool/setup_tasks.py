"""
A Celery task for setting up the database in the background.
"""

from django.db import transaction
from specifyweb.celery_tasks import app
from typing import Tuple, Optional
from celery.result import AsyncResult
from specifyweb.backend.setup_tool import api
from specifyweb.backend.setup_tool.app_resource_defaults import create_app_resource_defaults
from specifyweb.backend.setup_tool.tree_defaults import start_preload_default_tree
from specifyweb.specify.management.commands.run_key_migration_functions import fix_schema_config
from specifyweb.specify.models_utils.model_extras import PALEO_DISCIPLINES, GEOLOGY_DISCIPLINES
from specifyweb.celery_tasks import is_worker_alive, MissingWorkerError
from specifyweb.backend.redis_cache.store import set_string, get_string
from specifyweb.backend.setup_tool.redis import ACTIVE_TASK_REDIS_KEY, ACTIVE_TASK_TTL, LAST_ERROR_REDIS_KEY
from specifyweb.backend.setup_tool.task_tracking import (
    queue_collection_background_task,
    finish_collection_background_task,
)

from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

def setup_database_background(data: dict) -> str:
    # Clear any previous error logs.
    set_last_setup_error(None)

    if not is_worker_alive():
        set_last_setup_error("The Specify Worker is not running.")
        raise MissingWorkerError("The Specify Worker is not running.")

    task_id = str(uuid4())
    logger.debug(f'task_id: {task_id}')

    args = [data]

    task = setup_database_task.apply_async(args, task_id=task_id)

    set_string(ACTIVE_TASK_REDIS_KEY, task.id, time_to_live=ACTIVE_TASK_TTL)
    
    return task.id

def queue_fix_schema_config_background(collection_id: Optional[int] = None) -> str:
    """Queue fix_schema_config to run asynchronously and return the task id"""
    args = [collection_id] if collection_id is not None else []
    task = fix_schema_config_task.apply_async(args=args)
    if collection_id is not None:
        queue_collection_background_task(collection_id, task.id)
    return task.id

def get_active_setup_task() -> Tuple[Optional[AsyncResult], bool]:
    """Return the current setup task if it is active, and also if it is busy."""
    task_id = get_string(ACTIVE_TASK_REDIS_KEY)

    if not task_id:
        return None, False

    res = app.AsyncResult(task_id)
    busy = res.state in ("PENDING", "RECEIVED", "STARTED", "RETRY", "PROGRESS")

    # Check if the last task ended
    if not busy and res.state in ("SUCCESS", "FAILURE", "REVOKED"):
        # Get error message if any.
        if res.state == "FAILURE":
            info = getattr(res, "info", None)
            if isinstance(info, dict):
                error = info.get("error") or info.get("exc_message") or info.get("message") or repr(info)
            else:
                error = str(info)
            set_last_setup_error(error)
        # Clear the setup id if its not busy.
        # Commented out to allow error messages to be checked multiple times.
        # if _active_setup_task_id == task_id:
        #     _active_setup_task_id = None
    return res, busy

DEFAULT_TREE = {
    'ranks': {}
}


def _required_treedef_id(tree_result: dict, tree_name: str) -> int:
    treedef_id = tree_result.get('treedef_id')
    if treedef_id is None:
        raise ValueError(f'{tree_name} tree creation did not return treedef_id')
    return treedef_id

@app.task(bind=True)
def setup_database_task(self, data: dict):
    """Execute all database setup steps in order."""
    from specifyweb.specify.models import Discipline
    self.update_state(state='STARTED', meta={'progress': api.get_setup_resource_progress()})
    def update_progress():
        self.update_state(state='STARTED', meta={'progress': api.get_setup_resource_progress()})

    try:
        with transaction.atomic():
            logger.debug('## SETTING UP DATABASE WITH SETTINGS:##')
            logger.debug(data)

            logger.info('Creating institution')
            api.create_institution(data['institution'])
            update_progress()

            logger.info('Creating storage tree')
            api.create_storage_tree(data['storagetreedef'])
            update_progress()

            logger.info('Creating division')
            api.create_division(data['division'])
            update_progress()

            discipline_type = data['discipline'].get('type', '')
            is_paleo_geo = discipline_type in PALEO_DISCIPLINES or discipline_type in GEOLOGY_DISCIPLINES
            default_tree = DEFAULT_TREE.copy()

            # if is_paleo_geo:
            # Create an empty chronostrat tree no matter what because discipline needs it.
            logger.info('Creating Chronostratigraphy tree')
            default_chronostrat_tree = default_tree.copy()
            default_chronostrat_tree['fullnamedirection'] = -1
            chronostrat_result = api.create_geologictimeperiod_tree(default_chronostrat_tree)
            chronostrat_treedef_id = _required_treedef_id(chronostrat_result, 'Geologictimeperiod')

            logger.info('Creating geography tree')
            uses_global_geography_tree = data['institution'].get('issinglegeographytree', False)
            geography_result = api.create_geography_tree(data['geographytreedef'].copy(), global_tree=uses_global_geography_tree)
            geography_treedef_id = _required_treedef_id(geography_result, 'Geography')

            logger.info('Creating discipline')
            discipline_result = api.create_discipline(data['discipline'])
            discipline_id = discipline_result.get('discipline_id')
            default_tree['discipline_id'] = discipline_id
            update_progress()

            lithostrat_treedef_id = None
            tectonicunit_treedef_id = None
            if is_paleo_geo:
                logger.info('Creating Lithostratigraphy tree')
                lithostrat_result = api.create_lithostrat_tree(default_tree.copy())
                lithostrat_treedef_id = _required_treedef_id(lithostrat_result, 'Lithostrat')

                logger.info('Creating Tectonic Unit tree')
                tectonicunit_result = api.create_tectonicunit_tree(default_tree.copy())
                tectonicunit_treedef_id = _required_treedef_id(tectonicunit_result, 'Tectonicunit')

            logger.info('Creating taxon tree')
            if data['taxontreedef'].get('discipline_id') is None:
                data['taxontreedef']['discipline_id'] = discipline_id
            taxon_result = api.create_taxon_tree(data['taxontreedef'].copy())
            taxon_treedef_id = _required_treedef_id(taxon_result, 'Taxon')

            Discipline.objects.filter(id=discipline_id).update(
                geographytreedef_id=geography_treedef_id,
                taxontreedef_id=taxon_treedef_id,
                geologictimeperiodtreedef_id=chronostrat_treedef_id,
                lithostrattreedef_id=lithostrat_treedef_id,
                tectonicunittreedef_id=tectonicunit_treedef_id,
            )
            update_progress()

            logger.info('Creating collection')
            collection_result = api.create_collection(
                data['collection'],
                run_fix_schema_config_async=False
            )
            collection_id = collection_result.get('collection_id')
            update_progress()

            logger.info('Creating specify user')
            specifyuser_result = api.create_specifyuser(data['specifyuser'])
            specifyuser_id = specifyuser_result.get('user_id')

            logger.info('Finalizing database')
            fix_schema_config()
            create_app_resource_defaults()
        
        # Pre-load trees
        logger.info('Starting default tree downloads')
        if is_paleo_geo:
            transaction.on_commit(lambda: start_preload_default_tree(
                'Geologictimeperiod', discipline_id, collection_id, chronostrat_treedef_id, specifyuser_id, None, False
            ))
        if data['geographytreedef'].get('preload'):
            transaction.on_commit(lambda: start_preload_default_tree(
                'Geography', discipline_id, collection_id, geography_treedef_id, specifyuser_id, data['geographytreedef'].get('preloadfile'), False
            ))
        if data['taxontreedef'].get('preload'):
            transaction.on_commit(lambda: start_preload_default_tree(
                'Taxon', discipline_id, collection_id, taxon_treedef_id, specifyuser_id, data['taxontreedef'].get('preloadfile'), True
            ))

        update_progress()
    except Exception as e:
        logger.exception(f'Error setting up database: {e}')
        raise

@app.task(bind=True)
def fix_schema_config_task(self, collection_id: Optional[int] = None):
    """Run schema config migration fixups in a background worker"""
    try:
        fix_schema_config()
    finally:
        if collection_id is not None:
            finish_collection_background_task(collection_id, self.request.id)

def get_last_setup_error() -> Optional[str]:
    err = get_string(LAST_ERROR_REDIS_KEY)
    if err == '':
        return None
    return err

def set_last_setup_error(error_text: Optional[str]):
    set_string(LAST_ERROR_REDIS_KEY, error_text or '', time_to_live=60*60*24)

def create_discipline_and_trees_task(data: dict):
    from specifyweb.specify.models import Discipline
    """Create discipline and discipline's trees in the correct order. Similar to setup_database_task, but for the configuration tool."""
    try:
        with transaction.atomic():
            logger.debug('## CREATING DISCIPLINE AND TREES WITH SETTINGS:##')
            logger.debug(data)
            
            discipline_type = data['discipline'].get('type', '')
            is_paleo_geo = discipline_type in PALEO_DISCIPLINES or discipline_type in GEOLOGY_DISCIPLINES
            default_tree = DEFAULT_TREE.copy()

            # The discipline will temporarily use last created trees, the new trees are attached at the end.
            logger.info('Creating discipline')
            discipline_result = api.create_discipline(data['discipline'])
            discipline_id = discipline_result.get('discipline_id')
            default_tree['discipline_id'] = discipline_id
            logger.debug(discipline_id)

            # Ensure discipline id is set for tree creation
            if isinstance(data.get('geologictimeperiodtreedef'), dict):
                data['geologictimeperiodtreedef']['discipline_id'] = data['geologictimeperiodtreedef'].get('discipline_id') or discipline_id
            if isinstance(data.get('geographytreedef'), dict):
                data['geographytreedef']['discipline_id'] = data['geographytreedef'].get('discipline_id') or discipline_id
            if isinstance(data.get('taxontreedef'), dict):
                data['taxontreedef']['discipline_id'] = data['taxontreedef'].get('discipline_id') or discipline_id

            logger.info('Creating Chronostratigraphy tree')
            default_chronostrat_tree = default_tree.copy()
            default_chronostrat_tree['fullnamedirection'] = -1
            logger.info(default_chronostrat_tree)
            chronostrat_result = api.create_geologictimeperiod_tree(default_chronostrat_tree)
            chronostrat_treedef_id = _required_treedef_id(chronostrat_result, 'Geologictimeperiod')
            data['discipline']['geologictimeperiodtreedef_id'] = chronostrat_treedef_id

            logger.info('Creating geography tree')
            geography_result = api.create_geography_tree(data['geographytreedef'].copy(), global_tree=False)
            geography_treedef_id = _required_treedef_id(geography_result, 'Geography')

            logger.info('Creating taxon tree')
            taxon_result = api.create_taxon_tree(data['taxontreedef'].copy())
            taxon_treedef_id = _required_treedef_id(taxon_result, 'Taxon')

            lithostrat_id = None
            tectonicunit_id = None
            if is_paleo_geo:
                logger.info('Creating Lithostratigraphy tree')
                lithostrat_result = api.create_lithostrat_tree(default_tree.copy())
                lithostrat_id = _required_treedef_id(lithostrat_result, 'Lithostrat')

                logger.info('Creating Tectonic Unit tree')
                tectonicunit_result = api.create_tectonicunit_tree(default_tree.copy())
                tectonicunit_id = _required_treedef_id(tectonicunit_result, 'Tectonicunit')

            Discipline.objects.filter(id=discipline_id).update(
                geographytreedef_id=geography_treedef_id,
                taxontreedef_id=taxon_treedef_id,
                lithostrattreedef_id=lithostrat_id,
                tectonicunittreedef_id=tectonicunit_id,
                geologictimeperiodtreedef_id=chronostrat_treedef_id,
            )
        
        # Pre-load trees
        logger.info('Starting default tree downloads')
        if is_paleo_geo:
            transaction.on_commit(lambda: start_preload_default_tree(
                'Geologictimeperiod', discipline_id, None, chronostrat_treedef_id, None, None, False
            ))
        if data['geographytreedef'].get('preload'):
            transaction.on_commit(lambda: start_preload_default_tree(
                'Geography', discipline_id, None, geography_treedef_id, None, data['geographytreedef'].get('preloadfile'), False
            ))
        if data['taxontreedef'].get('preload'):
            transaction.on_commit(lambda: start_preload_default_tree(
                'Taxon', discipline_id, None, taxon_treedef_id, None, data['taxontreedef'].get('preloadfile'), True
            ))
    except Exception as e:
        logger.exception(f'Error creating discipline: {e}')
        raise
