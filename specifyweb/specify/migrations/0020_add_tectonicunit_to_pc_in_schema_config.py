"""
This migration adds Tectonic Unit -> Paleo Context in the Schema Config.
"""
from django.db import migrations
from specifyweb.specify.migration_utils import migration_helpers as usc
from specifyweb.specify.migration_utils.migration_helpers import add_tectonicunit_to_pc_in_schema_config, remove_tectonicunit_from_pc_schema_config

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0019_remove_parentCog'),
    ]

    def apply_migration(apps, schema_editor):
        add_tectonicunit_to_pc_in_schema_config(apps)

    def revert_migration(apps, schema_editor):
        remove_tectonicunit_from_pc_schema_config(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True),
    ]
