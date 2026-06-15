
# ##########################################
# Used in 0002_schema_config_update.py
# ##########################################

MIGRATION_0002_TABLES = [
    ('CollectionObjectType', None),
    ('CollectionObjectGroupType', None),
    ('CollectionObjectGroup', None),
    ('CollectionObjectGroupJoin', None),
    ('SpUserExternalId', 'Stores provider identifiers and tokens for users who sign in using Single Sign On (SSO).'),
    ('SpAttachmentDataSet', 'Holds attachment data sets.'),
    ('UniquenessRule', 'Stores table names in the data model that have uniqueness rules configured for each discipline.'),
    ('UniquenessRuleField', 'Stores field names in the data model that have uniqueness rules configured for each discipline, linked to UniquenessRule records.'),
    ('Message', 'Stores user notifications.'),
    ('SpMerging', 'Tracks record and task IDs of records being merged.'),
    ('UserPolicy', 'Records permissions for a user within a collection.'),
    ('UserRole', 'Records roles associated with ecify users.'),
    ('Role', 'Stores names, descriptions, and collection information for user-created roles.'),
    ('RolePolicy', 'Stores resource and action permissions for user-created roles within a collection.'),
    ('LibraryRole', 'Stores names and descriptions of default roles that can be added to any collection.'),
    ('LibraryRolePolicy', 'Stores resource and action permissions for library roles within a collection.'),
    ('SpDataSet', 'Stores Specify Data Sets created during bulk import using the WorkBench, typically through spreadsheet uploads.')
]

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
