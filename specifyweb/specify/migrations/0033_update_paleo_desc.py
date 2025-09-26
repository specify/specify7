from django.db import migrations
from specifyweb.specify.migration_utils import update_schema_config as usc

def schemaconfig_fixes(apps, schema_editor):
    usc.update_paleo_desc(apps)

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0032_add_quantities_gift'),
    ]

    operations = [
        migrations.RunPython(schemaconfig_fixes,
                             migrations.RunPython.noop, atomic=True)
    ]
