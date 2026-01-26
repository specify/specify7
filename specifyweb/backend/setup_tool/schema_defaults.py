from typing import Optional
from django.db import transaction
from django.apps import apps as global_apps
from django.core.exceptions import MultipleObjectsReturned
from specifyweb.specify.migration_utils.update_schema_config import (
    camel_to_spaced_title_case,
    datamodel_type_to_schematype,
    FieldSchemaConfig,
    HIDDEN_FIELDS,
    uncapitilize,
)
from .utils import load_json_from_file
from specifyweb.specify.models import (
    Discipline,
    datamodel,
)
from typing import NamedTuple, Literal
from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id

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

    create_default_table_schema_config(
        discipline_id=discipline.id,
        defaults=defaults,
    )

def create_default_table_schema_config(
    discipline_id: int,
    apps = global_apps,
    defaults: dict = None,
):
    """Creates all schema config localization records. Assumes none exist."""
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    with transaction.atomic():
        container_batch = []
        item_batch = []
        str_batch = []

        # These seemingly redundant loops are used for much needed batching

        # Create table containers #
        for table_name in model_names_by_table_id.values():
            container_batch.append(create_table_container(
                table_name,
                discipline_id
            ))
        Splocalecontainer.objects.bulk_create(container_batch, ignore_conflicts=True)

        # Create a map to reference the saved parent containers later
        saved_containers = Splocalecontainer.objects.filter(
            name__in=[c.name for c in container_batch],
            discipline_id=discipline_id
        )
        container_map = {c.name: c for c in saved_containers}

        # Create items for all fields in every table #
        for table_name in model_names_by_table_id.values():
            table_defaults = defaults.get(table_name.lower()) if defaults is not None else dict()
            if table_defaults is None:
                table_defaults = dict()

            container = container_map[table.name.lower()]

            for field in table.all_fields:
                field_defaults = None
                if table_defaults.get('items'):
                    field_defaults = table_defaults['items'].get(field.name.lower())

                item_batch.extend(create_field_item(
                    field.name,
                    table_name,
                    container,
                    field_defaults
                ))

        Splocalecontaineritem.objects.bulk_create(item_batch, ignore_conflicts=True)

        saved_items = Splocalecontaineritem.objects.filter(
            container__name__in=[c.name for c in container_batch],
            container__discipline_id=discipline_id
        )
        item_map = {(i.container.name, i.name): i for i in saved_items}

        # Create strings for names and descriptions belonging all tables and their fields #
        for table_name in model_names_by_table_id.values():
            table = datamodel.get_table(table_name)
            table_defaults = defaults.get(table_name.lower()) if defaults is not None else dict()
            if table_defaults is None:
                table_defaults = dict()

            container = container_map[table.name.lower()]

            str_batch.extend(create_table_strings(
                table_name,
                container,
                table_defaults
            ))

            for field in table.all_fields:
                field_name = field.name.lower()

                field_defaults = None
                if table_defaults.get('items'):
                    field_defaults = table_defaults['items'].get(field_name)

                item_key = (container.name, field_name)
                item = item_map[item_key]

                str_batch.extend(
                    create_field_strings(
                        field_name,
                        table_name,
                        item,
                        field_defaults,
                    )
                )
        Splocaleitemstr.objects.bulk_create(str_batch, ignore_conflicts=True)

def create_table_container(
    table_name: str,
    discipline_id: int,
    apps = global_apps,
):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    table = datamodel.get_table(table_name)

    return Splocalecontainer(
        name=table.name.lower(),
        discipline_id=discipline_id,
        schematype=0,
        ishidden=False,
        issystem=table.system,
        version=0,
    )

def create_field_item(
    field_name: str,
    table_name: str,
    container,
    field_defaults: dict = None,
    apps = global_apps,
):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    table = datamodel.get_table(table_name)
    field = table.get_field_strict(field_name)
    field_name_str = camel_to_spaced_title_case(field.name)
    field_desc_str = camel_to_spaced_title_case(field.name)
    field_hidden = field_name.lower() in HIDDEN_FIELDS
    field_required = field.required
    picklist_name = None
    if field_defaults is not None:
        field_name_str = field_defaults.get('name', field_name_str)
        field_desc_str = field_defaults.get('desc', field_desc_str)
        field_hidden = field_defaults.get('ishidden', field_hidden)
        field_required = field_defaults.get('isrequired', field_required)
        picklist_name = field_defaults.get('picklistname', picklist_name)

    field_config = FieldSchemaConfig(
        name=field_name,
        column=field.column,
        java_type=datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
        description=field_desc_str,
        language="en"
    )

    return Splocalecontaineritem(
        name=field_config.name,
        container=container,
        type=field_config.java_type,
        ishidden=field_hidden,
        isrequired=field_required,
        issystem=table.system,
        version=0,
        picklistname=picklist_name
    )

def create_table_strings(
    table_name: str,
    container,
    table_defaults: dict = None,
    apps = global_apps,
):
    table = datamodel.get_table(table_name)
    table_name_str = table_defaults.get('name', camel_to_spaced_title_case(uncapitilize(table.name)))
    table_desc_str = table_defaults.get('desc', camel_to_spaced_title_case(uncapitilize(table.name)))

    return create_strings('container', container, table_name_str, table_desc_str, apps)
    
def create_field_strings(
    field_name: str,
    table_name: str,
    item,
    field_defaults: dict = None,
    apps = global_apps,
):
    table = datamodel.get_table(table_name)
    field = table.get_field_strict(field_name)
    field_name = field.name
    field = table.get_field_strict(field_name)
    field_name_str = camel_to_spaced_title_case(field.name)
    field_desc_str = camel_to_spaced_title_case(field.name)
    if field_defaults is not None:
        field_name_str = field_defaults.get('name', field_name_str)
        field_desc_str = field_defaults.get('desc', field_desc_str)

    return create_strings('item', item, field_name_str, field_desc_str, apps)

def create_strings(
    parent_type: Literal['item', 'container'],
    item,
    name_str,
    desc_str,
    apps = global_apps,
):
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    strings = []
    for k, text in {
        f"{parent_type}name": name_str,
        f"{parent_type}desc": desc_str,
    }.items():
        itm_str = {
            'text': text,
            'language': 'en',
            'version': 0,
        }
        itm_str[k] = item
        strings.append(Splocaleitemstr(**itm_str))
    return strings