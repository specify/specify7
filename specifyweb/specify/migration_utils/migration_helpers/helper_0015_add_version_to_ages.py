
# ##########################################
# Used in 0015_add_version_to_ages.py
# ##########################################

from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults


def update_age_schema_config(apps):
    # Revert before adding to avoid duplicates
    # BUG: This will delete people's potentially modified Schema Config items
    # If we want to avoid duplicates, we should check the creation code and
    # prevent duplicates being created there
    # revert_update_age_schema_config(apps)

    Discipline = apps.get_model('specify', 'Discipline')
    for discipline_id, discipline_type in Discipline.objects.all().order_by('type').values_list('pk', 'type'):
        update_table_field_schema_config_with_defaults(
            table_name='AbsoluteAge',
            discipline_id=discipline_id,
            discipline_type=discipline_type,
            field_name='version',
            apps=apps
        )
        update_table_field_schema_config_with_defaults(
            table_name='RelativeAge',
            discipline_id=discipline_id,
            discipline_type=discipline_type,
            field_name='version',
            apps=apps
        )

def revert_update_age_schema_config(apps):
    revert_table_field_schema_config('AbsoluteAge', 'version', apps)
    revert_table_field_schema_config('RelativeAge', 'version', apps)
