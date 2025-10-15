from specifyweb.celery_tasks import LogErrorsTask, app
from specifyweb.backend.setup_tool import api

from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

def setup_database_background(data):
    task_id = str(uuid4())
    logger.debug(f'task_id: {task_id}')

    args = [data]

    logger.debug('starting task')
    task = setup_database_task.apply_async(args, task_id=task_id)
    
    return task.id


@app.task(bind=True)
def setup_database_task(self, data):
    try:
        logger.debug('## SETTING UP DATABASE WITH SETTINGS:##')
        logger.debug(data)

        logger.debug('Creating institution')
        api.create_institution(data['institution'])

        logger.debug('Creating storage tree')
        api.create_storage_tree(data['storagetreedef'])

        if data['institution'].get('issinglegeographytree', False) == True:
            logger.debug('Creating singular geography tree')
            api.create_global_geography_tree(data['globalgeographytreedef'])

        logger.debug('Creating division')
        api.create_division(data['division'])

        logger.debug('Creating discipline')
        api.create_discipline(data['discipline'])

        if data['institution'].get('issinglegeographytree', False) == False:
            logger.debug('Creating geography tree')
            api.create_geography_tree(data['geographytreedef'])

        logger.debug('Creating taxon tree')
        api.create_taxon_tree(data['taxontreedef'])

        logger.debug('Creating collection')
        api.create_collection(data['collection'])

        logger.debug('Creating specify user')
        api.create_specifyuser(data['specifyuser'])
    except Exception as e:
        logger.exception(f'Error setting up database: {e}')
        raise

def create_request(request, data, key_to_use):
    copy = request.copy()
    copy.data = data[key_to_use.lower()]
    return copy