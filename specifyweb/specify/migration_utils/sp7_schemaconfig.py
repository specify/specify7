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

MIGRATION_0020_FIELDS = {
    'PaleoContext': ['tectonicUnit'],
}

MIGRATION_0021_FIELDS = {
    'CollectionObject': ['relativeAges', 'absoluteAges', 'cojo'],
}

MIGRATION_0023_FIELDS = {
    'CollectionObjectGroup': [
        ('guid', 'GUID', 'GUID'), 
        ('cogType', 'Type', 'Determines the logic Specify should use when managing the children within that COG'),
        ('igsn', 'IGSN', 'An International Generic Sample Number (IGSN) provides an unambiguous globally unique and persistent identifier for physical samples.'),
        ('cojo', 'Collection Object Group Join', 'This connects a Collection Object Group to its parent Collection Object Group, which is used for managing a hierarchy.'), 
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ],

    'collectionobjectgroupjoin' : [
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('isSubstrate', 'Is Substrate?', 'The Collection Object that serves as the physical base for other items within the COG. This designation is useful for COGs with shared substrates.'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ('isPrimary', 'Is Primary?', 'The Collection Object designated as the most significant item in a Consolidated COG. A CO child must be set as “primary” when using a “Consolidated” COG.'),
        ('childCo', 'Child Collection Object', 'Child Collection Object'),
        ('childCog', 'Child Collection Object Group', 'Child Collection Object Group'),
        ('ParentCog', 'Parent', 'Parent Collection Object Group'),
        ('yesno3', 'YesNo3', 'YesNo3'),
    ],

    'collectionobjectgrouptype' : [
        ('cogTypeId', 'Collection Object Group Type ID', 'Collection Object Group Type ID'),
        ('yesno3', 'YesNo3', 'YesNo3'),
    ],

    'collectionobjecttype': [
        ('collectionObjectTypeId', 'Collection Object Type ID', 'Collection Object Type ID'),
        ('taxonTreeDef', 'Taxon Tree', 'The Taxon Tree associated with this Collection Object Type'),
    ],

    'absoluteage': [
        ('yesno2', 'YesNo2', 'YesNo2'),
    ],

    'relativeage': [
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('yesno1', 'YesNo1', 'YesNo1'),
    ],

    'collectionobject': [
        ('collectionObjectType', 'Type', 'The type of object, such as a fish, mammal, mineral, rock, or meteorite.'),
        ('cojo', 'Collection Object Group', 'Connects a Collection Object to its Collection Object Group'),
    ],

    'tectonicunit': [
        ('guid', 'GUID', 'GUID'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ('tectonicUnitId', 'Tectonic Unit Id', 'Tectonic Unit Id'),
        ('yesno2', 'YesNo2', 'YesNo2'),
    ],

    'tectonicunittreedefitem': [
        ('createdbyagent', 'Created By Agent', 'Created By Agent'),
        ('rankId', 'Rank Id', 'Rank Id'),
    ]
}

MIGRATION_0023_FIELDS_BIS = {
    'CollectionObjectGroup': ['guid', ' text3', 'decimal2', 'igsn', 'text2', 'collection', 'description', 'text1', 'cojo', 'decimal1', 'yesno3', 'integer3', 'yesno2', 'collectionObjectGroupId', 'integer2', 'yesno1', 'integer1', 'decimal3', ],

    'collectionobjectgroupjoin' : ['yesno2', 'text1', 'yesno1', 'integer3', 'integer2', 'integer1', 'text3', 'yesno3', 'precedence', 'text2'],

    'collectionobjectgrouptype' : ['collection'],

    'collectionobjecttype': ['text3', 'collectionObjectTypeId', 'text2', 'text1', 'collection'],

    'absoluteage': ['collectionDate', 'absoluteAgeId', 'date1', 'date2', 'yesno1', 'yesno2', 'agent1', 'number1', 'number2', 'collectionObject', 'absoluteAgeCitations', 'text1', 'text2'],

    'paleocontext': ['yesNo1', 'text2', 'discipline', 'yesNo4', 'text2', 'yesNo2', 'number1', 'text3', 'number4', 'number5', 'yesNo3', 'text1', 'text5', 'number3', 'collectionObjects', 'text4', 'number2', 'chronosStratEnd', 'yesNo5'],

    'relativeage': ['number2', 'yesno2', 'relativeAgeId', 'relativeAgePeriod', 'text1', 'agent1', 'collectionDate', 'text2', 'agent2', 'date1', 'date2', 'collectionObject', 'relativeAgeCitations', 'number1', 'yesno1'],

    'collectionobject': ['collectionObjectType', 'relativeAges', 'absoluteAges', 'cojo'],

    'absoluteagecitation': ['collectionMember', 'absoluteAgeCitationId'],

    'relativeagecitation': ['absoluteAgeCitationId', 'collectionMember'],

    'tectonicunit': ['collectionMember', 'nodeNumber', 'yesno1', 'tectonicUnitId', 'number1', 'yesno2', 'number2', 'reankId', 'text1'],

    'tectonicunittreedefitem': ['children', 'rankId', 'parent', 'treeDef', 'treeEntries', 'tectonicUnitTreeDefItemId'],

    'tectonicunittreedef': ['discipline', 'treeEntries', 'tectonicUnitTreeDefId']
}