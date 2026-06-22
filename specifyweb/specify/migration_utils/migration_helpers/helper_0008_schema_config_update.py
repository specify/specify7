from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
# ##########################################
# Used in 0008_schema_config_update.py
# ##########################################

MIGRATION_0008_FIELDS = {
    'AbsoluteAge': ['absoluteAgeCitations'],
    'RelativeAge': ['relativeAgeCitations']
}

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
