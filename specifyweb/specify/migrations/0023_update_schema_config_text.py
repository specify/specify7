"""
This migration updates descriptions, caption and isHidden value for various fields and tables in schema config.
"""

from django.db import migrations
from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0023_FIELDS as SCHEMA_CONFIG_MOD_TABLE_FIELDS

from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0023_FIELDS_BIS as SCHEMA_CONFIG_MOD_TABLE_FIELDS_BIS

def update_schema_config_field_desc(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items():
        #i.e: Collection Object
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )

        for container in containers:
         for field_name, new_name, new_desc in fields:
                #i.e: COType
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )

                for item in items:
                    localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                    localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                    if localized_items_desc is None or localized_items_name is None:
                     continue

                    localized_items_desc.text = new_desc
                    localized_items_desc.save() 

                    localized_items_name.text = new_name
                    localized_items_name.save() 

def update_hidden_prop(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS_BIS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )
        for container in containers:
            for field_name in fields:
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )

                for item in items:
                    item.ishidden = True
                    item.save()

def reverse_update_hidden_prop(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS_BIS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )
        for container in containers:
            for field_name in fields:
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )

                for item in items:
                    item.ishidden = False
                    item.save()

def reverse_update_schema_config_field_desc(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )

        for container in containers:
         for field_name, new_name, new_desc in fields:
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )

                for item in items:
                    localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                    localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                    if localized_items_desc is None or localized_items_name is None:
                     continue

                    localized_items_desc.text = item.name
                    localized_items_desc.save() 

                    localized_items_name.text = item.name
                    localized_items_name.save() 

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0022_ensure_default_cots'),
    ]

    operations = [
        migrations.RunPython(
            update_schema_config_field_desc, reverse_update_schema_config_field_desc, atomic=True
        ),
        migrations.RunPython(
            update_hidden_prop, reverse_update_hidden_prop, atomic=True
        ),
    ]