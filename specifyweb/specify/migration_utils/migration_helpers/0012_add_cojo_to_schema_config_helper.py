from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0012_FIELDS,
)
# ##########################################
# Used in 0012_add_cojo_to_schema_config.py
# ##########################################

def add_cojo_to_schema_config(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0012_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table, discipline.id, field, apps)


def remove_cojo_from_schema_config(apps):
    for table, fields in MIGRATION_0012_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)