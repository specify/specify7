from django.db import migrations

from specifyweb.specify.migration_utils.migration_helpers import create_discipline_type_picklist, revert_discipline_type_picklist, revert_discipline_type_splocalecontaineritem, update_discipline_type_splocalecontaineritem

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0041_add_missing_schema_after_reorganization'),
    ]

    def apply_migration(apps, schema_editor):
        create_discipline_type_picklist(apps)
        update_discipline_type_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        revert_discipline_type_picklist(apps)
        revert_discipline_type_splocalecontaineritem(apps)
        
    operations = [
        migrations.RunPython(
            apply_migration,
            revert_migration,
            atomic=True,
        ),
    ]
