"""
This migration updates the geo tables hidden proprety in schema config.
"""

from django.db import migrations
from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0021_FIELDS as SCHEMA_CONFIG_MOD_TABLE_FIELDS
from specifyweb.specify.model_extras import GEOLOGY_DISCIPLINES, PALEO_DISCIPLINES

def fix_hidden_geo_prop(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    excluded_disciplines = PALEO_DISCIPLINES | GEOLOGY_DISCIPLINES

    filtered_disciplines = Discipline.objects.exclude(type__in=excluded_disciplines)

    for discipline in filtered_disciplines:
        for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items():
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

def reverse_fix_hidden_geo_prop(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    excluded_disciplines = PALEO_DISCIPLINES | GEOLOGY_DISCIPLINES

    filtered_disciplines = Discipline.objects.exclude(type__in=excluded_disciplines)

    for discipline in filtered_disciplines:
        for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items():
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
        ('specify', '0020_add_tectonicunit_to_pc_in_schema_config'),
    ]

    operations = [
        migrations.RunPython(fix_hidden_geo_prop, reverse_fix_hidden_geo_prop, atomic=True)
    ]