"""
These represent changes to the SchemaConfig tables 
SpLocaleContainer, SpLocaleContainerItem, and SpLocaleItemStr
in migrations from 0002-0016

These are needed in this file because there was a bug in migrations which was 
later resolved in migration 0016, so both the migration files and the bug-fix 
migration file could utilize the same source
"""

# SpLocalContainer Changes
# of the form (TableName, Table Description)

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

MIGRATION_0004_TABLES = [
    ('AbsoluteAge', None),
    ('RelativeAge', None),
    ('TectonicUnitTreeDef', None),
    ('TectonicUnitTreeDefItem', None),
    ('TectonicUnit', None),
    ('RelativeAgeCitation', None),
    ('RelativeAgeAttachment', None),
    ('AbsoluteAgeCitation', None),
    ('AbsoluteAgeAttachment', None),
]

# SpLocaleContainerItem Changes
# of the form {TableName: [...addedFields]} 

MIGRATION_0004_FIELDS = {
    'Collectionobject': ['relativeAges', 'absoluteAges', 'collectionObjectType'],
    'Collection': ['collectionObjectType'],
    'Geographytreedef': ['discipline'],
    'Geologictimeperiodtreedef': ['discipline'],
    'Lithostrattreedef': ['discipline'],
}

MIGRATION_0007_FIELDS = {
    'StorageTreeDef': ['institution'],
    'CollectionObjectGroup': ['children']
}

MIGRATION_0008_FIELDS = {
    'AbsoluteAge': ['absoluteAgeCitations'],
    'RelativeAge': ['relativeAgeCitations']
}

MIGRATION_0012_FIELDS = {
    'CollectionObjectGroup': ['cojo'],
    'CollectionObject': ['cojo']
}

MIGRATION_0013_FIELDS = {
    'CollectionObjectGroup': ['parentCog']
}