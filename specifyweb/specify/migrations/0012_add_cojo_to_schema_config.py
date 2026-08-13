"""
This migration adds COG -> cojo and CO -> cojo to Schema Config.
"""
from django.db import migrations
from specifyweb.specify.migration_utils import migration_helpers as usc
from specifyweb.specify.migration_utils.migration_helpers.helper_0012_add_cojo_to_schema_config import add_cojo_to_schema_config, remove_cojo_from_schema_config

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0011_cascading_tree_nodes'),
    ]

    def apply_migration(apps, schema_editor):
        add_cojo_to_schema_config(apps)

    def revert_migration(apps, schema_editor):
        remove_cojo_from_schema_config(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True),
    ]
