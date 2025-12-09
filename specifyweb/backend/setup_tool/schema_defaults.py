from typing import Optional
from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.specify.migration_utils.update_schema_config import update_table_schema_config_with_defaults
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
        load_json_from_file(schema_overrides_path)

    # Update the schema for each table individually.
    for model_name in model_names_by_table_id.values():
        logger.debug(f'Applying schema defaults for {model_name}. Using overrides: {overrides is not None}.')
    
        # Table information
        table_description = get_table_override(defaults, model_name, 'desc')

        update_table_schema_config_with_defaults(
            table_name=model_name,
            description=table_description,
            discipline_id=discipline.id,
            defaults=defaults,
            overrides=overrides,
        )

def get_table_override(overrides: Optional[dict], model_name: str, key: str):
    """Get a specific table's field override from a dict of all table overrides."""
    if overrides is not None and overrides.get(model_name, None) is not None:
        return overrides[model_name].get(key, None)
    return None