
from django.db import migrations
from django.db.models import F

from specifyweb.specify.migration_utils.sp7_schemaconfig import (
MIGRATION_0033_TABLES
)

CONTAINER_MIGRATIONS = MIGRATION_0033_TABLES

def fix_table_description(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table_name, table_desc in CONTAINER_MIGRATIONS:
        containers = Splocalecontainer.objects.filter(
            name=table_name.lower(), schematype=0)

        Splocaleitemstr.objects.filter(
         containerdesc__in=containers
        ).update(text=table_desc)

def schemaconfig_fixes(apps, schema_editor):
    fix_table_description(apps)

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0032_add_quantities_gift'),
    ]

    operations = [
        migrations.RunPython(schemaconfig_fixes,
                             migrations.RunPython.noop, atomic=True)
    ]
