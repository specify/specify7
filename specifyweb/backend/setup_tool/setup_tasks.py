"""
A Celery task for setting up the database in the background.
"""

from specifyweb.celery_tasks import app
from typing import Tuple, Optional
from celery.result import AsyncResult
from specifyweb.backend.setup_tool import api
from django.db import transaction
import threading
from specifyweb.specify.models_utils.model_extras import PALEO_DISCIPLINES, GEOLOGY_DISCIPLINES
import traceback

from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

# Keep track of the currently running setup task. There should only ever be one.
_active_setup_task_id: Optional[str] = None
_active_setup_lock = threading.Lock()

# Keep track of last error.
_last_error: Optional[str] = None
_last_error_lock = threading.Lock()

class MissingWorkerError(Exception):
    """Raised when worker is not running."""
    pass

def setup_database_background(data: dict) -> str:
    global _active_setup_task_id, _last_error

    # Clear any previous error logs.
    set_last_setup_error(None)

    if not is_worker_alive():
        set_last_setup_error("The Specify Worker is not running.")
        raise MissingWorkerError("The Specify Worker is not running.")

    task_id = str(uuid4())
    logger.debug(f'task_id: {task_id}')

    args = [data]

    task = setup_database_task.apply_async(args, task_id=task_id)

    with _active_setup_lock:
        _active_setup_task_id = task.id
    
    return task.id

def is_worker_alive():
    """Pings the worker to see if its running."""
    try:
        res = app.control.inspect(timeout=1).ping()
        return bool(res)
    except Exception:
        return False

def get_active_setup_task() -> Tuple[Optional[AsyncResult], bool]:
    """Return the current setup task if it is active, and also if it is busy."""
    global _active_setup_task_id
    with _active_setup_lock:
        task_id = _active_setup_task_id

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
        # with _active_setup_lock:
        #     if _active_setup_task_id == task_id:
        #         _active_setup_task_id = None
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

            if data['institution'].get('issinglegeographytree', False) == True:
                logger.debug('Creating singular geography tree')
                api.create_global_geography_tree(data['globalgeographytreedef'])

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
            api.create_geologictimeperiod_tree(default_tree.copy())

            if data['institution'].get('issinglegeographytree', False) == False:
                logger.debug('Creating geography tree')
                api.create_geography_tree(data['geographytreedef'])

            logger.debug('Creating discipline')
            api.create_discipline(data['discipline'])
            update_progress()

            if is_paleo_geo:
                logger.debug('Creating Lithostratigraphy tree')
                api.create_lithostrat_tree(default_tree.copy())

                logger.debug('Creating Tectonic Unit tree')
                api.create_tectonicunit_tree(default_tree.copy())

            logger.debug('Creating taxon tree')
            api.create_taxon_tree(data['taxontreedef'])
            update_progress()

            logger.debug('Creating collection')
            api.create_collection(data['collection'])
            update_progress()

            logger.debug('Creating specify user')
            api.create_specifyuser(data['specifyuser'])
            update_progress()
    except Exception as e:
        logger.exception(f'Error setting up database: {e}')
        raise

def get_last_setup_error() -> Optional[str]:
    global _last_error
    return _last_error

def set_last_setup_error(error_text: Optional[str]):
    global _last_error
    with _last_error_lock:
        _last_error = error_text