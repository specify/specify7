
from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.specify.migration_utils.update_schema_config import update_table_schema_config_with_defaults
from specifyweb.celery_tasks import LogErrorsTask, app

from django.conf import settings
import json
from pathlib import Path
from uuid import uuid4

import logging
logger = logging.getLogger(__name__)

def apply_schema_defaults(discipline, background=False):
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
    defaults = None
    schema_localization_file = (Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'schema_localization_en.json')
    if schema_localization_file.exists() and schema_localization_file.is_file():
        try:
            with schema_localization_file.open('r', encoding='utf-8') as fh:
                defaults = json.load(fh)
        except Exception as e:
            logger.exception(f'Failed to load default schema localization from {schema_localization_file}: {e}')
            defaults = None

    # Read schema overrides file for the discipline, if it exists
    schema_overrides_file = (Path(__file__).parent.parent.parent.parent / 'config' / discipline_type / 'schema_overrides.json')
    if schema_overrides_file.exists() and schema_overrides_file.is_file():
        try:
            with schema_overrides_file.open('r', encoding='utf-8') as fh:
                overrides = json.load(fh)
        except Exception as e:
            logger.exception(f'Failed to load schema overrides from {schema_overrides_file}: {e}')
            overrides = None

    # Update the schema for each table individually.
    for model_name in model_names_by_table_id.values():
        logger.debug(f'Applying schema defaults for {model_name}. Using overrides: {overrides is not None}.')
    
        # Table information
        table_name = get_table_override(defaults, model_name, 'name') if not None else model_name
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