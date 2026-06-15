from django.db import migrations
from specifyweb.specify.migration_utils.migration_helpers import update_paleo_desc

def schemaconfig_fixes(apps, schema_editor):
    update_paleo_desc(apps)

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0032_add_quantities_gift'),
    ]

    operations = [
        migrations.RunPython(schemaconfig_fixes,
                             migrations.RunPython.noop, atomic=True)
    ]
