import re

from typing import NamedTuple, List

from django.db.models import Q
from django.apps import apps

from specifyweb.specify.load_datamodel import Table
from specifyweb.specify.models import (
    datamodel,
)

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
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    table: Table = datamodel.get_table(table_name)
    table_config = TableSchemaConfig(
        name=table.name,
        discipline_id=discipline_id,
        schema_type=0,
        description=camel_to_spaced_title_case(uncapitilize(table.name)) if description is None else description,
        language="en"
    )

    # Create Splocalecontainer for the table
    sp_local_container = Splocalecontainer.objects.create(
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
        Splocaleitemstr.objects.create(**item_str)

    for field in table.all_fields:
        # Create Splocalecontaineritem for each field
        sp_local_container_item = Splocalecontaineritem.objects.create(
            name=field.name,
            container=sp_local_container,
            type=datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
            ishidden=field.name.lower() in HIDDEN_FIELDS,
            isrequired=field.required,
            issystem=table.system,
            version=0,
        )

        # Splocaleitemstr for the field name and description
        for k, text in {
            "itemname": camel_to_spaced_title_case(field.name),
            "itemdesc": camel_to_spaced_title_case(field.name),
        }.items():
            itm_str = {
                "text": text,
                "language": "en",
                "version": 0,
            }
            itm_str[k] = sp_local_container_item
            Splocaleitemstr.objects.create(**itm_str)


def revert_table_schema_config(table_name, apps = apps):
    table: Table = datamodel.get_table(table_name)
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
    table: Table = datamodel.get_table(table_name)
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

    sp_local_container = Splocalecontainer.objects.get(
        name=table.name.lower(),
        discipline_id=discipline_id,
        schematype=table_config.schema_type,
    )

    field = table.get_field(field_name)

    field_config = FieldSchemaConfig(
        name=field_name,
        column=field.column,
        java_type=datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
        description=camel_to_spaced_title_case(field.name),
        language="en"
    )

    sp_local_container_item = Splocalecontaineritem.objects.create(
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
        Splocaleitemstr.objects.create(**itm_str)

def revert_table_field_schema_config(table_name, field_name, apps = apps):
    table: Table = datamodel.get_table(table_name)
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
