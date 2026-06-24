
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
    for discipline in Discipline.objects.all():
        update_table_field_schema_config_with_defaults('AbsoluteAge', discipline.id, 'version', apps)
        update_table_field_schema_config_with_defaults('RelativeAge', discipline.id, 'version', apps)

def revert_update_age_schema_config(apps):
    revert_table_field_schema_config('AbsoluteAge', 'version', apps)
    revert_table_field_schema_config('RelativeAge', 'version', apps)
