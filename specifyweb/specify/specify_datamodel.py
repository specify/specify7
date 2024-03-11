from .specify_datamodel_classes import *

datamodel = Datamodel(tables=[
    Table(
        classname='edu.ku.brc.specify.datamodel.Accession',
        table='accession',
        tableId=7,
        idColumn='AccessionID',
        idFieldName='accessionId',
        idField=IdField(name='accessionId', column='AccessionID', type='java.lang.Integer'),
        fields=[
            Field(name='accessionCondition', column='AccessionCondition', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='accessionNumber', column='AccessionNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=60),
            Field(name='dateAccessioned', column='DateAccessioned', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateAcknowledged', column='DateAcknowledged', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateReceived', column='DateReceived', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='status', column='Status', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='totalValue', column='TotalValue', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='verbatimDate', column='VerbatimDate', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='AccessionNumberIDX', column_names=['AccessionNumber']),
            Index(name='AccessionDateIDX', column_names=['DateAccessioned'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='accessionAgents', type='one-to-many',required=False, relatedModelName='AccessionAgent', otherSideName='accession'),
            Relationship(is_relationship=True, name='accessionAttachments', type='one-to-many',required=False, relatedModelName='AccessionAttachment', otherSideName='accession'),
            Relationship(is_relationship=True, name='accessionAuthorizations', type='one-to-many',required=False, relatedModelName='AccessionAuthorization', otherSideName='accession'),
            Relationship(is_relationship=True, name='accessionCitations', type='one-to-many',required=False, relatedModelName='AccessionCitation', otherSideName='accession'),
            Relationship(is_relationship=True, name='addressOfRecord', type='many-to-one',required=False, relatedModelName='AddressOfRecord', column='AddressOfRecordID', otherSideName='accessions'),
            Relationship(is_relationship=True, name='appraisals', type='one-to-many',required=False, relatedModelName='Appraisal', otherSideName='accession'),
            Relationship(is_relationship=True, name='collectionObjects', type='one-to-many',required=False, relatedModelName='CollectionObject', otherSideName='accession'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=True, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='repositoryAgreement', type='many-to-one',required=False, relatedModelName='RepositoryAgreement', column='RepositoryAgreementID', otherSideName='accessions'),
            Relationship(is_relationship=True, name='treatmentEvents', type='one-to-many',required=False, relatedModelName='TreatmentEvent', otherSideName='accession')
        ],
        fieldAliases=[

        ],
        view='Accession',
        searchDialog='AccessionSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AccessionAgent',
        table='accessionagent',
        tableId=12,
        idColumn='AccessionAgentID',
        idFieldName='accessionAgentId',
        idField=IdField(name='accessionAgentId', column='AccessionAgentID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='role', column='Role', indexed=False, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='accession', type='many-to-one',required=False, relatedModelName='Accession', column='AccessionID', otherSideName='accessionAgents'),
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='repositoryAgreement', type='many-to-one',required=False, relatedModelName='RepositoryAgreement', column='RepositoryAgreementID', otherSideName='repositoryAgreementAgents')
        ],
        fieldAliases=[

        ],
        view='AccessionAgent',
        searchDialog='AccessionAgentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AccessionAttachment',
        table='accessionattachment',
        tableId=108,
        idColumn='AccessionAttachmentID',
        idFieldName='accessionAttachmentId',
        idField=IdField(name='accessionAttachmentId', column='AccessionAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='accession', type='many-to-one',required=True, relatedModelName='Accession', column='AccessionID', otherSideName='accessionAttachments'),
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='accessionAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog='AttachmentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AccessionAuthorization',
        table='accessionauthorization',
        tableId=13,
        idColumn='AccessionAuthorizationID',
        idFieldName='accessionAuthorizationId',
        idField=IdField(name='accessionAuthorizationId', column='AccessionAuthorizationID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='accession', type='many-to-one',required=False, relatedModelName='Accession', column='AccessionID', otherSideName='accessionAuthorizations'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='permit', type='many-to-one',required=True, relatedModelName='Permit', column='PermitID', otherSideName='accessionAuthorizations'),
            Relationship(is_relationship=True, name='repositoryAgreement', type='many-to-one',required=False, relatedModelName='RepositoryAgreement', column='RepositoryAgreementID', otherSideName='repositoryAgreementAuthorizations')
        ],
        fieldAliases=[

        ],
        view=None,
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AccessionCitation',
        table='accessioncitation',
        tableId=159,
        idColumn='AccessionCitationID',
        idFieldName='accessionCitationId',
        idField=IdField(name='accessionCitationId', column='AccessionCitationID', type='java.lang.Integer'),
        fields=[
            Field(name='figureNumber', column='FigureNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='isFigured', column='IsFigured', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='pageNumber', column='PageNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='plateNumber', column='PlateNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='accession', type='many-to-one',required=True, relatedModelName='Accession', column='AccessionID', otherSideName='accessionCitations'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Address',
        table='address',
        tableId=8,
        idColumn='AddressID',
        idFieldName='addressId',
        idField=IdField(name='addressId', column='AddressID', type='java.lang.Integer'),
        fields=[
            Field(name='address', column='Address', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='address2', column='Address2', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='address3', column='Address3', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='address4', column='Address4', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='address5', column='Address5', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='city', column='City', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='country', column='Country', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='endDate', column='EndDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='fax', column='Fax', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='isCurrent', column='IsCurrent', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isPrimary', column='IsPrimary', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isShipping', column='IsShipping', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='phone1', column='Phone1', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='phone2', column='Phone2', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='positionHeld', column='PositionHeld', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='postalCode', column='PostalCode', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='roomOrBuilding', column='RoomOrBuilding', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='startDate', column='StartDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='state', column='State', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='typeOfAddr', column='TypeOfAddr', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=False, relatedModelName='Agent', column='AgentID', otherSideName='addresses'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='divisions', type='one-to-many',required=False, relatedModelName='Division', otherSideName='address'),
            Relationship(is_relationship=True, name='insitutions', type='one-to-many',required=False, relatedModelName='Institution', otherSideName='address'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='Address',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AddressOfRecord',
        table='addressofrecord',
        tableId=125,
        idColumn='AddressOfRecordID',
        idFieldName='addressOfRecordId',
        idField=IdField(name='addressOfRecordId', column='AddressOfRecordID', type='java.lang.Integer'),
        fields=[
            Field(name='address', column='Address', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='address2', column='Address2', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='city', column='City', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='country', column='Country', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='postalCode', column='PostalCode', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='state', column='State', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='accessions', type='one-to-many',required=False, relatedModelName='Accession', otherSideName='addressOfRecord'),
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=False, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='exchangeIns', type='one-to-many',required=False, relatedModelName='ExchangeIn', otherSideName='addressOfRecord'),
            Relationship(is_relationship=True, name='exchangeOuts', type='one-to-many',required=False, relatedModelName='ExchangeOut', otherSideName='addressOfRecord'),
            Relationship(is_relationship=True, name='loans', type='one-to-many',required=False, relatedModelName='Loan', otherSideName='addressOfRecord'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='repositoryAgreements', type='one-to-many',required=False, relatedModelName='RepositoryAgreement', otherSideName='addressOfRecord')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Agent',
        table='agent',
        tableId=5,
        idColumn='AgentID',
        idFieldName='agentId',
        idField=IdField(name='agentId', column='AgentID', type='java.lang.Integer'),
        fields=[
            Field(name='abbreviation', column='Abbreviation', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='agentType', column='AgentType', indexed=True, unique=False, required=True, type='java.lang.Byte'),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2Precision', column='Date2Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='dateOfBirth', column='DateOfBirth', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateOfBirthPrecision', column='DateOfBirthPrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='dateOfDeath', column='DateOfDeath', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateOfDeathPrecision', column='DateOfDeathPrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='dateType', column='DateType', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='email', column='Email', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='firstName', column='FirstName', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='initials', column='Initials', indexed=False, unique=False, required=False, type='java.lang.String', length=8),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='interests', column='Interests', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='jobTitle', column='JobTitle', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='lastName', column='LastName', indexed=True, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='middleInitial', column='MiddleInitial', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='suffix', column='Suffix', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='url', column='URL', indexed=False, unique=False, required=False, type='java.lang.String', length=1024),
            Field(name='verbatimDate1', column='VerbatimDate1', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='verbatimDate2', column='VerbatimDate2', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='AgentLastNameIDX', column_names=['LastName']),
            Index(name='AgentFirstNameIDX', column_names=['FirstName']),
            Index(name='AgentGuidIDX', column_names=['GUID']),
            Index(name='AgentTypeIDX', column_names=['AgentType']),
            Index(name='AbbreviationIDX', column_names=['Abbreviation'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='addresses', type='one-to-many',required=False, relatedModelName='Address', otherSideName='agent'),
            Relationship(is_relationship=True, name='agentAttachments', type='one-to-many',required=False, relatedModelName='AgentAttachment', otherSideName='agent'),
            Relationship(is_relationship=True, name='agentGeographies', type='one-to-many',required=False, relatedModelName='AgentGeography', otherSideName='agent'),
            Relationship(is_relationship=True, name='agentSpecialties', type='one-to-many',required=False, relatedModelName='AgentSpecialty', otherSideName='agent'),
            Relationship(is_relationship=True, name='collContentContact', type='many-to-one',required=False, relatedModelName='Collection', column='CollectionCCID', otherSideName='contentContacts'),
            Relationship(is_relationship=True, name='collTechContact', type='many-to-one',required=False, relatedModelName='Collection', column='CollectionTCID', otherSideName='technicalContacts'),
            Relationship(is_relationship=True, name='collectors', type='one-to-many',required=False, relatedModelName='Collector', otherSideName='agent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=False, relatedModelName='Division', column='DivisionID', otherSideName='members'),
            Relationship(is_relationship=True, name='groups', type='one-to-many',required=False, relatedModelName='GroupPerson', otherSideName='group'),
            Relationship(is_relationship=True, name='identifiers', type='one-to-many',required=False, relatedModelName='AgentIdentifier', otherSideName='agent'),
            Relationship(is_relationship=True, name='instContentContact', type='many-to-one',required=False, relatedModelName='Institution', column='InstitutionCCID', otherSideName='contentContacts'),
            Relationship(is_relationship=True, name='instTechContact', type='many-to-one',required=False, relatedModelName='Institution', column='InstitutionTCID', otherSideName='technicalContacts'),
            Relationship(is_relationship=True, name='members', type='one-to-many',required=False, relatedModelName='GroupPerson', otherSideName='member'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='orgMembers', type='one-to-many',required=False, relatedModelName='Agent', otherSideName='organization'),
            Relationship(is_relationship=True, name='organization', type='many-to-one',required=False, relatedModelName='Agent', column='ParentOrganizationID', otherSideName='orgMembers'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=False, relatedModelName='SpecifyUser', column='SpecifyUserID', otherSideName='agents'),
            Relationship(is_relationship=True, name='variants', type='one-to-many',required=False, relatedModelName='AgentVariant', otherSideName='agent')
        ],
        fieldAliases=[

        ],
        view='Agent',
        searchDialog='AgentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AgentAttachment',
        table='agentattachment',
        tableId=109,
        idColumn='AgentAttachmentID',
        idFieldName='agentAttachmentId',
        idField=IdField(name='agentAttachmentId', column='AgentAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID', otherSideName='agentAttachments'),
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='agentAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='AgentAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AgentGeography',
        table='agentgeography',
        tableId=78,
        idColumn='AgentGeographyID',
        idFieldName='agentGeographyId',
        idField=IdField(name='agentGeographyId', column='AgentGeographyID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='role', column='Role', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID', otherSideName='agentGeographies'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='geography', type='many-to-one',required=True, relatedModelName='Geography', column='GeographyID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AgentIdentifier',
        table='agentidentifier',
        tableId=168,
        idColumn='AgentIdentifierID',
        idFieldName='agentIdentifierId',
        idField=IdField(name='agentIdentifierId', column='AgentIdentifierID', type='java.lang.Integer'),
        fields=[
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2Precision', column='Date2Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='identifier', column='Identifier', indexed=False, unique=False, required=True, type='java.lang.String', length=2048),
            Field(name='identifierType', column='IdentifierType', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID', otherSideName='identifiers'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='AgentIdentifier',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AgentSpecialty',
        table='agentspecialty',
        tableId=86,
        idColumn='AgentSpecialtyID',
        idFieldName='agentSpecialtyId',
        idField=IdField(name='agentSpecialtyId', column='AgentSpecialtyID', type='java.lang.Integer'),
        fields=[
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='specialtyName', column='SpecialtyName', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID', otherSideName='agentSpecialties'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AgentVariant',
        table='agentvariant',
        tableId=107,
        idColumn='AgentVariantID',
        idFieldName='agentVariantId',
        idField=IdField(name='agentVariantId', column='AgentVariantID', type='java.lang.Integer'),
        fields=[
            Field(name='country', column='Country', indexed=False, unique=False, required=False, type='java.lang.String', length=2),
            Field(name='language', column='Language', indexed=False, unique=False, required=False, type='java.lang.String', length=2),
            Field(name='name', column='Name', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='varType', column='VarType', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='variant', column='Variant', indexed=False, unique=False, required=False, type='java.lang.String', length=2),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID', otherSideName='variants'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='AgentVariant',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Appraisal',
        table='appraisal',
        tableId=67,
        idColumn='AppraisalID',
        idFieldName='appraisalId',
        idField=IdField(name='appraisalId', column='AppraisalID', type='java.lang.Integer'),
        fields=[
            Field(name='appraisalDate', column='AppraisalDate', indexed=True, unique=False, required=True, type='java.util.Calendar'),
            Field(name='appraisalNumber', column='AppraisalNumber', indexed=True, unique=True, required=True, type='java.lang.String', length=64),
            Field(name='appraisalValue', column='AppraisalValue', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='monetaryUnitType', column='MonetaryUnitType', indexed=False, unique=False, required=False, type='java.lang.String', length=8),
            Field(name='notes', column='Notes', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='AppraisalNumberIDX', column_names=['AppraisalNumber']),
            Index(name='AppraisalDateIDX', column_names=['AppraisalDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='accession', type='many-to-one',required=False, relatedModelName='Accession', column='AccessionID', otherSideName='appraisals'),
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='collectionObjects', type='one-to-many',required=False, relatedModelName='CollectionObject', otherSideName='appraisal'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='Appraisal',
        searchDialog='AppraisalSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Attachment',
        table='attachment',
        tableId=41,
        idColumn='AttachmentID',
        idFieldName='attachmentId',
        idField=IdField(name='attachmentId', column='AttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='attachmentLocation', column='AttachmentLocation', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='attachmentStorageConfig', column='AttachmentStorageConfig', indexed=False, unique=False, required=False, type='text'),
            Field(name='captureDevice', column='CaptureDevice', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='copyrightDate', column='CopyrightDate', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='copyrightHolder', column='CopyrightHolder', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='credit', column='Credit', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='dateImaged', column='DateImaged', indexed=True, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='fileCreatedDate', column='FileCreatedDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='isPublic', column='IsPublic', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='license', column='License', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='licenseLogoUrl', column='LicenseLogoUrl', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='metadataText', column='MetadataText', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='mimeType', column='MimeType', indexed=False, unique=False, required=False, type='java.lang.String', length=1024),
            Field(name='origFilename', column='OrigFilename', indexed=False, unique=False, required=True, type='text', length=65535),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='scopeID', column='ScopeID', indexed=True, unique=False, required=False, type='java.lang.Integer'),
            Field(name='scopeType', column='ScopeType', indexed=True, unique=False, required=False, type='java.lang.Byte'),
            Field(name='subjectOrientation', column='SubjectOrientation', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='subtype', column='Subtype', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='tableID', column='TableID', indexed=False, unique=False, required=True, type='java.lang.Short'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='visibility', column='Visibility', indexed=False, unique=False, required=False, type='java.lang.Byte')
        ],
        indexes=[
            Index(name='TitleIDX', column_names=['Title']),
            Index(name='DateImagedIDX', column_names=['DateImaged']),
            Index(name='AttchScopeIDIDX', column_names=['ScopeID']),
            Index(name='AttchScopeTypeIDX', column_names=['ScopeType']),
            Index(name='AttchmentGuidIDX', column_names=['GUID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='accessionAttachments', type='one-to-many',required=False, relatedModelName='AccessionAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='agentAttachments', type='one-to-many',required=False, relatedModelName='AgentAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='attachmentImageAttribute', type='many-to-one',required=False, relatedModelName='AttachmentImageAttribute', column='AttachmentImageAttributeID', otherSideName='attachments'),
            Relationship(is_relationship=True, name='borrowAttachments', type='one-to-many',required=False, relatedModelName='BorrowAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='collectingEventAttachments', type='one-to-many',required=False, relatedModelName='CollectingEventAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='collectingTripAttachments', type='one-to-many',required=False, relatedModelName='CollectingTripAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='collectionObjectAttachments', type='one-to-many',required=False, relatedModelName='CollectionObjectAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='conservDescriptionAttachments', type='one-to-many',required=False, relatedModelName='ConservDescriptionAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='conservEventAttachments', type='one-to-many',required=False, relatedModelName='ConservEventAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='creator', type='many-to-one',required=False, relatedModelName='Agent', column='CreatorID'),
            Relationship(is_relationship=True, name='deaccessionAttachments', type='one-to-many',required=False, relatedModelName='DeaccessionAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='disposalAttachments', type='one-to-many',required=False, relatedModelName='DisposalAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='dnaSequenceAttachments', type='one-to-many',required=False, relatedModelName='DNASequenceAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='dnaSequencingRunAttachments', type='one-to-many',required=False, relatedModelName='DNASequencingRunAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='exchangeInAttachments', type='one-to-many',required=False, relatedModelName='ExchangeInAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='exchangeOutAttachments', type='one-to-many',required=False, relatedModelName='ExchangeOutAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='fieldNotebookAttachments', type='one-to-many',required=False, relatedModelName='FieldNotebookAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='fieldNotebookPageAttachments', type='one-to-many',required=False, relatedModelName='FieldNotebookPageAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='fieldNotebookPageSetAttachments', type='one-to-many',required=False, relatedModelName='FieldNotebookPageSetAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='giftAttachments', type='one-to-many',required=False, relatedModelName='GiftAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='loanAttachments', type='one-to-many',required=False, relatedModelName='LoanAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='localityAttachments', type='one-to-many',required=False, relatedModelName='LocalityAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='metadata', type='one-to-many',required=False, relatedModelName='AttachmentMetadata', otherSideName='attachment'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='permitAttachments', type='one-to-many',required=False, relatedModelName='PermitAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='preparationAttachments', type='one-to-many',required=False, relatedModelName='PreparationAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='referenceWorkAttachments', type='one-to-many',required=False, relatedModelName='ReferenceWorkAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='repositoryAgreementAttachments', type='one-to-many',required=False, relatedModelName='RepositoryAgreementAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='storageAttachments', type='one-to-many',required=False, relatedModelName='StorageAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='tags', type='one-to-many',required=False, relatedModelName='AttachmentTag', otherSideName='attachment'),
            Relationship(is_relationship=True, name='taxonAttachments', type='one-to-many',required=False, relatedModelName='TaxonAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='treatmentEventAttachments', type='one-to-many',required=False, relatedModelName='TreatmentEventAttachment', otherSideName='attachment'),
            Relationship(is_relationship=True, name='visibilitySetBy', type='many-to-one',required=False, relatedModelName='SpecifyUser', column='VisibilitySetByID')
        ],
        fieldAliases=[

        ],
        view='AttachmentsForm',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AttachmentImageAttribute',
        table='attachmentimageattribute',
        tableId=139,
        idColumn='AttachmentImageAttributeID',
        idFieldName='attachmentImageAttributeId',
        idField=IdField(name='attachmentImageAttributeId', column='AttachmentImageAttributeID', type='java.lang.Integer'),
        fields=[
            Field(name='creativeCommons', column='CreativeCommons', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='height', column='Height', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='imageType', column='ImageType', indexed=False, unique=False, required=False, type='java.lang.String', length=80),
            Field(name='magnification', column='Magnification', indexed=False, unique=False, required=False, type='java.lang.Double', length=24),
            Field(name='mbImageId', column='MBImageID', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='resolution', column='Resolution', indexed=False, unique=False, required=False, type='java.lang.Double', length=24),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=200),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=200),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampLastSend', column='TimestampLastSend', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='timestampLastUpdateCheck', column='TimestampLastUpdateCheck', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='viewDescription', column='ViewDescription', indexed=False, unique=False, required=False, type='java.lang.String', length=80),
            Field(name='width', column='Width', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachments', type='one-to-many',required=False, relatedModelName='Attachment', otherSideName='attachmentImageAttribute'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='morphBankView', type='many-to-one',required=False, relatedModelName='MorphBankView', column='MorphBankViewID', otherSideName='attachmentImageAttributes')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AttachmentMetadata',
        table='attachmentmetadata',
        tableId=42,
        idColumn='AttachmentMetadataID',
        idFieldName='attachmentMetadataID',
        idField=IdField(name='attachmentMetadataID', column='AttachmentMetadataID', type='java.lang.Integer'),
        fields=[
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='value', column='Value', indexed=False, unique=False, required=True, type='java.lang.String', length=128),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=False, relatedModelName='Attachment', column='AttachmentID', otherSideName='metadata'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AttachmentTag',
        table='attachmenttag',
        tableId=130,
        idColumn='AttachmentTagID',
        idFieldName='attachmentTagID',
        idField=IdField(name='attachmentTagID', column='AttachmentTagID', type='java.lang.Integer'),
        fields=[
            Field(name='tag', column='Tag', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='tags'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AttributeDef',
        table='attributedef',
        tableId=16,
        idColumn='AttributeDefID',
        idFieldName='attributeDefId',
        idField=IdField(name='attributeDefId', column='AttributeDefID', type='java.lang.Integer'),
        fields=[
            Field(name='dataType', column='DataType', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='fieldName', column='FieldName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='tableType', column='TableType', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='collectingEventAttrs', type='one-to-many',required=False, relatedModelName='CollectingEventAttr', otherSideName='definition'),
            Relationship(is_relationship=True, name='collectionObjectAttrs', type='one-to-many',required=False, relatedModelName='CollectionObjectAttr', otherSideName='definition'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID', otherSideName='attributeDefs'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='prepType', type='many-to-one',required=False, relatedModelName='PrepType', column='PrepTypeID', otherSideName='attributeDefs'),
            Relationship(is_relationship=True, name='preparationAttrs', type='one-to-many',required=False, relatedModelName='PreparationAttr', otherSideName='definition')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Author',
        table='author',
        tableId=17,
        idColumn='AuthorID',
        idFieldName='authorId',
        idField=IdField(name='authorId', column='AuthorID', type='java.lang.Integer'),
        fields=[
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=True, type='java.lang.Short'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID', otherSideName='authors')
        ],
        fieldAliases=[

        ],
        view='Author',
        searchDialog='AuthorSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.AutoNumberingScheme',
        table='autonumberingscheme',
        tableId=97,
        idColumn='AutoNumberingSchemeID',
        idFieldName='autoNumberingSchemeId',
        idField=IdField(name='autoNumberingSchemeId', column='AutoNumberingSchemeID', type='java.lang.Integer'),
        fields=[
            Field(name='formatName', column='FormatName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='isNumericOnly', column='IsNumericOnly', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='schemeClassName', column='SchemeClassName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='schemeName', column='SchemeName', indexed=True, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='tableNumber', column='TableNumber', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SchemeNameIDX', column_names=['SchemeName'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collections', type='many-to-many',required=False, relatedModelName='Collection', otherSideName='numberingSchemes'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disciplines', type='many-to-many',required=False, relatedModelName='Discipline', otherSideName='numberingSchemes'),
            Relationship(is_relationship=True, name='divisions', type='many-to-many',required=False, relatedModelName='Division', otherSideName='numberingSchemes'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='AutoNumberingScheme',
        searchDialog='AutoNumberingScheme'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Borrow',
        table='borrow',
        tableId=18,
        idColumn='BorrowID',
        idFieldName='borrowId',
        idField=IdField(name='borrowId', column='BorrowID', type='java.lang.Integer'),
        fields=[
            Field(name='borrowDate', column='BorrowDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='borrowDatePrecision', column='BorrowDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='currentDueDate', column='CurrentDueDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateClosed', column='DateClosed', indexed=False, unique=False, required=False, type='java.util.Calendar', length=10),
            Field(name='invoiceNumber', column='InvoiceNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='isClosed', column='IsClosed', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isFinancialResponsibility', column='IsFinancialResponsibility', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='numberOfItemsBorrowed', column='NumberOfItemsBorrowed', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='originalDueDate', column='OriginalDueDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='receivedDate', column='ReceivedDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='status', column='Status', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='BorInvoiceNumberIDX', column_names=['InvoiceNumber']),
            Index(name='BorReceivedDateIDX', column_names=['ReceivedDate']),
            Index(name='BorColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='addressOfRecord', type='many-to-one',required=False, relatedModelName='AddressOfRecord', column='AddressOfRecordID'),
            Relationship(is_relationship=True, name='borrowAgents', type='one-to-many',required=False, relatedModelName='BorrowAgent', otherSideName='borrow'),
            Relationship(is_relationship=True, name='borrowAttachments', type='one-to-many',required=False, relatedModelName='BorrowAttachment', otherSideName='borrow'),
            Relationship(is_relationship=True, name='borrowMaterials', type='one-to-many',required=False, relatedModelName='BorrowMaterial', otherSideName='borrow'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='shipments', type='one-to-many',required=False, relatedModelName='Shipment', otherSideName='borrow')
        ],
        fieldAliases=[

        ],
        view='Borrow',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.BorrowAgent',
        table='borrowagent',
        tableId=19,
        idColumn='BorrowAgentID',
        idFieldName='borrowAgentId',
        idField=IdField(name='borrowAgentId', column='BorrowAgentID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='role', column='Role', indexed=False, unique=False, required=True, type='java.lang.String', length=32),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='BorColMemIDX2', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='borrow', type='many-to-one',required=True, relatedModelName='Borrow', column='BorrowID', otherSideName='borrowAgents'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='BorrowAgent',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.BorrowAttachment',
        table='borrowattachment',
        tableId=145,
        idColumn='BorrowAttachmentID',
        idFieldName='borrowAttachmentId',
        idField=IdField(name='borrowAttachmentId', column='BorrowAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='borrowAttachments'),
            Relationship(is_relationship=True, name='borrow', type='many-to-one',required=True, relatedModelName='Borrow', column='BorrowID', otherSideName='borrowAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.BorrowMaterial',
        table='borrowmaterial',
        tableId=20,
        idColumn='BorrowMaterialID',
        idFieldName='borrowMaterialId',
        idField=IdField(name='borrowMaterialId', column='BorrowMaterialID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='description', column='Description', indexed=True, unique=False, required=False, type='java.lang.String', length=250),
            Field(name='inComments', column='InComments', indexed=False, unique=False, required=False, type='text', length=1024),
            Field(name='materialNumber', column='MaterialNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='outComments', column='OutComments', indexed=False, unique=False, required=False, type='text', length=1024),
            Field(name='quantity', column='Quantity', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='quantityResolved', column='QuantityResolved', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='quantityReturned', column='QuantityReturned', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=6667),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=6667),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='BorMaterialNumberIDX', column_names=['MaterialNumber']),
            Index(name='BorMaterialColMemIDX', column_names=['CollectionMemberID']),
            Index(name='DescriptionIDX', column_names=['Description'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='borrow', type='many-to-one',required=True, relatedModelName='Borrow', column='BorrowID', otherSideName='borrowMaterials'),
            Relationship(is_relationship=True, name='borrowReturnMaterials', type='one-to-many',required=False, relatedModelName='BorrowReturnMaterial', otherSideName='borrowMaterial'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='BorrowMaterial',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.BorrowReturnMaterial',
        table='borrowreturnmaterial',
        tableId=21,
        idColumn='BorrowReturnMaterialID',
        idFieldName='borrowReturnMaterialId',
        idField=IdField(name='borrowReturnMaterialId', column='BorrowReturnMaterialID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='quantity', column='Quantity', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='returnedDate', column='ReturnedDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='BorrowReturnedDateIDX', column_names=['ReturnedDate']),
            Index(name='BorrowReturnedColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=False, relatedModelName='Agent', column='ReturnedByID'),
            Relationship(is_relationship=True, name='borrowMaterial', type='many-to-one',required=True, relatedModelName='BorrowMaterial', column='BorrowMaterialID', otherSideName='borrowReturnMaterials'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='BorrowReturnMaterial',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingEvent',
        table='collectingevent',
        tableId=10,
        idColumn='CollectingEventID',
        idFieldName='collectingEventId',
        idField=IdField(name='collectingEventId', column='CollectingEventID', type='java.lang.Integer'),
        fields=[
            Field(name='endDate', column='EndDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='endDatePrecision', column='EndDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='endDateVerbatim', column='EndDateVerbatim', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='endTime', column='EndTime', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='method', column='Method', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='reservedInteger3', column='ReservedInteger3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedInteger4', column='ReservedInteger4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedText1', column='ReservedText1', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='reservedText2', column='ReservedText2', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='sgrStatus', column='SGRStatus', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='startDate', column='StartDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='startDatePrecision', column='StartDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='startDateVerbatim', column='StartDateVerbatim', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='startTime', column='StartTime', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='stationFieldNumber', column='StationFieldNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='stationFieldNumberModifier1', column='StationFieldNumberModifier1', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='stationFieldNumberModifier2', column='StationFieldNumberModifier2', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='stationFieldNumberModifier3', column='StationFieldNumberModifier3', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='uniqueIdentifier', column='UniqueIdentifier', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='verbatimDate', column='VerbatimDate', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='verbatimLocality', column='VerbatimLocality', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='visibility', column='Visibility', indexed=False, unique=False, required=False, type='java.lang.Byte')
        ],
        indexes=[
            Index(name='CEStationFieldNumberIDX', column_names=['StationFieldNumber']),
            Index(name='CEStartDateIDX', column_names=['StartDate']),
            Index(name='CEEndDateIDX', column_names=['EndDate']),
            Index(name='CEUniqueIdentifierIDX', column_names=['UniqueIdentifier']),
            Index(name='CEGuidIDX', column_names=['GUID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectingEventAttachments', type='one-to-many',required=False, relatedModelName='CollectingEventAttachment', otherSideName='collectingEvent'),
            Relationship(is_relationship=True, name='collectingEventAttribute', type='many-to-one',required=False, relatedModelName='CollectingEventAttribute', column='CollectingEventAttributeID', otherSideName='collectingEvents'),
            Relationship(is_relationship=True, name='collectingEventAttrs', type='one-to-many',required=False, relatedModelName='CollectingEventAttr', otherSideName='collectingEvent'),
            Relationship(is_relationship=True, name='collectingEventAuthorizations', type='one-to-many',required=False, relatedModelName='CollectingEventAuthorization', otherSideName='collectingEvent'),
            Relationship(is_relationship=True, name='collectingTrip', type='many-to-one',required=False, relatedModelName='CollectingTrip', column='CollectingTripID', otherSideName='collectingEvents'),
            Relationship(is_relationship=True, name='collectionObjects', type='one-to-many',required=False, relatedModelName='CollectionObject', otherSideName='collectingEvent'),
            Relationship(is_relationship=True, name='collectors', type='one-to-many',required=False, relatedModelName='Collector', otherSideName='collectingEvent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='locality', type='many-to-one',required=False, relatedModelName='Locality', column='LocalityID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='paleoContext', type='many-to-one',required=False, relatedModelName='PaleoContext', column='PaleoContextID', otherSideName='collectingEvents'),
            Relationship(is_relationship=True, name='visibilitySetBy', type='many-to-one',required=False, relatedModelName='SpecifyUser', column='VisibilitySetByID')
        ],
        fieldAliases=[

        ],
        view='CollectingEvent',
        searchDialog='CollectingEventSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingEventAttachment',
        table='collectingeventattachment',
        tableId=110,
        idColumn='CollectingEventAttachmentID',
        idFieldName='collectingEventAttachmentId',
        idField=IdField(name='collectingEventAttachmentId', column='CollectingEventAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='CEAColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='collectingEventAttachments'),
            Relationship(is_relationship=True, name='collectingEvent', type='many-to-one',required=True, relatedModelName='CollectingEvent', column='CollectingEventID', otherSideName='collectingEventAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingEventAttr',
        table='collectingeventattr',
        tableId=25,
        idColumn='AttrID',
        idFieldName='attrId',
        idField=IdField(name='attrId', column='AttrID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='dblValue', column='DoubleValue', indexed=False, unique=False, required=False, type='java.lang.Double'),
            Field(name='strValue', column='StrValue', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='COLEVATColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectingEvent', type='many-to-one',required=True, relatedModelName='CollectingEvent', column='CollectingEventID', otherSideName='collectingEventAttrs'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='definition', type='many-to-one',required=True, relatedModelName='AttributeDef', column='AttributeDefID', otherSideName='collectingEventAttrs'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingEventAttribute',
        table='collectingeventattribute',
        tableId=92,
        idColumn='CollectingEventAttributeID',
        idFieldName='collectingEventAttributeId',
        idField=IdField(name='collectingEventAttributeId', column='CollectingEventAttributeID', type='java.lang.Integer'),
        fields=[
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer10', column='Integer10', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer6', column='Integer6', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer7', column='Integer7', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer8', column='Integer8', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer9', column='Integer9', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number10', column='Number10', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number11', column='Number11', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number12', column='Number12', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number13', column='Number13', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number6', column='Number6', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number7', column='Number7', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number8', column='Number8', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number9', column='Number9', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text14', column='Text14', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text15', column='Text15', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text16', column='Text16', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text17', column='Text17', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='COLEVATSDispIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectingEvents', type='one-to-many',required=False, relatedModelName='CollectingEvent', otherSideName='collectingEventAttribute'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='hostTaxon', type='many-to-one',required=False, relatedModelName='Taxon', column='HostTaxonID', otherSideName='collectingEventAttributes'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingEventAuthorization',
        table='collectingeventauthorization',
        tableId=152,
        idColumn='CollectingEventAuthorizationID',
        idFieldName='collectingEventAuthorizationId',
        idField=IdField(name='collectingEventAuthorizationId', column='CollectingEventAuthorizationID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='collectingEvent', type='many-to-one',required=False, relatedModelName='CollectingEvent', column='CollectingEventID', otherSideName='collectingEventAuthorizations'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='permit', type='many-to-one',required=True, relatedModelName='Permit', column='PermitID', otherSideName='collectingEventAuthorizations')
        ],
        fieldAliases=[

        ],
        view=None,
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingTrip',
        table='collectingtrip',
        tableId=87,
        idColumn='CollectingTripID',
        idFieldName='collectingTripId',
        idField=IdField(name='collectingTripId', column='CollectingTripID', type='java.lang.Integer'),
        fields=[
            Field(name='collectingTripName', column='CollectingTripName', indexed=True, unique=False, required=False, type='java.lang.String', length=400),
            Field(name='cruise', column='Cruise', indexed=False, unique=False, required=False, type='java.lang.String', length=250),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2Precision', column='Date2Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='endDate', column='EndDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='endDatePrecision', column='EndDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='endDateVerbatim', column='EndDateVerbatim', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='endTime', column='EndTime', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='expedition', column='Expedition', indexed=False, unique=False, required=False, type='java.lang.String', length=250),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='sponsor', column='Sponsor', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='startDate', column='StartDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='startDatePrecision', column='StartDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='startDateVerbatim', column='StartDateVerbatim', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='startTime', column='StartTime', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='vessel', column='Vessel', indexed=False, unique=False, required=False, type='java.lang.String', length=250),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='COLTRPNameIDX', column_names=['CollectingTripName']),
            Index(name='COLTRPStartDateIDX', column_names=['StartDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent1', type='many-to-one',required=False, relatedModelName='Agent', column='Agent1ID'),
            Relationship(is_relationship=True, name='agent2', type='many-to-one',required=False, relatedModelName='Agent', column='Agent2ID'),
            Relationship(is_relationship=True, name='collectingEvents', type='one-to-many',required=False, relatedModelName='CollectingEvent', otherSideName='collectingTrip'),
            Relationship(is_relationship=True, name='collectingTripAttachments', type='one-to-many',required=False, relatedModelName='CollectingTripAttachment', otherSideName='collectingTrip'),
            Relationship(is_relationship=True, name='collectingTripAttribute', type='many-to-one',required=False, relatedModelName='CollectingTripAttribute', column='CollectingTripAttributeID', otherSideName='collectingTrips'),
            Relationship(is_relationship=True, name='collectingTripAuthorizations', type='one-to-many',required=False, relatedModelName='CollectingTripAuthorization', otherSideName='collectingTrip'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='fundingAgents', type='one-to-many',required=False, relatedModelName='FundingAgent', otherSideName='collectingTrip'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='CollectingTripForm',
        searchDialog='CollectingTripSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingTripAttachment',
        table='collectingtripattachment',
        tableId=156,
        idColumn='CollectingTripAttachmentID',
        idFieldName='collectingTripAttachmentId',
        idField=IdField(name='collectingTripAttachmentId', column='CollectingTripAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='CTAColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='collectingTripAttachments'),
            Relationship(is_relationship=True, name='collectingTrip', type='many-to-one',required=True, relatedModelName='CollectingTrip', column='CollectingTripID', otherSideName='collectingTripAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingTripAttribute',
        table='collectingtripattribute',
        tableId=157,
        idColumn='CollectingTripAttributeID',
        idFieldName='collectingTripAttributeId',
        idField=IdField(name='collectingTripAttributeId', column='CollectingTripAttributeID', type='java.lang.Integer'),
        fields=[
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer10', column='Integer10', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer6', column='Integer6', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer7', column='Integer7', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer8', column='Integer8', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer9', column='Integer9', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number10', column='Number10', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number11', column='Number11', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number12', column='Number12', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number13', column='Number13', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number6', column='Number6', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number7', column='Number7', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number8', column='Number8', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number9', column='Number9', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text14', column='Text14', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text15', column='Text15', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text16', column='Text16', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text17', column='Text17', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='COLTRPSDispIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectingTrips', type='one-to-many',required=False, relatedModelName='CollectingTrip', otherSideName='collectingTripAttribute'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectingTripAuthorization',
        table='collectingtripauthorization',
        tableId=158,
        idColumn='CollectingTripAuthorizationID',
        idFieldName='collectingTripAuthorizationId',
        idField=IdField(name='collectingTripAuthorizationId', column='CollectingTripAuthorizationID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='collectingTrip', type='many-to-one',required=False, relatedModelName='CollectingTrip', column='CollectingTripID', otherSideName='collectingTripAuthorizations'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='permit', type='many-to-one',required=True, relatedModelName='Permit', column='PermitID', otherSideName='collectingTripAuthorizations')
        ],
        fieldAliases=[

        ],
        view=None,
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Collection',
        table='collection',
        tableId=23,
        idColumn='UserGroupScopeId',
        idFieldName='userGroupScopeId',
        idField=IdField(name='userGroupScopeId', column='UserGroupScopeId', type='java.lang.Integer'),
        fields=[
            Field(name='catalogNumFormatName', column='CatalogFormatNumName', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='code', column='Code', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='collectionName', column='CollectionName', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='collectionType', column='CollectionType', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='dbContentVersion', column='DbContentVersion', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='developmentStatus', column='DevelopmentStatus', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='estimatedSize', column='EstimatedSize', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='institutionType', column='InstitutionType', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='isEmbeddedCollectingEvent', column='IsEmbeddedCollectingEvent', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isaNumber', column='IsaNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=24),
            Field(name='kingdomCoverage', column='KingdomCoverage', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='preservationMethodType', column='PreservationMethodType', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='primaryFocus', column='PrimaryFocus', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='primaryPurpose', column='PrimaryPurpose', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='regNumber', column='RegNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=24),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='scope', column='Scope', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='webPortalURI', column='WebPortalURI', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='webSiteURI', column='WebSiteURI', indexed=False, unique=False, required=False, type='java.lang.String', length=255)
        ],
        indexes=[
            Index(name='CollectionNameIDX', column_names=['CollectionName']),
            Index(name='CollectionGuidIDX', column_names=['GUID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='adminContact', type='many-to-one',required=False, relatedModelName='Agent', column='AdminContactID'),
            Relationship(is_relationship=True, name='contentContacts', type='one-to-many',required=False, relatedModelName='Agent', otherSideName='collContentContact'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID', otherSideName='collections'),
            Relationship(is_relationship=True, name='institutionNetwork', type='many-to-one',required=False, relatedModelName='Institution', column='InstitutionNetworkID'),
            Relationship(is_relationship=True, name='leftSideRelTypes', type='one-to-many',required=False, relatedModelName='CollectionRelType', otherSideName='leftSideCollection'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='numberingSchemes', type='many-to-many',required=False, relatedModelName='AutoNumberingScheme', otherSideName='collections'),
            Relationship(is_relationship=True, name='pickLists', type='one-to-many',required=False, relatedModelName='PickList', otherSideName='collection'),
            Relationship(is_relationship=True, name='prepTypes', type='one-to-many',required=False, relatedModelName='PrepType', otherSideName='collection'),
            Relationship(is_relationship=True, name='rightSideRelTypes', type='one-to-many',required=False, relatedModelName='CollectionRelType', otherSideName='rightSideCollection'),
            Relationship(is_relationship=True, name='technicalContacts', type='one-to-many',required=False, relatedModelName='Agent', otherSideName='collTechContact'),
            Relationship(is_relationship=True, name='userGroups', type='one-to-many',required=False, relatedModelName='SpPrincipal', otherSideName='scope')
        ],
        fieldAliases=[

        ],
        view='Collection',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectionObject',
        table='collectionobject',
        tableId=1,
        idColumn='CollectionObjectID',
        idFieldName='collectionObjectId',
        idField=IdField(name='collectionObjectId', column='CollectionObjectID', type='java.lang.Integer'),
        fields=[
            Field(name='altCatalogNumber', column='AltCatalogNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='availability', column='Availability', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='catalogNumber', column='CatalogNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='catalogedDate', column='CatalogedDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='catalogedDatePrecision', column='CatalogedDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='catalogedDateVerbatim', column='CatalogedDateVerbatim', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='countAmt', column='CountAmt', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='deaccessioned', column='Deaccessioned', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='embargoReason', column='EmbargoReason', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='embargoReleaseDate', column='EmbargoReleaseDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='embargoReleaseDatePrecision', column='EmbargoReleaseDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='embargoStartDate', column='EmbargoStartDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='embargoStartDatePrecision', column='EmbargoStartDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='fieldNumber', column='FieldNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='inventoryDate', column='InventoryDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='inventoryDatePrecision', column='InventoryDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='modifier', column='Modifier', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='name', column='Name', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='notifications', column='Notifications', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='numberOfDuplicates', column='NumberOfDuplicates', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='objectCondition', column='ObjectCondition', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='ocr', column='OCR', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='projectNumber', column='ProjectNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='reservedInteger3', column='ReservedInteger3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedInteger4', column='ReservedInteger4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedText', column='ReservedText', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='reservedText2', column='ReservedText2', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='reservedText3', column='ReservedText3', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='restrictions', column='Restrictions', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='sgrStatus', column='SGRStatus', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='totalValue', column='TotalValue', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='uniqueIdentifier', column='UniqueIdentifier', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='visibility', column='Visibility', indexed=False, unique=False, required=False, type='java.lang.Byte', length=10),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo6', column='YesNo6', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='FieldNumberIDX', column_names=['FieldNumber']),
            Index(name='CatalogedDateIDX', column_names=['CatalogedDate']),
            Index(name='CatalogNumberIDX', column_names=['CatalogNumber']),
            Index(name='COUniqueIdentifierIDX', column_names=['UniqueIdentifier']),
            Index(name='AltCatalogNumberIDX', column_names=['AltCatalogNumber']),
            Index(name='ColObjGuidIDX', column_names=['GUID']),
            Index(name='COColMemIDX', column_names=['CollectionmemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='accession', type='many-to-one',required=False, relatedModelName='Accession', column='AccessionID', otherSideName='collectionObjects'),
            Relationship(is_relationship=True, name='agent1', type='many-to-one',required=False, relatedModelName='Agent', column='Agent1ID'),
            Relationship(is_relationship=True, name='appraisal', type='many-to-one',required=False, relatedModelName='Appraisal', column='AppraisalID', otherSideName='collectionObjects'),
            Relationship(is_relationship=True, name='cataloger', type='many-to-one',required=False, relatedModelName='Agent', column='CatalogerID'),
            Relationship(is_relationship=True, name='collectingEvent', type='many-to-one',required=False, relatedModelName='CollectingEvent', column='CollectingEventID', otherSideName='collectionObjects'),
            Relationship(is_relationship=True, name='collection', type='many-to-one',required=True, relatedModelName='Collection', column='CollectionID'),
            Relationship(is_relationship=True, name='collectionObjectAttachments', type='one-to-many',required=False, relatedModelName='CollectionObjectAttachment', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='collectionObjectAttribute', type='many-to-one',required=False, relatedModelName='CollectionObjectAttribute', column='CollectionObjectAttributeID', otherSideName='collectionObjects'),
            Relationship(is_relationship=True, name='collectionObjectAttrs', type='one-to-many',required=False, relatedModelName='CollectionObjectAttr', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='collectionObjectCitations', type='one-to-many',required=False, relatedModelName='CollectionObjectCitation', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='collectionObjectProperties', type='one-to-many',required=False, relatedModelName='CollectionObjectProperty', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='conservDescriptions', type='one-to-many',required=False, relatedModelName='ConservDescription', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='container', type='many-to-one',required=False, relatedModelName='Container', column='ContainerID', otherSideName='collectionObjects'),
            Relationship(is_relationship=True, name='containerOwner', type='many-to-one',required=False, relatedModelName='Container', column='ContainerOwnerID', otherSideName='collectionObjectKids'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='determinations', type='one-to-many',required=False, relatedModelName='Determination', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='dnaSequences', type='one-to-many',required=False, relatedModelName='DNASequence', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='embargoAuthority', type='many-to-one',required=False, relatedModelName='Agent', column='EmbargoAuthorityID'),
            Relationship(is_relationship=True, name='exsiccataItems', type='one-to-many',required=False, relatedModelName='ExsiccataItem', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='fieldNotebookPage', type='many-to-one',required=False, relatedModelName='FieldNotebookPage', column='FieldNotebookPageID', otherSideName='collectionObjects'),
            Relationship(is_relationship=True, name='inventorizedBy', type='many-to-one',required=False, relatedModelName='Agent', column='InventorizedByID'),
            Relationship(is_relationship=True, name='leftSideRels', type='one-to-many',required=False, relatedModelName='CollectionRelationship', otherSideName='leftSide'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='otherIdentifiers', type='one-to-many',required=False, relatedModelName='OtherIdentifier', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='paleoContext', type='many-to-one',required=False, relatedModelName='PaleoContext', column='PaleoContextID', otherSideName='collectionObjects'),
            Relationship(is_relationship=True, name='preparations', type='one-to-many',required=False, relatedModelName='Preparation', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='projects', type='many-to-many',required=False, relatedModelName='Project', otherSideName='collectionObjects'),
            Relationship(is_relationship=True, name='rightSideRels', type='one-to-many',required=False, relatedModelName='CollectionRelationship', otherSideName='rightSide'),
            Relationship(is_relationship=True, name='treatmentEvents', type='one-to-many',required=False, relatedModelName='TreatmentEvent', otherSideName='collectionObject'),
            Relationship(is_relationship=True, name='visibilitySetBy', type='many-to-one',required=False, relatedModelName='SpecifyUser', column='VisibilitySetByID'),
            Relationship(is_relationship=True, name='voucherRelationships', type='one-to-many',required=False, relatedModelName='VoucherRelationship', otherSideName='collectionObject')
        ],
        fieldAliases=[

        ],
        view='CollectionObject',
        searchDialog='CollectionObjectSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectionObjectAttachment',
        table='collectionobjectattachment',
        tableId=111,
        idColumn='CollectionObjectAttachmentID',
        idFieldName='collectionObjectAttachmentId',
        idField=IdField(name='collectionObjectAttachmentId', column='CollectionObjectAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='COLOBJATTColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='collectionObjectAttachments'),
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='collectionObjectAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectionObjectAttr',
        table='collectionobjectattr',
        tableId=28,
        idColumn='AttrID',
        idFieldName='attrId',
        idField=IdField(name='attrId', column='AttrID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='dblValue', column='DoubleValue', indexed=False, unique=False, required=False, type='java.lang.Double'),
            Field(name='strValue', column='StrValue', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='COLOBJATRSColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='collectionObjectAttrs'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='definition', type='many-to-one',required=True, relatedModelName='AttributeDef', column='AttributeDefID', otherSideName='collectionObjectAttrs'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectionObjectAttribute',
        table='collectionobjectattribute',
        tableId=93,
        idColumn='CollectionObjectAttributeID',
        idFieldName='collectionObjectAttributeId',
        idField=IdField(name='collectionObjectAttributeId', column='CollectionObjectAttributeID', type='java.lang.Integer'),
        fields=[
            Field(name='bottomDistance', column='BottomDistance', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='direction', column='Direction', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='distanceUnits', column='DistanceUnits', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer10', column='Integer10', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer6', column='Integer6', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer7', column='Integer7', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer8', column='Integer8', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer9', column='Integer9', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number10', column='Number10', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number11', column='Number11', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number12', column='Number12', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number13', column='Number13', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number14', column='Number14', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number15', column='Number15', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number16', column='Number16', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number17', column='Number17', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number18', column='Number18', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number19', column='Number19', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number20', column='Number20', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number21', column='Number21', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number22', column='Number22', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number23', column='Number23', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number24', column='Number24', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number25', column='Number25', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number26', column='Number26', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number27', column='Number27', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number28', column='Number28', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number29', column='Number29', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number30', column='Number30', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number31', column='Number31', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number32', column='Number32', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number33', column='Number33', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number34', column='Number34', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number35', column='Number35', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number36', column='Number36', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number37', column='Number37', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number38', column='Number38', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number39', column='Number39', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number40', column='Number40', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number41', column='Number41', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number42', column='Number42', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number6', column='Number6', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number7', column='Number7', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number8', column='Number8', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number9', column='Number9', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='positionState', column='PositionState', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text14', column='Text14', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text15', column='Text15', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text16', column='Text16', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text17', column='Text17', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text18', column='Text18', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text19', column='Text19', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text20', column='Text20', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text21', column='Text21', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text22', column='Text22', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text23', column='Text23', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text24', column='Text24', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text25', column='Text25', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text26', column='Text26', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text27', column='Text27', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text28', column='Text28', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text29', column='Text29', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text30', column='Text30', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text31', column='Text31', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text32', column='Text32', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text33', column='Text33', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text34', column='Text34', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text35', column='Text35', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text36', column='Text36', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text37', column='Text37', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text38', column='Text38', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text39', column='Text39', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text40', column='Text40', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='topDistance', column='TopDistance', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo10', column='YesNo10', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo11', column='YesNo11', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo12', column='YesNo12', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo13', column='YesNo13', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo14', column='YesNo14', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo15', column='YesNo15', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo16', column='YesNo16', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo17', column='YesNo17', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo18', column='YesNo18', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo19', column='YesNo19', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo20', column='YesNo20', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo6', column='YesNo6', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo7', column='YesNo7', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo8', column='YesNo8', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo9', column='YesNo9', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='COLOBJATTRSColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent1', type='many-to-one',required=False, relatedModelName='Agent', column='Agent1ID'),
            Relationship(is_relationship=True, name='collectionObjects', type='one-to-many',required=False, relatedModelName='CollectionObject', otherSideName='collectionObjectAttribute'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectionObjectCitation',
        table='collectionobjectcitation',
        tableId=29,
        idColumn='CollectionObjectCitationID',
        idFieldName='collectionObjectCitationId',
        idField=IdField(name='collectionObjectCitationId', column='CollectionObjectCitationID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='figureNumber', column='FigureNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='isFigured', column='IsFigured', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='pageNumber', column='PageNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='plateNumber', column='PlateNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='COCITColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='collectionObjectCitations'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID', otherSideName='collectionObjectCitations')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectionObjectProperty',
        table='collectionobjectproperty',
        tableId=153,
        idColumn='CollectionObjectPropertyID',
        idFieldName='collectionObjectPropertyId',
        idField=IdField(name='collectionObjectPropertyId', column='CollectionObjectPropertyID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date10', column='Date10', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date11', column='Date11', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date12', column='Date12', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date13', column='Date13', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date14', column='Date14', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date15', column='Date15', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date16', column='Date16', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date17', column='Date17', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date18', column='Date18', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date19', column='Date19', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date20', column='Date20', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date3', column='Date3', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date4', column='Date4', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date5', column='Date5', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date6', column='Date6', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date7', column='Date7', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date8', column='Date8', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date9', column='Date9', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='guid', column='GUID', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer10', column='Integer10', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer11', column='Integer11', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer12', column='Integer12', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer13', column='Integer13', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer14', column='Integer14', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer15', column='Integer15', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer16', column='Integer16', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer17', column='Integer17', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer18', column='Integer18', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer19', column='Integer19', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer20', column='Integer20', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer21', column='Integer21', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer22', column='Integer22', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer23', column='Integer23', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer24', column='Integer24', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer25', column='Integer25', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer26', column='Integer26', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer27', column='Integer27', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer28', column='Integer28', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer29', column='Integer29', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer30', column='Integer30', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer6', column='Integer6', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer7', column='Integer7', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer8', column='Integer8', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer9', column='Integer9', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number10', column='Number10', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number11', column='Number11', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number12', column='Number12', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number13', column='Number13', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number14', column='Number14', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number15', column='Number15', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number16', column='Number16', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number17', column='Number17', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number18', column='Number18', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number19', column='Number19', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number20', column='Number20', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number21', column='Number21', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number22', column='Number22', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number23', column='Number23', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number24', column='Number24', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number25', column='Number25', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number26', column='Number26', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number27', column='Number27', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number28', column='Number28', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number29', column='Number29', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number30', column='Number30', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number6', column='Number6', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number7', column='Number7', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number8', column='Number8', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number9', column='Number9', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text14', column='Text14', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text15', column='Text15', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text16', column='Text16', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text17', column='Text17', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text18', column='Text18', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text19', column='Text19', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text20', column='Text20', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text21', column='Text21', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text22', column='Text22', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text23', column='Text23', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text24', column='Text24', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text25', column='Text25', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text26', column='Text26', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text27', column='Text27', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text28', column='Text28', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text29', column='Text29', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text30', column='Text30', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text31', column='Text31', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text32', column='Text32', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text33', column='Text33', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text34', column='Text34', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text35', column='Text35', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text36', column='Text36', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text37', column='Text37', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text38', column='Text38', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text39', column='Text39', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text40', column='Text40', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo10', column='YesNo10', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo11', column='YesNo11', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo12', column='YesNo12', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo13', column='YesNo13', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo14', column='YesNo14', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo15', column='YesNo15', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo16', column='YesNo16', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo17', column='YesNo17', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo18', column='YesNo18', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo19', column='YesNo19', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo20', column='YesNo20', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo6', column='YesNo6', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo7', column='YesNo7', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo8', column='YesNo8', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo9', column='YesNo9', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='COLOBJPROPColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent1', type='many-to-one',required=False, relatedModelName='Agent', column='Agent1ID'),
            Relationship(is_relationship=True, name='agent10', type='many-to-one',required=False, relatedModelName='Agent', column='Agent10ID'),
            Relationship(is_relationship=True, name='agent11', type='many-to-one',required=False, relatedModelName='Agent', column='Agent11ID'),
            Relationship(is_relationship=True, name='agent12', type='many-to-one',required=False, relatedModelName='Agent', column='Agent12ID'),
            Relationship(is_relationship=True, name='agent13', type='many-to-one',required=False, relatedModelName='Agent', column='Agent13ID'),
            Relationship(is_relationship=True, name='agent14', type='many-to-one',required=False, relatedModelName='Agent', column='Agent14ID'),
            Relationship(is_relationship=True, name='agent15', type='many-to-one',required=False, relatedModelName='Agent', column='Agent15ID'),
            Relationship(is_relationship=True, name='agent16', type='many-to-one',required=False, relatedModelName='Agent', column='Agent16ID'),
            Relationship(is_relationship=True, name='agent17', type='many-to-one',required=False, relatedModelName='Agent', column='Agent17ID'),
            Relationship(is_relationship=True, name='agent18', type='many-to-one',required=False, relatedModelName='Agent', column='Agent18ID'),
            Relationship(is_relationship=True, name='agent19', type='many-to-one',required=False, relatedModelName='Agent', column='Agent19ID'),
            Relationship(is_relationship=True, name='agent2', type='many-to-one',required=False, relatedModelName='Agent', column='Agent2ID'),
            Relationship(is_relationship=True, name='agent20', type='many-to-one',required=False, relatedModelName='Agent', column='Agent20ID'),
            Relationship(is_relationship=True, name='agent3', type='many-to-one',required=False, relatedModelName='Agent', column='Agent3ID'),
            Relationship(is_relationship=True, name='agent4', type='many-to-one',required=False, relatedModelName='Agent', column='Agent4ID'),
            Relationship(is_relationship=True, name='agent5', type='many-to-one',required=False, relatedModelName='Agent', column='Agent5ID'),
            Relationship(is_relationship=True, name='agent6', type='many-to-one',required=False, relatedModelName='Agent', column='Agent6ID'),
            Relationship(is_relationship=True, name='agent7', type='many-to-one',required=False, relatedModelName='Agent', column='Agent7ID'),
            Relationship(is_relationship=True, name='agent8', type='many-to-one',required=False, relatedModelName='Agent', column='Agent8D'),
            Relationship(is_relationship=True, name='agent9', type='many-to-one',required=False, relatedModelName='Agent', column='Agent9ID'),
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='collectionObjectProperties'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='CollectionObjectProperty',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectionRelType',
        table='collectionreltype',
        tableId=98,
        idColumn='CollectionRelTypeID',
        idFieldName='collectionRelTypeId',
        idField=IdField(name='collectionRelTypeId', column='CollectionRelTypeID', type='java.lang.Integer'),
        fields=[
            Field(name='name', column='Name', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='java.lang.String', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='leftSideCollection', type='many-to-one',required=False, relatedModelName='Collection', column='LeftSideCollectionID', otherSideName='leftSideRelTypes'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='rightSideCollection', type='many-to-one',required=False, relatedModelName='Collection', column='RightSideCollectionID', otherSideName='rightSideRelTypes')
        ],
        fieldAliases=[

        ],
        view=None,
        searchDialog='CollectionRelTypeSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CollectionRelationship',
        table='collectionrelationship',
        tableId=99,
        idColumn='CollectionRelationshipID',
        idFieldName='collectionRelationshipId',
        idField=IdField(name='collectionRelationshipId', column='CollectionRelationshipID', type='java.lang.Integer'),
        fields=[
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='collectionRelType', type='many-to-one',required=False, relatedModelName='CollectionRelType', column='CollectionRelTypeID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='leftSide', type='many-to-one',required=True, relatedModelName='CollectionObject', column='LeftSideCollectionID', otherSideName='leftSideRels'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='rightSide', type='many-to-one',required=True, relatedModelName='CollectionObject', column='RightSideCollectionID', otherSideName='rightSideRels')
        ],
        fieldAliases=[

        ],
        view='CollectionRelationship',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Collector',
        table='collector',
        tableId=30,
        idColumn='CollectorID',
        idFieldName='collectorId',
        idField=IdField(name='collectorId', column='CollectorID', type='java.lang.Integer'),
        fields=[
            Field(name='isPrimary', column='IsPrimary', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='COLTRDivIDX', column_names=['DivisionID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID', otherSideName='collectors'),
            Relationship(is_relationship=True, name='collectingEvent', type='many-to-one',required=True, relatedModelName='CollectingEvent', column='CollectingEventID', otherSideName='collectors'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=False, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='Collector',
        searchDialog='CollectorSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CommonNameTx',
        table='commonnametx',
        tableId=106,
        idColumn='CommonNameTxID',
        idFieldName='commonNameTxId',
        idField=IdField(name='commonNameTxId', column='CommonNameTxID', type='java.lang.Integer'),
        fields=[
            Field(name='author', column='Author', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='country', column='Country', indexed=True, unique=False, required=False, type='java.lang.String', length=2),
            Field(name='language', column='Language', indexed=False, unique=False, required=False, type='java.lang.String', length=2),
            Field(name='name', column='Name', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='variant', column='Variant', indexed=False, unique=False, required=False, type='java.lang.String', length=2),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='CommonNameTxNameIDX', column_names=['Name']),
            Index(name='CommonNameTxCountryIDX', column_names=['Country'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='citations', type='one-to-many',required=False, relatedModelName='CommonNameTxCitation', otherSideName='commonNameTx'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='taxon', type='many-to-one',required=True, relatedModelName='Taxon', column='TaxonID', otherSideName='commonNames')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.CommonNameTxCitation',
        table='commonnametxcitation',
        tableId=134,
        idColumn='CommonNameTxCitationID',
        idFieldName='commonNameTxCitationId',
        idField=IdField(name='commonNameTxCitationId', column='CommonNameTxCitationID', type='java.lang.Integer'),
        fields=[
            Field(name='figureNumber', column='FigureNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='isFigured', column='IsFigured', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='pageNumber', column='PageNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='plateNumber', column='PlateNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='commonNameTx', type='many-to-one',required=True, relatedModelName='CommonNameTx', column='CommonNameTxID', otherSideName='citations'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ConservDescription',
        table='conservdescription',
        tableId=103,
        idColumn='ConservDescriptionID',
        idFieldName='conservDescriptionId',
        idField=IdField(name='conservDescriptionId', column='ConservDescriptionID', type='java.lang.Integer'),
        fields=[
            Field(name='backgroundInfo', column='BackgroundInfo', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='composition', column='Composition', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2Precision', column='Date2Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date3', column='Date3', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date3Precision', column='Date3Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date4', column='Date4', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date4Precision', column='Date4Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date5', column='Date5', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date5Precision', column='Date5Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='determinedDate', column='CatalogedDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='displayRecommendations', column='DisplayRecommendations', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='height', column='Height', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer', length=34),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Integer', length=44),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Integer', length=54),
            Field(name='lightRecommendations', column='LightRecommendations', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=34),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=44),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=54),
            Field(name='objLength', column='ObjLength', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='otherRecommendations', column='OtherRecommendations', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='shortDesc', column='ShortDesc', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='source', column='Source', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='units', column='Units', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='width', column='Width', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='ConservDescShortDescIDX', column_names=['ShortDesc'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=False, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='conservDescriptions'),
            Relationship(is_relationship=True, name='conservDescriptionAttachments', type='one-to-many',required=False, relatedModelName='ConservDescriptionAttachment', otherSideName='conservDescription'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=False, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='events', type='one-to-many',required=False, relatedModelName='ConservEvent', otherSideName='conservDescription'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=False, relatedModelName='Preparation', column='PreparationID', otherSideName='conservDescriptions')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ConservDescriptionAttachment',
        table='conservdescriptionattachment',
        tableId=112,
        idColumn='ConservDescriptionAttachmentID',
        idFieldName='conservDescriptionAttachmentId',
        idField=IdField(name='conservDescriptionAttachmentId', column='ConservDescriptionAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='conservDescriptionAttachments'),
            Relationship(is_relationship=True, name='conservDescription', type='many-to-one',required=True, relatedModelName='ConservDescription', column='ConservDescriptionID', otherSideName='conservDescriptionAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ConservEvent',
        table='conservevent',
        tableId=73,
        idColumn='ConservEventID',
        idFieldName='conservEventId',
        idField=IdField(name='conservEventId', column='ConservEventID', type='java.lang.Integer'),
        fields=[
            Field(name='advTestingExam', column='AdvTestingExam', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='advTestingExamResults', column='AdvTestingExamResults', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='completedComments', column='CompletedComments', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='completedDate', column='CompletedDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='completedDatePrecision', column='CompletedDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='conditionReport', column='ConditionReport', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='curatorApprovalDate', column='CuratorApprovalDate', indexed=False, unique=False, required=False, type='java.util.Calendar', length=8192),
            Field(name='curatorApprovalDatePrecision', column='CuratorApprovalDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='examDate', column='ExamDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='examDatePrecision', column='ExamDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='photoDocs', column='PhotoDocs', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='treatmentCompDate', column='TreatmentCompDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='treatmentCompDatePrecision', column='TreatmentCompDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='treatmentReport', column='TreatmentReport', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='ConservExamDateIDX', column_names=['ExamDate']),
            Index(name='ConservCompletedDateIDX', column_names=['completedDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='conservDescription', type='many-to-one',required=True, relatedModelName='ConservDescription', column='ConservDescriptionID', otherSideName='events'),
            Relationship(is_relationship=True, name='conservEventAttachments', type='one-to-many',required=False, relatedModelName='ConservEventAttachment', otherSideName='conservEvent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='curator', type='many-to-one',required=False, relatedModelName='Agent', column='CuratorID'),
            Relationship(is_relationship=True, name='examinedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ExaminedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='treatedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='TreatedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ConservEventAttachment',
        table='conserveventattachment',
        tableId=113,
        idColumn='ConservEventAttachmentID',
        idFieldName='conservEventAttachmentId',
        idField=IdField(name='conservEventAttachmentId', column='ConservEventAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='conservEventAttachments'),
            Relationship(is_relationship=True, name='conservEvent', type='many-to-one',required=True, relatedModelName='ConservEvent', column='ConservEventID', otherSideName='conservEventAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Container',
        table='container',
        tableId=31,
        idColumn='ContainerID',
        idFieldName='containerId',
        idField=IdField(name='containerId', column='ContainerID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='name', column='Name', indexed=True, unique=False, required=False, type='java.lang.String', length=1024),
            Field(name='number', column='Number', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='ContainerNameIDX', column_names=['Name']),
            Index(name='ContainerMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='Container', otherSideName='parent'),
            Relationship(is_relationship=True, name='collectionObjectKids', type='one-to-many',required=False, relatedModelName='CollectionObject', otherSideName='containerOwner'),
            Relationship(is_relationship=True, name='collectionObjects', type='one-to-many',required=False, relatedModelName='CollectionObject', otherSideName='container'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='Container', column='ParentID', otherSideName='children'),
            Relationship(is_relationship=True, name='storage', type='many-to-one',required=False, relatedModelName='Storage', column='StorageID', otherSideName='containers')
        ],
        fieldAliases=[

        ],
        view='Container',
        searchDialog='ContainerSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DNAPrimer',
        table='dnaprimer',
        tableId=150,
        idColumn='DNAPrimerID',
        idFieldName='dnaPrimerId',
        idField=IdField(name='dnaPrimerId', column='DNAPrimerID', type='java.lang.Integer'),
        fields=[
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='primerDesignator', column='PrimerDesignator', indexed=True, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='primerNameForward', column='PrimerNameForward', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='primerNameReverse', column='PrimerNameReverse', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='primerReferenceCitationForward', column='PrimerReferenceCitationForward', indexed=False, unique=False, required=False, type='java.lang.String', length=300),
            Field(name='primerReferenceCitationReverse', column='PrimerReferenceCitationReverse', indexed=False, unique=False, required=False, type='java.lang.String', length=300),
            Field(name='primerReferenceLinkForward', column='PrimerReferenceLinkForward', indexed=False, unique=False, required=False, type='java.lang.String', length=300),
            Field(name='primerReferenceLinkReverse', column='PrimerReferenceLinkReverse', indexed=False, unique=False, required=False, type='java.lang.String', length=300),
            Field(name='primerSequenceForward', column='PrimerSequenceForward', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='primerSequenceReverse', column='PrimerSequenceReverse', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='purificationMethod', column='purificationMethod', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='reservedInteger3', column='ReservedInteger3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedInteger4', column='ReservedInteger4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedNumber3', column='ReservedNumber3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='reservedNumber4', column='ReservedNumber4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='reservedText3', column='ReservedText3', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='reservedText4', column='ReservedText4', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='DesignatorIDX', column_names=['PrimerDesignator'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dnaSequencingRuns', type='one-to-many',required=False, relatedModelName='DNASequencingRun', otherSideName='dnaPrimer'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='DNAPrimer',
        searchDialog='DNAPrimerSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DNASequence',
        table='dnasequence',
        tableId=121,
        idColumn='DnaSequenceID',
        idFieldName='dnaSequenceId',
        idField=IdField(name='dnaSequenceId', column='DnaSequenceID', type='java.lang.Integer'),
        fields=[
            Field(name='ambiguousResidues', column='AmbiguousResidues', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='boldBarcodeId', column='BOLDBarcodeID', indexed=True, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='boldLastUpdateDate', column='BOLDLastUpdateDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='boldSampleId', column='BOLDSampleID', indexed=True, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='boldTranslationMatrix', column='BOLDTranslationMatrix', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='compA', column='CompA', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='compC', column='CompC', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='compG', column='CompG', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='compT', column='compT', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='extractionDate', column='ExtractionDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='extractionDatePrecision', column='ExtractionDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='genbankAccessionNumber', column='GenBankAccessionNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='geneSequence', column='GeneSequence', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='moleculeType', column='MoleculeType', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='sequenceDate', column='SequenceDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='sequenceDatePrecision', column='SequenceDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='targetMarker', column='TargetMarker', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='totalResidues', column='TotalResidues', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='GenBankAccIDX', column_names=['GenBankAccessionNumber']),
            Index(name='BOLDBarcodeIDX', column_names=['BOLDBarcodeID']),
            Index(name='BOLDSampleIDX', column_names=['BOLDSampleID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attachments', type='one-to-many',required=False, relatedModelName='DNASequenceAttachment', otherSideName='dnaSequence'),
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=False, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='dnaSequences'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dnaSequencingRuns', type='one-to-many',required=False, relatedModelName='DNASequencingRun', otherSideName='dnaSequence'),
            Relationship(is_relationship=True, name='extractor', type='many-to-one',required=False, relatedModelName='Agent', column='ExtractorID'),
            Relationship(is_relationship=True, name='extractors', type='one-to-many',required=False, relatedModelName='Extractor', otherSideName='dnaSequence'),
            Relationship(is_relationship=True, name='materialSample', type='many-to-one',required=False, relatedModelName='MaterialSample', column='MaterialSampleID', otherSideName='dnaSequences'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='pcrPersons', type='one-to-many',required=False, relatedModelName='PcrPerson', otherSideName='dnaSequence'),
            Relationship(is_relationship=True, name='sequencer', type='many-to-one',required=False, relatedModelName='Agent', column='AgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DNASequenceAttachment',
        table='dnasequenceattachment',
        tableId=147,
        idColumn='DnaSequenceAttachmentId',
        idFieldName='dnaSequenceAttachmentId',
        idField=IdField(name='dnaSequenceAttachmentId', column='DnaSequenceAttachmentId', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='dnaSequenceAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dnaSequence', type='many-to-one',required=True, relatedModelName='DNASequence', column='DnaSequenceID', otherSideName='attachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DNASequencingRun',
        table='dnasequencingrun',
        tableId=88,
        idColumn='DNASequencingRunID',
        idFieldName='dnaSequencingRunId',
        idField=IdField(name='dnaSequencingRunId', column='DNASequencingRunID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='dryadDOI', column='DryadDOI', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='geneSequence', column='GeneSequence', indexed=False, unique=False, required=False, type='text'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='pcrCocktailPrimer', column='PCRCocktailPrimer', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='pcrForwardPrimerCode', column='PCRForwardPrimerCode', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='pcrPrimerName', column='PCRPrimerName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='pcrPrimerSequence5_3', column='PCRPrimerSequence5_3', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='pcrReversePrimerCode', column='PCRReversePrimerCode', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='readDirection', column='ReadDirection', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='runDate', column='RunDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='scoreFileName', column='ScoreFileName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='sequenceCocktailPrimer', column='SequenceCocktailPrimer', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='sequencePrimerCode', column='SequencePrimerCode', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='sequencePrimerName', column='SequencePrimerName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='sequencePrimerSequence5_3', column='SequencePrimerSequence5_3', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='sraExperimentID', column='SRAExperimentID', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='sraRunID', column='SRARunID', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='sraSubmissionID', column='SRASubmissionID', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='traceFileName', column='TraceFileName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachments', type='one-to-many',required=False, relatedModelName='DNASequencingRunAttachment', otherSideName='dnaSequencingRun'),
            Relationship(is_relationship=True, name='citations', type='one-to-many',required=False, relatedModelName='DNASequencingRunCitation', otherSideName='sequencingRun'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dnaPrimer', type='many-to-one',required=False, relatedModelName='DNAPrimer', column='DNAPrimerID', otherSideName='dnaSequencingRuns'),
            Relationship(is_relationship=True, name='dnaSequence', type='many-to-one',required=True, relatedModelName='DNASequence', column='DNASequenceID', otherSideName='dnaSequencingRuns'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='PreparedByAgentID'),
            Relationship(is_relationship=True, name='runByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='RunByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DNASequencingRunAttachment',
        table='dnasequencerunattachment',
        tableId=135,
        idColumn='DnaSequencingRunAttachmentId',
        idFieldName='dnaSequencingRunAttachmentId',
        idField=IdField(name='dnaSequencingRunAttachmentId', column='DnaSequencingRunAttachmentId', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='dnaSequencingRunAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dnaSequencingRun', type='many-to-one',required=True, relatedModelName='DNASequencingRun', column='DnaSequencingRunID', otherSideName='attachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DNASequencingRunCitation',
        table='dnasequencingruncitation',
        tableId=105,
        idColumn='DNASequencingRunCitationID',
        idFieldName='dnaSequencingRunCitationId',
        idField=IdField(name='dnaSequencingRunCitationId', column='DNASequencingRunCitationID', type='java.lang.Integer'),
        fields=[
            Field(name='figureNumber', column='FigureNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='isFigured', column='IsFigured', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='pageNumber', column='PageNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='plateNumber', column='PlateNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID'),
            Relationship(is_relationship=True, name='sequencingRun', type='many-to-one',required=True, relatedModelName='DNASequencingRun', column='DNASequencingRunID', otherSideName='citations')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DataType',
        table='datatype',
        tableId=33,
        idColumn='DataTypeID',
        idFieldName='dataTypeId',
        idField=IdField(name='dataTypeId', column='DataTypeID', type='java.lang.Integer'),
        fields=[
            Field(name='name', column='Name', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Deaccession',
        table='deaccession',
        tableId=163,
        idColumn='DeaccessionID',
        idFieldName='deaccessionId',
        idField=IdField(name='deaccessionId', column='DeaccessionID', type='java.lang.Integer'),
        fields=[
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='deaccessionDate', column='DeaccessionDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='deaccessionNumber', column='DeaccessionNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer', length=34),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Integer', length=44),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Integer', length=54),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=34),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=44),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=54),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='status', column='Status', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='DeaccessionNumberIDX', column_names=['DeaccessionNumber']),
            Index(name='DeaccessionDateIDX', column_names=['DeaccessionDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent1', type='many-to-one',required=False, relatedModelName='Agent', column='Agent1ID'),
            Relationship(is_relationship=True, name='agent2', type='many-to-one',required=False, relatedModelName='Agent', column='Agent2ID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='deaccessionAgents', type='one-to-many',required=False, relatedModelName='DeaccessionAgent', otherSideName='deaccession'),
            Relationship(is_relationship=True, name='deaccessionAttachments', type='one-to-many',required=False, relatedModelName='DeaccessionAttachment', otherSideName='deaccession'),
            Relationship(is_relationship=True, name='disposals', type='one-to-many',required=False, relatedModelName='Disposal', otherSideName='deaccession'),
            Relationship(is_relationship=True, name='exchangeOuts', type='one-to-many',required=False, relatedModelName='ExchangeOut', otherSideName='deaccession'),
            Relationship(is_relationship=True, name='gifts', type='one-to-many',required=False, relatedModelName='Gift', otherSideName='deaccession'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='Deaccession',
        searchDialog='DeaccessionSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DeaccessionAgent',
        table='deaccessionagent',
        tableId=164,
        idColumn='DeaccessionAgentID',
        idFieldName='deaccessionAgentId',
        idField=IdField(name='deaccessionAgentId', column='DeaccessionAgentID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='role', column='Role', indexed=False, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='deaccession', type='many-to-one',required=True, relatedModelName='Deaccession', column='DeaccessionID', otherSideName='deaccessionAgents'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='DeaccessionAgent',
        searchDialog='DeaccessionAgentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DeaccessionAttachment',
        table='deaccessionattachment',
        tableId=165,
        idColumn='DeaccessionAttachmentID',
        idFieldName='deaccessionAttachmentId',
        idField=IdField(name='deaccessionAttachmentId', column='DeaccessionAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='deaccessionAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='deaccession', type='many-to-one',required=True, relatedModelName='Deaccession', column='DeaccessionID', otherSideName='deaccessionAttachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog='AttachmentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Determination',
        table='determination',
        tableId=9,
        idColumn='DeterminationID',
        idFieldName='determinationId',
        idField=IdField(name='determinationId', column='DeterminationID', type='java.lang.Integer'),
        fields=[
            Field(name='addendum', column='Addendum', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='alternateName', column='AlternateName', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='confidence', column='Confidence', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='determinedDate', column='DeterminedDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='determinedDatePrecision', column='DeterminedDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='featureOrBasis', column='FeatureOrBasis', indexed=False, unique=False, required=False, type='java.lang.String', length=250),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer', length=34),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Integer', length=44),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Integer', length=54),
            Field(name='isCurrent', column='IsCurrent', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='method', column='Method', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='nameUsage', column='NameUsage', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=34),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=44),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=54),
            Field(name='qualifier', column='Qualifier', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='subSpQualifier', column='SubSpQualifier', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='typeStatusName', column='TypeStatusName', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='varQualifier', column='VarQualifier', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='DeterminedDateIDX', column_names=['DeterminedDate']),
            Index(name='DetMemIDX', column_names=['CollectionMemberID']),
            Index(name='AlterNameIDX', column_names=['AlternateName']),
            Index(name='DeterminationGuidIDX', column_names=['GUID']),
            Index(name='TypeStatusNameIDX', column_names=['TypeStatusName'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='determinations'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='determinationCitations', type='one-to-many',required=False, relatedModelName='DeterminationCitation', otherSideName='determination'),
            Relationship(is_relationship=True, name='determiner', type='many-to-one',required=False, relatedModelName='Agent', column='DeterminerID'),
            Relationship(is_relationship=True, name='determiners', type='one-to-many',required=False, relatedModelName='Determiner', otherSideName='determination'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preferredTaxon', type='many-to-one',required=False, relatedModelName='Taxon', column='PreferredTaxonID'),
            Relationship(is_relationship=True, name='taxon', type='many-to-one',required=False, relatedModelName='Taxon', column='TaxonID', otherSideName='determinations')
        ],
        fieldAliases=[

        ],
        view='Determination',
        searchDialog='DeterminationSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DeterminationCitation',
        table='determinationcitation',
        tableId=38,
        idColumn='DeterminationCitationID',
        idFieldName='determinationCitationId',
        idField=IdField(name='determinationCitationId', column='DeterminationCitationID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='figureNumber', column='FigureNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='isFigured', column='IsFigured', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='pageNumber', column='PageNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='plateNumber', column='PlateNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='DetCitColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='determination', type='many-to-one',required=True, relatedModelName='Determination', column='DeterminationID', otherSideName='determinationCitations'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID', otherSideName='determinationCitations')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Determiner',
        table='determiner',
        tableId=167,
        idColumn='DeterminerID',
        idFieldName='determinerId',
        idField=IdField(name='determinerId', column='DeterminerID', type='java.lang.Integer'),
        fields=[
            Field(name='isPrimary', column='IsPrimary', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='determination', type='many-to-one',required=True, relatedModelName='Determination', column='DeterminationID', otherSideName='determiners'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='Determiner',
        searchDialog='DeterminerSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Discipline',
        table='discipline',
        tableId=26,
        idColumn='UserGroupScopeId',
        idFieldName='userGroupScopeId',
        idField=IdField(name='userGroupScopeId', column='UserGroupScopeId', type='java.lang.Integer'),
        fields=[
            Field(name='isPaleoContextEmbedded', column='IsPaleoContextEmbedded', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='paleoContextChildTable', column='PaleoContextChildTable', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='regNumber', column='RegNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=24),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='DisciplineNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attributeDefs', type='one-to-many',required=False, relatedModelName='AttributeDef', otherSideName='discipline'),
            Relationship(is_relationship=True, name='collections', type='one-to-many',required=False, relatedModelName='Collection', otherSideName='discipline'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dataType', type='many-to-one',required=True, relatedModelName='DataType', column='DataTypeID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=True, relatedModelName='Division', column='DivisionID', otherSideName='disciplines'),
            Relationship(is_relationship=True, name='geographyTreeDef', type='many-to-one',required=True, relatedModelName='GeographyTreeDef', column='GeographyTreeDefID', otherSideName='disciplines'),
            Relationship(is_relationship=True, name='geologicTimePeriodTreeDef', type='many-to-one',required=True, relatedModelName='GeologicTimePeriodTreeDef', column='GeologicTimePeriodTreeDefID', otherSideName='disciplines'),
            Relationship(is_relationship=True, name='lithoStratTreeDef', type='many-to-one',required=False, relatedModelName='LithoStratTreeDef', column='LithoStratTreeDefID', otherSideName='disciplines'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='numberingSchemes', type='many-to-many',required=False, relatedModelName='AutoNumberingScheme', otherSideName='disciplines'),
            Relationship(is_relationship=True, name='spExportSchemas', type='one-to-many',required=False, relatedModelName='SpExportSchema', otherSideName='discipline'),
            Relationship(is_relationship=True, name='spLocaleContainers', type='one-to-many',required=False, relatedModelName='SpLocaleContainer', otherSideName='discipline'),
            Relationship(is_relationship=True, name='taxonTreeDef', type='one-to-one',required=False, relatedModelName='TaxonTreeDef', column='TaxonTreeDefID', otherSideName='discipline'),
            Relationship(is_relationship=True, name='userGroups', type='one-to-many',required=False, relatedModelName='SpPrincipal', otherSideName='scope')
        ],
        fieldAliases=[

        ],
        view='Discipline',
        searchDialog='DisciplineSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Disposal',
        table='disposal',
        tableId=34,
        idColumn='DisposalID',
        idFieldName='disposalId',
        idField=IdField(name='disposalId', column='DisposalID', type='java.lang.Integer'),
        fields=[
            Field(name='disposalDate', column='DisposalDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='disposalNumber', column='DisposalNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='doNotExport', column='doNotExport', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='DisposalNumberIDX', column_names=['DisposalNumber']),
            Index(name='DisposalDateIDX', column_names=['DisposalDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='deaccession', type='many-to-one',required=False, relatedModelName='Deaccession', column='DeaccessionID', otherSideName='disposals'),
            Relationship(is_relationship=True, name='disposalAgents', type='one-to-many',required=False, relatedModelName='DisposalAgent', otherSideName='disposal'),
            Relationship(is_relationship=True, name='disposalAttachments', type='one-to-many',required=False, relatedModelName='DisposalAttachment', otherSideName='disposal'),
            Relationship(is_relationship=True, name='disposalPreparations', type='one-to-many',required=False, relatedModelName='DisposalPreparation', otherSideName='disposal'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='Disposal',
        searchDialog='DisposalSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DisposalAgent',
        table='disposalagent',
        tableId=35,
        idColumn='DisposalAgentID',
        idFieldName='disposalAgentId',
        idField=IdField(name='disposalAgentId', column='DisposalAgentID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='role', column='Role', indexed=False, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disposal', type='many-to-one',required=True, relatedModelName='Disposal', column='DisposalID', otherSideName='disposalAgents'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='DisposalAgent',
        searchDialog='DisposalAgentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DisposalAttachment',
        table='disposalattachment',
        tableId=166,
        idColumn='DisposalAttachmentID',
        idFieldName='disposalAttachmentId',
        idField=IdField(name='disposalAttachmentId', column='DisposalAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='disposalAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disposal', type='many-to-one',required=True, relatedModelName='Disposal', column='DisposalID', otherSideName='disposalAttachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog='AttachmentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.DisposalPreparation',
        table='disposalpreparation',
        tableId=36,
        idColumn='DisposalPreparationID',
        idFieldName='disposalPreparationId',
        idField=IdField(name='disposalPreparationId', column='DisposalPreparationID', type='java.lang.Integer'),
        fields=[
            Field(name='quantity', column='Quantity', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disposal', type='many-to-one',required=True, relatedModelName='Disposal', column='DisposalID', otherSideName='disposalPreparations'),
            Relationship(is_relationship=True, name='loanReturnPreparation', type='many-to-one',required=False, relatedModelName='LoanReturnPreparation', column='LoanReturnPreparationID', otherSideName='disposalPreparations'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=False, relatedModelName='Preparation', column='PreparationID', otherSideName='disposalPreparations')
        ],
        fieldAliases=[

        ],
        view='DisposalPreparation',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Division',
        table='division',
        tableId=96,
        idColumn='UserGroupScopeId',
        idFieldName='userGroupScopeId',
        idField=IdField(name='userGroupScopeId', column='UserGroupScopeId', type='java.lang.Integer'),
        fields=[
            Field(name='abbrev', column='Abbrev', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='altName', column='AltName', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='discipline', column='DisciplineType', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='iconURI', column='IconURI', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='name', column='Name', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='regNumber', column='RegNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=24),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='uri', column='Uri', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='DivisionNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='address', type='many-to-one',required=False, relatedModelName='Address', column='AddressID', otherSideName='divisions'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disciplines', type='one-to-many',required=False, relatedModelName='Discipline', otherSideName='division'),
            Relationship(is_relationship=True, name='institution', type='many-to-one',required=True, relatedModelName='Institution', column='InstitutionID', otherSideName='divisions'),
            Relationship(is_relationship=True, name='members', type='one-to-many',required=False, relatedModelName='Agent', otherSideName='division'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='numberingSchemes', type='many-to-many',required=False, relatedModelName='AutoNumberingScheme', otherSideName='divisions'),
            Relationship(is_relationship=True, name='userGroups', type='one-to-many',required=False, relatedModelName='SpPrincipal', otherSideName='scope')
        ],
        fieldAliases=[

        ],
        view='Division',
        searchDialog='DivisionSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ExchangeIn',
        table='exchangein',
        tableId=39,
        idColumn='ExchangeInID',
        idFieldName='exchangeInId',
        idField=IdField(name='exchangeInId', column='ExchangeInID', type='java.lang.Integer'),
        fields=[
            Field(name='contents', column='Contents', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='descriptionOfMaterial', column='DescriptionOfMaterial', indexed=True, unique=False, required=False, type='java.lang.String', length=120),
            Field(name='exchangeDate', column='ExchangeDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='exchangeInNumber', column='ExchangeInNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='quantityExchanged', column='QuantityExchanged', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='srcGeography', column='SrcGeography', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='srcTaxonomy', column='SrcTaxonomy', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='ExchangeDateIDX', column_names=['ExchangeDate']),
            Index(name='DescriptionOfMaterialIDX', column_names=['DescriptionOfMaterial'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='addressOfRecord', type='many-to-one',required=False, relatedModelName='AddressOfRecord', column='AddressOfRecordID', otherSideName='exchangeIns'),
            Relationship(is_relationship=True, name='agentCatalogedBy', type='many-to-one',required=True, relatedModelName='Agent', column='CatalogedByID'),
            Relationship(is_relationship=True, name='agentReceivedFrom', type='many-to-one',required=True, relatedModelName='Agent', column='ReceivedFromOrganizationID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=True, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='exchangeInAttachments', type='one-to-many',required=False, relatedModelName='ExchangeInAttachment', otherSideName='exchangeIn'),
            Relationship(is_relationship=True, name='exchangeInPreps', type='one-to-many',required=False, relatedModelName='ExchangeInPrep', otherSideName='exchangeIn'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ExchangeIn',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ExchangeInAttachment',
        table='exchangeinattachment',
        tableId=169,
        idColumn='ExchangeInAttachmentID',
        idFieldName='exchangeInAttachmentId',
        idField=IdField(name='exchangeInAttachmentId', column='ExchangeInAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='exchangeInAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='exchangeIn', type='many-to-one',required=True, relatedModelName='ExchangeIn', column='ExchangeInID', otherSideName='exchangeInAttachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog='AttachmentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ExchangeInPrep',
        table='exchangeinprep',
        tableId=140,
        idColumn='ExchangeInPrepID',
        idFieldName='exchangeInPrepId',
        idField=IdField(name='exchangeInPrepId', column='ExchangeInPrepID', type='java.lang.Integer'),
        fields=[
            Field(name='comments', column='Comments', indexed=False, unique=False, required=False, type='text'),
            Field(name='descriptionOfMaterial', column='DescriptionOfMaterial', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='quantity', column='Quantity', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text'),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='ExchgInPrepDspMemIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='exchangeIn', type='many-to-one',required=False, relatedModelName='ExchangeIn', column='ExchangeInID', otherSideName='exchangeInPreps'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=False, relatedModelName='Preparation', column='PreparationID', otherSideName='exchangeInPreps')
        ],
        fieldAliases=[

        ],
        view='ExchangeInPrep',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ExchangeOut',
        table='exchangeout',
        tableId=40,
        idColumn='ExchangeOutID',
        idFieldName='exchangeOutId',
        idField=IdField(name='exchangeOutId', column='ExchangeOutID', type='java.lang.Integer'),
        fields=[
            Field(name='contents', column='Contents', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='descriptionOfMaterial', column='DescriptionOfMaterial', indexed=True, unique=False, required=False, type='java.lang.String', length=120),
            Field(name='exchangeDate', column='ExchangeDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='exchangeOutNumber', column='ExchangeOutNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='quantityExchanged', column='QuantityExchanged', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='srcGeography', column='SrcGeography', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='srcTaxonomy', column='SrcTaxonomy', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='ExchangeOutdateIDX', column_names=['ExchangeDate']),
            Index(name='DescriptionOfMaterialIDX2', column_names=['DescriptionOfMaterial']),
            Index(name='ExchangeOutNumberIDX', column_names=['ExchangeOutNumber'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='addressOfRecord', type='many-to-one',required=False, relatedModelName='AddressOfRecord', column='AddressOfRecordID', otherSideName='exchangeOuts'),
            Relationship(is_relationship=True, name='agentCatalogedBy', type='many-to-one',required=True, relatedModelName='Agent', column='CatalogedByID'),
            Relationship(is_relationship=True, name='agentSentTo', type='many-to-one',required=True, relatedModelName='Agent', column='SentToOrganizationID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='deaccession', type='many-to-one',required=False, relatedModelName='Deaccession', column='DeaccessionID', otherSideName='exchangeOuts'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=True, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='exchangeOutAttachments', type='one-to-many',required=False, relatedModelName='ExchangeOutAttachment', otherSideName='exchangeOut'),
            Relationship(is_relationship=True, name='exchangeOutPreps', type='one-to-many',required=False, relatedModelName='ExchangeOutPrep', otherSideName='exchangeOut'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='shipments', type='one-to-many',required=False, relatedModelName='Shipment', otherSideName='exchangeOut')
        ],
        fieldAliases=[

        ],
        view='ExchangeOut',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ExchangeOutAttachment',
        table='exchangeoutattachment',
        tableId=170,
        idColumn='ExchangeOutAttachmentID',
        idFieldName='exchangeOutAttachmentId',
        idField=IdField(name='exchangeOutAttachmentId', column='ExchangeOutAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='exchangeOutAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='exchangeOut', type='many-to-one',required=True, relatedModelName='ExchangeOut', column='ExchangeOutID', otherSideName='exchangeOutAttachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog='AttachmentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ExchangeOutPrep',
        table='exchangeoutprep',
        tableId=141,
        idColumn='ExchangeOutPrepID',
        idFieldName='exchangeOutPrepId',
        idField=IdField(name='exchangeOutPrepId', column='ExchangeOutPrepID', type='java.lang.Integer'),
        fields=[
            Field(name='comments', column='Comments', indexed=False, unique=False, required=False, type='text'),
            Field(name='descriptionOfMaterial', column='DescriptionOfMaterial', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='quantity', column='Quantity', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text'),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='ExchgOutPrepDspMemIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='exchangeOut', type='many-to-one',required=False, relatedModelName='ExchangeOut', column='ExchangeOutID', otherSideName='exchangeOutPreps'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=False, relatedModelName='Preparation', column='PreparationID', otherSideName='exchangeOutPreps')
        ],
        fieldAliases=[

        ],
        view='ExchangeOutPrep',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Exsiccata',
        table='exsiccata',
        tableId=89,
        idColumn='ExsiccataID',
        idFieldName='exsiccataId',
        idField=IdField(name='exsiccataId', column='ExsiccataID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='schedae', column='Schedae', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=False, unique=False, required=True, type='java.lang.String', length=255),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='exsiccataItems', type='one-to-many',required=False, relatedModelName='ExsiccataItem', otherSideName='exsiccata'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID', otherSideName='exsiccatae')
        ],
        fieldAliases=[

        ],
        view='Exsiccata',
        searchDialog='ExsiccataSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ExsiccataItem',
        table='exsiccataitem',
        tableId=104,
        idColumn='ExsiccataItemID',
        idFieldName='exsiccataItemId',
        idField=IdField(name='exsiccataItemId', column='ExsiccataItemID', type='java.lang.Integer'),
        fields=[
            Field(name='fascicle', column='Fascicle', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='number', column='Number', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='exsiccataItems'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='exsiccata', type='many-to-one',required=True, relatedModelName='Exsiccata', column='ExsiccataID', otherSideName='exsiccataItems'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Extractor',
        table='extractor',
        tableId=160,
        idColumn='ExtractorID',
        idFieldName='extractorId',
        idField=IdField(name='extractorId', column='ExtractorID', type='java.lang.Integer'),
        fields=[
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dnaSequence', type='many-to-one',required=True, relatedModelName='DNASequence', column='DNASequenceID', otherSideName='extractors'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='Extractor',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.FieldNotebook',
        table='fieldnotebook',
        tableId=83,
        idColumn='FieldNotebookID',
        idFieldName='fieldNotebookId',
        idField=IdField(name='fieldNotebookId', column='FieldNotebookID', type='java.lang.Integer'),
        fields=[
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='endDate', column='EndDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='location', column='Storage', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='name', column='Name', indexed=True, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='startDate', column='StartDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='FNBNameIDX', column_names=['Name']),
            Index(name='FNBStartDateIDX', column_names=['StartDate']),
            Index(name='FNBEndDateIDX', column_names=['EndDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attachments', type='one-to-many',required=False, relatedModelName='FieldNotebookAttachment', otherSideName='fieldNotebook'),
            Relationship(is_relationship=True, name='collection', type='many-to-one',required=True, relatedModelName='Collection', column='CollectionID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='ownerAgent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='pageSets', type='one-to-many',required=False, relatedModelName='FieldNotebookPageSet', otherSideName='fieldNotebook')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.FieldNotebookAttachment',
        table='fieldnotebookattachment',
        tableId=127,
        idColumn='FieldNotebookAttachmentId',
        idFieldName='fieldNotebookAttachmentId',
        idField=IdField(name='fieldNotebookAttachmentId', column='FieldNotebookAttachmentId', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='fieldNotebookAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='fieldNotebook', type='many-to-one',required=True, relatedModelName='FieldNotebook', column='FieldNotebookID', otherSideName='attachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.FieldNotebookPage',
        table='fieldnotebookpage',
        tableId=85,
        idColumn='FieldNotebookPageID',
        idFieldName='fieldNotebookPageId',
        idField=IdField(name='fieldNotebookPageId', column='FieldNotebookPageID', type='java.lang.Integer'),
        fields=[
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='pageNumber', column='PageNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=32),
            Field(name='scanDate', column='ScanDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='FNBPPageNumberIDX', column_names=['PageNumber']),
            Index(name='FNBPScanDateIDX', column_names=['ScanDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attachments', type='one-to-many',required=False, relatedModelName='FieldNotebookPageAttachment', otherSideName='fieldNotebookPage'),
            Relationship(is_relationship=True, name='collectionObjects', type='one-to-many',required=False, relatedModelName='CollectionObject', otherSideName='fieldNotebookPage'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='pageSet', type='many-to-one',required=False, relatedModelName='FieldNotebookPageSet', column='FieldNotebookPageSetID', otherSideName='pages')
        ],
        fieldAliases=[

        ],
        view='FieldNotebookPage',
        searchDialog='FieldNotebookPageSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.FieldNotebookPageAttachment',
        table='fieldnotebookpageattachment',
        tableId=129,
        idColumn='FieldNotebookPageAttachmentId',
        idFieldName='fieldNotebookPageAttachmentId',
        idField=IdField(name='fieldNotebookPageAttachmentId', column='FieldNotebookPageAttachmentId', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='fieldNotebookPageAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='fieldNotebookPage', type='many-to-one',required=True, relatedModelName='FieldNotebookPage', column='FieldNotebookPageID', otherSideName='attachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.FieldNotebookPageSet',
        table='fieldnotebookpageset',
        tableId=84,
        idColumn='FieldNotebookPageSetID',
        idFieldName='fieldNotebookPageSetId',
        idField=IdField(name='fieldNotebookPageSetId', column='FieldNotebookPageSetID', type='java.lang.Integer'),
        fields=[
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='endDate', column='EndDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='method', column='Method', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='startDate', column='StartDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='FNBPSStartDateIDX', column_names=['StartDate']),
            Index(name='FNBPSEndDateIDX', column_names=['EndDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attachments', type='one-to-many',required=False, relatedModelName='FieldNotebookPageSetAttachment', otherSideName='fieldNotebookPageSet'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='fieldNotebook', type='many-to-one',required=False, relatedModelName='FieldNotebook', column='FieldNotebookID', otherSideName='pageSets'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='pages', type='one-to-many',required=False, relatedModelName='FieldNotebookPage', otherSideName='pageSet'),
            Relationship(is_relationship=True, name='sourceAgent', type='many-to-one',required=False, relatedModelName='Agent', column='AgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.FieldNotebookPageSetAttachment',
        table='fieldnotebookpagesetattachment',
        tableId=128,
        idColumn='FieldNotebookPageSetAttachmentId',
        idFieldName='fieldNotebookPageSetAttachmentId',
        idField=IdField(name='fieldNotebookPageSetAttachmentId', column='FieldNotebookPageSetAttachmentId', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='fieldNotebookPageSetAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='fieldNotebookPageSet', type='many-to-one',required=True, relatedModelName='FieldNotebookPageSet', column='FieldNotebookPageSetID', otherSideName='attachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.FundingAgent',
        table='fundingagent',
        tableId=146,
        idColumn='FundingAgentID',
        idFieldName='fundingAgentId',
        idField=IdField(name='fundingAgentId', column='FundingAgentID', type='java.lang.Integer'),
        fields=[
            Field(name='isPrimary', column='IsPrimary', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='COLTRIPDivIDX', column_names=['DivisionID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='collectingTrip', type='many-to-one',required=True, relatedModelName='CollectingTrip', column='CollectingTripID', otherSideName='fundingAgents'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=False, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='FundingAgent',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GeoCoordDetail',
        table='geocoorddetail',
        tableId=123,
        idColumn='GeoCoordDetailID',
        idFieldName='geoCoordDetailId',
        idField=IdField(name='geoCoordDetailId', column='GeoCoordDetailID', type='java.lang.Integer'),
        fields=[
            Field(name='errorPolygon', column='ErrorPolygon', indexed=False, unique=False, required=False, type='text'),
            Field(name='geoRefAccuracy', column='GeoRefAccuracy', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='geoRefAccuracyUnits', column='GeoRefAccuracyUnits', indexed=False, unique=False, required=False, type='java.lang.String', length=20),
            Field(name='geoRefCompiledDate', column='GeoRefCompiledDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='geoRefDetDate', column='GeoRefDetDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='geoRefDetRef', column='GeoRefDetRef', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='geoRefRemarks', column='GeoRefRemarks', indexed=False, unique=False, required=False, type='text'),
            Field(name='geoRefVerificationStatus', column='GeoRefVerificationStatus', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer', length=24),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer', length=34),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Integer', length=44),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Integer', length=54),
            Field(name='maxUncertaintyEst', column='MaxUncertaintyEst', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='maxUncertaintyEstUnit', column='MaxUncertaintyEstUnit', indexed=False, unique=False, required=False, type='java.lang.String', length=8),
            Field(name='namedPlaceExtent', column='NamedPlaceExtent', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='noGeoRefBecause', column='NoGeoRefBecause', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=34),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=44),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=54),
            Field(name='originalCoordSystem', column='OriginalCoordSystem', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='protocol', column='Protocol', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='source', column='Source', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='uncertaintyPolygon', column='UncertaintyPolygon', indexed=False, unique=False, required=False, type='text'),
            Field(name='validation', column='Validation', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='geoRefCompiledBy', type='many-to-one',required=False, relatedModelName='Agent', column='CompiledByID'),
            Relationship(is_relationship=True, name='geoRefDetBy', type='many-to-one',required=False, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='locality', type='many-to-one',required=False, relatedModelName='Locality', column='LocalityID', otherSideName='geoCoordDetails'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Geography',
        table='geography',
        tableId=3,
        idColumn='GeographyID',
        idFieldName='geographyId',
        idField=IdField(name='geographyId', column='GeographyID', type='java.lang.Integer'),
        fields=[
            Field(name='abbrev', column='Abbrev', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='centroidLat', column='CentroidLat', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='centroidLon', column='CentroidLon', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='commonName', column='CommonName', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='fullName', column='FullName', indexed=True, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='geographyCode', column='GeographyCode', indexed=False, unique=False, required=False, type='java.lang.String', length=24),
            Field(name='gml', column='GML', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='guid', column='GUID', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='highestChildNodeNumber', column='HighestChildNodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='isAccepted', column='IsAccepted', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isCurrent', column='IsCurrent', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=128),
            Field(name='nodeNumber', column='NodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='timestampVersion', column='TimestampVersion', indexed=False, unique=False, required=False, type='java.util.Date'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='GeoNameIDX', column_names=['Name']),
            Index(name='GeoFullNameIDX', column_names=['FullName'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='acceptedChildren', type='one-to-many',required=False, relatedModelName='Geography', otherSideName='acceptedGeography'),
            Relationship(is_relationship=True, name='acceptedGeography', type='many-to-one',required=False, relatedModelName='Geography', column='AcceptedID', otherSideName='acceptedChildren'),
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='Geography', otherSideName='parent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='definition', type='many-to-one',required=True, relatedModelName='GeographyTreeDef', column='GeographyTreeDefID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='definitionItem', type='many-to-one',required=True, relatedModelName='GeographyTreeDefItem', column='GeographyTreeDefItemID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='localities', type='one-to-many',required=False, relatedModelName='Locality', otherSideName='geography'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='Geography', column='ParentID', otherSideName='children')
        ],
        fieldAliases=[
            {'vname':'acceptedParent', 'aname':'acceptedGeography'}
        ],
        view='Geography',
        searchDialog='GeographySearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GeographyTreeDef',
        table='geographytreedef',
        tableId=44,
        idColumn='GeographyTreeDefID',
        idFieldName='geographyTreeDefId',
        idField=IdField(name='geographyTreeDefId', column='GeographyTreeDefID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameDirection', column='FullNameDirection', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disciplines', type='one-to-many',required=False, relatedModelName='Discipline', otherSideName='geographyTreeDef'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='treeDefItems', type='one-to-many',required=False, relatedModelName='GeographyTreeDefItem', otherSideName='treeDef'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='Geography', otherSideName='definition')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GeographyTreeDefItem',
        table='geographytreedefitem',
        tableId=45,
        idColumn='GeographyTreeDefItemID',
        idFieldName='geographyTreeDefItemId',
        idField=IdField(name='geographyTreeDefItemId', column='GeographyTreeDefItemID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameSeparator', column='FullNameSeparator', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='isEnforced', column='IsEnforced', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isInFullName', column='IsInFullName', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='textAfter', column='TextAfter', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='textBefore', column='TextBefore', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='GeographyTreeDefItem', otherSideName='parent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='GeographyTreeDefItem', column='ParentItemID', otherSideName='children'),
            Relationship(is_relationship=True, name='treeDef', type='many-to-one',required=True, relatedModelName='GeographyTreeDef', column='GeographyTreeDefID', otherSideName='treeDefItems'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='Geography', otherSideName='definitionItem')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GeologicTimePeriod',
        table='geologictimeperiod',
        tableId=46,
        idColumn='GeologicTimePeriodID',
        idFieldName='geologicTimePeriodId',
        idField=IdField(name='geologicTimePeriodId', column='GeologicTimePeriodID', type='java.lang.Integer'),
        fields=[
            Field(name='endPeriod', column='EndPeriod', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='endUncertainty', column='EndUncertainty', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='fullName', column='FullName', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='highestChildNodeNumber', column='HighestChildNodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='isAccepted', column='IsAccepted', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isBioStrat', column='IsBioStrat', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='nodeNumber', column='NodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='standard', column='Standard', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='startPeriod', column='StartPeriod', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='startUncertainty', column='StartUncertainty', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='GTPNameIDX', column_names=['Name']),
            Index(name='GTPFullNameIDX', column_names=['FullName']),
            Index(name='GTPGuidIDX', column_names=['GUID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='acceptedChildren', type='one-to-many',required=False, relatedModelName='GeologicTimePeriod', otherSideName='acceptedGeologicTimePeriod'),
            Relationship(is_relationship=True, name='acceptedGeologicTimePeriod', type='many-to-one',required=False, relatedModelName='GeologicTimePeriod', column='AcceptedID', otherSideName='acceptedChildren'),
            Relationship(is_relationship=True, name='bioStratsPaleoContext', type='one-to-many',required=False, relatedModelName='PaleoContext', otherSideName='bioStrat'),
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='GeologicTimePeriod', otherSideName='parent'),
            Relationship(is_relationship=True, name='chronosStratsPaleoContext', type='one-to-many',required=False, relatedModelName='PaleoContext', otherSideName='chronosStrat'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='definition', type='many-to-one',required=True, relatedModelName='GeologicTimePeriodTreeDef', column='GeologicTimePeriodTreeDefID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='definitionItem', type='many-to-one',required=True, relatedModelName='GeologicTimePeriodTreeDefItem', column='GeologicTimePeriodTreeDefItemID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='GeologicTimePeriod', column='ParentID', otherSideName='children')
        ],
        fieldAliases=[
            {'vname':'acceptedParent', 'aname':'acceptedGeologicTimePeriod'}
        ],
        view='GeologicTimePeriod',
        searchDialog='ChronosStratSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GeologicTimePeriodTreeDef',
        table='geologictimeperiodtreedef',
        tableId=47,
        idColumn='GeologicTimePeriodTreeDefID',
        idFieldName='geologicTimePeriodTreeDefId',
        idField=IdField(name='geologicTimePeriodTreeDefId', column='GeologicTimePeriodTreeDefID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameDirection', column='FullNameDirection', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disciplines', type='one-to-many',required=False, relatedModelName='Discipline', otherSideName='geologicTimePeriodTreeDef'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='treeDefItems', type='one-to-many',required=False, relatedModelName='GeologicTimePeriodTreeDefItem', otherSideName='treeDef'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='GeologicTimePeriod', otherSideName='definition')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GeologicTimePeriodTreeDefItem',
        table='geologictimeperiodtreedefitem',
        tableId=48,
        idColumn='GeologicTimePeriodTreeDefItemID',
        idFieldName='geologicTimePeriodTreeDefItemId',
        idField=IdField(name='geologicTimePeriodTreeDefItemId', column='GeologicTimePeriodTreeDefItemID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameSeparator', column='FullNameSeparator', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='isEnforced', column='IsEnforced', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isInFullName', column='IsInFullName', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='textAfter', column='TextAfter', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='textBefore', column='TextBefore', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='GeologicTimePeriodTreeDefItem', otherSideName='parent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='GeologicTimePeriodTreeDefItem', column='ParentItemID', otherSideName='children'),
            Relationship(is_relationship=True, name='treeDef', type='many-to-one',required=True, relatedModelName='GeologicTimePeriodTreeDef', column='GeologicTimePeriodTreeDefID', otherSideName='treeDefItems'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='GeologicTimePeriod', otherSideName='definitionItem')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Gift',
        table='gift',
        tableId=131,
        idColumn='GiftID',
        idFieldName='giftId',
        idField=IdField(name='giftId', column='GiftID', type='java.lang.Integer'),
        fields=[
            Field(name='contents', column='Contents', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='dateReceived', column='DateReceived', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='giftDate', column='GiftDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='giftNumber', column='GiftNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='isFinancialResponsibility', column='IsFinancialResponsibility', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='purposeOfGift', column='PurposeOfGift', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='receivedComments', column='ReceivedComments', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='specialConditions', column='SpecialConditions', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='srcGeography', column='SrcGeography', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='srcTaxonomy', column='SrcTaxonomy', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='status', column='Status', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='GiftNumberIDX', column_names=['GiftNumber']),
            Index(name='GiftDateIDX', column_names=['GiftDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='addressOfRecord', type='many-to-one',required=False, relatedModelName='AddressOfRecord', column='AddressOfRecordID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='deaccession', type='many-to-one',required=False, relatedModelName='Deaccession', column='DeaccessionID', otherSideName='gifts'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=False, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='giftAgents', type='one-to-many',required=False, relatedModelName='GiftAgent', otherSideName='gift'),
            Relationship(is_relationship=True, name='giftAttachments', type='one-to-many',required=False, relatedModelName='GiftAttachment', otherSideName='gift'),
            Relationship(is_relationship=True, name='giftPreparations', type='one-to-many',required=False, relatedModelName='GiftPreparation', otherSideName='gift'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='shipments', type='one-to-many',required=False, relatedModelName='Shipment', otherSideName='gift')
        ],
        fieldAliases=[

        ],
        view='Gift',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GiftAgent',
        table='giftagent',
        tableId=133,
        idColumn='GiftAgentID',
        idFieldName='giftAgentId',
        idField=IdField(name='giftAgentId', column='GiftAgentID', type='java.lang.Integer'),
        fields=[
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='role', column='Role', indexed=False, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='GiftAgDspMemIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='gift', type='many-to-one',required=True, relatedModelName='Gift', column='GiftID', otherSideName='giftAgents'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='GiftAgent',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GiftAttachment',
        table='giftattachment',
        tableId=144,
        idColumn='GiftAttachmentID',
        idFieldName='giftAttachmentId',
        idField=IdField(name='giftAttachmentId', column='GiftAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='giftAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='gift', type='many-to-one',required=True, relatedModelName='Gift', column='GiftID', otherSideName='giftAttachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GiftPreparation',
        table='giftpreparation',
        tableId=132,
        idColumn='GiftPreparationID',
        idFieldName='giftPreparationId',
        idField=IdField(name='giftPreparationId', column='GiftPreparationID', type='java.lang.Integer'),
        fields=[
            Field(name='descriptionOfMaterial', column='DescriptionOfMaterial', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='inComments', column='InComments', indexed=False, unique=False, required=False, type='text', length=1024),
            Field(name='outComments', column='OutComments', indexed=False, unique=False, required=False, type='text', length=1024),
            Field(name='quantity', column='Quantity', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='receivedComments', column='ReceivedComments', indexed=False, unique=False, required=False, type='text', length=1024),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='GiftPrepDspMemIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='gift', type='many-to-one',required=False, relatedModelName='Gift', column='GiftID', otherSideName='giftPreparations'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=False, relatedModelName='Preparation', column='PreparationID', otherSideName='giftPreparations')
        ],
        fieldAliases=[

        ],
        view='GiftItems',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.GroupPerson',
        table='groupperson',
        tableId=49,
        idColumn='GroupPersonID',
        idFieldName='groupPersonId',
        idField=IdField(name='groupPersonId', column='GroupPersonID', type='java.lang.Integer'),
        fields=[
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=True, type='java.lang.Short'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=True, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='group', type='many-to-one',required=True, relatedModelName='Agent', column='GroupID', otherSideName='groups'),
            Relationship(is_relationship=True, name='member', type='many-to-one',required=True, relatedModelName='Agent', column='MemberID', otherSideName='members'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='GroupPerson',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.InfoRequest',
        table='inforequest',
        tableId=50,
        idColumn='InfoRequestID',
        idFieldName='infoRequestID',
        idField=IdField(name='infoRequestID', column='InfoRequestID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='email', column='Email', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='firstName', column='Firstname', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='infoReqNumber', column='InfoReqNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='institution', column='Institution', indexed=False, unique=False, required=False, type='java.lang.String', length=127),
            Field(name='lastName', column='Lastname', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='replyDate', column='ReplyDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='requestDate', column='RequestDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='IRColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=False, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='recordSets', type='one-to-many',required=False, relatedModelName='RecordSet', otherSideName='infoRequest')
        ],
        fieldAliases=[

        ],
        view='InfoRequest',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Institution',
        table='institution',
        tableId=94,
        idColumn='UserGroupScopeId',
        idFieldName='userGroupScopeId',
        idField=IdField(name='userGroupScopeId', column='UserGroupScopeId', type='java.lang.Integer'),
        fields=[
            Field(name='altName', column='AltName', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='code', column='Code', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='copyright', column='Copyright', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='currentManagedRelVersion', column='CurrentManagedRelVersion', indexed=False, unique=False, required=False, type='java.lang.String', length=8),
            Field(name='currentManagedSchemaVersion', column='CurrentManagedSchemaVersion', indexed=False, unique=False, required=False, type='java.lang.String', length=8),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='disclaimer', column='Disclaimer', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='hasBeenAsked', column='HasBeenAsked', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='iconURI', column='IconURI', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='ipr', column='Ipr', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='isAccessionsGlobal', column='IsAccessionsGlobal', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isAnonymous', column='IsAnonymous', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isReleaseManagedGlobally', column='IsReleaseManagedGlobally', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isSecurityOn', column='IsSecurityOn', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isServerBased', column='IsServerBased', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isSharingLocalities', column='IsSharingLocalities', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isSingleGeographyTree', column='IsSingleGeographyTree', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='license', column='License', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='lsidAuthority', column='LsidAuthority', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='minimumPwdLength', column='MinimumPwdLength', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='name', column='Name', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='regNumber', column='RegNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=24),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='termsOfUse', column='TermsOfUse', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='uri', column='Uri', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='InstNameIDX', column_names=['Name']),
            Index(name='InstGuidIDX', column_names=['GUID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='address', type='many-to-one',required=False, relatedModelName='Address', column='AddressID', otherSideName='insitutions'),
            Relationship(is_relationship=True, name='contentContacts', type='one-to-many',required=False, relatedModelName='Agent', otherSideName='instContentContact'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='divisions', type='one-to-many',required=False, relatedModelName='Division', otherSideName='institution'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='storageTreeDef', type='many-to-one',required=False, relatedModelName='StorageTreeDef', column='StorageTreeDefID', otherSideName='institutions'),
            Relationship(is_relationship=True, name='technicalContacts', type='one-to-many',required=False, relatedModelName='Agent', otherSideName='instTechContact'),
            Relationship(is_relationship=True, name='userGroups', type='one-to-many',required=False, relatedModelName='SpPrincipal', otherSideName='scope')
        ],
        fieldAliases=[

        ],
        view='Institution',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.InstitutionNetwork',
        table='institutionnetwork',
        tableId=142,
        idColumn='InstitutionNetworkID',
        idFieldName='institutionNetworkId',
        idField=IdField(name='institutionNetworkId', column='InstitutionNetworkID', type='java.lang.Integer'),
        fields=[
            Field(name='altName', column='AltName', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='code', column='Code', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='copyright', column='Copyright', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='disclaimer', column='Disclaimer', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='iconURI', column='IconURI', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='ipr', column='Ipr', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='license', column='License', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='name', column='Name', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='termsOfUse', column='TermsOfUse', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='uri', column='Uri', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='InstNetworkNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='address', type='many-to-one',required=False, relatedModelName='Address', column='AddressID'),
            Relationship(is_relationship=True, name='collections', type='one-to-many',required=False, relatedModelName='Collection', otherSideName='institutionNetwork'),
            Relationship(is_relationship=True, name='contacts', type='one-to-many',required=False, relatedModelName='Agent', otherSideName='instTechContact'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Journal',
        table='journal',
        tableId=51,
        idColumn='JournalID',
        idFieldName='journalId',
        idField=IdField(name='journalId', column='JournalID', type='java.lang.Integer'),
        fields=[
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='issn', column='ISSN', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='journalAbbreviation', column='JournalAbbreviation', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='journalName', column='JournalName', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='JournalNameIDX', column_names=['JournalName']),
            Index(name='JournalGUIDIDX', column_names=['GUID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='institution', type='many-to-one',required=True, relatedModelName='Institution', column='InstitutionID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWorks', type='one-to-many',required=False, relatedModelName='ReferenceWork', otherSideName='journal')
        ],
        fieldAliases=[

        ],
        view='JournalForm',
        searchDialog='JournalSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LatLonPolygon',
        table='latlonpolygon',
        tableId=136,
        idColumn='LatLonPolygonID',
        idFieldName='latLonPolygonId',
        idField=IdField(name='latLonPolygonId', column='LatLonPolygonID', type='java.lang.Integer'),
        fields=[
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='isPolyline', column='IsPolyline', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='locality', type='many-to-one',required=False, relatedModelName='Locality', column='LocalityID', otherSideName='latLonpolygons'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='points', type='one-to-many',required=False, relatedModelName='LatLonPolygonPnt', otherSideName='latLonPolygon'),
            Relationship(is_relationship=True, name='visualQuery', type='many-to-one',required=False, relatedModelName='SpVisualQuery', column='SpVisualQueryID', otherSideName='polygons')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LatLonPolygonPnt',
        table='latlonpolygonpnt',
        tableId=137,
        idColumn='LatLonPolygonPntID',
        idFieldName='latLonPolygonPntId',
        idField=IdField(name='latLonPolygonPntId', column='LatLonPolygonPntID', type='java.lang.Integer'),
        fields=[
            Field(name='elevation', column='Elevation', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='latitude', column='Latitude', indexed=False, unique=False, required=True, type='java.math.BigDecimal'),
            Field(name='longitude', column='Longitude', indexed=False, unique=False, required=True, type='java.math.BigDecimal'),
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='latLonPolygon', type='many-to-one',required=True, relatedModelName='LatLonPolygon', column='LatLonPolygonID', otherSideName='points')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LithoStrat',
        table='lithostrat',
        tableId=100,
        idColumn='LithoStratID',
        idFieldName='lithoStratId',
        idField=IdField(name='lithoStratId', column='LithoStratID', type='java.lang.Integer'),
        fields=[
            Field(name='fullName', column='FullName', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='highestChildNodeNumber', column='HighestChildNodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='isAccepted', column='IsAccepted', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='nodeNumber', column='NodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='LithoNameIDX', column_names=['Name']),
            Index(name='LithoFullNameIDX', column_names=['FullName']),
            Index(name='LithoGuidIDX', column_names=['GUID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='acceptedChildren', type='one-to-many',required=False, relatedModelName='LithoStrat', otherSideName='acceptedLithoStrat'),
            Relationship(is_relationship=True, name='acceptedLithoStrat', type='many-to-one',required=False, relatedModelName='LithoStrat', column='AcceptedID', otherSideName='acceptedChildren'),
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='LithoStrat', otherSideName='parent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='definition', type='many-to-one',required=True, relatedModelName='LithoStratTreeDef', column='LithoStratTreeDefID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='definitionItem', type='many-to-one',required=True, relatedModelName='LithoStratTreeDefItem', column='LithoStratTreeDefItemID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='paleoContexts', type='one-to-many',required=False, relatedModelName='PaleoContext', otherSideName='lithoStrat'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='LithoStrat', column='ParentID', otherSideName='children')
        ],
        fieldAliases=[
            {'vname':'acceptedParent', 'aname':'acceptedLithoStrat'}
        ],
        view='LithoStrat',
        searchDialog='LithoStratSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LithoStratTreeDef',
        table='lithostrattreedef',
        tableId=101,
        idColumn='LithoStratTreeDefID',
        idFieldName='lithoStratTreeDefId',
        idField=IdField(name='lithoStratTreeDefId', column='LithoStratTreeDefID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameDirection', column='FullNameDirection', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disciplines', type='one-to-many',required=False, relatedModelName='Discipline', otherSideName='lithoStratTreeDef'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='treeDefItems', type='one-to-many',required=False, relatedModelName='LithoStratTreeDefItem', otherSideName='treeDef'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='LithoStrat', otherSideName='definition')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LithoStratTreeDefItem',
        table='lithostrattreedefitem',
        tableId=102,
        idColumn='LithoStratTreeDefItemID',
        idFieldName='lithoStratTreeDefItemId',
        idField=IdField(name='lithoStratTreeDefItemId', column='LithoStratTreeDefItemID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameSeparator', column='FullNameSeparator', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='isEnforced', column='IsEnforced', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isInFullName', column='IsInFullName', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='textAfter', column='TextAfter', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='textBefore', column='TextBefore', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='LithoStratTreeDefItem', otherSideName='parent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='LithoStratTreeDefItem', column='ParentItemID', otherSideName='children'),
            Relationship(is_relationship=True, name='treeDef', type='many-to-one',required=True, relatedModelName='LithoStratTreeDef', column='LithoStratTreeDefID', otherSideName='treeDefItems'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='LithoStrat', otherSideName='definitionItem')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Loan',
        table='loan',
        tableId=52,
        idColumn='LoanID',
        idFieldName='loanId',
        idField=IdField(name='loanId', column='LoanID', type='java.lang.Integer'),
        fields=[
            Field(name='contents', column='Contents', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='currentDueDate', column='CurrentDueDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateClosed', column='DateClosed', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateReceived', column='DateReceived', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='isClosed', column='IsClosed', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isFinancialResponsibility', column='IsFinancialResponsibility', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='loanDate', column='LoanDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='loanNumber', column='LoanNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='originalDueDate', column='OriginalDueDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='overdueNotiSentDate', column='OverdueNotiSetDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='purposeOfLoan', column='PurposeOfLoan', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='receivedComments', column='ReceivedComments', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='specialConditions', column='SpecialConditions', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='srcGeography', column='SrcGeography', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='srcTaxonomy', column='SrcTaxonomy', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='status', column='Status', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='LoanNumberIDX', column_names=['LoanNumber']),
            Index(name='LoanDateIDX', column_names=['LoanDate']),
            Index(name='CurrentDueDateIDX', column_names=['CurrentDueDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='addressOfRecord', type='many-to-one',required=False, relatedModelName='AddressOfRecord', column='AddressOfRecordID', otherSideName='loans'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=False, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='loanAgents', type='one-to-many',required=False, relatedModelName='LoanAgent', otherSideName='loan'),
            Relationship(is_relationship=True, name='loanAttachments', type='one-to-many',required=False, relatedModelName='LoanAttachment', otherSideName='loan'),
            Relationship(is_relationship=True, name='loanPreparations', type='one-to-many',required=False, relatedModelName='LoanPreparation', otherSideName='loan'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='shipments', type='one-to-many',required=False, relatedModelName='Shipment', otherSideName='loan')
        ],
        fieldAliases=[

        ],
        view='Loan',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LoanAgent',
        table='loanagent',
        tableId=53,
        idColumn='LoanAgentID',
        idFieldName='loanAgentId',
        idField=IdField(name='loanAgentId', column='LoanAgentID', type='java.lang.Integer'),
        fields=[
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='role', column='Role', indexed=False, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='LoanAgDspMemIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='loan', type='many-to-one',required=True, relatedModelName='Loan', column='LoanID', otherSideName='loanAgents'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='LoanAgent',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LoanAttachment',
        table='loanattachment',
        tableId=114,
        idColumn='LoanAttachmentID',
        idFieldName='loanAttachmentId',
        idField=IdField(name='loanAttachmentId', column='LoanAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='loanAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='loan', type='many-to-one',required=True, relatedModelName='Loan', column='LoanID', otherSideName='loanAttachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LoanPreparation',
        table='loanpreparation',
        tableId=54,
        idColumn='LoanPreparationID',
        idFieldName='loanPreparationId',
        idField=IdField(name='loanPreparationId', column='LoanPreparationID', type='java.lang.Integer'),
        fields=[
            Field(name='descriptionOfMaterial', column='DescriptionOfMaterial', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='inComments', column='InComments', indexed=False, unique=False, required=False, type='text', length=1024),
            Field(name='isResolved', column='IsResolved', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='outComments', column='OutComments', indexed=False, unique=False, required=False, type='text', length=1024),
            Field(name='quantity', column='Quantity', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='quantityResolved', column='QuantityResolved', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='quantityReturned', column='QuantityReturned', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='receivedComments', column='ReceivedComments', indexed=False, unique=False, required=False, type='text', length=1024),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='LoanPrepDspMemIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='loan', type='many-to-one',required=True, relatedModelName='Loan', column='LoanID', otherSideName='loanPreparations'),
            Relationship(is_relationship=True, name='loanReturnPreparations', type='one-to-many',required=False, relatedModelName='LoanReturnPreparation', otherSideName='loanPreparation'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=False, relatedModelName='Preparation', column='PreparationID', otherSideName='loanPreparations')
        ],
        fieldAliases=[

        ],
        view='LoanItems',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LoanReturnPreparation',
        table='loanreturnpreparation',
        tableId=55,
        idColumn='LoanReturnPreparationID',
        idFieldName='loanReturnPreparationId',
        idField=IdField(name='loanReturnPreparationId', column='LoanReturnPreparationID', type='java.lang.Integer'),
        fields=[
            Field(name='quantityResolved', column='QuantityResolved', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='quantityReturned', column='QuantityReturned', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='returnedDate', column='ReturnedDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='LoanReturnedDateIDX', column_names=['ReturnedDate']),
            Index(name='LoanRetPrepDspMemIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='disposalPreparations', type='one-to-many',required=False, relatedModelName='DisposalPreparation', otherSideName='loanReturnPreparation'),
            Relationship(is_relationship=True, name='loanPreparation', type='many-to-one',required=True, relatedModelName='LoanPreparation', column='LoanPreparationID', otherSideName='loanReturnPreparations'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='receivedBy', type='many-to-one',required=False, relatedModelName='Agent', column='ReceivedByID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Locality',
        table='locality',
        tableId=2,
        idColumn='LocalityID',
        idFieldName='localityId',
        idField=IdField(name='localityId', column='LocalityID', type='java.lang.Integer'),
        fields=[
            Field(name='datum', column='Datum', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='elevationAccuracy', column='ElevationAccuracy', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='elevationMethod', column='ElevationMethod', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='gml', column='GML', indexed=False, unique=False, required=False, type='text'),
            Field(name='guid', column='GUID', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='lat1text', column='Lat1Text', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='lat2text', column='Lat2Text', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='latLongAccuracy', column='LatLongAccuracy', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='latLongMethod', column='LatLongMethod', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='latLongType', column='LatLongType', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='latitude1', column='Latitude1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='latitude2', column='Latitude2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='localityName', column='LocalityName', indexed=True, unique=False, required=True, type='java.lang.String', length=1024),
            Field(name='long1text', column='Long1Text', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='long2text', column='Long2Text', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='longitude1', column='Longitude1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='longitude2', column='Longitude2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='maxElevation', column='MaxElevation', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='minElevation', column='MinElevation', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='namedPlace', column='NamedPlace', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='originalElevationUnit', column='OriginalElevationUnit', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='originalLatLongUnit', column='OriginalLatLongUnit', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='relationToNamedPlace', column='RelationToNamedPlace', indexed=True, unique=False, required=False, type='java.lang.String', length=120),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='sgrStatus', column='SGRStatus', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='shortName', column='ShortName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='srcLatLongUnit', column='SrcLatLongUnit', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='uniqueIdentifier', column='UniqueIdentifier', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='verbatimElevation', column='VerbatimElevation', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='verbatimLatitude', column='VerbatimLatitude', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='verbatimLongitude', column='VerbatimLongitude', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='visibility', column='Visibility', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='localityNameIDX', column_names=['LocalityName']),
            Index(name='LocalityDisciplineIDX', column_names=['DisciplineID']),
            Index(name='NamedPlaceIDX', column_names=['NamedPlace']),
            Index(name='LocalityUniqueIdentifierIDX', column_names=['UniqueIdentifier']),
            Index(name='RelationToNamedPlaceIDX', column_names=['RelationToNamedPlace'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='geoCoordDetails', type='zero-to-one',required=False, relatedModelName='GeoCoordDetail', otherSideName='locality'),
            Relationship(is_relationship=True, name='geography', type='many-to-one',required=False, relatedModelName='Geography', column='GeographyID', otherSideName='localities'),
            Relationship(is_relationship=True, name='latLonpolygons', type='one-to-many',required=False, relatedModelName='LatLonPolygon', otherSideName='locality'),
            Relationship(is_relationship=True, name='localityAttachments', type='one-to-many',required=False, relatedModelName='LocalityAttachment', otherSideName='locality'),
            Relationship(is_relationship=True, name='localityCitations', type='one-to-many',required=False, relatedModelName='LocalityCitation', otherSideName='locality'),
            Relationship(is_relationship=True, name='localityDetails', type='zero-to-one',required=False, relatedModelName='LocalityDetail', otherSideName='locality'),
            Relationship(is_relationship=True, name='localityNameAliass', type='one-to-many',required=False, relatedModelName='LocalityNameAlias', otherSideName='locality'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='paleoContext', type='many-to-one',required=False, relatedModelName='PaleoContext', column='PaleoContextID', otherSideName='localities'),
            Relationship(is_relationship=True, name='visibilitySetBy', type='many-to-one',required=False, relatedModelName='SpecifyUser', column='VisibilitySetByID')
        ],
        fieldAliases=[

        ],
        view='Locality',
        searchDialog='LocalitySearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LocalityAttachment',
        table='localityattachment',
        tableId=115,
        idColumn='LocalityAttachmentID',
        idFieldName='localityAttachmentId',
        idField=IdField(name='localityAttachmentId', column='LocalityAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='localityAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='locality', type='many-to-one',required=True, relatedModelName='Locality', column='LocalityID', otherSideName='localityAttachments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LocalityCitation',
        table='localitycitation',
        tableId=57,
        idColumn='LocalityCitationID',
        idFieldName='localityCitationId',
        idField=IdField(name='localityCitationId', column='LocalityCitationID', type='java.lang.Integer'),
        fields=[
            Field(name='figureNumber', column='FigureNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='isFigured', column='IsFigured', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='pageNumber', column='PageNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='plateNumber', column='PlateNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='LocCitDspMemIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='locality', type='many-to-one',required=True, relatedModelName='Locality', column='LocalityID', otherSideName='localityCitations'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID', otherSideName='localityCitations')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LocalityDetail',
        table='localitydetail',
        tableId=124,
        idColumn='LocalityDetailID',
        idFieldName='localityDetailId',
        idField=IdField(name='localityDetailId', column='LocalityDetailID', type='java.lang.Integer'),
        fields=[
            Field(name='baseMeridian', column='BaseMeridian', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='drainage', column='Drainage', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='endDepth', column='EndDepth', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='endDepthUnit', column='EndDepthUnit', indexed=False, unique=False, required=False, type='java.lang.String', length=23),
            Field(name='endDepthVerbatim', column='EndDepthVerbatim', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='gml', column='GML', indexed=False, unique=False, required=False, type='text'),
            Field(name='hucCode', column='HucCode', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='island', column='Island', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='islandGroup', column='IslandGroup', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='mgrsZone', column='MgrsZone', indexed=False, unique=False, required=False, type='java.lang.String', length=4),
            Field(name='nationalParkName', column='NationalParkName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='paleoLat', column='PaleoLat', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='paleoLng', column='PaleoLng', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='rangeDesc', column='RangeDesc', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='rangeDirection', column='RangeDirection', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='section', column='Section', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='sectionPart', column='SectionPart', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='startDepth', column='StartDepth', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='startDepthUnit', column='StartDepthUnit', indexed=False, unique=False, required=False, type='java.lang.String', length=23),
            Field(name='startDepthVerbatim', column='StartDepthVerbatim', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='township', column='Township', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='townshipDirection', column='TownshipDirection', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='utmDatum', column='UtmDatum', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='utmEasting', column='UtmEasting', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='utmFalseEasting', column='UtmFalseEasting', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='utmFalseNorthing', column='UtmFalseNorthing', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='utmNorthing', column='UtmNorthing', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='utmOrigLatitude', column='UtmOrigLatitude', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='utmOrigLongitude', column='UtmOrigLongitude', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='utmScale', column='UtmScale', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='utmZone', column='UtmZone', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='waterBody', column='WaterBody', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='locality', type='many-to-one',required=False, relatedModelName='Locality', column='LocalityID', otherSideName='localityDetails'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.LocalityNameAlias',
        table='localitynamealias',
        tableId=120,
        idColumn='LocalityNameAliasID',
        idFieldName='localityNameAliasId',
        idField=IdField(name='localityNameAliasId', column='LocalityNameAliasID', type='java.lang.Integer'),
        fields=[
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=255),
            Field(name='source', column='Source', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='LocalityNameAliasIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='locality', type='many-to-one',required=True, relatedModelName='Locality', column='LocalityID', otherSideName='localityNameAliass'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.MaterialSample',
        table='materialsample',
        tableId=151,
        idColumn='MaterialSampleID',
        idFieldName='materialSampleId',
        idField=IdField(name='materialSampleId', column='MaterialSampleID', type='java.lang.Integer'),
        fields=[
            Field(name='GGBN_absorbanceRatio260_230', column='GGBNAbsorbanceRatio260_230', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='GGBN_absorbanceRatio260_280', column='GGBNAbsorbanceRatio260_280', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='GGBN_absorbanceRatioMethod', column='GGBNRAbsorbanceRatioMethod', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='GGBN_concentration', column='GGBNConcentration', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='GGBN_concentrationUnit', column='GGBNConcentrationUnit', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='GGBN_materialSampleType', column='GGBNMaterialSampleType', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='GGBN_medium', column='GGBNMedium', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='GGBN_purificationMethod', column='GGBNPurificationMethod', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='GGBN_quality', column='GGBNQuality', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='GGBN_qualityCheckDate', column='GGBNQualityCheckDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='GGBN_qualityRemarks', column='GGBNQualityRemarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='GGBN_sampleDesignation', column='GGBNSampleDesignation', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='GGBN_sampleSize', column='GGBNSampleSize', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='GGBN_volume', column='GGBNVolume', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='GGBN_volumeUnit', column='GGBNVolumeUnit', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='GGBN_weight', column='GGBNWeight', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='GGBN_weightMethod', column='GGBNWeightMethod', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='GGBN_weightUnit', column='GGBNWeightUnit', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='extractionDate', column='ExtractionDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='guid', column='GUID', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='reservedInteger3', column='ReservedInteger3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedInteger4', column='ReservedInteger4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedNumber3', column='ReservedNumber3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='reservedNumber4', column='ReservedNumber4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='reservedText3', column='ReservedText3', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='reservedText4', column='ReservedText4', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='sraBioProjectID', column='SRABioProjectID', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='sraBioSampleID', column='SRABioSampleID', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='sraProjectID', column='SRAProjectID', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='sraSampleID', column='SRASampleID', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='DesignationIDX', column_names=['GGBNSampleDesignation'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dnaSequences', type='one-to-many',required=False, relatedModelName='DNASequence', otherSideName='materialSample'),
            Relationship(is_relationship=True, name='extractor', type='many-to-one',required=False, relatedModelName='Agent', column='ExtractorID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=True, relatedModelName='Preparation', column='PreparationID', otherSideName='materialSamples')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.MorphBankView',
        table='morphbankview',
        tableId=138,
        idColumn='MorphBankViewID',
        idFieldName='morphBankViewId',
        idField=IdField(name='morphBankViewId', column='MorphBankViewID', type='java.lang.Integer'),
        fields=[
            Field(name='developmentState', column='DevelopmentState', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='form', column='Form', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='imagingPreparationTechnique', column='ImagingPreparationTechnique', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='imagingTechnique', column='ImagingTechnique', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='morphBankExternalViewId', column='MorphBankExternalViewID', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='sex', column='Sex', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='specimenPart', column='SpecimenPart', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='viewAngle', column='ViewAngle', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='viewName', column='ViewName', indexed=False, unique=False, required=False, type='java.lang.String', length=128)
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachmentImageAttributes', type='one-to-many',required=False, relatedModelName='AttachmentImageAttribute', otherSideName='morphBankView'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='MorphBankView',
        searchDialog='MorphBankViewSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.OtherIdentifier',
        table='otheridentifier',
        tableId=61,
        idColumn='OtherIdentifierID',
        idFieldName='otherIdentifierId',
        idField=IdField(name='otherIdentifierId', column='OtherIdentifierID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2Precision', column='Date2Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='identifier', column='Identifier', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='institution', column='Institution', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='OthIdColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent1', type='many-to-one',required=False, relatedModelName='Agent', column='Agent1ID'),
            Relationship(is_relationship=True, name='agent2', type='many-to-one',required=False, relatedModelName='Agent', column='Agent2ID'),
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='otherIdentifiers'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='OtherIdentifiers',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PaleoContext',
        table='paleocontext',
        tableId=32,
        idColumn='PaleoContextID',
        idFieldName='paleoContextId',
        idField=IdField(name='paleoContextId', column='PaleoContextID', type='java.lang.Integer'),
        fields=[
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='paleoContextName', column='PaleoContextName', indexed=True, unique=False, required=False, type='java.lang.String', length=80),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='PaleoCxtNameIDX', column_names=['PaleoContextName']),
            Index(name='PaleoCxtDisciplineIDX', column_names=['DisciplineID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='bioStrat', type='many-to-one',required=False, relatedModelName='GeologicTimePeriod', column='BioStratID', otherSideName='bioStratsPaleoContext'),
            Relationship(is_relationship=True, name='chronosStrat', type='many-to-one',required=False, relatedModelName='GeologicTimePeriod', column='ChronosStratID', otherSideName='chronosStratsPaleoContext'),
            Relationship(is_relationship=True, name='chronosStratEnd', type='many-to-one',required=False, relatedModelName='GeologicTimePeriod', column='ChronosStratEndID'),
            Relationship(is_relationship=True, name='collectingEvents', type='one-to-many',required=False, relatedModelName='CollectingEvent', otherSideName='paleoContext'),
            Relationship(is_relationship=True, name='collectionObjects', type='one-to-many',required=False, relatedModelName='CollectionObject', otherSideName='paleoContext'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='lithoStrat', type='many-to-one',required=False, relatedModelName='LithoStrat', column='LithoStratID', otherSideName='paleoContexts'),
            Relationship(is_relationship=True, name='localities', type='one-to-many',required=False, relatedModelName='Locality', otherSideName='paleoContext'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='PaleoContext',
        searchDialog='PaleoContextSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PcrPerson',
        table='pcrperson',
        tableId=161,
        idColumn='PcrPersonID',
        idFieldName='pcrPersonId',
        idField=IdField(name='pcrPersonId', column='PcrPersonID', type='java.lang.Integer'),
        fields=[
            Field(name='orderNumber', column='OrderNumber', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='dnaSequence', type='many-to-one',required=True, relatedModelName='DNASequence', column='DNASequenceID', otherSideName='pcrPersons'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='PcrPerson',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Permit',
        table='permit',
        tableId=6,
        idColumn='PermitID',
        idFieldName='permitId',
        idField=IdField(name='permitId', column='PermitID', type='java.lang.Integer'),
        fields=[
            Field(name='copyright', column='Copyright', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='endDate', column='EndDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='isAvailable', column='IsAvailable', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isRequired', column='IsRequired', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='issuedDate', column='IssuedDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='permitNumber', column='PermitNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='permitText', column='PermitText', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='renewalDate', column='RenewalDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='reservedInteger1', column='ReservedInteger1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedInteger2', column='ReservedInteger2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedText3', column='ReservedText3', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='reservedText4', column='ReservedText4', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='startDate', column='StartDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='status', column='Status', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='statusQualifier', column='StatusQualifier', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='PermitNumberIDX', column_names=['PermitNumber']),
            Index(name='IssuedDateIDX', column_names=['IssuedDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='accessionAuthorizations', type='one-to-many',required=False, relatedModelName='AccessionAuthorization', otherSideName='permit'),
            Relationship(is_relationship=True, name='collectingEventAuthorizations', type='one-to-many',required=False, relatedModelName='CollectingEventAuthorization', otherSideName='permit'),
            Relationship(is_relationship=True, name='collectingTripAuthorizations', type='one-to-many',required=False, relatedModelName='CollectingTripAuthorization', otherSideName='permit'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='institution', type='many-to-one',required=True, relatedModelName='Institution', column='InstitutionID'),
            Relationship(is_relationship=True, name='issuedBy', type='many-to-one',required=False, relatedModelName='Agent', column='IssuedByID'),
            Relationship(is_relationship=True, name='issuedTo', type='many-to-one',required=False, relatedModelName='Agent', column='IssuedToID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='permitAttachments', type='one-to-many',required=False, relatedModelName='PermitAttachment', otherSideName='permit')
        ],
        fieldAliases=[

        ],
        view='Permit',
        searchDialog='PermitSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PermitAttachment',
        table='permitattachment',
        tableId=116,
        idColumn='PermitAttachmentID',
        idFieldName='permitAttachmentId',
        idField=IdField(name='permitAttachmentId', column='PermitAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='permitAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='permit', type='many-to-one',required=True, relatedModelName='Permit', column='PermitID', otherSideName='permitAttachments')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PickList',
        table='picklist',
        tableId=500,
        idColumn='PickListID',
        idFieldName='pickListId',
        idField=IdField(name='pickListId', column='PickListID', type='java.lang.Integer'),
        fields=[
            Field(name='fieldName', column='FieldName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='filterFieldName', column='FilterFieldName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='filterValue', column='FilterValue', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='formatter', column='Formatter', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='isSystem', column='IsSystem', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='readOnly', column='ReadOnly', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='sizeLimit', column='SizeLimit', indexed=False, unique=False, required=False, type='java.lang.Integer', length=10),
            Field(name='sortType', column='SortType', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='tableName', column='TableName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='PickListNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collection', type='many-to-one',required=True, relatedModelName='Collection', column='CollectionID', otherSideName='pickLists'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='pickListItems', type='one-to-many',required=False, relatedModelName='PickListItem', otherSideName='pickList')
        ],
        fieldAliases=[

        ],
        view='PickList',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PickListItem',
        table='picklistitem',
        tableId=501,
        idColumn='PickListItemID',
        idFieldName='pickListItemId',
        idField=IdField(name='pickListItemId', column='PickListItemID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=False, unique=False, required=True, type='java.lang.String', length=1024),
            Field(name='value', column='Value', indexed=False, unique=False, required=False, type='java.lang.String', length=1024),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='pickList', type='many-to-one',required=True, relatedModelName='PickList', column='PickListID', otherSideName='pickListItems')
        ],
        fieldAliases=[

        ],
        view='PickListItem',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PrepType',
        table='preptype',
        tableId=65,
        idColumn='PrepTypeID',
        idFieldName='prepTypeId',
        idField=IdField(name='prepTypeId', column='PrepTypeID', type='java.lang.Integer'),
        fields=[
            Field(name='isLoanable', column='IsLoanable', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attributeDefs', type='one-to-many',required=False, relatedModelName='AttributeDef', otherSideName='prepType'),
            Relationship(is_relationship=True, name='collection', type='many-to-one',required=True, relatedModelName='Collection', column='CollectionID', otherSideName='prepTypes'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='PrepType',
        searchDialog='PrepTypeSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Preparation',
        table='preparation',
        tableId=63,
        idColumn='PreparationID',
        idFieldName='preparationId',
        idField=IdField(name='preparationId', column='PreparationID', type='java.lang.Integer'),
        fields=[
            Field(name='barCode', column='BarCode', indexed=True, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='countAmt', column='CountAmt', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2Precision', column='Date2Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date3', column='Date3', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date3Precision', column='Date3Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='date4', column='Date4', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date4Precision', column='Date4Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='preparedDate', column='PreparedDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='preparedDatePrecision', column='PreparedDatePrecision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='reservedInteger3', column='ReservedInteger3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='reservedInteger4', column='ReservedInteger4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='sampleNumber', column='SampleNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='status', column='Status', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='storageLocation', column='StorageLocation', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='PreparedDateIDX', column_names=['preparedDate']),
            Index(name='PrepColMemIDX', column_names=['CollectionMemberID']),
            Index(name='PrepGuidIDX', column_names=['GUID']),
            Index(name='PrepSampleNumIDX', column_names=['SampleNumber']),
            Index(name='PrepBarCodeIDX', column_names=['BarCode'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='alternateStorage', type='many-to-one',required=False, relatedModelName='Storage', column='AlternateStorageID'),
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='preparations'),
            Relationship(is_relationship=True, name='conservDescriptions', type='one-to-many',required=False, relatedModelName='ConservDescription', otherSideName='preparation'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='disposalPreparations', type='one-to-many',required=False, relatedModelName='DisposalPreparation', otherSideName='preparation'),
            Relationship(is_relationship=True, name='exchangeInPreps', type='one-to-many',required=False, relatedModelName='ExchangeInPrep', otherSideName='preparation'),
            Relationship(is_relationship=True, name='exchangeOutPreps', type='one-to-many',required=False, relatedModelName='ExchangeOutPrep', otherSideName='preparation'),
            Relationship(is_relationship=True, name='giftPreparations', type='one-to-many',required=False, relatedModelName='GiftPreparation', otherSideName='preparation'),
            Relationship(is_relationship=True, name='loanPreparations', type='one-to-many',required=False, relatedModelName='LoanPreparation', otherSideName='preparation'),
            Relationship(is_relationship=True, name='materialSamples', type='one-to-many',required=False, relatedModelName='MaterialSample', otherSideName='preparation'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='prepType', type='many-to-one',required=True, relatedModelName='PrepType', column='PrepTypeID'),
            Relationship(is_relationship=True, name='preparationAttachments', type='one-to-many',required=False, relatedModelName='PreparationAttachment', otherSideName='preparation'),
            Relationship(is_relationship=True, name='preparationAttribute', type='many-to-one',required=False, relatedModelName='PreparationAttribute', column='PreparationAttributeID', otherSideName='preparations'),
            Relationship(is_relationship=True, name='preparationAttrs', type='one-to-many',required=False, relatedModelName='PreparationAttr', otherSideName='preparation'),
            Relationship(is_relationship=True, name='preparationProperties', type='one-to-many',required=False, relatedModelName='PreparationProperty', otherSideName='preparation'),
            Relationship(is_relationship=True, name='preparedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='PreparedByID'),
            Relationship(is_relationship=True, name='storage', type='many-to-one',required=False, relatedModelName='Storage', column='StorageID', otherSideName='preparations')
        ],
        fieldAliases=[

        ],
        view='Preparation',
        searchDialog='PreparationSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PreparationAttachment',
        table='preparationattachment',
        tableId=117,
        idColumn='PreparationAttachmentID',
        idFieldName='preparationAttachmentId',
        idField=IdField(name='preparationAttachmentId', column='PreparationAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='PrepAttColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='preparationAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=True, relatedModelName='Preparation', column='PreparationID', otherSideName='preparationAttachments')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PreparationAttr',
        table='preparationattr',
        tableId=64,
        idColumn='AttrID',
        idFieldName='attrId',
        idField=IdField(name='attrId', column='AttrID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='dblValue', column='DoubleValue', indexed=False, unique=False, required=False, type='java.lang.Double'),
            Field(name='strValue', column='StrValue', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='PrepAttrColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='definition', type='many-to-one',required=True, relatedModelName='AttributeDef', column='AttributeDefID', otherSideName='preparationAttrs'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=True, relatedModelName='Preparation', column='PreparationId', otherSideName='preparationAttrs')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PreparationAttribute',
        table='preparationattribute',
        tableId=91,
        idColumn='PreparationAttributeID',
        idFieldName='preparationAttributeId',
        idField=IdField(name='preparationAttributeId', column='PreparationAttributeID', type='java.lang.Integer'),
        fields=[
            Field(name='attrDate', column='AttrDate', indexed=False, unique=False, required=False, type='java.util.Calendar', length=10),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number6', column='Number6', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number7', column='Number7', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number8', column='Number8', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number9', column='Number9', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text14', column='Text14', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text15', column='Text15', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text16', column='Text16', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text17', column='Text17', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text18', column='Text18', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text19', column='Text19', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text20', column='Text20', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text21', column='Text21', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text22', column='Text22', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text23', column='Text23', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text24', column='Text24', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text25', column='Text25', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text26', column='Text26', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='PrepAttrsColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparations', type='one-to-many',required=False, relatedModelName='Preparation', otherSideName='preparationAttribute')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.PreparationProperty',
        table='preparationproperty',
        tableId=154,
        idColumn='PreparationPropertyID',
        idFieldName='preparationPropertyId',
        idField=IdField(name='preparationPropertyId', column='PreparationPropertyID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date10', column='Date10', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date11', column='Date11', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date12', column='Date12', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date13', column='Date13', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date14', column='Date14', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date15', column='Date15', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date16', column='Date16', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date17', column='Date17', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date18', column='Date18', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date19', column='Date19', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date2', column='Date2', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date20', column='Date20', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date3', column='Date3', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date4', column='Date4', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date5', column='Date5', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date6', column='Date6', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date7', column='Date7', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date8', column='Date8', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date9', column='Date9', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='guid', column='GUID', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer10', column='Integer10', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer11', column='Integer11', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer12', column='Integer12', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer13', column='Integer13', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer14', column='Integer14', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer15', column='Integer15', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer16', column='Integer16', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer17', column='Integer17', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer18', column='Integer18', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer19', column='Integer19', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer20', column='Integer20', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer21', column='Integer21', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer22', column='Integer22', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer23', column='Integer23', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer24', column='Integer24', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer25', column='Integer25', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer26', column='Integer26', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer27', column='Integer27', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer28', column='Integer28', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer29', column='Integer29', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer30', column='Integer30', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer6', column='Integer6', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer7', column='Integer7', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer8', column='Integer8', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='integer9', column='Integer9', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number10', column='Number10', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number11', column='Number11', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number12', column='Number12', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number13', column='Number13', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number14', column='Number14', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number15', column='Number15', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number16', column='Number16', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number17', column='Number17', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number18', column='Number18', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number19', column='Number19', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number20', column='Number20', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number21', column='Number21', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number22', column='Number22', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number23', column='Number23', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number24', column='Number24', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number25', column='Number25', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number26', column='Number26', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number27', column='Number27', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number28', column='Number28', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number29', column='Number29', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number30', column='Number30', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number6', column='Number6', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number7', column='Number7', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number8', column='Number8', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number9', column='Number9', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text14', column='Text14', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text15', column='Text15', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text16', column='Text16', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text17', column='Text17', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text18', column='Text18', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text19', column='Text19', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text20', column='Text20', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text21', column='Text21', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text22', column='Text22', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text23', column='Text23', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text24', column='Text24', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text25', column='Text25', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text26', column='Text26', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text27', column='Text27', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text28', column='Text28', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text29', column='Text29', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text30', column='Text30', indexed=False, unique=False, required=False, type='java.lang.String', length=100),
            Field(name='text31', column='Text31', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text32', column='Text32', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text33', column='Text33', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text34', column='Text34', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text35', column='Text35', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text36', column='Text36', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text37', column='Text37', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text38', column='Text38', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text39', column='Text39', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text40', column='Text40', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo10', column='YesNo10', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo11', column='YesNo11', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo12', column='YesNo12', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo13', column='YesNo13', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo14', column='YesNo14', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo15', column='YesNo15', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo16', column='YesNo16', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo17', column='YesNo17', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo18', column='YesNo18', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo19', column='YesNo19', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo20', column='YesNo20', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo6', column='YesNo6', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo7', column='YesNo7', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo8', column='YesNo8', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo9', column='YesNo9', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='PREPPROPColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent1', type='many-to-one',required=False, relatedModelName='Agent', column='Agent1ID'),
            Relationship(is_relationship=True, name='agent10', type='many-to-one',required=False, relatedModelName='Agent', column='Agent10ID'),
            Relationship(is_relationship=True, name='agent11', type='many-to-one',required=False, relatedModelName='Agent', column='Agent11ID'),
            Relationship(is_relationship=True, name='agent12', type='many-to-one',required=False, relatedModelName='Agent', column='Agent12ID'),
            Relationship(is_relationship=True, name='agent13', type='many-to-one',required=False, relatedModelName='Agent', column='Agent13ID'),
            Relationship(is_relationship=True, name='agent14', type='many-to-one',required=False, relatedModelName='Agent', column='Agent14ID'),
            Relationship(is_relationship=True, name='agent15', type='many-to-one',required=False, relatedModelName='Agent', column='Agent15ID'),
            Relationship(is_relationship=True, name='agent16', type='many-to-one',required=False, relatedModelName='Agent', column='Agent16ID'),
            Relationship(is_relationship=True, name='agent17', type='many-to-one',required=False, relatedModelName='Agent', column='Agent17ID'),
            Relationship(is_relationship=True, name='agent18', type='many-to-one',required=False, relatedModelName='Agent', column='Agent18ID'),
            Relationship(is_relationship=True, name='agent19', type='many-to-one',required=False, relatedModelName='Agent', column='Agent19ID'),
            Relationship(is_relationship=True, name='agent2', type='many-to-one',required=False, relatedModelName='Agent', column='Agent2ID'),
            Relationship(is_relationship=True, name='agent20', type='many-to-one',required=False, relatedModelName='Agent', column='Agent20ID'),
            Relationship(is_relationship=True, name='agent3', type='many-to-one',required=False, relatedModelName='Agent', column='Agent3ID'),
            Relationship(is_relationship=True, name='agent4', type='many-to-one',required=False, relatedModelName='Agent', column='Agent4ID'),
            Relationship(is_relationship=True, name='agent5', type='many-to-one',required=False, relatedModelName='Agent', column='Agent5ID'),
            Relationship(is_relationship=True, name='agent6', type='many-to-one',required=False, relatedModelName='Agent', column='Agent6ID'),
            Relationship(is_relationship=True, name='agent7', type='many-to-one',required=False, relatedModelName='Agent', column='Agent7ID'),
            Relationship(is_relationship=True, name='agent8', type='many-to-one',required=False, relatedModelName='Agent', column='Agent8D'),
            Relationship(is_relationship=True, name='agent9', type='many-to-one',required=False, relatedModelName='Agent', column='Agent9ID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='preparation', type='many-to-one',required=True, relatedModelName='Preparation', column='PreparationID', otherSideName='preparationProperties')
        ],
        fieldAliases=[

        ],
        view='PreparationProperty',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Project',
        table='project',
        tableId=66,
        idColumn='ProjectID',
        idFieldName='projectId',
        idField=IdField(name='projectId', column='ProjectID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='endDate', column='EndDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='grantAgency', column='GrantAgency', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='grantNumber', column='GrantNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='projectDescription', column='ProjectDescription', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='projectName', column='ProjectName', indexed=True, unique=False, required=True, type='java.lang.String', length=128),
            Field(name='projectNumber', column='ProjectNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='startDate', column='StartDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='url', column='URL', indexed=False, unique=False, required=False, type='java.lang.String', length=1024),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='ProjectNameIDX', column_names=['ProjectName']),
            Index(name='ProjectNumberIDX', column_names=['ProjectNumber'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='agent', type='many-to-one',required=False, relatedModelName='Agent', column='ProjectAgentID'),
            Relationship(is_relationship=True, name='collectionObjects', type='many-to-many',required=False, relatedModelName='CollectionObject', otherSideName='projects'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='Project',
        searchDialog='ProjectSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.RecordSet',
        table='recordset',
        tableId=68,
        idColumn='RecordSetID',
        idFieldName='recordSetId',
        idField=IdField(name='recordSetId', column='RecordSetID', type='java.lang.Integer'),
        fields=[
            Field(name='allPermissionLevel', column='AllPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='dbTableId', column='TableID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='groupPermissionLevel', column='GroupPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=280),
            Field(name='ownerPermissionLevel', column='OwnerPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='RecordSetNameIDX', column_names=['name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='group', type='many-to-one',required=False, relatedModelName='SpPrincipal', column='SpPrincipalID'),
            Relationship(is_relationship=True, name='infoRequest', type='many-to-one',required=False, relatedModelName='InfoRequest', column='InfoRequestID', otherSideName='recordSets'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='recordSetItems', type='one-to-many',required=False, relatedModelName='RecordSetItem', otherSideName='recordSet'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=True, relatedModelName='SpecifyUser', column='SpecifyUserID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.RecordSetItem',
        table='recordsetitem',
        tableId=502,
        idColumn='RecordSetItemID',
        idFieldName='recordSetItemId',
        idField=IdField(name='recordSetItemId', column='RecordSetItemID', type='java.lang.Integer'),
        fields=[
            Field(name='order', column='OrderNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='recordId', column='RecordId', indexed=False, unique=False, required=True, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='recordSet', type='many-to-one',required=True, relatedModelName='RecordSet', column='RecordSetID', otherSideName='recordSetItems')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ReferenceWork',
        table='referencework',
        tableId=69,
        idColumn='ReferenceWorkID',
        idFieldName='referenceWorkId',
        idField=IdField(name='referenceWorkId', column='ReferenceWorkID', type='java.lang.Integer'),
        fields=[
            Field(name='doi', column='Doi', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='isPublished', column='IsPublished', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isbn', column='ISBN', indexed=True, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='libraryNumber', column='LibraryNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='pages', column='Pages', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='placeOfPublication', column='PlaceOfPublication', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='publisher', column='Publisher', indexed=True, unique=False, required=False, type='java.lang.String', length=250),
            Field(name='referenceWorkType', column='ReferenceWorkType', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=True, unique=False, required=True, type='java.lang.String', length=500),
            Field(name='uri', column='Uri', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='url', column='URL', indexed=False, unique=False, required=False, type='java.lang.String', length=1024),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='volume', column='Volume', indexed=False, unique=False, required=False, type='java.lang.String', length=25),
            Field(name='workDate', column='WorkDate', indexed=False, unique=False, required=False, type='java.lang.String', length=25),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='RefWrkTitleIDX', column_names=['Title']),
            Index(name='RefWrkPublisherIDX', column_names=['Publisher']),
            Index(name='RefWrkGuidIDX', column_names=['GUID']),
            Index(name='ISBNIDX', column_names=['ISBN'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='authors', type='one-to-many',required=False, relatedModelName='Author', otherSideName='referenceWork'),
            Relationship(is_relationship=True, name='collectionObjectCitations', type='one-to-many',required=False, relatedModelName='CollectionObjectCitation', otherSideName='referenceWork'),
            Relationship(is_relationship=True, name='containedRFParent', type='many-to-one',required=False, relatedModelName='ReferenceWork', column='ContainedRFParentID', otherSideName='containedReferenceWorks'),
            Relationship(is_relationship=True, name='containedReferenceWorks', type='one-to-many',required=False, relatedModelName='ReferenceWork', otherSideName='containedRFParent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='determinationCitations', type='one-to-many',required=False, relatedModelName='DeterminationCitation', otherSideName='referenceWork'),
            Relationship(is_relationship=True, name='exsiccatae', type='one-to-many',required=False, relatedModelName='Exsiccata', otherSideName='referenceWork'),
            Relationship(is_relationship=True, name='institution', type='many-to-one',required=True, relatedModelName='Institution', column='InstitutionID'),
            Relationship(is_relationship=True, name='journal', type='many-to-one',required=False, relatedModelName='Journal', column='JournalID', otherSideName='referenceWorks'),
            Relationship(is_relationship=True, name='localityCitations', type='one-to-many',required=False, relatedModelName='LocalityCitation', otherSideName='referenceWork'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWorkAttachments', type='one-to-many',required=False, relatedModelName='ReferenceWorkAttachment', otherSideName='referenceWork'),
            Relationship(is_relationship=True, name='taxonCitations', type='one-to-many',required=False, relatedModelName='TaxonCitation', otherSideName='referenceWork')
        ],
        fieldAliases=[

        ],
        view='ReferenceWork',
        searchDialog='ReferenceWorkSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.ReferenceWorkAttachment',
        table='referenceworkattachment',
        tableId=143,
        idColumn='ReferenceWorkAttachmentID',
        idFieldName='referenceWorkAttachmentId',
        idField=IdField(name='referenceWorkAttachmentId', column='ReferenceWorkAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='referenceWorkAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID', otherSideName='referenceWorkAttachments')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.RepositoryAgreement',
        table='repositoryagreement',
        tableId=70,
        idColumn='RepositoryAgreementID',
        idFieldName='repositoryAgreementId',
        idField=IdField(name='repositoryAgreementId', column='RepositoryAgreementID', type='java.lang.Integer'),
        fields=[
            Field(name='dateReceived', column='DateReceived', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='endDate', column='EndDate', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='repositoryAgreementNumber', column='RepositoryAgreementNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=60),
            Field(name='startDate', column='StartDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='status', column='Status', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='RefWrkNumberIDX', column_names=['RepositoryAgreementNumber']),
            Index(name='RefWrkStartDate', column_names=['StartDate'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='accessions', type='one-to-many',required=False, relatedModelName='Accession', otherSideName='repositoryAgreement'),
            Relationship(is_relationship=True, name='addressOfRecord', type='many-to-one',required=False, relatedModelName='AddressOfRecord', column='AddressOfRecordID', otherSideName='repositoryAgreements'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=True, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='originator', type='many-to-one',required=True, relatedModelName='Agent', column='AgentID'),
            Relationship(is_relationship=True, name='repositoryAgreementAgents', type='one-to-many',required=False, relatedModelName='AccessionAgent', otherSideName='repositoryAgreement'),
            Relationship(is_relationship=True, name='repositoryAgreementAttachments', type='one-to-many',required=False, relatedModelName='RepositoryAgreementAttachment', otherSideName='repositoryAgreement'),
            Relationship(is_relationship=True, name='repositoryAgreementAuthorizations', type='one-to-many',required=False, relatedModelName='AccessionAuthorization', otherSideName='repositoryAgreement')
        ],
        fieldAliases=[

        ],
        view='RepositoryAgreement',
        searchDialog='RepositoryAgreementSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.RepositoryAgreementAttachment',
        table='repositoryagreementattachment',
        tableId=118,
        idColumn='RepositoryAgreementAttachmentID',
        idFieldName='repositoryAgreementAttachmentId',
        idField=IdField(name='repositoryAgreementAttachmentId', column='RepositoryAgreementAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='repositoryAgreementAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='repositoryAgreement', type='many-to-one',required=True, relatedModelName='RepositoryAgreement', column='RepositoryAgreementID', otherSideName='repositoryAgreementAttachments')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Shipment',
        table='shipment',
        tableId=71,
        idColumn='ShipmentID',
        idFieldName='shipmentId',
        idField=IdField(name='shipmentId', column='ShipmentID', type='java.lang.Integer'),
        fields=[
            Field(name='insuredForAmount', column='InsuredForAmount', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='numberOfPackages', column='NumberOfPackages', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='shipmentDate', column='ShipmentDate', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='shipmentMethod', column='ShipmentMethod', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='shipmentNumber', column='ShipmentNumber', indexed=True, unique=False, required=True, type='java.lang.String', length=50),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='weight', column='Weight', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='ShipmentNumberIDX', column_names=['ShipmentNumber']),
            Index(name='ShipmentDateIDX', column_names=['ShipmentDate']),
            Index(name='ShipmentDspMemIDX', column_names=['DisciplineID']),
            Index(name='ShipmentMethodIDX', column_names=['ShipmentMethod'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='borrow', type='many-to-one',required=False, relatedModelName='Borrow', column='BorrowID', otherSideName='shipments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='exchangeOut', type='many-to-one',required=False, relatedModelName='ExchangeOut', column='ExchangeOutID', otherSideName='shipments'),
            Relationship(is_relationship=True, name='gift', type='many-to-one',required=False, relatedModelName='Gift', column='GiftID', otherSideName='shipments'),
            Relationship(is_relationship=True, name='loan', type='many-to-one',required=False, relatedModelName='Loan', column='LoanID', otherSideName='shipments'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='shippedBy', type='many-to-one',required=False, relatedModelName='Agent', column='ShippedByID'),
            Relationship(is_relationship=True, name='shippedTo', type='many-to-one',required=False, relatedModelName='Agent', column='ShippedToID'),
            Relationship(is_relationship=True, name='shipper', type='many-to-one',required=False, relatedModelName='Agent', column='ShipperID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpAppResource',
        table='spappresource',
        tableId=514,
        idColumn='SpAppResourceID',
        idFieldName='spAppResourceId',
        idField=IdField(name='spAppResourceId', column='SpAppResourceID', type='java.lang.Integer'),
        fields=[
            Field(name='allPermissionLevel', column='AllPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='groupPermissionLevel', column='GroupPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='level', column='Level', indexed=False, unique=False, required=True, type='java.lang.Short'),
            Field(name='metaData', column='MetaData', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='mimeType', column='MimeType', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='ownerPermissionLevel', column='OwnerPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpAppResNameIDX', column_names=['Name']),
            Index(name='SpAppResMimeTypeIDX', column_names=['MimeType'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='group', type='many-to-one',required=False, relatedModelName='SpPrincipal', column='SpPrincipalID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spAppResourceDatas', type='one-to-many',required=False, relatedModelName='SpAppResourceData', otherSideName='spAppResource'),
            Relationship(is_relationship=True, name='spAppResourceDir', type='many-to-one',required=True, relatedModelName='SpAppResourceDir', column='SpAppResourceDirID', otherSideName='spPersistedAppResources'),
            Relationship(is_relationship=True, name='spReports', type='one-to-many',required=False, relatedModelName='SpReport', otherSideName='appResource'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=True, relatedModelName='SpecifyUser', column='SpecifyUserID', otherSideName='spAppResources')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpAppResourceData',
        table='spappresourcedata',
        tableId=515,
        idColumn='SpAppResourceDataID',
        idFieldName='spAppResourceDataId',
        idField=IdField(name='spAppResourceDataId', column='SpAppResourceDataID', type='java.lang.Integer'),
        fields=[
            Field(name='data', column='data', indexed=False, unique=False, required=False, type='text', length=16000000),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spAppResource', type='many-to-one',required=False, relatedModelName='SpAppResource', column='SpAppResourceID', otherSideName='spAppResourceDatas'),
            Relationship(is_relationship=True, name='spViewSetObj', type='many-to-one',required=False, relatedModelName='SpViewSetObj', column='SpViewSetObjID', otherSideName='spAppResourceDatas')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpAppResourceDir',
        table='spappresourcedir',
        tableId=516,
        idColumn='SpAppResourceDirID',
        idFieldName='spAppResourceDirId',
        idField=IdField(name='spAppResourceDirId', column='SpAppResourceDirID', type='java.lang.Integer'),
        fields=[
            Field(name='disciplineType', column='DisciplineType', indexed=True, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='isPersonal', column='IsPersonal', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='userType', column='UserType', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpAppResourceDirDispTypeIDX', column_names=['DisciplineType'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collection', type='many-to-one',required=False, relatedModelName='Collection', column='CollectionID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=False, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spPersistedAppResources', type='one-to-many',required=False, relatedModelName='SpAppResource', otherSideName='spAppResourceDir'),
            Relationship(is_relationship=True, name='spPersistedViewSets', type='one-to-many',required=False, relatedModelName='SpViewSetObj', otherSideName='spAppResourceDir'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=False, relatedModelName='SpecifyUser', column='SpecifyUserID', otherSideName='spAppResourceDirs')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpAuditLog',
        table='spauditlog',
        tableId=530,
        idColumn='SpAuditLogID',
        idFieldName='spAuditLogId',
        idField=IdField(name='spAuditLogId', column='SpAuditLogID', type='java.lang.Integer'),
        fields=[
            Field(name='action', column='Action', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='parentRecordId', column='ParentRecordId', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='parentTableNum', column='ParentTableNum', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='recordId', column='RecordId', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='recordVersion', column='RecordVersion', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='tableNum', column='TableNum', indexed=False, unique=False, required=True, type='java.lang.Short'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='fields', type='one-to-many',required=False, relatedModelName='SpAuditLogField', otherSideName='spAuditLog'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpAuditLogField',
        table='spauditlogfield',
        tableId=531,
        idColumn='SpAuditLogFieldID',
        idFieldName='spAuditLogFieldId',
        idField=IdField(name='spAuditLogFieldId', column='SpAuditLogFieldID', type='java.lang.Integer'),
        fields=[
            Field(name='fieldName', column='FieldName', indexed=False, unique=False, required=True, type='java.lang.String', length=128),
            Field(name='newValue', column='NewValue', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='oldValue', column='OldValue', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spAuditLog', type='many-to-one',required=False, relatedModelName='SpAuditLog', column='SpAuditLogID', otherSideName='fields')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpExportSchema',
        table='spexportschema',
        tableId=524,
        idColumn='SpExportSchemaID',
        idFieldName='spExportSchemaId',
        idField=IdField(name='spExportSchemaId', column='SpExportSchemaID', type='java.lang.Integer'),
        fields=[
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='schemaName', column='SchemaName', indexed=False, unique=False, required=False, type='java.lang.String', length=80),
            Field(name='schemaVersion', column='SchemaVersion', indexed=False, unique=False, required=False, type='java.lang.String', length=80),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID', otherSideName='spExportSchemas'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spExportSchemaItems', type='one-to-many',required=False, relatedModelName='SpExportSchemaItem', otherSideName='spExportSchema'),
            Relationship(is_relationship=True, name='spExportSchemaMappings', type='many-to-many',required=False, relatedModelName='SpExportSchemaMapping', otherSideName='spExportSchemas')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpExportSchemaItem',
        table='spexportschemaitem',
        tableId=525,
        idColumn='SpExportSchemaItemID',
        idFieldName='spExportSchemaItemId',
        idField=IdField(name='spExportSchemaItemId', column='SpExportSchemaItemID', type='java.lang.Integer'),
        fields=[
            Field(name='dataType', column='DataType', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='fieldName', column='FieldName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='formatter', column='Formatter', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spExportSchema', type='many-to-one',required=True, relatedModelName='SpExportSchema', column='SpExportSchemaID', otherSideName='spExportSchemaItems'),
            Relationship(is_relationship=True, name='spLocaleContainerItem', type='many-to-one',required=False, relatedModelName='SpLocaleContainerItem', column='SpLocaleContainerItemID', otherSideName='spExportSchemaItems')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpExportSchemaItemMapping',
        table='spexportschemaitemmapping',
        tableId=527,
        idColumn='SpExportSchemaItemMappingID',
        idFieldName='spExportSchemaItemMappingId',
        idField=IdField(name='spExportSchemaItemMappingId', column='SpExportSchemaItemMappingID', type='java.lang.Integer'),
        fields=[
            Field(name='exportedFieldName', column='ExportedFieldName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='extensionItem', column='ExtensionItem', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='rowType', column='RowType', indexed=False, unique=False, required=False, type='java.lang.String', length=500),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='exportSchemaItem', type='many-to-one',required=False, relatedModelName='SpExportSchemaItem', column='ExportSchemaItemID'),
            Relationship(is_relationship=True, name='exportSchemaMapping', type='many-to-one',required=False, relatedModelName='SpExportSchemaMapping', column='SpExportSchemaMappingID', otherSideName='mappings'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='queryField', type='many-to-one',required=False, relatedModelName='SpQueryField', column='SpQueryFieldID', otherSideName='mappings')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpExportSchemaMapping',
        table='spexportschemamapping',
        tableId=528,
        idColumn='SpExportSchemaMappingID',
        idFieldName='spExportSchemaMappingId',
        idField=IdField(name='spExportSchemaMappingId', column='SpExportSchemaMappingID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='mappingName', column='MappingName', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampExported', column='TimeStampExported', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SPEXPSCHMMAPColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='mappings', type='one-to-many',required=False, relatedModelName='SpExportSchemaItemMapping', otherSideName='exportSchemaMapping'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spExportSchemas', type='many-to-many',required=False, relatedModelName='SpExportSchema', otherSideName='spExportSchemaMappings'),
            Relationship(is_relationship=True, name='symbiotaInstances', type='one-to-many',required=False, relatedModelName='SpSymbiotaInstance', otherSideName='schemaMapping')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpFieldValueDefault',
        table='spfieldvaluedefault',
        tableId=520,
        idColumn='SpFieldValueDefaultID',
        idFieldName='spFieldValueDefaultId',
        idField=IdField(name='spFieldValueDefaultId', column='SpFieldValueDefaultID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='fieldName', column='FieldName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='idValue', column='IdValue', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='strValue', column='StrValue', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='tableName', column='TableName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpFieldValueDefaultColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpLocaleContainer',
        table='splocalecontainer',
        tableId=503,
        idColumn='SpLocaleContainerID',
        idFieldName='spLocaleContainerId',
        idField=IdField(name='spLocaleContainerId', column='SpLocaleContainerID', type='java.lang.Integer'),
        fields=[
            Field(name='aggregator', column='Aggregator', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='defaultUI', column='DefaultUI', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='format', column='Format', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='isHidden', column='IsHidden', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isSystem', column='IsSystem', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isUIFormatter', column='IsUIFormatter', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='pickListName', column='PickListName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='schemaType', column='SchemaType', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpLocaleContainerNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='descs', type='one-to-many',required=False, relatedModelName='SpLocaleItemStr', otherSideName='containerDesc'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=True, relatedModelName='Discipline', column='DisciplineID', otherSideName='spLocaleContainers'),
            Relationship(is_relationship=True, name='items', type='one-to-many',required=False, relatedModelName='SpLocaleContainerItem', otherSideName='container'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='names', type='one-to-many',required=False, relatedModelName='SpLocaleItemStr', otherSideName='containerName')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpLocaleContainerItem',
        table='splocalecontaineritem',
        tableId=504,
        idColumn='SpLocaleContainerItemID',
        idFieldName='spLocaleContainerItemId',
        idField=IdField(name='spLocaleContainerItemId', column='SpLocaleContainerItemID', type='java.lang.Integer'),
        fields=[
            Field(name='format', column='Format', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='isHidden', column='IsHidden', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isRequired', column='IsRequired', indexed=False, unique=False, required=False, type='java.lang.Boolean', length=32),
            Field(name='isSystem', column='IsSystem', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isUIFormatter', column='IsUIFormatter', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='pickListName', column='PickListName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='webLinkName', column='WebLinkName', indexed=False, unique=False, required=False, type='java.lang.String', length=32)
        ],
        indexes=[
            Index(name='SpLocaleContainerItemNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='container', type='many-to-one',required=True, relatedModelName='SpLocaleContainer', column='SpLocaleContainerID', otherSideName='items'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='descs', type='one-to-many',required=False, relatedModelName='SpLocaleItemStr', otherSideName='itemDesc'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='names', type='one-to-many',required=False, relatedModelName='SpLocaleItemStr', otherSideName='itemName'),
            Relationship(is_relationship=True, name='spExportSchemaItems', type='one-to-many',required=False, relatedModelName='SpExportSchemaItem', otherSideName='spLocaleContainerItem')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpLocaleItemStr',
        table='splocaleitemstr',
        tableId=505,
        idColumn='SpLocaleItemStrID',
        idFieldName='spLocaleItemStrId',
        idField=IdField(name='spLocaleItemStrId', column='SpLocaleItemStrID', type='java.lang.Integer'),
        fields=[
            Field(name='country', column='Country', indexed=True, unique=False, required=False, type='java.lang.String', length=2),
            Field(name='language', column='Language', indexed=True, unique=False, required=True, type='java.lang.String', length=2),
            Field(name='text', column='Text', indexed=False, unique=False, required=True, type='java.lang.String', length=2048),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='variant', column='Variant', indexed=False, unique=False, required=False, type='java.lang.String', length=2),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpLocaleLanguageIDX', column_names=['Language']),
            Index(name='SpLocaleCountyIDX', column_names=['Country'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='containerDesc', type='many-to-one',required=False, relatedModelName='SpLocaleContainer', column='SpLocaleContainerDescID', otherSideName='descs'),
            Relationship(is_relationship=True, name='containerName', type='many-to-one',required=False, relatedModelName='SpLocaleContainer', column='SpLocaleContainerNameID', otherSideName='names'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='itemDesc', type='many-to-one',required=False, relatedModelName='SpLocaleContainerItem', column='SpLocaleContainerItemDescID', otherSideName='descs'),
            Relationship(is_relationship=True, name='itemName', type='many-to-one',required=False, relatedModelName='SpLocaleContainerItem', column='SpLocaleContainerItemNameID', otherSideName='names'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpPermission',
        table='sppermission',
        tableId=521,
        idColumn='SpPermissionID',
        idFieldName='permissionId',
        idField=IdField(name='permissionId', column='SpPermissionID', type='java.lang.Integer'),
        fields=[
            Field(name='actions', column='Actions', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='name', column='Name', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='permissionClass', column='PermissionClass', indexed=False, unique=False, required=True, type='java.lang.String', length=256),
            Field(name='targetId', column='TargetId', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='principals', type='many-to-many',required=False, relatedModelName='SpPrincipal', otherSideName='permissions')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpPrincipal',
        table='spprincipal',
        tableId=522,
        idColumn='SpPrincipalID',
        idFieldName='userGroupId',
        idField=IdField(name='userGroupId', column='SpPrincipalID', type='java.lang.Integer'),
        fields=[
            Field(name='groupSubClass', column='GroupSubClass', indexed=False, unique=False, required=True, type='java.lang.String', length=255),
            Field(name='groupType', column='groupType', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='priority', column='Priority', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text'),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='permissions', type='many-to-many',required=False, relatedModelName='SpPermission', otherSideName='principals'),
            Relationship(is_relationship=True, name='scope', type='many-to-one',required=False, relatedModelName='UserGroupScope', column='userGroupScopeID', otherSideName='userGroups'),
            Relationship(is_relationship=True, name='specifyUsers', type='many-to-many',required=False, relatedModelName='SpecifyUser', otherSideName='spPrincipals')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpQuery',
        table='spquery',
        tableId=517,
        idColumn='SpQueryID',
        idFieldName='spQueryId',
        idField=IdField(name='spQueryId', column='SpQueryID', type='java.lang.Integer'),
        fields=[
            Field(name='contextName', column='ContextName', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='contextTableId', column='ContextTableId', indexed=False, unique=False, required=True, type='java.lang.Short'),
            Field(name='countOnly', column='CountOnly', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='formatAuditRecIds', column='FormatAuditRecIds', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isFavorite', column='IsFavorite', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=256),
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='searchSynonymy', column='SearchSynonymy', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='selectDistinct', column='SelectDistinct', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='smushed', column='Smushed', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='sqlStr', column='SqlStr', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpQueryNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='fields', type='one-to-many',required=False, relatedModelName='SpQueryField', otherSideName='query'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='reports', type='one-to-many',required=False, relatedModelName='SpReport', otherSideName='query'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=True, relatedModelName='SpecifyUser', column='SpecifyUserID', otherSideName='spQuerys')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpQueryField',
        table='spqueryfield',
        tableId=518,
        idColumn='SpQueryFieldID',
        idFieldName='spQueryFieldId',
        idField=IdField(name='spQueryFieldId', column='SpQueryFieldID', type='java.lang.Integer'),
        fields=[
            Field(name='allowNulls', column='AllowNulls', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='alwaysFilter', column='AlwaysFilter', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='columnAlias', column='ColumnAlias', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='contextTableIdent', column='ContextTableIdent', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='endValue', column='EndValue', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='fieldName', column='FieldName', indexed=False, unique=False, required=True, type='java.lang.String', length=32),
            Field(name='formatName', column='FormatName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='isDisplay', column='IsDisplay', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isNot', column='IsNot', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isPrompt', column='IsPrompt', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isRelFld', column='IsRelFld', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='operEnd', column='OperEnd', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='operStart', column='OperStart', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='position', column='Position', indexed=False, unique=False, required=True, type='java.lang.Short'),
            Field(name='sortType', column='SortType', indexed=False, unique=False, required=True, type='java.lang.Byte'),
            Field(name='startValue', column='StartValue', indexed=False, unique=False, required=True, type='text', length=65535),
            Field(name='stringId', column='StringId', indexed=False, unique=False, required=True, type='java.lang.String', length=500),
            Field(name='tableList', column='TableList', indexed=False, unique=False, required=True, type='java.lang.String', length=500),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='mappings', type='one-to-many',required=False, relatedModelName='SpExportSchemaItemMapping', otherSideName='queryField'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='query', type='many-to-one',required=False, relatedModelName='SpQuery', column='SpQueryID', otherSideName='fields')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpReport',
        table='spreport',
        tableId=519,
        idColumn='SpReportId',
        idFieldName='spReportId',
        idField=IdField(name='spReportId', column='SpReportId', type='java.lang.Integer'),
        fields=[
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='repeatCount', column='RepeatCount', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='repeatField', column='RepeatField', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpReportNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='appResource', type='many-to-one',required=True, relatedModelName='SpAppResource', column='AppResourceID', otherSideName='spReports'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='query', type='many-to-one',required=False, relatedModelName='SpQuery', column='SpQueryID', otherSideName='reports'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=True, relatedModelName='SpecifyUser', column='SpecifyUserID'),
            Relationship(is_relationship=True, name='workbenchTemplate', type='one-to-one',required=False, relatedModelName='WorkbenchTemplate', column='WorkbenchTemplateID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpSymbiotaInstance',
        table='spsymbiotainstance',
        tableId=533,
        idColumn='SpSymbiotaInstanceID',
        idFieldName='spSymbiotaInstanceId',
        idField=IdField(name='spSymbiotaInstanceId', column='SpSymbiotaInstanceID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='instanceName', column='InstanceName', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='lastCacheBuild', column='LastCacheBuild', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='lastPull', column='LastPull', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='lastPush', column='LastPush', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text'),
            Field(name='symbiotaKey', column='SymbiotaKey', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SPSYMINSTColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='schemaMapping', type='many-to-one',required=False, relatedModelName='SpExportSchemaMapping', column='SchemaMappingID', otherSideName='symbiotaInstances')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpTaskSemaphore',
        table='sptasksemaphore',
        tableId=526,
        idColumn='TaskSemaphoreID',
        idFieldName='spTaskSemaphoreId',
        idField=IdField(name='spTaskSemaphoreId', column='TaskSemaphoreID', type='java.lang.Integer'),
        fields=[
            Field(name='context', column='Context', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='isLocked', column='IsLocked', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='lockedTime', column='LockedTime', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='machineName', column='MachineName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='scope', column='Scope', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='taskName', column='TaskName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='usageCount', column='UsageCount', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='collection', type='many-to-one',required=False, relatedModelName='Collection', column='CollectionID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='many-to-one',required=False, relatedModelName='Discipline', column='DisciplineID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='owner', type='many-to-one',required=False, relatedModelName='SpecifyUser', column='OwnerID', otherSideName='taskSemaphores')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpVersion',
        table='spversion',
        tableId=529,
        idColumn='SpVersionID',
        idFieldName='spVersionId',
        idField=IdField(name='spVersionId', column='SpVersionID', type='java.lang.Integer'),
        fields=[
            Field(name='appName', column='AppName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='appVersion', column='AppVersion', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='dbClosedBy', column='DbClosedBy', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='isDBClosed', column='IsDBClosed', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='schemaVersion', column='SchemaVersion', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='workbenchSchemaVersion', column='WorkbenchSchemaVersion', indexed=False, unique=False, required=False, type='java.lang.String', length=16)
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpViewSetObj',
        table='spviewsetobj',
        tableId=513,
        idColumn='SpViewSetObjID',
        idFieldName='spViewSetObjId',
        idField=IdField(name='spViewSetObjId', column='SpViewSetObjID', type='java.lang.Integer'),
        fields=[
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='fileName', column='FileName', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='level', column='Level', indexed=False, unique=False, required=True, type='java.lang.Short'),
            Field(name='metaData', column='MetaData', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpViewObjNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spAppResourceDatas', type='one-to-many',required=False, relatedModelName='SpAppResourceData', otherSideName='spViewSetObj'),
            Relationship(is_relationship=True, name='spAppResourceDir', type='many-to-one',required=True, relatedModelName='SpAppResourceDir', column='SpAppResourceDirID', otherSideName='spPersistedViewSets')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpVisualQuery',
        table='spvisualquery',
        tableId=532,
        idColumn='SpVisualQueryID',
        idFieldName='spVisualQueryId',
        idField=IdField(name='spVisualQueryId', column='SpVisualQueryID', type='java.lang.Integer'),
        fields=[
            Field(name='description', column='Description', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='SpVisualQueryNameIDX', column_names=['Name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='polygons', type='one-to-many',required=False, relatedModelName='LatLonPolygon', otherSideName='visualQuery'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=True, relatedModelName='SpecifyUser', column='SpecifyUserID')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.SpecifyUser',
        table='specifyuser',
        tableId=72,
        idColumn='SpecifyUserID',
        idFieldName='specifyUserId',
        idField=IdField(name='specifyUserId', column='SpecifyUserID', type='java.lang.Integer'),
        fields=[
            Field(name='accumMinLoggedIn', column='AccumMinLoggedIn', indexed=False, unique=False, required=False, type='java.lang.Long'),
            Field(name='email', column='EMail', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='isLoggedIn', column='IsLoggedIn', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isLoggedInReport', column='IsLoggedInReport', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='loginCollectionName', column='LoginCollectionName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='loginDisciplineName', column='LoginDisciplineName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='loginOutTime', column='LoginOutTime', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='name', column='Name', indexed=False, unique=True, required=True, type='java.lang.String', length=64),
            Field(name='password', column='Password', indexed=False, unique=False, required=True, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='userType', column='UserType', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agents', type='one-to-many',required=False, relatedModelName='Agent', otherSideName='specifyUser'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='spAppResourceDirs', type='one-to-many',required=False, relatedModelName='SpAppResourceDir', otherSideName='specifyUser'),
            Relationship(is_relationship=True, name='spAppResources', type='one-to-many',required=False, relatedModelName='SpAppResource', otherSideName='specifyUser'),
            Relationship(is_relationship=True, name='spPrincipals', type='many-to-many',required=False, relatedModelName='SpPrincipal', otherSideName='specifyUsers'),
            Relationship(is_relationship=True, name='spQuerys', type='one-to-many',required=False, relatedModelName='SpQuery', otherSideName='specifyUser'),
            Relationship(is_relationship=True, name='taskSemaphores', type='one-to-many',required=False, relatedModelName='SpTaskSemaphore', otherSideName='owner'),
            Relationship(is_relationship=True, name='workbenchTemplates', type='one-to-many',required=False, relatedModelName='WorkbenchTemplate', otherSideName='specifyUser'),
            Relationship(is_relationship=True, name='workbenches', type='one-to-many',required=False, relatedModelName='Workbench', otherSideName='specifyUser')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Storage',
        table='storage',
        tableId=58,
        idColumn='StorageID',
        idFieldName='storageId',
        idField=IdField(name='storageId', column='StorageID', type='java.lang.Integer'),
        fields=[
            Field(name='abbrev', column='Abbrev', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='fullName', column='FullName', indexed=True, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='highestChildNodeNumber', column='HighestChildNodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='isAccepted', column='IsAccepted', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='nodeNumber', column='NodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='timestampVersion', column='TimestampVersion', indexed=False, unique=False, required=False, type='java.util.Date'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='StorNameIDX', column_names=['Name']),
            Index(name='StorFullNameIDX', column_names=['FullName'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='acceptedChildren', type='one-to-many',required=False, relatedModelName='Storage', otherSideName='acceptedStorage'),
            Relationship(is_relationship=True, name='acceptedStorage', type='many-to-one',required=False, relatedModelName='Storage', column='AcceptedID', otherSideName='acceptedChildren'),
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='Storage', otherSideName='parent'),
            Relationship(is_relationship=True, name='containers', type='one-to-many',required=False, relatedModelName='Container', otherSideName='storage'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='definition', type='many-to-one',required=True, relatedModelName='StorageTreeDef', column='StorageTreeDefID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='definitionItem', type='many-to-one',required=True, relatedModelName='StorageTreeDefItem', column='StorageTreeDefItemID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='Storage', column='ParentID', otherSideName='children'),
            Relationship(is_relationship=True, name='preparations', type='one-to-many',required=False, relatedModelName='Preparation', otherSideName='storage'),
            Relationship(is_relationship=True, name='storageAttachments', type='one-to-many',required=False, relatedModelName='StorageAttachment', otherSideName='storage')
        ],
        fieldAliases=[
            {'vname':'acceptedParent', 'aname':'acceptedStorage'}
        ],
        view='Storage',
        searchDialog='StorageSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.StorageAttachment',
        table='storageattachment',
        tableId=148,
        idColumn='StorageAttachmentID',
        idFieldName='storageAttachmentId',
        idField=IdField(name='storageAttachmentId', column='StorageAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='storageAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='storage', type='many-to-one',required=True, relatedModelName='Storage', column='StorageID', otherSideName='storageAttachments')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.StorageTreeDef',
        table='storagetreedef',
        tableId=59,
        idColumn='StorageTreeDefID',
        idFieldName='storageTreeDefId',
        idField=IdField(name='storageTreeDefId', column='StorageTreeDefID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameDirection', column='FullNameDirection', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='institutions', type='one-to-many',required=False, relatedModelName='Institution', otherSideName='storageTreeDef'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='treeDefItems', type='one-to-many',required=False, relatedModelName='StorageTreeDefItem', otherSideName='treeDef'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='Storage', otherSideName='definition')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.StorageTreeDefItem',
        table='storagetreedefitem',
        tableId=60,
        idColumn='StorageTreeDefItemID',
        idFieldName='storageTreeDefItemId',
        idField=IdField(name='storageTreeDefItemId', column='StorageTreeDefItemID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameSeparator', column='FullNameSeparator', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='isEnforced', column='IsEnforced', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isInFullName', column='IsInFullName', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='textAfter', column='TextAfter', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='textBefore', column='TextBefore', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='StorageTreeDefItem', otherSideName='parent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='StorageTreeDefItem', column='ParentItemID', otherSideName='children'),
            Relationship(is_relationship=True, name='treeDef', type='many-to-one',required=True, relatedModelName='StorageTreeDef', column='StorageTreeDefID', otherSideName='treeDefItems'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='Storage', otherSideName='definitionItem')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Taxon',
        table='taxon',
        tableId=4,
        idColumn='TaxonID',
        idFieldName='taxonId',
        idField=IdField(name='taxonId', column='TaxonID', type='java.lang.Integer'),
        fields=[
            Field(name='author', column='Author', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='citesStatus', column='CitesStatus', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='colStatus', column='COLStatus', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='commonName', column='CommonName', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='cultivarName', column='CultivarName', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='environmentalProtectionStatus', column='EnvironmentalProtectionStatus', indexed=True, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='esaStatus', column='EsaStatus', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='fullName', column='FullName', indexed=True, unique=False, required=False, type='java.lang.String', length=512),
            Field(name='groupNumber', column='GroupNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=20),
            Field(name='guid', column='GUID', indexed=True, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='highestChildNodeNumber', column='HighestChildNodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Long'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Long'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Long'),
            Field(name='integer4', column='Integer4', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer5', column='Integer5', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='isAccepted', column='IsAccepted', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isHybrid', column='IsHybrid', indexed=False, unique=False, required=True, type='java.lang.Boolean'),
            Field(name='isisNumber', column='IsisNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='labelFormat', column='LabelFormat', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='lsid', column='LSID', indexed=False, unique=False, required=False, type='text'),
            Field(name='name', column='Name', indexed=True, unique=False, required=True, type='java.lang.String', length=256),
            Field(name='ncbiTaxonNumber', column='NcbiTaxonNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=8),
            Field(name='nodeNumber', column='NodeNumber', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='source', column='Source', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='taxonomicSerialNumber', column='TaxonomicSerialNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text14', column='Text14', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text15', column='Text15', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text16', column='Text16', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text17', column='Text17', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text18', column='Text18', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text19', column='Text19', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='text20', column='Text20', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='unitInd1', column='UnitInd1', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='unitInd2', column='UnitInd2', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='unitInd3', column='UnitInd3', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='unitInd4', column='UnitInd4', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='unitName1', column='UnitName1', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='unitName2', column='UnitName2', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='unitName3', column='UnitName3', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='unitName4', column='UnitName4', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='usfwsCode', column='UsfwsCode', indexed=False, unique=False, required=False, type='java.lang.String', length=16),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='visibility', column='Visibility', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo10', column='YesNo10', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo11', column='YesNo11', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo12', column='YesNo12', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo13', column='YesNo13', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo14', column='YesNo14', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo15', column='YesNo15', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo16', column='YesNo16', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo17', column='YesNo17', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo18', column='YesNo18', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo19', column='YesNo19', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo6', column='YesNo6', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo7', column='YesNo7', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo8', column='YesNo8', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo9', column='YesNo9', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='TaxonGuidIDX', column_names=['GUID']),
            Index(name='TaxonomicSerialNumberIDX', column_names=['TaxonomicSerialNumber']),
            Index(name='TaxonCommonNameIDX', column_names=['CommonName']),
            Index(name='TaxonNameIDX', column_names=['Name']),
            Index(name='TaxonFullNameIDX', column_names=['FullName']),
            Index(name='EnvironmentalProtectionStatusIDX', column_names=['EnvironmentalProtectionStatus'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='acceptedChildren', type='one-to-many',required=False, relatedModelName='Taxon', otherSideName='acceptedTaxon'),
            Relationship(is_relationship=True, name='acceptedTaxon', type='many-to-one',required=False, relatedModelName='Taxon', column='AcceptedID', otherSideName='acceptedChildren'),
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='Taxon', otherSideName='parent'),
            Relationship(is_relationship=True, name='collectingEventAttributes', type='one-to-many',required=False, relatedModelName='CollectingEventAttribute', otherSideName='hostTaxon'),
            Relationship(is_relationship=True, name='commonNames', type='one-to-many',required=False, relatedModelName='CommonNameTx', otherSideName='taxon'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='definition', type='many-to-one',required=True, relatedModelName='TaxonTreeDef', column='TaxonTreeDefID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='definitionItem', type='many-to-one',required=True, relatedModelName='TaxonTreeDefItem', column='TaxonTreeDefItemID', otherSideName='treeEntries'),
            Relationship(is_relationship=True, name='determinations', type='one-to-many',required=False, relatedModelName='Determination', otherSideName='taxon'),
            Relationship(is_relationship=True, name='hybridChildren1', type='one-to-many',required=False, relatedModelName='Taxon', otherSideName='hybridParent1'),
            Relationship(is_relationship=True, name='hybridChildren2', type='one-to-many',required=False, relatedModelName='Taxon', otherSideName='hybridParent2'),
            Relationship(is_relationship=True, name='hybridParent1', type='many-to-one',required=False, relatedModelName='Taxon', column='HybridParent1ID', otherSideName='hybridChildren1'),
            Relationship(is_relationship=True, name='hybridParent2', type='many-to-one',required=False, relatedModelName='Taxon', column='HybridParent2ID', otherSideName='hybridChildren2'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='Taxon', column='ParentID', otherSideName='children'),
            Relationship(is_relationship=True, name='taxonAttachments', type='one-to-many',required=False, relatedModelName='TaxonAttachment', otherSideName='taxon'),
            Relationship(is_relationship=True, name='taxonAttribute', type='many-to-one',required=False, relatedModelName='TaxonAttribute', column='TaxonAttributeID', otherSideName='taxons'),
            Relationship(is_relationship=True, name='taxonCitations', type='one-to-many',required=False, relatedModelName='TaxonCitation', otherSideName='taxon'),
            Relationship(is_relationship=True, name='visibilitySetBy', type='many-to-one',required=False, relatedModelName='SpecifyUser', column='VisibilitySetByID')
        ],
        fieldAliases=[
            {'vname':'acceptedParent', 'aname':'acceptedTaxon'}
        ],
        view='Taxon',
        searchDialog='TaxonSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.TaxonAttachment',
        table='taxonattachment',
        tableId=119,
        idColumn='TaxonAttachmentID',
        idFieldName='taxonAttachmentId',
        idField=IdField(name='taxonAttachmentId', column='TaxonAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='taxonAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='taxon', type='many-to-one',required=True, relatedModelName='Taxon', column='TaxonID', otherSideName='taxonAttachments')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.TaxonAttribute',
        table='taxonattribute',
        tableId=162,
        idColumn='TaxonAttributeID',
        idFieldName='taxonAttributeId',
        idField=IdField(name='taxonAttributeId', column='TaxonAttributeID', type='java.lang.Integer'),
        fields=[
            Field(name='date1', column='Date1', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='date1Precision', column='Date1Precision', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number10', column='Number10', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number11', column='Number11', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number12', column='Number12', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number13', column='Number13', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number14', column='Number14', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number15', column='Number15', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number16', column='Number16', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number17', column='Number17', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number18', column='Number18', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number19', column='Number19', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number20', column='Number20', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number6', column='Number6', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number7', column='Number7', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number8', column='Number8', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number9', column='Number9', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text10', column='Text10', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text11', column='Text11', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text12', column='Text12', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text13', column='Text13', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text14', column='Text14', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text15', column='Text15', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text16', column='Text16', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text17', column='Text17', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text18', column='Text18', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text19', column='Text19', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text20', column='Text20', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text21', column='Text21', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text22', column='Text22', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text23', column='Text23', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text24', column='Text24', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text25', column='Text25', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text26', column='Text26', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text27', column='Text27', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text28', column='Text28', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text29', column='Text29', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text30', column='Text30', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text31', column='Text31', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text32', column='Text32', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text33', column='Text33', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text34', column='Text34', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text35', column='Text35', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text36', column='Text36', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text37', column='Text37', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text38', column='Text38', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text39', column='Text39', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text40', column='Text40', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text41', column='Text41', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text42', column='Text42', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text43', column='Text43', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text44', column='Text44', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text45', column='Text45', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text46', column='Text46', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text47', column='Text47', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text48', column='Text48', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='text49', column='Text49', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text50', column='Text50', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text51', column='Text51', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text52', column='Text52', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text53', column='Text53', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text54', column='Text54', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text55', column='Text55', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text56', column='Text56', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text57', column='Text57', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text58', column='Text58', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text6', column='Text6', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text7', column='Text7', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text8', column='Text8', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='text9', column='Text9', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo10', column='YesNo10', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo11', column='YesNo11', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo12', column='YesNo12', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo13', column='YesNo13', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo14', column='YesNo14', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo15', column='YesNo15', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo16', column='YesNo16', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo17', column='YesNo17', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo18', column='YesNo18', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo19', column='YesNo19', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo20', column='YesNo20', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo21', column='YesNo21', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo22', column='YesNo22', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo23', column='YesNo23', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo24', column='YesNo24', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo25', column='YesNo25', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo26', column='YesNo26', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo27', column='YesNo27', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo28', column='YesNo28', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo29', column='YesNo29', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo30', column='YesNo30', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo31', column='YesNo31', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo32', column='YesNo32', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo33', column='YesNo33', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo34', column='YesNo34', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo35', column='YesNo35', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo36', column='YesNo36', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo37', column='YesNo37', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo38', column='YesNo38', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo39', column='YesNo39', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo4', column='YesNo4', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo40', column='YesNo40', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo41', column='YesNo41', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo42', column='YesNo42', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo43', column='YesNo43', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo44', column='YesNo44', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo45', column='YesNo45', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo46', column='YesNo46', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo47', column='YesNo47', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo48', column='YesNo48', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo49', column='YesNo49', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo5', column='YesNo5', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo50', column='YesNo50', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo51', column='YesNo51', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo52', column='YesNo52', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo53', column='YesNo53', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo54', column='YesNo54', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo55', column='YesNo55', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo56', column='YesNo56', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo57', column='YesNo57', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo58', column='YesNo58', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo59', column='YesNo59', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo6', column='YesNo6', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo60', column='YesNo60', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo61', column='YesNo61', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo62', column='YesNo62', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo63', column='YesNo63', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo64', column='YesNo64', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo65', column='YesNo65', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo66', column='YesNo66', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo67', column='YesNo67', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo68', column='YesNo68', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo69', column='YesNo69', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo7', column='YesNo7', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo70', column='YesNo70', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo71', column='YesNo71', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo72', column='YesNo72', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo73', column='YesNo73', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo74', column='YesNo74', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo75', column='YesNo75', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo76', column='YesNo76', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo77', column='YesNo77', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo78', column='YesNo78', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo79', column='YesNo79', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo8', column='YesNo8', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo80', column='YesNo80', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo81', column='YesNo81', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo82', column='YesNo82', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo9', column='YesNo9', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='agent1', type='many-to-one',required=False, relatedModelName='Agent', column='Agent1ID'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='taxons', type='one-to-many',required=False, relatedModelName='Taxon', otherSideName='taxonAttribute')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.TaxonCitation',
        table='taxoncitation',
        tableId=75,
        idColumn='TaxonCitationID',
        idFieldName='taxonCitationId',
        idField=IdField(name='taxonCitationId', column='TaxonCitationID', type='java.lang.Integer'),
        fields=[
            Field(name='figureNumber', column='FigureNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='isFigured', column='IsFigured', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal', length=24),
            Field(name='pageNumber', column='PageNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='plateNumber', column='PlateNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='referenceWork', type='many-to-one',required=True, relatedModelName='ReferenceWork', column='ReferenceWorkID', otherSideName='taxonCitations'),
            Relationship(is_relationship=True, name='taxon', type='many-to-one',required=True, relatedModelName='Taxon', column='TaxonID', otherSideName='taxonCitations')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.TaxonTreeDef',
        table='taxontreedef',
        tableId=76,
        idColumn='TaxonTreeDefID',
        idFieldName='taxonTreeDefId',
        idField=IdField(name='taxonTreeDefId', column='TaxonTreeDefID', type='java.lang.Integer'),
        fields=[
            Field(name='fullNameDirection', column='FullNameDirection', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='discipline', type='one-to-one',required=False, relatedModelName='Discipline', otherSideName='taxonTreeDef'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='treeDefItems', type='one-to-many',required=False, relatedModelName='TaxonTreeDefItem', otherSideName='treeDef'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='Taxon', otherSideName='definition')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.TaxonTreeDefItem',
        table='taxontreedefitem',
        tableId=77,
        idColumn='TaxonTreeDefItemID',
        idFieldName='taxonTreeDefItemId',
        idField=IdField(name='taxonTreeDefItemId', column='TaxonTreeDefItemID', type='java.lang.Integer'),
        fields=[
            Field(name='formatToken', column='FormatToken', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='fullNameSeparator', column='FullNameSeparator', indexed=False, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='isEnforced', column='IsEnforced', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isInFullName', column='IsInFullName', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='name', column='Name', indexed=False, unique=False, required=True, type='java.lang.String', length=64),
            Field(name='rankId', column='RankID', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='textAfter', column='TextAfter', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='textBefore', column='TextBefore', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='title', column='Title', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='children', type='one-to-many',required=False, relatedModelName='TaxonTreeDefItem', otherSideName='parent'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='parent', type='many-to-one',required=False, relatedModelName='TaxonTreeDefItem', column='ParentItemID', otherSideName='children'),
            Relationship(is_relationship=True, name='treeDef', type='many-to-one',required=True, relatedModelName='TaxonTreeDef', column='TaxonTreeDefID', otherSideName='treeDefItems'),
            Relationship(is_relationship=True, name='treeEntries', type='one-to-many',required=False, relatedModelName='Taxon', otherSideName='definitionItem')
        ],
        fieldAliases=[

        ],
        view='TaxonTreeDefItem',
        searchDialog='TaxonTreeDefItemSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.TreatmentEvent',
        table='treatmentevent',
        tableId=122,
        idColumn='TreatmentEventID',
        idFieldName='treatmentEventId',
        idField=IdField(name='treatmentEventId', column='TreatmentEventID', type='java.lang.Integer'),
        fields=[
            Field(name='dateBoxed', column='DateBoxed', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateCleaned', column='DateCleaned', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateCompleted', column='DateCompleted', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateReceived', column='DateReceived', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateToIsolation', column='DateToIsolation', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateTreatmentEnded', column='DateTreatmentEnded', indexed=False, unique=False, required=False, type='java.util.Calendar'),
            Field(name='dateTreatmentStarted', column='DateTreatmentStarted', indexed=True, unique=False, required=False, type='java.util.Calendar'),
            Field(name='fieldNumber', column='FieldNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='location', column='Storage', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number4', column='Number4', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number5', column='Number5', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=2048),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text4', column='Text4', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text5', column='Text5', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='treatmentNumber', column='TreatmentNumber', indexed=True, unique=False, required=False, type='java.lang.String', length=32),
            Field(name='type', column='Type', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='TEDateReceivedIDX', column_names=['DateReceived']),
            Index(name='TEDateTreatmentStartedIDX', column_names=['DateTreatmentStarted']),
            Index(name='TEFieldNumberIDX', column_names=['FieldNumber']),
            Index(name='TETreatmentNumberIDX', column_names=['TreatmentNumber'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='accession', type='many-to-one',required=False, relatedModelName='Accession', column='AccessionID', otherSideName='treatmentEvents'),
            Relationship(is_relationship=True, name='authorizedBy', type='many-to-one',required=False, relatedModelName='Agent', column='AuthorizedByID'),
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=False, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='treatmentEvents'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='division', type='many-to-one',required=False, relatedModelName='Division', column='DivisionID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='performedBy', type='many-to-one',required=False, relatedModelName='Agent', column='PerformedByID'),
            Relationship(is_relationship=True, name='treatmentEventAttachments', type='one-to-many',required=False, relatedModelName='TreatmentEventAttachment', otherSideName='treatmentEvent')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.TreatmentEventAttachment',
        table='treatmenteventattachment',
        tableId=149,
        idColumn='TreatmentEventAttachmentID',
        idFieldName='treatmentEventAttachmentId',
        idField=IdField(name='treatmentEventAttachmentId', column='TreatmentEventAttachmentID', type='java.lang.Integer'),
        fields=[
            Field(name='ordinal', column='Ordinal', indexed=False, unique=False, required=True, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='attachment', type='many-to-one',required=True, relatedModelName='Attachment', column='AttachmentID', otherSideName='treatmentEventAttachments'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='treatmentEvent', type='many-to-one',required=True, relatedModelName='TreatmentEvent', column='TreatmentEventID', otherSideName='treatmentEventAttachments')
        ],
        fieldAliases=[

        ],
        view='ObjectAttachment',
        searchDialog='AttachmentSearch'
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.VoucherRelationship',
        table='voucherrelationship',
        tableId=155,
        idColumn='VoucherRelationshipID',
        idFieldName='voucherRelationshipId',
        idField=IdField(name='voucherRelationshipId', column='VoucherRelationshipID', type='java.lang.Integer'),
        fields=[
            Field(name='collectionCode', column='CollectionCode', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='collectionMemberId', column='CollectionMemberID', indexed=True, unique=False, required=True, type='java.lang.Integer'),
            Field(name='institutionCode', column='InstitutionCode', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='integer1', column='Integer1', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer2', column='Integer2', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='integer3', column='Integer3', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='number1', column='Number1', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number2', column='Number2', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='number3', column='Number3', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text1', column='Text1', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text2', column='Text2', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='text3', column='Text3', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='urlLink', column='UrlLink', indexed=False, unique=False, required=False, type='java.lang.String', length=1024),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='voucherNumber', column='VoucherNumber', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='yesNo1', column='YesNo1', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo2', column='YesNo2', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='yesNo3', column='YesNo3', indexed=False, unique=False, required=False, type='java.lang.Boolean')
        ],
        indexes=[
            Index(name='VRXDATColMemIDX', column_names=['CollectionMemberID'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='collectionObject', type='many-to-one',required=True, relatedModelName='CollectionObject', column='CollectionObjectID', otherSideName='voucherRelationships'),
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID')
        ],
        fieldAliases=[

        ],
        view='VoucherRelationship',
        searchDialog=None
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.Workbench',
        table='workbench',
        tableId=79,
        idColumn='WorkbenchID',
        idFieldName='workbenchId',
        idField=IdField(name='workbenchId', column='WorkbenchID', type='java.lang.Integer'),
        fields=[
            Field(name='allPermissionLevel', column='AllPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='dbTableId', column='TableID', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='exportInstitutionName', column='ExportInstitutionName', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='exportedFromTableName', column='ExportedFromTableName', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='formId', column='FormId', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='groupPermissionLevel', column='GroupPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='lockedByUserName', column='LockedByUserName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='name', column='Name', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='ownerPermissionLevel', column='OwnerPermissionLevel', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='srcFilePath', column='SrcFilePath', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[
            Index(name='WorkbenchNameIDX', column_names=['name'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='group', type='many-to-one',required=False, relatedModelName='SpPrincipal', column='SpPrincipalID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=True, relatedModelName='SpecifyUser', column='SpecifyUserID', otherSideName='workbenches'),
            Relationship(is_relationship=True, name='workbenchRows', type='one-to-many',required=False, relatedModelName='WorkbenchRow', otherSideName='workbench'),
            Relationship(is_relationship=True, name='workbenchTemplate', type='many-to-one',required=True, relatedModelName='WorkbenchTemplate', column='WorkbenchTemplateID', otherSideName='workbenches')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.WorkbenchDataItem',
        table='workbenchdataitem',
        tableId=80,
        idColumn='WorkbenchDataItemID',
        idFieldName='workbenchDataItemId',
        idField=IdField(name='workbenchDataItemId', column='WorkbenchDataItemID', type='java.lang.Integer'),
        fields=[
            Field(name='cellData', column='CellData', indexed=False, unique=False, required=False, type='text'),
            Field(name='rowNumber', column='RowNumber', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='validationStatus', column='ValidationStatus', indexed=False, unique=False, required=False, type='java.lang.Short')
        ],
        indexes=[
            Index(name='DataItemRowNumberIDX', column_names=['rowNumber'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='workbenchRow', type='many-to-one',required=True, relatedModelName='WorkbenchRow', column='WorkbenchRowID', otherSideName='workbenchDataItems'),
            Relationship(is_relationship=True, name='workbenchTemplateMappingItem', type='many-to-one',required=True, relatedModelName='WorkbenchTemplateMappingItem', column='WorkbenchTemplateMappingItemID', otherSideName='workbenchDataItems')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.WorkbenchRow',
        table='workbenchrow',
        tableId=90,
        idColumn='WorkbenchRowID',
        idFieldName='workbenchRowId',
        idField=IdField(name='workbenchRowId', column='WorkbenchRowID', type='java.lang.Integer'),
        fields=[
            Field(name='bioGeomancerResults', column='BioGeomancerResults', indexed=False, unique=False, required=False, type='text', length=8192),
            Field(name='cardImageData', column='CardImageData', indexed=False, unique=False, required=False, type='text', length=16000000),
            Field(name='cardImageFullPath', column='CardImageFullPath', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='errorEstimate', column='ErrorEstimate', indexed=False, unique=False, required=False, type='java.math.BigDecimal'),
            Field(name='errorPolygon', column='ErrorPolygon', indexed=False, unique=False, required=False, type='text', length=65535),
            Field(name='lat1Text', column='Lat1Text', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='lat2Text', column='Lat2Text', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='long1Text', column='Long1Text', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='long2Text', column='Long2Text', indexed=False, unique=False, required=False, type='java.lang.String', length=50),
            Field(name='recordId', column='RecordID', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='rowNumber', column='RowNumber', indexed=True, unique=False, required=False, type='java.lang.Short'),
            Field(name='sgrStatus', column='SGRStatus', indexed=False, unique=False, required=False, type='java.lang.Byte'),
            Field(name='uploadStatus', column='UploadStatus', indexed=False, unique=False, required=False, type='java.lang.Byte')
        ],
        indexes=[
            Index(name='RowNumberIDX', column_names=['RowNumber'])
        ],
        relationships=[
            Relationship(is_relationship=True, name='workbench', type='many-to-one',required=True, relatedModelName='Workbench', column='WorkbenchID', otherSideName='workbenchRows'),
            Relationship(is_relationship=True, name='workbenchDataItems', type='one-to-many',required=False, relatedModelName='WorkbenchDataItem', otherSideName='workbenchRow'),
            Relationship(is_relationship=True, name='workbenchRowExportedRelationships', type='one-to-many',required=False, relatedModelName='WorkbenchRowExportedRelationship', otherSideName='workbenchRow'),
            Relationship(is_relationship=True, name='workbenchRowImages', type='one-to-many',required=False, relatedModelName='WorkbenchRowImage', otherSideName='workbenchRow')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.WorkbenchRowExportedRelationship',
        table='workbenchrowexportedrelationship',
        tableId=126,
        idColumn='WorkbenchRowExportedRelationshipID',
        idFieldName='workbenchRowExportedRelationshipId',
        idField=IdField(name='workbenchRowExportedRelationshipId', column='WorkbenchRowExportedRelationshipID', type='java.lang.Integer'),
        fields=[
            Field(name='recordId', column='RecordID', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='relationshipName', column='RelationshipName', indexed=False, unique=False, required=False, type='java.lang.String', length=120),
            Field(name='sequence', column='Sequence', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='tableName', column='TableName', indexed=False, unique=False, required=False, type='java.lang.String', length=120),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='workbenchRow', type='many-to-one',required=True, relatedModelName='WorkbenchRow', column='WorkbenchRowID', otherSideName='workbenchRowExportedRelationships')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.WorkbenchRowImage',
        table='workbenchrowimage',
        tableId=95,
        idColumn='WorkbenchRowImageID',
        idFieldName='workbenchRowImageId',
        idField=IdField(name='workbenchRowImageId', column='WorkbenchRowImageID', type='java.lang.Integer'),
        fields=[
            Field(name='attachToTableName', column='AttachToTableName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='cardImageData', column='CardImageData', indexed=False, unique=False, required=False, type='text', length=16000000),
            Field(name='cardImageFullPath', column='CardImageFullPath', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='imageOrder', column='ImageOrder', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='workbenchRow', type='many-to-one',required=True, relatedModelName='WorkbenchRow', column='WorkbenchRowID', otherSideName='workbenchRowImages')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.WorkbenchTemplate',
        table='workbenchtemplate',
        tableId=81,
        idColumn='WorkbenchTemplateID',
        idFieldName='workbenchTemplateId',
        idField=IdField(name='workbenchTemplateId', column='WorkbenchTemplateID', type='java.lang.Integer'),
        fields=[
            Field(name='name', column='Name', indexed=False, unique=False, required=False, type='java.lang.String', length=256),
            Field(name='remarks', column='Remarks', indexed=False, unique=False, required=False, type='text', length=4096),
            Field(name='srcFilePath', column='SrcFilePath', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='specifyUser', type='many-to-one',required=True, relatedModelName='SpecifyUser', column='SpecifyUserID', otherSideName='workbenchTemplates'),
            Relationship(is_relationship=True, name='workbenchTemplateMappingItems', type='one-to-many',required=False, relatedModelName='WorkbenchTemplateMappingItem', otherSideName='workbenchTemplate'),
            Relationship(is_relationship=True, name='workbenches', type='one-to-many',required=False, relatedModelName='Workbench', otherSideName='workbenchTemplate')
        ],
        fieldAliases=[

        ]
    ),
    Table(
        classname='edu.ku.brc.specify.datamodel.WorkbenchTemplateMappingItem',
        table='workbenchtemplatemappingitem',
        tableId=82,
        idColumn='WorkbenchTemplateMappingItemID',
        idFieldName='workbenchTemplateMappingItemId',
        idField=IdField(name='workbenchTemplateMappingItemId', column='WorkbenchTemplateMappingItemID', type='java.lang.Integer'),
        fields=[
            Field(name='caption', column='Caption', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='carryForward', column='CarryForward', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='dataFieldLength', column='DataFieldLength', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='fieldName', column='FieldName', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='fieldType', column='FieldType', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='importedColName', column='ImportedColName', indexed=False, unique=False, required=False, type='java.lang.String', length=255),
            Field(name='isEditable', column='IsEditable', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isExportableToContent', column='IsExportableToContent', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isIncludedInTitle', column='IsIncludedInTitle', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='isRequired', column='IsRequired', indexed=False, unique=False, required=False, type='java.lang.Boolean'),
            Field(name='metaData', column='MetaData', indexed=False, unique=False, required=False, type='java.lang.String', length=128),
            Field(name='origImportColumnIndex', column='DataColumnIndex', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='srcTableId', column='TableId', indexed=False, unique=False, required=False, type='java.lang.Integer', length=64),
            Field(name='tableName', column='TableName', indexed=False, unique=False, required=False, type='java.lang.String', length=64),
            Field(name='timestampCreated', column='TimestampCreated', indexed=False, unique=False, required=True, type='java.sql.Timestamp'),
            Field(name='timestampModified', column='TimestampModified', indexed=False, unique=False, required=False, type='java.sql.Timestamp'),
            Field(name='version', column='Version', indexed=False, unique=False, required=False, type='java.lang.Integer'),
            Field(name='viewOrder', column='ViewOrder', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='xCoord', column='XCoord', indexed=False, unique=False, required=False, type='java.lang.Short'),
            Field(name='yCoord', column='YCoord', indexed=False, unique=False, required=False, type='java.lang.Short')
        ],
        indexes=[

        ],
        relationships=[
            Relationship(is_relationship=True, name='createdByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='CreatedByAgentID'),
            Relationship(is_relationship=True, name='modifiedByAgent', type='many-to-one',required=False, relatedModelName='Agent', column='ModifiedByAgentID'),
            Relationship(is_relationship=True, name='workbenchDataItems', type='one-to-many',required=False, relatedModelName='WorkbenchDataItem', otherSideName='workbenchTemplateMappingItem'),
            Relationship(is_relationship=True, name='workbenchTemplate', type='many-to-one',required=True, relatedModelName='WorkbenchTemplate', column='WorkbenchTemplateID', otherSideName='workbenchTemplateMappingItems')
        ],
        fieldAliases=[

        ]
    )
])

add_collectingevents_to_locality(datamodel)
flag_dependent_fields(datamodel)
flag_system_tables(datamodel)
