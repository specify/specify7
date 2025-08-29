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
    'CollectionObject': ['relativeAges', 'absoluteAges', 'collectionObjectType'],
    'Collection': ['collectionObjectType'],
    'GeographyTreeDef': ['discipline'],
    'GeologicTimePeriodTreeDef': ['discipline'],
    'LithoStratTreeDef': ['discipline'],
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
        ('cojo', 'Parent COG', 'This connects a Collection Object Group to its parent Collection Object Group, which is used for managing a hierarchy.'), 
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ],

    'CollectionObjectGroupJoin' : [
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('isSubstrate', 'Is Substrate?', 'The Collection Object that serves as the physical base for other items within the COG. This designation is useful for COGs with shared substrates.'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ('isPrimary', 'Is Primary?', 'The Collection Object designated as the most significant item in a Consolidated COG. A CO child must be set as “primary” when using a “Consolidated” COG.'),
        ('childCo', 'Child Collection Object', 'Child Collection Object'),
        ('childCog', 'Child Collection Object Group', 'Child Collection Object Group'),
        ('ParentCog', 'Parent', 'Parent Collection Object Group'),
        ('yesno3', 'YesNo3', 'YesNo3'),
    ],

    'CollectionObjectGroupType' : [
        ('cogTypeId', 'Collection Object Group Type ID', 'Collection Object Group Type ID'),
        ('yesno3', 'YesNo3', 'YesNo3'),
    ],

    'CollectionObjectType': [
        ('collectionObjectTypeId', 'Collection Object Type ID', 'Collection Object Type ID'),
        ('taxonTreeDef', 'Taxon Tree', 'The Taxon Tree associated with this Collection Object Type'),
    ],

    'AbsoluteAge': [
        ('yesno2', 'YesNo2', 'YesNo2'),
    ],

    'RelativeAge': [
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('yesno1', 'YesNo1', 'YesNo1'),
    ],

    'CollectionObject': [
        ('collectionObjectType', 'Type', 'The type of object, such as a fish, mammal, mineral, rock, or meteorite.'),
        ('cojo', 'Parent COG', 'Connects a Collection Object to its Collection Object Group'),
    ],

    'TectonicUnit': [
        ('guid', 'GUID', 'GUID'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ('tectonicUnitId', 'Tectonic Unit ID', 'Tectonic Unit Id'),
        ('yesno2', 'YesNo2', 'YesNo2'),
    ],

    'TectonicUnitTreeDefItem': [
        ('createdbyagent', 'Created By Agent', 'Created By Agent'),
        ('rankId', 'Rank ID', 'Rank Id'),
    ]
}

MIGRATION_0023_FIELDS_BIS = {
    'CollectionObjectGroup': ['guid', ' text3', 'decimal2', 'igsn', 'text2', 'collection', 'description', 'text1', 'cojo', 'decimal1', 'yesno3', 'integer3', 'yesno2', 'collectionObjectGroupId', 'integer2', 'yesno1', 'integer1', 'decimal3', ],
    'CollectionObjectGroupJoin' : ['yesno2', 'text1', 'yesno1', 'integer3', 'integer2', 'integer1', 'text3', 'yesno3', 'precedence', 'text2'],
    'CollectionObjectGroupType' : ['collection'],
    'CollectionObjectType': ['text3', 'collectionObjectTypeId', 'text2', 'text1', 'collection'],
    'AbsoluteAge': ['collectionDate', 'absoluteAgeId', 'date1', 'date2', 'yesno1', 'yesno2', 'agent1', 'number1', 'number2', 'collectionObject', 'absoluteAgeCitations', 'text1', 'text2'],
    'RelativeAge': ['number2', 'yesno2', 'relativeAgeId', 'relativeAgePeriod', 'text1', 'agent1', 'collectionDate', 'text2', 'agent2', 'date1', 'date2', 'collectionObject', 'relativeAgeCitations', 'number1', 'yesno1'],
    'CollectionObject': ['collectionObjectType', 'relativeAges', 'absoluteAges', 'cojo'],
    'AbsoluteAgeCitation': ['collectionMember', 'absoluteAgeCitationId'],
    'RelativeAgeCitation': ['absoluteAgeCitationId', 'collectionMember'],
    'TectonicUnit': ['collectionMember', 'nodeNumber', 'yesno1', 'tectonicUnitId', 'number1', 'yesno2', 'number2', 'rankId', 'text1'],
    'TectonicUnitTreeDefItem': ['children', 'rankId', 'parent', 'treeDef', 'treeEntries', 'tectonicUnitTreeDefItemId'],
    'TectonicUnitTreeDef': ['discipline', 'treeEntries', 'tectonicUnitTreeDefId']
}

MIGRATION_0024_FIELDS = {
    'Storage': ['uniqueIdentifier'],
}

MIGRATION_0027_FIELDS = {
    'CollectionObject': ['parentCO', 'children'],
}

MIGRATION_0027_UPDATE_FIELDS = {
    'CollectionObject': [
        ('parentCO', 'Parent Collection Object', 'Parent CollectionObject'), 
        ('children', 'Children', 'Children'),
    ]
}

MIGRATION_0029_FIELDS = {
    'CollectionObject': ['componentParent', 'components'],
}

MIGRATION_0029_UPDATE_FIELDS = {
    'CollectionObject': [
        ('componentParent', 'Component Parent', 'Parent of a component Collection Object'), 
        ('components', 'Components', 'Component parts of a Collection Object'),
    ]
}


MIGRATION_0032_FIELDS = {
    'GiftPreparation': ['quantityResolved', 'quantityReturned'],
}

MIGRATION_0032_UPDATE_FIELDS = {
    'GiftPreparation': [
        ('quantityResolved','Quantity Resolved', 'Number of specimens returned, deaccessioned or otherwise accounted for. (necessary for Lots).'), 
        ('quantityReturned', 'Quantity Returned', 'Number of specimens returned. (necessary for Lots)'),
    ]
}

MIGRATION_0033_TABLES = [
    ('Paleocontext', 'Paleo Context provides contextual information on the chronostratigraphy, lithostratigraphy, and biostratigraphy of a collection object, collecting event, or locality.'),
]

MIGRATION_0034_FIELDS = {
    'Accession': ['dateAccessionedPrecision', 'dateAcknowledgedPrecision', 'dateReceivedPrecision', 'date1', 'date1Precision', 'date2', 'date2Precision'],
}

MIGRATION_0034_UPDATE_FIELDS = {
    'Accession': [
        ('dateAccessionedPrecision',    'Date Accessioned Precision',    'Date Accessioned Precision'),
        ('dateAcknowledgedPrecision',   'Date Acknowledged Precision',   'Date Acknowledged Precision'),
        ('dateReceivedPrecision',       'Date Received Precision',       'Date Received Precision'),
        ('date1',                       'Date 1',                        'Date 1'),
        ('date1Precision',              'Date 1 Precision',              'Date 1 Precision'),
        ('date2',                       'Date 2',                        'Date 2'),
        ('date2Precision',              'Date 2 Precision',              'Date 2 Precision'),
    ]
}

MIGRATION_0035_FIELDS = {
    'AbsoluteAge': ['version'],
    'AbsoluteAgeAttachment': ['version'],
    'AbsoluteAgeCitation': ['version'],
    'Accession': ['version'],
    'AccessionAgent': ['version'],
    'AccessionAttachment': ['version'],
    'AccessionAuthorization': ['version'],
    'AccessionCitation': ['version'],
    'Address': ['version'],
    'AddressOfRecord': ['version'],
    'Agent': ['version'],
    'AgentAttachment': ['version'],
    'AgentGeography': ['version'],
    'AgentIdentifier': ['version'],
    'AgentSpecialty': ['version'],
    'AgentVariant': ['version'],
    'Appraisal': ['version'],
    'Attachment': ['version'],
    'AttachmentImageAttribute': ['version'],
    'AttachmentMetadata': ['version'],
    'AttachmentTag': ['version'],
    'AttributeDef': ['version'],
    'Author': ['version'],
    'AutoNumberingScheme': ['version'],
    'Borrow': ['version'],
    'BorrowAgent': ['version'],
    'BorrowAttachment': ['version'],
    'BorrowMaterial': ['version'],
    'BorrowReturnMaterial': ['version'],
    'CollectingEvent': ['version'],
    'CollectingEventAttachment': ['version'],
    'CollectingEventAttr': ['version'],
    'CollectingEventAttribute': ['version'],
    'CollectingEventAuthorization': ['version'],
    'CollectingTrip': ['version'],
    'CollectingTripAttachment': ['version'],
    'CollectingTripAttribute': ['version'],
    'CollectingTripAuthorization': ['version'],
    'Collection': ['version'],
    'CollectionObject': ['version'],
    'CollectionObjectAttachment': ['version'],
    'CollectionObjectAttr': ['version'],
    'CollectionObjectAttribute': ['version'],
    'CollectionObjectCitation': ['version'],
    'CollectionObjectGroup': ['version'],
    'CollectionObjectGroupJoin': ['version'],
    'CollectionObjectGroupType': ['version'],
    'CollectionObjectProperty': ['version'],
    'CollectionObjectType': ['version'],
    'CollectionRelationship': ['version'],
    'CollectionRelType': ['version'],
    'Collector': ['version'],
    'CommonNameTx': ['version'],
    'CommonNameTxCitation': ['version'],
    'ConservDescription': ['version'],
    'ConservDescriptionAttachment': ['version'],
    'ConservEvent': ['version'],
    'ConservEventAttachment': ['version'],
    'Container': ['version'],
    'DataType': ['version'],
    'Deaccession': ['version'],
    'DeaccessionAgent': ['version'],
    'DeaccessionAttachment': ['version'],
    'Determination': ['version'],
    'DeterminationCitation': ['version'],
    'Determiner': ['version'],
    'Discipline': ['version'],
    'Disposal': ['version'],
    'DisposalAgent': ['version'],
    'DisposalAttachment': ['version'],
    'DisposalPreparation': ['version'],
    'Division': ['version'],
    'DnaPrimer': ['version'],
    'DnaSequence': ['version'],
    'DnaSequenceAttachment': ['version'],
    'DnaSequencingRun': ['version'],
    'DnaSequencingRunAttachment': ['version'],
    'DnaSequencingRunCitation': ['version'],
    'ExchangeIn': ['version'],
    'ExchangeInAttachment': ['version'],
    'ExchangeInPrep': ['version'],
    'ExchangeOut': ['version'],
    'ExchangeOutAttachment': ['version'],
    'ExchangeOutPrep': ['version'],
    'Exsiccata': ['version'],
    'ExsiccataItem': ['version'],
    'Extractor': ['version'],
    'FieldNotebook': ['version'],
    'FieldNotebookAttachment': ['version'],
    'FieldNotebookPage': ['version'],
    'FieldNotebookPageAttachment': ['version'],
    'FieldNotebookPageSet': ['version'],
    'FieldNotebookPageSetAttachment': ['version'],
    'FundingAgent': ['version'],
    'GeoCoordDetail': ['version'],
    'Geography': ['version'],
    'GeographyTreeDef': ['version'],
    'GeographyTreeDefItem': ['version'],
    'GeologicTimePeriod': ['version'],
    'GeologicTimePeriodTreeDef': ['version'],
    'GeologicTimePeriodTreeDefItem': ['version'],
    'Gift': ['version'],
    'GiftAgent': ['version'],
    'GiftAttachment': ['version'],
    'GiftPreparation': ['version'],
    'GroupPerson': ['version'],
    'InfoRequest': ['version'],
    'Institution': ['version'],
    'InstitutionNetwork': ['version'],
    'Journal': ['version'],
    'LatLonPolygon': ['version'],
    'LithoStrat': ['version'],
    'LithoStratTreeDef': ['version'],
    'LithoStratTreeDefItem': ['version'],
    'Loan': ['version'],
    'LoanAgent': ['version'],
    'LoanAttachment': ['version'],
    'LoanPreparation': ['version'],
    'LoanReturnPreparation': ['version'],
    'Locality': ['version'],
    'LocalityAttachment': ['version'],
    'LocalityCitation': ['version'],
    'LocalityDetail': ['version'],
    'LocalityNameAlias': ['version'],
    'MaterialSample': ['version'],
    'MorphbankView': ['version'],
    'OtherIdentifier': ['version'],
    'PaleoContext': ['version'],
    'PcrPerson': ['version'],
    'Permit': ['version'],
    'PermitAttachment': ['version'],
    'PickList': ['version'],
    'PickListItem': ['version'],
    'Preparation': ['version'],
    'PreparationAttachment': ['version'],
    'PreparationAttr': ['version'],
    'PreparationAttribute': ['version'],
    'PreparationProperty': ['version'],
    'PrepType': ['version'],
    'Project': ['version'],
    'Recordset': ['version'],
    'ReferenceWork': ['version'],
    'ReferenceWorkAttachment': ['version'],
    'RelativeAge': ['version'],
    'RelativeAgeAttachment': ['version'],
    'RelativeAgeCitation': ['version'],
    'RepositoryAgreement': ['version'],
    'RepositoryAgreementAttachment': ['version'],
    'Shipment': ['version'],
    'SpAppResource': ['version'],
    'SpAppResourceData': ['version'],
    'SpAppResourceDir': ['version'],
    'SpAuditLog': ['version'],
    'SpAuditLogField': ['version'],
    'SpecifyUser': ['version'],
    'SpExportSchema': ['version'],
    'SpExportSchemaItem': ['version'],
    'SpExportSchemaItemMapping': ['version'],
    'SpExportSchemaMapping': ['version'],
    'SpFieldValueDefault': ['version'],
    'SpLocaleContainer': ['version'],
    'SpLocaleContainerItem': ['version'],
    'SpLocaleItemStr': ['version'],
    'SpPrincipal': ['version'],
    'SpQuery': ['version'],
    'SpQueryField': ['version'],
    'SpReport': ['version'],
    'SpSymbiotaInstance': ['version'],
    'SpTaskSemaphore': ['version'],
    'SpVersion': ['version'],
    'SpViewSetObj': ['version'],
    'SpVisualQuery': ['version'],
    'Storage': ['version'],
    'StorageAttachment': ['version'],
    'StorageTreeDef': ['version'],
    'StorageTreeDefItem': ['version'],
    'Taxon': ['version'],
    'TaxonAttachment': ['version'],
    'TaxonAttribute': ['version'],
    'TaxonCitation': ['version'],
    'TaxonTreeDef': ['version'],
    'TaxonTreeDefItem': ['version'],
    'TectonicUnit': ['version'],
    'TectonicUnitTreeDef': ['version'],
    'TectonicUnitTreeDefItem': ['version'],
    'TreatmentEvent': ['version'],
    'TreatmentEventAttachment': ['version'],
    'VoucherRelationship': ['version'],
    'Workbench': ['version'],
    'WorkbenchRowExportedRelationship': ['version'],
    'WorkbenchTemplate': ['version'],
    'WorkbenchTemplateMappingItem': ['version'],
}

MIGRATION_0038_FIELDS = {
    'Loan': ['agent1', 'agent2', 'agent3', 'agent4', 'agent5'],
    'Gift': ['agent1', 'agent2', 'agent3', 'agent4', 'agent5'],
}

MIGRATION_0038_UPDATE_FIELDS = {
    'Loan': [
        ('agent1','Agent 1','Agent 1'),
        ('agent2','Agent 2','Agent 2'),
        ('agent3','Agent 3','Agent 3'),
        ('agent4','Agent 4','Agent 4'),
        ('agent5','Agent 5','Agent 5'),
    ],
    'Gift': [
        ('agent1','Agent 1','Agent 1'),
        ('agent2','Agent 2','Agent 2'),
        ('agent3','Agent 3','Agent 3'),
        ('agent4','Agent 4','Agent 4'),
        ('agent5','Agent 5','Agent 5'),
    ]
}
