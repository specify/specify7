"""
This migration updates the CO table children field to make hidden by default in schema config.
"""

from django.db import migrations
from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0029_FIELDS as SCHEMA_CONFIG_CO_TABLE_FIELDS
from specifyweb.specify.model_extras import GEOLOGY_DISCIPLINES, PALEO_DISCIPLINES

def hide_co_children(apps, schema_editor):
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
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )

                    for item in items:
                        item.ishidden = True
                        item.save()

def reverse_hide_co_children(apps, schema_editor):
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
                for field_name in fields:
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

    operations = [
        migrations.RunPython(hide_co_children, reverse_hide_co_children, atomic=True)
    ]