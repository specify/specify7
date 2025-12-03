"""
This migration adds COG -> cojo and CO -> cojo to Schema Config.
"""
from django.db import migrations
from specifyweb.specify.migration_utils import update_schema_config as usc

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0011_cascading_tree_nodes'),
    ]

    def apply_migration(apps, schema_editor):
        usc.add_cojo_to_schema_config(apps)

    def revert_migration(apps, schema_editor):
        usc.remove_cojo_from_schema_config(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True),
    ]
