
from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.specify.migration_utils.update_schema_config import update_table_schema_config_with_defaults
from specifyweb.celery_tasks import LogErrorsTask, app

from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

def apply_schema_defaults(discipline):
    task_id = str(uuid4())

    args = [discipline.id]

    task = apply_schema_defaults_task.apply_async(args, task_id=task_id)
    
    return task.id


@app.task(bind=True)
def apply_schema_defaults_task(self, discipline_id):
    for model_name in model_names_by_table_id.values():
        logger.debug(f'applying defaults for {model_name}')
        update_table_schema_config_with_defaults(
            table_name=model_name,
            discipline_id=discipline_id
        )