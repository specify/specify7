from specifyweb.specify.migration_utils.schema_writer import update_table_field_schema_config_params
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0035_FIELDS,
)
# ##########################################
# Used in 0035_version_required.py
# ##########################################

def update_version_required(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    updated_config_params = {
        'isrequired': False,
    }

    # Update the schema config for each discipline with the version isHidden change
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0035_FIELDS.items():
            for field in fields:    
                update_table_field_schema_config_params(table, discipline.id, field, updated_config_params, apps)

def revert_version_required(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    updated_config_params = {
        'isrequired': True,
    }

    # Revert the schema config for each discipline with the version isHidden change
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0035_FIELDS.items():
            for field in fields:    
                update_table_field_schema_config_params(table, discipline.id, field, updated_config_params, apps)
