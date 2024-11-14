"""
This migration adds COG -> cojo and CO -> cojo to Schema Config.
"""
from django.db import migrations
from specifyweb.specify.update_schema_config import revert_table_field_schema_config, update_table_field_schema_config_with_defaults

def add_cojo_to_schema_config(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        update_table_field_schema_config_with_defaults('CollectionObjectGroup', discipline.id, 'cojo', apps)
        update_table_field_schema_config_with_defaults('CollectionObject', discipline.id, 'cojo', apps)

def remove_cojo_from_schema_config(apps):
    revert_table_field_schema_config('CollectionObjectGroup', 'cojo', apps)
    revert_table_field_schema_config('CollectionObject', 'cojo', apps)

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