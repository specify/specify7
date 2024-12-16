import re

from typing import NamedTuple, List
import logging

from django.db.models import Q
from django.apps import apps

from specifyweb.specify.load_datamodel import Table, FieldDoesNotExistError, TableDoesNotExistError
from specifyweb.specify.models import (
    datamodel,
)

logger = logging.getLogger(__name__)

HIDDEN_FIELDS = [
    "timestampcreated", "timestampmodified", "version", "createdbyagent", "modifiedbyagent"
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

class TableSchemaConfig(NamedTuple):
    name: str
    discipline_id: int
    schema_type: int = 0
    description: str = "TBD"
    language: str = "en"

class FieldSchemaConfig(NamedTuple):
    name: str
    column: str
    java_type: str
    description: str = ""
    language: str = "en"

def uncapitilize(string: str) -> str: 
    return string.lower() if len(string) <= 1 else string[0].lower() + string[1:]

def update_table_schema_config_with_defaults(
    table_name,
    discipline_id: int,
    description: str = None,
    apps = apps
):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    try:
        table: Table = datamodel.get_table_strict(table_name)
    except TableDoesNotExistError:
        logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
        return

    table_config = TableSchemaConfig(
        name=table.name,
        discipline_id=discipline_id,
        schema_type=0,
        description=camel_to_spaced_title_case(uncapitilize(table.name)) if description is None else description,
        language="en"
    )

    # Create Splocalecontainer for the table
    sp_local_container, _ = Splocalecontainer.objects.get_or_create(
        name=table_config.name.lower(),
        discipline_id=discipline_id,
        schematype=table_config.schema_type,
        ishidden=False,
        issystem=table.system,
        version=0,
    )

    # Create a Splocaleitemstr for the table name and description
    for k, text in {'containername': camel_to_spaced_title_case(uncapitilize(table.name)), 'containerdesc': table_config.description}.items():
        item_str = {
            'text': text,
            'language': 'en',
            'version': 0,
        }
        item_str[k] = sp_local_container
        Splocaleitemstr.objects.get_or_create(**item_str)

    for field in table.all_fields:
        update_table_field_schema_config_with_defaults(table_name, discipline_id, field.name, apps)


def revert_table_schema_config(table_name, apps = apps):
    try:
        table: Table = datamodel.get_table_strict(table_name)
    except TableDoesNotExistError:
        logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
        return
    
    table_name = table.name

    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    containers = Splocalecontainer.objects.filter(name=table_name)
    items = Splocalecontaineritem.objects.filter(container__in=containers)
    Splocaleitemstr.objects.filter(
        Q(itemname__in=items) |
        Q(itemdesc__in=items) |
        Q(containername__in=containers) |
        Q(containerdesc__in=containers)
    ).delete()
    items.delete()
    containers.delete()

def update_table_field_schema_config_with_defaults(
    table_name,
    discipline_id: int,
    field_name: str,
    apps = apps
):
    try:
        table: Table = datamodel.get_table_strict(table_name)
    except TableDoesNotExistError:
        logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
        return
    
    table_name = table.name
    table_config = TableSchemaConfig(
        name=table_name.lower(),
        discipline_id=discipline_id,
        schema_type=0,
        language="en"
    )

    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    sp_local_container, _ = Splocalecontainer.objects.get_or_create(
        name=table.name.lower(),
        discipline_id=discipline_id,
        schematype=table_config.schema_type,
    )

    try:
        field = table.get_field_strict(field_name)
    except FieldDoesNotExistError:
        logger.warning(f"Field does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name} -> {field_name}")
        return

    field_config = FieldSchemaConfig(
        name=field_name,
        column=field.column,
        java_type=datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
        description=camel_to_spaced_title_case(field.name),
        language="en"
    )

    sp_local_container_item, _ = Splocalecontaineritem.objects.get_or_create(
        name=field_config.name,
        container=sp_local_container,
        type=field_config.java_type,
        ishidden=field_config.name.lower() in HIDDEN_FIELDS,
        isrequired=field.required,
        issystem=table.system,
        version=0,
    )

    for k, text in {
        "itemname": field_config.description,
        "itemdesc": field_config.description,
    }.items():
        itm_str = {
            'text': text,
            'language': 'en',
            'version': 0,
        }
        itm_str[k] = sp_local_container_item
        Splocaleitemstr.objects.get_or_create(**itm_str)

def revert_table_field_schema_config(table_name, field_name, apps = apps):
    try:
        table: Table = datamodel.get_table_strict(table_name)
    except TableDoesNotExistError:
        logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
        return
    
    table_name = table.name

    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    containers = Splocalecontainer.objects.filter(name=table_name)
    items = Splocalecontaineritem.objects.filter(container__in=containers, name=field_name)
    Splocaleitemstr.objects.filter(
        Q(itemname__in=items) |
        Q(itemdesc__in=items)
    ).delete()
    items.delete()
