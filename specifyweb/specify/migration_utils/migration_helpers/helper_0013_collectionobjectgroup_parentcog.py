
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
    for discipline_id, discipline_type in Discipline.objects.all().order_by('type').values_list('pk', 'type'):
        for table, fields in MIGRATION_0013_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table_name=table,
                    discipline_id=discipline_id,
                    discipline_type=discipline_type,
                    field_name=field,
                    apps=apps
                )


def revert_update_cog_schema_config(apps):
    for table, fields in MIGRATION_0013_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)

    Discipline = apps.get_model('specify', 'Discipline')
    for discipline_id, discipline_type in Discipline.objects.all().order_by('type').values_list('pk', 'type'):
        # BUG: The parentCojo won't ever exist when this migration can be
        # reverted, leading update_table_field_schema_config_with_defaults to
        # essentially perform a NO-OP
        update_table_field_schema_config_with_defaults(
            table_name='CollectionObjectGroup',
            discipline_id=discipline_id,
            discipline_type=discipline_type,
            field_name='parentCojo',
            apps=apps
        )
