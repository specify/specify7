from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0002_TABLES,
)

# ##########################################
# Used in 0002_schema_config_update.py
# ##########################################

from specifyweb.specify.migration_utils.schema_writer import update_table_schema_config_with_defaults


DEFAULT_COG_TYPES = [
    'Discrete',
    'Consolidated',
    'Drill Core',
]

def create_geo_table_schema_config_with_defaults(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, desc in MIGRATION_0002_TABLES:
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)
