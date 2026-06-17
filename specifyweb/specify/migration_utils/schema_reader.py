import re
import json

from typing import NamedTuple, Tuple, TypedDict, NotRequired
import logging
from collections import defaultdict
from functools import lru_cache
from pathlib import Path


from django.db.models import Q
from django.conf import settings
from django.apps import apps as global_apps

from specifyweb.specify.models import (
    datamodel,
)

logger = logging.getLogger(__name__)

HIDDEN_FIELDS = [
    "timestampcreated", "timestampmodified", "version", "createdbyagent", "modifiedbyagent"
]

def _has_explicit_hidden_override(field_config: dict) -> bool:
    return any(key.lower() == "ishidden" for key in field_config.keys())

@lru_cache(maxsize=None)
def _schema_override_hidden_values_for_discipline(
    discipline_type: str,
) -> dict[str, dict[str, bool]]:
    """
    Return a mapping of {table_name -> {field_name -> ishidden_value}} for fields
    that have an
    explicit `ishidden` override in config/<discipline>/schema_overrides.json.
    """
    normalized_discipline = (discipline_type or "").lower()
    if not normalized_discipline:
        return {}

    schema_overrides_path = (
        Path(settings.SPECIFY_CONFIG_DIR) / normalized_discipline / "schema_overrides.json"
    )
    if not schema_overrides_path.exists():
        return {}

    try:
        with schema_overrides_path.open("r", encoding="utf-8") as schema_overrides_file:
            overrides = json.load(schema_overrides_file)
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning(
            "Unable to read schema overrides for discipline '%s' at %s: %s",
            normalized_discipline,
            schema_overrides_path,
            exc,
        )
        return {}

    if not isinstance(overrides, dict):
        return {}

    hidden_override_values_by_table: dict[str, dict[str, bool]] = {}
    for table_name, table_config in overrides.items():
        if not isinstance(table_config, dict):
            continue

        explicit_hidden_override_values: dict[str, bool] = {}
        items = table_config.get("items", [])
        if not isinstance(items, list):
            continue

        for item in items:
            if not isinstance(item, dict):
                continue

            for field_name, field_config in item.items():
                if not isinstance(field_config, dict):
                    continue
                if not _has_explicit_hidden_override(field_config):
                    continue
                for key, value in field_config.items():
                    if key.lower() == "ishidden":
                        explicit_hidden_override_values[field_name.lower()] = bool(value)
                        break

        if explicit_hidden_override_values:
            hidden_override_values_by_table[table_name.lower()] = explicit_hidden_override_values

    return hidden_override_values_by_table

@lru_cache(maxsize=None)
def _schema_override_hidden_fields_for_discipline(discipline_type: str) -> dict[str, set[str]]:
    hidden_override_values = _schema_override_hidden_values_for_discipline(discipline_type)
    return {
        table_name: set(table_values.keys())
        for table_name, table_values in hidden_override_values.items()
    }

def _fields_without_explicit_hidden_override(
    table_name: str,
    field_names: list[str],
    discipline_type: str,
) -> list[str]:
    table_hidden_overrides = _schema_override_hidden_fields_for_discipline(
        discipline_type
    ).get(table_name.lower(), set())
    return [
        field_name
        for field_name in field_names
        if field_name.lower() not in table_hidden_overrides
    ]

def datamodel_type_to_schematype(datamodel_type: str) -> str: 
    """
    Converts a string like `many-to-one` to `ManyToOne` by: 
    - Splitting on hyphens
      - e.g., ['many', 'to', 'one']
    - Lowering then capitilizing each string in the split
      - e.g., ['Many', 'To', 'One']
    - Joining the split strings back together
      - e.g., 'ManyToOne'
    """
    return "".join(map(lambda type_part: type_part.lower().capitalize(), datamodel_type.split('-')))

def camel_to_spaced_title_case(camel_case: str) -> str: 
    """
    Given a camel case string, convert it to title case and add spaces

    - `catalogNumber` -> `Catalog Number`
    - `modifiedByAgent` -> `Modified By Agent`
    - `yesNo6` -> `Yes No6`
    - `cojo` -> `Cojo`
    """
    return re.sub(r"(?<!^)(?=[A-Z])", " ", camel_case).title()

class FieldSchemaConfig(NamedTuple):
    name: str
    column: str
    java_type: str
    description: str = ""
    language: str = "en"

def uncapitilize(string: str) -> str: 
    return string.lower() if len(string) <= 1 else string[0].lower() + string[1:]

def bulk_create_splocaleitemstr_idempotent(Splocaleitemstr, rows: list[dict]) -> int:
    if not rows:
        return 0

    fk_fields = ("itemname", "itemdesc", "containername", "containerdesc")
    groups: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        present = [f for f in fk_fields if r.get(f) is not None]
        if len(present) != 1:
            raise ValueError(f"Each row must set exactly one FK among {fk_fields}. Got: {present}")
        groups[present[0]].append(r)

    total_created = 0

    for fk_field, group_rows in groups.items():
        fk_ids: set[int] = set()
        languages: set[str] = set()

        for r in group_rows:
            fk_ids.add(r[fk_field].pk)
            languages.add(r["language"])

        existing_rows = list(
            Splocaleitemstr.objects.filter(
                **{
                    f"{fk_field}_id__in": fk_ids,
                    "language__in": languages,
                }
            )
            .filter(
                Q(country__isnull=True) | Q(country=""),
                Q(variant__isnull=True) | Q(variant=""),
            )
            .order_by("id")
        )

        existing_by_key: dict[Tuple[str, int], list] = defaultdict(list)
        fk_field_id = f"{fk_field}_id"
        for existing_row in existing_rows:
            key = (existing_row.language, getattr(existing_row, fk_field_id))
            existing_by_key[key].append(existing_row)

        desired_by_key: dict[Tuple[str, int], dict] = {}
        for r in group_rows:
            key = (r["language"], r[fk_field].pk)
            desired_by_key[key] = r

        ids_to_delete: set[int] = set()
        to_create = []
        for key, desired_row in desired_by_key.items():
            existing_for_key = existing_by_key.get(key, [])

            if not existing_for_key:
                to_create.append(Splocaleitemstr(**desired_row))
                continue

            for duplicate in existing_for_key[1:]:
                ids_to_delete.add(duplicate.id)

        if ids_to_delete:
            Splocaleitemstr.objects.filter(id__in=ids_to_delete).delete()

        if to_create:
            Splocaleitemstr.objects.bulk_create(to_create)
            total_created += len(to_create)

    return total_created

class FieldDefaults(TypedDict):
    name: NotRequired[str]
    desc: NotRequired[str]
    ishidden: NotRequired[bool]
    isrequired: NotRequired[bool]
    picklistname: NotRequired[str]
class TableDefaults(TypedDict):
    name: NotRequired[str]
    desc: NotRequired[str]
    items: NotRequired[dict[str, FieldDefaults]]

def find_missing_schema_config_fields(discipline_id: int, apps=global_apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    missing_tables: list[str] = []
    missing_fields: dict[str, list[str]] = {}

    containers = Splocalecontainer.objects.filter(
        discipline_id=discipline_id,
        schematype=0,
    )
    container_names = set(
        containers.values_list('name', flat=True)
    )

    existing_fields_by_table: dict[str, set[str]] = defaultdict(set)
    for table_name, field_name in Splocalecontaineritem.objects.filter(
        container__in=containers
    ).values_list('container__name', 'name'):
        if table_name and field_name:
            existing_fields_by_table[table_name].add(field_name.lower())

    for table in datamodel.tables:
        table_name = table.name
        table_name_lower = table_name.lower()
        if table_name_lower not in container_names:
            missing_tables.append(table_name)
            missing_fields[table_name] = sorted(
                field.name for field in table._all_fields(exclude_id_field=True) if field.name
            )
            continue

        existing_fields = existing_fields_by_table.get(table_name_lower, set())
        missing_in_table = sorted( # sort for better reproducablity
            field.name
            for field in table._all_fields(exclude_id_field=True)
            if field.name and field.name.lower() not in existing_fields
        )

        if missing_in_table:
            missing_fields[table_name] = missing_in_table

    return missing_tables, missing_fields