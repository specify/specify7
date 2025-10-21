
from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.specify.migration_utils.update_schema_config import update_table_schema_config_with_defaults
from specifyweb.celery_tasks import LogErrorsTask, app
from .utils import load_json_from_file

from pathlib import Path
from uuid import uuid4

import logging
logger = logging.getLogger(__name__)

def apply_schema_defaults(discipline, background=False):
    """
    Apply schema config localization defaults for this discipline.
    """
    if background:
        task_id = str(uuid4())

        args = [discipline.id, discipline.type]

        task = apply_schema_defaults_task.apply_async(args, task_id=task_id)
        
        return task.id
    else:
        _apply_schema_defaults(discipline.id, discipline.type)

@app.task(bind=True)
def apply_schema_defaults_task(self, discipline_id, discipline_type):
    _apply_schema_defaults(discipline_id, discipline_type)

def _apply_schema_defaults(discipline_id, discipline_type):
    # Get default schema localization
    defaults = load_json_from_file(Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'schema_localization_en.json')

    # Read schema overrides file for the discipline, if it exists
    schema_overrides_path = Path(__file__).parent.parent.parent.parent / 'config' / discipline_type / 'schema_overrides.json'
    overrides = None
    if schema_overrides_path.exists():
        load_json_from_file(schema_overrides_path)

    # Update the schema for each table individually.
    for model_name in model_names_by_table_id.values():
        logger.debug(f'Applying schema defaults for {model_name}. Using overrides: {overrides is not None}.')
    
        # Table information
        table_description = get_table_override(defaults, model_name, 'desc')

        update_table_schema_config_with_defaults(
            table_name=model_name,
            description=table_description,
            discipline_id=discipline_id,
            defaults=defaults,
            overrides=overrides,
        )

def get_table_override(overrides, model_name, key):
    if overrides is not None and overrides.get(model_name, None) is not None:
        return overrides[model_name].get(key, None)
    return None