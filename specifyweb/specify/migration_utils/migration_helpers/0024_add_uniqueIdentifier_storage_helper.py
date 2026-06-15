from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0024_FIELDS,
)
# ##########################################
# Used in 0024_add_uniqueIdentifier_storage.py
# ##########################################

def update_storage_unique_id_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')

    # Add uniqueIdentifier -> storage
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0024_FIELDS.items(): 
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def revert_storage_unique_id_fields(apps):
    # Remove uniqueIdentifier -> storage
    for table, fields in MIGRATION_0024_FIELDS.items(): 
        for field in fields: 
            revert_table_field_schema_config(table, field, apps)