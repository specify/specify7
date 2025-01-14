"""
This migration adds Tectonic Unit -> Paleo Context in the Schema Config.
"""
from django.db import migrations
from specifyweb.specify.migration_utils.update_schema_config import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0020_FIELDS as SCHEMA_CONFIG_MOD_TABLE_FIELDS


def add_tectonicunit_to_pc_in_schema_config(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table, discipline.id, field, apps)


def remove_tectonicunit_from_pc_schema_config(apps):
    for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)


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
