from specifyweb.celery_tasks import LogErrorsTask, app
from typing import Tuple, Optional
from celery.result import AsyncResult
from specifyweb.backend.setup_tool import api
from django.db import transaction
import threading

from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

# Keep track of the currently running setup task. There should only ever be one.
_active_setup_task_id: Optional[str] = None
_active_setup_lock = threading.Lock()

def setup_database_background(data):
    global _active_setup_task_id
    task_id = str(uuid4())
    logger.debug(f'task_id: {task_id}')

    args = [data]

    task = setup_database_task.apply_async(args, task_id=task_id)

    with _active_setup_lock:
        _active_setup_task_id = task.id
    
    return task.id

def get_active_setup_task() -> Tuple[Optional[AsyncResult], bool]:
    """Return the current setup task if it is active, and also if it is busy."""
    global _active_setup_task_id
    with _active_setup_lock:
        task_id = _active_setup_task_id

    if not task_id:
        return None, False

    res = app.AsyncResult(task_id)
    busy = res.state in ("PENDING", "RECEIVED", "STARTED", "RETRY", "PROGRESS")
    # Clear the setup id if its not busy.
    if not busy and res.state in ("SUCCESS", "FAILURE", "REVOKED"):
        with _active_setup_lock:
            if _active_setup_task_id == task_id:
                _active_setup_task_id = None
    return res, busy

@app.task(bind=True)
def setup_database_task(self, data):
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

            logger.debug('Creating discipline')
            api.create_discipline(data['discipline'])
            update_progress()

            discipline_type = data['discipline'].get('type', '')
            if discipline_type == 'geology' or 'paleo' in discipline_type:
                logger.debug('Creating Chronostratigraphy tree')
                api.create_geologictimeperiod_tree({
                    'fullnamedirection': 1,
                    'ranks': {
                        '0': True
                    }
                })
                logger.debug('Creating Lithostratigraphy tree')
                api.create_lithostrat_tree({
                    'fullnamedirection': 1,
                    'ranks': {
                        '0': True
                    }
                })
                logger.debug('Creating Tectonic Unit tree')
                api.create_tectonicunit_tree({
                    'fullnamedirection': 1,
                    'ranks': {
                        '0': True
                    }
                })

            if data['institution'].get('issinglegeographytree', False) == False:
                logger.debug('Creating geography tree')
                api.create_geography_tree(data['geographytreedef'])

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

def create_request(request, data, key_to_use):
    copy = request.copy()
    copy.data = data[key_to_use.lower()]
    return copy