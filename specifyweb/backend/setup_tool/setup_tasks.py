"""
A Celery task for setting up the database in the background.
"""

from django.db import transaction
from specifyweb.celery_tasks import app
from typing import Tuple, Optional
from celery.result import AsyncResult
from specifyweb.backend.setup_tool import api
from specifyweb.backend.setup_tool.app_resource_defaults import create_app_resource_defaults
from specifyweb.specify.management.commands.run_key_migration_functions import fix_schema_config
from specifyweb.specify.models_utils.model_extras import PALEO_DISCIPLINES, GEOLOGY_DISCIPLINES
from specifyweb.celery_tasks import is_worker_alive, MissingWorkerError
from specifyweb.backend.redis_cache.store import set_string, get_string

from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

# Keep track of the currently running setup task. There should only ever be one.
ACTIVE_TASK_REDIS_KEY = "specify:setup:active_task_id"

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

    set_string(ACTIVE_TASK_REDIS_KEY, task.id)
    
    return task.id

def get_active_setup_task() -> Tuple[Optional[AsyncResult], bool]:
    """Return the current setup task if it is active, and also if it is busy."""
    task_id = get_string(ACTIVE_TASK_REDIS_KEY)
    last_error = get_string(LAST_ERROR_REDIS_KEY)

    logger.debug('########## GETTING WORKER TASK STATUS ########')
    logger.debug(task_id)
    logger.debug(last_error)
    if not task_id:
        return None, False

    res = app.AsyncResult(task_id)
    logger.debug(res.state)
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

            logger.debug('Creating institution')
            api.create_institution(data['institution'])
            update_progress()

            logger.debug('Creating storage tree')
            api.create_storage_tree(data['storagetreedef'])
            update_progress()

            logger.debug('Creating division')
            api.create_division(data['division'])
            update_progress()

            discipline_type = data['discipline'].get('type', '')
            is_paleo_geo = discipline_type in PALEO_DISCIPLINES or discipline_type in GEOLOGY_DISCIPLINES
            default_tree = {
                'fullnamedirection': 1,
                'ranks': {
                    '0': True
                }
            }

            # if is_paleo_geo:
            # Create an empty chronostrat tree no matter what because discipline needs it.
            logger.debug('Creating Chronostratigraphy tree')
            default_chronostrat_tree = default_tree.copy()
            default_chronostrat_tree['fullnamedirection'] = -1
            api.create_geologictimeperiod_tree(default_chronostrat_tree)

            logger.debug('Creating geography tree')
            uses_global_geography_tree = data['institution'].get('issinglegeographytree', False)
            api.create_geography_tree(data['geographytreedef'], global_tree=uses_global_geography_tree)

            logger.debug('Creating discipline')
            discipline_result = api.create_discipline(data['discipline'])
            discipline_id = discipline_result.get('discipline_id')
            default_tree['discipline_id'] = discipline_id
            update_progress()

            if is_paleo_geo:
                logger.debug('Creating Lithostratigraphy tree')
                api.create_lithostrat_tree(default_tree.copy())

                logger.debug('Creating Tectonic Unit tree')
                api.create_tectonicunit_tree(default_tree.copy())

            logger.debug('Creating taxon tree')
            if data['taxontreedef'].get('discipline_id') is None:
                data['taxontreedef']['discipline_id'] = discipline_id
            api.create_taxon_tree(data['taxontreedef'])
            update_progress()

            logger.debug('Creating collection')
            api.create_collection(data['collection'])
            update_progress()

            logger.debug('Creating specify user')
            api.create_specifyuser(data['specifyuser'])

            logger.debug('Finalizing database')
            fix_schema_config()
            create_app_resource_defaults()
            update_progress()
    except Exception as e:
        logger.exception(f'Error setting up database: {e}')
        raise

def get_last_setup_error() -> Optional[str]:
    err = get_string(LAST_ERROR_REDIS_KEY)
    if err == '':
        return None
    return err

def set_last_setup_error(error_text: Optional[str]):
    set_string(LAST_ERROR_REDIS_KEY, error_text or '')