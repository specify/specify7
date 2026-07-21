from typing import TypedDict, NotRequired
from collections.abc import Mapping, MutableMapping
from copy import deepcopy
from functools import lru_cache

from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.backend.context.app_resource import DISCIPLINE_NAMES
from specifyweb.celery_tasks import app
from .utils import load_json_from_file
from .task_tracking import queue_discipline_background_task, finish_discipline_background_task
from specifyweb.specify.models import Discipline
from django.db import transaction
from celery.exceptions import MaxRetriesExceededError

from pathlib import Path
from uuid import uuid4

import logging
logger = logging.getLogger(__name__)

SCHEMA_DEFAULTS_MISSING_DISCIPLINE_RETRY_DELAY_SEC = 2
SCHEMA_DEFAULTS_MISSING_DISCIPLINE_MAX_RETRIES = 5

class FieldDefaults(TypedDict):
    name: NotRequired[str]
    desc: NotRequired[str]
    ishidden: NotRequired[bool]
    isrequired: NotRequired[bool]
    picklistname: NotRequired[str | None]
    weblinkname: NotRequired[str | None]

class TableDefaults(TypedDict):
    name: NotRequired[str]
    desc: NotRequired[str]
    items: NotRequired[dict[str, FieldDefaults]]
    ishidden: NotRequired[bool]
    picklistname: NotRequired[str | None]
    format: NotRequired[str | None]
    isuiformatter: NotRequired[bool | None]
    aggregator: NotRequired[str | None]

class ReadonlyDict[K, V](Mapping[K, V]):
    def __init__(self, mapping: Mapping[K, V]):
        if not isinstance(mapping, Mapping):
            raise TypeError(f"Can not create readonly dict for {mapping}. mapping not Mapping compliant")
        self._original_mapping = mapping

    def as_dict(self):
        return deepcopy(dict(self._original_mapping))

    def __getitem__(self, key):
        orginal_item = self._original_mapping[key]
        if isinstance(orginal_item, MutableMapping):
            return ReadonlyDict(orginal_item)
        elif isinstance(orginal_item, list):
            return tuple(orginal_item)
        return orginal_item

    def __iter__(self):
        return iter(self._original_mapping)

    def __len__(self):
        return len(self._original_mapping)

SchemaDefaults = dict[str, TableDefaults]

@lru_cache(maxsize=1)
def _global_schema_defaults() -> ReadonlyDict[str, TableDefaults]:
    global_defaults = load_json_from_file(Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'schema_localization_en.json')
    # We'd like the cached value to be immutable, so callers can't change the
    # internal cached dictonary
    # Frozendict would be better here, but those aren't supported in
    # Python 3.12 and would have to be installed from the third-party
    # immutabledict library
    return ReadonlyDict(global_defaults)


@lru_cache(maxsize=len(DISCIPLINE_NAMES) // 3)
def read_schema_config_defaults(discipline_type: str | None = None) -> ReadonlyDict[str, TableDefaults]:
    # Get default schema localization
    defaults = _global_schema_defaults()

    if not discipline_type:
        return defaults or ReadonlyDict(dict())

    overrides = None
    # Read schema overrides file for the discipline, if it exists
    schema_overrides_path = Path(__file__).parent.parent.parent.parent / 'config' / discipline_type / 'schema_overrides.json'
    if schema_overrides_path.exists():
        overrides = load_json_from_file(schema_overrides_path)

    if overrides is None:
        return defaults

    # We create a copy of the _global_schema_defaults() dict to avoid mutating
    # the cached dictonary
    new_defaults = defaults.as_dict()
    # Apply overrides to defaults
    # Overrides contains a dict for each table with overrides
    for table_name, table in overrides.items():
        # Items contains a list of dicts (item).
        for item in table.get('items', []):
            # Each item is a dict with only one entry.
            for field_name, override_dict in item.items():
                table_items = new_defaults.setdefault(table_name, {}).setdefault('items', {})
                default_dict = table_items.get(field_name, {})
                merged_dict = {**default_dict, **override_dict}
                table_items[field_name] = merged_dict
        # Replace other properties
        for key, v in table.items():
            if key == 'items':
                continue
            new_defaults.setdefault(table_name, {})[key] = v
    # We'd like the cached value to be immutable, so callers can't change the
    # internal cached dictonary
    return ReadonlyDict(new_defaults or dict())

def apply_schema_defaults(discipline: Discipline):
    from specifyweb.specify.migration_utils.schema_writer import update_table_schema_config_with_defaults
    """
    Apply schema config localization defaults for this discipline.
    """
    defaults = read_schema_config_defaults(discipline.type)

    # Update the schema for each table individually.
    for model_name in model_names_by_table_id.values():
        logger.debug(f'Applying schema defaults for {model_name}')

        # Table information
        table_defaults = defaults.get(model_name.lower(), TableDefaults())

        update_table_schema_config_with_defaults(
            table_name=model_name,
            discipline_id=discipline.id,
            table_defaults=table_defaults,
        )

def queue_apply_schema_defaults_background(discipline_id: int) -> str:
    """Queue apply_schema_defaults to run asynchronously and return the task id."""
    task_id = str(uuid4())

    # Dispatch only after the discipline row is committed so workers can read it.
    def enqueue() -> None:
        async_result = apply_schema_defaults_task.apply_async(
            args=[discipline_id],
            task_id=task_id,
        )
        queue_discipline_background_task(discipline_id, async_result.id)

    transaction.on_commit(
        enqueue
    )
    return task_id

@app.task(bind=True, max_retries=SCHEMA_DEFAULTS_MISSING_DISCIPLINE_MAX_RETRIES)
def apply_schema_defaults_task(self, discipline_id: int):
    """Run schema localization defaults for one discipline in a background worker."""
    task_id = getattr(self.request, 'id', None)

    try:
        discipline = Discipline.objects.get(id=discipline_id)
    except Discipline.DoesNotExist as exc:
        try:
            raise self.retry(
                exc=exc,
                countdown=SCHEMA_DEFAULTS_MISSING_DISCIPLINE_RETRY_DELAY_SEC,
            )
        except MaxRetriesExceededError:
            logger.error(
                "Skipping schema defaults. Discipline %s does not exist after %s retries.",
                discipline_id,
                SCHEMA_DEFAULTS_MISSING_DISCIPLINE_MAX_RETRIES,
            )
            if task_id is not None:
                finish_discipline_background_task(discipline_id, task_id)
            return
    try:
        apply_schema_defaults(discipline)
    finally:
        if task_id is not None:
            finish_discipline_background_task(discipline_id, task_id)