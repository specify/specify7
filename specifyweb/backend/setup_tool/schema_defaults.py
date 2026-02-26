from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.specify.migration_utils.update_schema_config import update_table_schema_config_with_defaults
from specifyweb.celery_tasks import app
from .utils import load_json_from_file
from specifyweb.specify.models import Discipline

from pathlib import Path

import logging
logger = logging.getLogger(__name__)

def apply_schema_defaults(discipline: Discipline):
    """
    Apply schema config localization defaults for this discipline.
    """
    # Get default schema localization
    defaults = load_json_from_file(Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'schema_localization_en.json')

    # Read schema overrides file for the discipline, if it exists
    schema_overrides_path = Path(__file__).parent.parent.parent.parent / 'config' / discipline.type / 'schema_overrides.json'
    overrides = None
    if schema_overrides_path.exists():
        overrides = load_json_from_file(schema_overrides_path)

        # Apply overrides to defaults
        if overrides is not None:
            # Overrides contains a dict for each table with overrides
            for table_name, table in overrides.items():
                # Items contains a list of dicts (item).
                for item in table.get('items', []):
                    # Each item is a dict with only one entry.
                    for field_name, override_dict in item.items():
                        table_items = defaults.setdefault(table_name, {}).setdefault('items', {})
                        default_dict = table_items.get(field_name) or {}
                        merged_dict = {**default_dict, **override_dict}
                        table_items[field_name] = merged_dict
                # Replace other properties
                for key, v in table.items():
                    if key == 'items':
                        continue
                    defaults.setdefault(table_name, {})[key] = v

    # Update the schema for each table individually.
    for model_name in model_names_by_table_id.values():
        logger.debug(f'Applying schema defaults for {model_name}. Using defaults: {overrides is not None}.')
    
        # Table information
        table_defaults = defaults.get(model_name.lower())
        table_description = None
        if table_defaults:
            table_description = table_defaults.get('desc')

        update_table_schema_config_with_defaults(
            table_name=model_name,
            discipline_id=discipline.id,
            description=table_description,
            defaults=table_defaults,
        )

def queue_apply_schema_defaults_background(discipline_id: int) -> str:
    """Queue apply_schema_defaults to run asynchronously and return the task id."""
    task = apply_schema_defaults_task.apply_async(args=[discipline_id])
    return task.id

@app.task(bind=True)
def apply_schema_defaults_task(self, discipline_id: int):
    """Run schema localization defaults for one discipline in a background worker."""
    discipline = Discipline.objects.get(id=discipline_id)
    apply_schema_defaults(discipline)
