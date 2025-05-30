# Generated by Django 4.2.18 on 2025-05-12 07:30

from django.db import migrations, models
import django.db.models.deletion

from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0029_FIELDS as SCHEMA_CONFIG_TABLE_FIELDS, MIGRATION_0029_UPDATE_FIELDS as SCHEMA_CONFIG_CO_TABLE_FIELDS
from specifyweb.specify.migration_utils.update_schema_config import revert_table_field_schema_config, update_table_field_schema_config_with_defaults

def update_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        for table, fields in SCHEMA_CONFIG_TABLE_FIELDS.items(): 
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def update_schema_config_field_desc(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in SCHEMA_CONFIG_CO_TABLE_FIELDS.items():
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

def hide_co_component(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    disciplines = Discipline.objects.all()

    for discipline in disciplines:
        for table, fields in SCHEMA_CONFIG_CO_TABLE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                for field_name, _, _ in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )

                    for item in items:
                        item.ishidden = True
                        item.save()

def revert_update_fields(apps):
    for table, fields in SCHEMA_CONFIG_TABLE_FIELDS.items(): 
        for field in fields: 
            revert_table_field_schema_config(table, field, apps)

def revert_update_schema_field(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in SCHEMA_CONFIG_CO_TABLE_FIELDS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )
        for container in containers:
            for field_name in fields:
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name
                )

                for item in items:
                    item.ishidden = False
                    item.save()

def reverse_hide_co_component(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    disciplines = Discipline.objects.all()

    for discipline in disciplines:
        for table, fields in SCHEMA_CONFIG_CO_TABLE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                for field_name, _, _ in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )

                    for item in items:
                        item.ishidden = False
                        item.save()

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0028_selectseries'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        update_fields(apps)
        update_schema_config_field_desc(apps, schema_editor)
        hide_co_component(apps, schema_editor)

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        revert_update_fields(apps)
        revert_update_schema_field(apps, schema_editor)
        reverse_hide_co_component(apps, schema_editor)

    operations = [
        migrations.RemoveField(
            model_name='collectionobject',
            name='parentco',
        ),
        migrations.AddField(
            model_name='collectionobject',
            name='componentParent',
            field=models.ForeignKey(db_column='ComponentParentID', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='components', to='specify.collectionobject'),
        ),
        migrations.RunPython(consolidated_python_django_migration_operations, revert_cosolidated_python_django_migration_operations, atomic=True),
    ]
