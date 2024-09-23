import re
from specifyweb.specify.load_datamodel import Table
from specifyweb.specify.models import (
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
    Discipline,
    datamodel,
)
from typing import List, Optional, NamedTuple
from django.db.models import Q

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

def update_table_schema_config_with_defaults(
    table_name,
    discipline_id: int,
    discipline: Optional[Discipline],
    description: str = None,
):
    table: Table = datamodel.get_table(table_name)
    table_name = table.name
    table_desc = re.sub(r'(?<!^)(?=[A-Z])', r' ', table_name) if description is None else description
    table_config = TableSchemaConfig(
        name=table_name.lower(),
        discipline_id=discipline_id,
        schema_type=0,
        description=table_desc,
        language="en"
    )

    fields_config = []
    for field in table.all_fields:
        field_name=field.name
        field_desc = re.sub(r'(?<!^)(?=[A-Z])', ' ', field.name).title()
        fields_config.append(FieldSchemaConfig(
            name=field_name,
            column=field.column,
            java_type=field.type,
            description=field_desc,
            language="en"
        ))

    HIDDEN_FIELDS = [
        "timestampcreated", "timestampmodified", "version", "createdbyagent", "modifiedbyagent"
    ]

    # Create Splocalecontainer for the table
    sp_local_container = Splocalecontainer.objects.create(
        name=table.name.lower(),
        discipline=discipline,
        schematype=table_config.schema_type,
        ishidden=False,
        issystem=table.system,
        version=0,
    )

    # Create a Splocaleitemstr for the table name and description
    for k, text in {'containername': table_config.description, 'containerdesc': table_config.description}.items():
        item_str = {
            'text': text,
            'language': 'en',
            'version': 0,
        }
        item_str[k] = sp_local_container
        Splocaleitemstr.objects.create(**item_str)

    for field in fields_config:
        # Create Splocalecontaineritem for each field
        sp_local_container_item = Splocalecontaineritem.objects.create(
            name=field.name,
            container=sp_local_container,
            ishidden=field.name.lower() in HIDDEN_FIELDS,
            issystem=table.system,
            version=0,
        )

        # Splocaleitemstr for the field name and description
        for k, text in {'itemname': field.name, 'itemdesc': field.description}.items():
            itm_str = {
                'text': text,
                'language': 'en',
                'version': 0,
            }
            itm_str[k] = sp_local_container_item
            Splocaleitemstr.objects.create(**itm_str)


def revert_table_schema_config(table_name):
    table: Table = datamodel.get_table(table_name)
    table_name = table.name

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
