from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.specify.migration_utils.update_schema_config import update_table_schema_config_with_defaults
from specifyweb.celery_tasks import app
from .utils import load_json_from_file
from specifyweb.specify.models import Discipline
from specifyweb.backend.redis_cache.store import add_to_set, delete_key, remove_from_set, set_members
from specifyweb.backend.setup_tool.redis import DISCIPLINE_TASK_IDS_REDIS_KEY

from pathlib import Path
from typing import Optional
from uuid import uuid4

import logging
logger = logging.getLogger(__name__)

ACTIVE_CELERY_STATES = frozenset(("PENDING", "RECEIVED", "STARTED", "RETRY", "PROGRESS"))

def _discipline_task_ids_key(discipline_id: int) -> str:
    return DISCIPLINE_TASK_IDS_REDIS_KEY.replace(
        "{discipline_id}", f"({{database}},{discipline_id})"
    )

def _track_discipline_task(discipline_id: int, task_id: str) -> None:
    add_to_set(_discipline_task_ids_key(discipline_id), task_id)

def _untrack_discipline_task(discipline_id: Optional[int], task_id: Optional[str]) -> None:
    if discipline_id is None or task_id is None:
        return
    key = _discipline_task_ids_key(discipline_id)
    remove_from_set(key, task_id)
    if not set_members(key):
        delete_key(key)

def _is_task_active(task_id: str) -> bool:
    return app.AsyncResult(task_id).state in ACTIVE_CELERY_STATES

def is_discipline_setup_busy(discipline_id: Optional[int]) -> bool:
    if discipline_id is None:
        return False

    key = _discipline_task_ids_key(discipline_id)
    task_ids = set_members(key)
    if not task_ids:
        return False

    inactive_task_ids = []
    for task_id in task_ids:
        if _is_task_active(task_id):
            return True
        inactive_task_ids.append(task_id)

    remove_from_set(key, *inactive_task_ids)
    if not set_members(key):
        delete_key(key)
    return False

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
    task_id = str(uuid4())
    _track_discipline_task(discipline_id, task_id)
    try:
        task = apply_schema_defaults_task.apply_async(args=[discipline_id], task_id=task_id)
    except Exception:
        _untrack_discipline_task(discipline_id, task_id)
        raise
    return task.id

@app.task(bind=True)
def apply_schema_defaults_task(self, discipline_id: int):
    """Run schema localization defaults for one discipline in a background worker."""
    task_id = getattr(self.request, "id", None)
    try:
        discipline = Discipline.objects.get(id=discipline_id)
        apply_schema_defaults(discipline)
    finally:
        _untrack_discipline_task(discipline_id, task_id)
