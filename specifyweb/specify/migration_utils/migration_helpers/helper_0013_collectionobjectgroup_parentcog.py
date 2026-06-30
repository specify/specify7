
# ##########################################
# Used in 0013_collectionobjectgroup_parentcog.py
# ##########################################

MIGRATION_0013_FIELDS = {
    'CollectionObjectGroup': ['parentCog']
}

from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults


def update_cog_schema_config(apps):
    revert_table_field_schema_config(
        'CollectionObjectGroup', 'parentCojo', apps)
    revert_table_field_schema_config(
        'CollectionObjectGroup', 'parentCog', apps)

    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0013_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table, discipline.id, field, apps)


def revert_update_cog_schema_config(apps):
    for table, fields in MIGRATION_0013_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)

    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        update_table_field_schema_config_with_defaults(
            'CollectionObjectGroup', discipline.id, 'parentCojo', apps)
