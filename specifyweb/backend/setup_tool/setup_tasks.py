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

from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

# Keep track of the currently running setup task. There should only ever be one.
# Also defined separately in setup_tool/apps.py
ACTIVE_TASK_REDIS_KEY = "specify:setup:active_task_id"
ACTIVE_TASK_TTL = 60*60*2 # setup should be less than 2 hours
# Keep track of last error.
LAST_ERROR_REDIS_KEY = "specify:setup:last_error"

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

def queue_fix_schema_config_background() -> str:
    """Queue fix_schema_config to run asynchronously and return the task id"""
    task = fix_schema_config_task.apply_async()
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

@app.task(bind=True)
def setup_database_task(self, data: dict):
    """Execute all database setup steps in order."""
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
            

            # if is_paleo_geo:
            # Create an empty chronostrat tree no matter what because discipline needs it.
            logger.info('Creating Chronostratigraphy tree')
            default_chronostrat_tree = DEFAULT_TREE.copy()
            default_chronostrat_tree['fullnamedirection'] = -1
            chronostrat_result = api.create_geologictimeperiod_tree(default_chronostrat_tree)
            chronostrat_treedef_id = chronostrat_result.get('treedef_id')

            logger.info('Creating geography tree')
            uses_global_geography_tree = data['institution'].get('issinglegeographytree', False)
            geography_result = api.create_geography_tree(data['geographytreedef'].copy(), global_tree=uses_global_geography_tree)
            geography_treedef_id = geography_result.get('treedef_id')

            logger.info('Creating discipline')
            discipline_result = api.create_discipline(data['discipline'])
            discipline_id = discipline_result.get('discipline_id')
            DEFAULT_TREE['discipline_id'] = discipline_id
            update_progress()

            if is_paleo_geo:
                logger.info('Creating Lithostratigraphy tree')
                api.create_lithostrat_tree(DEFAULT_TREE.copy())

                logger.info('Creating Tectonic Unit tree')
                api.create_tectonicunit_tree(DEFAULT_TREE.copy())

            logger.info('Creating taxon tree')
            if data['taxontreedef'].get('discipline_id') is None:
                data['taxontreedef']['discipline_id'] = discipline_id
            taxon_result = api.create_taxon_tree(data['taxontreedef'].copy())
            taxon_treedef_id = taxon_result.get('treedef_id')
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
                start_preload_default_tree('Geologictimeperiod', discipline_id, collection_id, chronostrat_treedef_id, specifyuser_id, None, False)
            if data['geographytreedef'].get('preload'):
                start_preload_default_tree('Geography', discipline_id, collection_id, geography_treedef_id, specifyuser_id, data['geographytreedef'].get('preloadfile'), False)
            if data['taxontreedef'].get('preload'):
                start_preload_default_tree('Taxon', discipline_id, collection_id, taxon_treedef_id, specifyuser_id, data['taxontreedef'].get('preloadfile'), True)

            update_progress()
    except Exception as e:
        logger.exception(f'Error setting up database: {e}')
        raise

@app.task(bind=True)
def fix_schema_config_task(self):
    """Run schema config migration fixups in a background worker"""
    fix_schema_config()

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
    logger.debug('## CREATING DISCIPLINE AND TREES WITH SETTINGS:##')
    logger.debug(data)
    logger.info('Creating discipline')
    discipline_result = api.create_discipline(data['discipline'])
    discipline_id = discipline_result.get('discipline_id')
    discipline_type = data['discipline'].get('type', '')
    is_paleo_geo = discipline_type in PALEO_DISCIPLINES or discipline_type in GEOLOGY_DISCIPLINES

    # Ensure discipline id is set for tree creation
    if isinstance(data.get('geographytreedef'), dict):
        data['geographytreedef']['discipline_id'] = data['geographytreedef'].get('discipline_id') or discipline_id
    if isinstance(data.get('taxontreedef'), dict):
        data['taxontreedef']['discipline_id'] = data['taxontreedef'].get('discipline_id') or discipline_id

    logger.info('Creating geography tree')
    geography_result = api.create_geography_tree(data['geographytreedef'].copy(), global_tree=False)
    geography_treedef_id = geography_result.get('treedef_id')

    logger.info('Creating taxon tree')
    taxon_result = api.create_taxon_tree(data['taxontreedef'].copy())
    taxon_treedef_id = taxon_result.get('treedef_id')

    lithostrat_id = None
    tectonicunit_id = None
    if is_paleo_geo:
        logger.info('Creating Lithostratigraphy tree')
        lithostrat_result = api.create_lithostrat_tree(DEFAULT_TREE.copy())
        lithostrat_id = lithostrat_result.get('lithostrattreedef_id')

        logger.info('Creating Tectonic Unit tree')
        tectonicunit_result = api.create_tectonicunit_tree(DEFAULT_TREE.copy())
        tectonicunit_id = tectonicunit_result.get('tectonicunittreedef_id')

    Discipline.objects.filter(id=discipline_id).update(
        geographytreedef_id=geography_treedef_id,
        taxontreedef_id=taxon_treedef_id,
        lithostrattreedef_id=lithostrat_id,
        tectonicunittreedef_id=tectonicunit_id,
    )

    if data['geographytreedef'].get('preload'):
        start_preload_default_tree('Geography', discipline_id, None, geography_treedef_id, None, data['geographytreedef'].get('preloadfile'), False)
    if data['taxontreedef'].get('preload'):
        start_preload_default_tree('Taxon', discipline_id, None, taxon_treedef_id, None, data['taxontreedef'].get('preloadfile'), True)
