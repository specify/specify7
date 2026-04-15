from django.db import migrations
from specifyweb.specify.migration_utils import update_schema_config as usc

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0041_add_missing_schema_after_reorganization'),
    ]

    def apply_migration(apps, schema_editor):
        usc.create_discipline_type_picklist(apps)
        usc.update_discipline_type_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        usc.revert_discipline_type_picklist(apps)
        usc.revert_discipline_type_splocalecontaineritem(apps)
        
    operations = [
        migrations.RunPython(
            apply_migration,
            revert_migration,
            atomic=True,
        ),
    ]
