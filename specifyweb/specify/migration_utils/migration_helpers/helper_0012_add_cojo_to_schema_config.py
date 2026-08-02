from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults

# ##########################################
# Used in 0012_add_cojo_to_schema_config.py
# ##########################################

MIGRATION_0012_FIELDS = {
    'CollectionObjectGroup': ['cojo'],
    'CollectionObject': ['cojo']
}

def add_cojo_to_schema_config(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline_id, discipline_type in Discipline.objects.all().order_by('type').values_list('pk', 'type'):
        for table, fields in MIGRATION_0012_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table_name=table,
                    discipline_id=discipline_id,
                    discipline_type=discipline_type,
                    field_name=field,
                    apps=apps
                )


def remove_cojo_from_schema_config(apps):
    for table, fields in MIGRATION_0012_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)
