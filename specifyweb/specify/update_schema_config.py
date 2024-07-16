import re
from specifyweb.specify.load_datamodel import Table
from specifyweb.specify.models import (
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
    Discipline,
    datamodel,
)
from typing import List
from dataclasses import dataclass
from django.db.models import Q

@dataclass
class TableSchemaConfig:
    name: str
    discipline_id: int
    schema_type: int = 0
    description: str = "TBD"
    language: str = "en"

@dataclass
class FieldSchemaConfig:
    name: str
    column: str
    java_type: str
    description: str = ""
    language: str = "en"

def update_table_schema_config_with_defaults(table_name, discipline_id, description=None):
    table: Table = datamodel.get_table(table_name)
    table_name = table.classname.split('.')[-1]
    table_desc = re.sub(r'(?<!^)(?=[A-Z])', r' ', table_name) if description is None else description
    table_config = TableSchemaConfig(
        name=table_name,
        discipline_id=discipline_id,
        schema_type=0,
        description=table_desc,
        language="en"
    )

    fields_config = []
    for field in table.fields:
        field_desc = field.name
        field_name = re.sub(r'(?<!^)(?=[A-Z])', ' ', field_desc).capitalize()
        fields_config.append(FieldSchemaConfig(
            name=field_name,
            column=field.column,
            java_type=field.type,
            description=field_desc,
            language="en"
        ))

    # Create Splocalecontainer for the tbale
    sp_local_container = Splocalecontainer.objects.create(
        name=table.name,
        discipline=Discipline.objects.values_list('id', flat=True).get(id=discipline_id),
        schematype=table_config.schema_type,
        ishidden=False,
        issystem=table.system,
        version=0,
    )

    # Create a Splocaleitemstr for the table name and description
    for k, text in {'containername': table_config.name, 'containerdesc': table_config.description}.items():
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
            ishidden=False,
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
    table_name = table.classname.split('.')[-1]

    container = Splocalecontainer.objects.get(name=table_name)
    items = Splocalecontaineritem.objects.filter(container=container)
    for item in items:
        item_strs = Splocaleitemstr.objects.filter(Q(itemname=item) | Q(itemdesc=item))
        for item_str in item_strs:
            item_str.delete()
        item.delete()
    
    item_strs = Splocaleitemstr.objects.filter(Q(containername=container) | Q(containerdesc=container))
    for item_str in item_strs:
        item_str.delete()
    container.delete()
