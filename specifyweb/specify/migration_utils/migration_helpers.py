from specifyweb.specify.migration_utils.schema_writer import (
    update_table_schema_config_with_defaults,
)
from specifyweb.specify.models import datamodel

#TODO: This is not used, can we remove?
# ##############################################################################
# Migration schema config helper functions
# ##############################################################################

def update_all_table_schema_config_with_defaults(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table in datamodel.tables:
            update_table_schema_config_with_defaults(table.name, discipline.id, None, apps)

