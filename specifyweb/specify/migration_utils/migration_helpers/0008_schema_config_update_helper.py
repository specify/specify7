from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0008_FIELDS,
)
# ##########################################
# Used in 0008_schema_config_update.py
# ##########################################

def update_relative_age_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')

    # Add absoluteAgeCitation -> absoluteAge & Add relativeAgeCitation -> relativeAge
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0008_FIELDS.items(): 
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def revert_relative_age_fields(apps):
    # Remove absoluteAgeCitation -> absoluteAge and relativeAgeCitation -> relativeAge
        for table, fields in MIGRATION_0008_FIELDS.items(): 
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)