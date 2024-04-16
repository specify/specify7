from sqlalchemy import Column, ForeignKey, types, orm
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.mysql import BIT as mysql_bit_type

Base = declarative_base()

class Accession(Base):
    tableid = 7
    _id = 'accessionId'
    __tablename__ = 'accession'

    accessionId = Column('Accessionid', types.Integer, primary_key=True)
    accessionCondition = Column('AccessionCondition', types.String, index=False, unique=False, nullable=True)
    accessionNumber = Column('AccessionNumber', types.String, index=True, unique=False, nullable=False)
    dateAccessioned = Column('DateAccessioned', types.Date, index=True, unique=False, nullable=True)
    dateAcknowledged = Column('DateAcknowledged', types.Date, index=False, unique=False, nullable=True)
    dateReceived = Column('DateReceived', types.Date, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    status = Column('Status', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    totalValue = Column('TotalValue', types.Numeric, index=False, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    verbatimDate = Column('VerbatimDate', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    addressOfRecordID = Column('AddressOfRecordID', types.Integer, ForeignKey('AddressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    repositoryAgreementID = Column('RepositoryAgreementID', types.Integer, ForeignKey('RepositoryAgreement.RepositoryAgreementID'), nullable=True, unique=False)

    AddressOfRecord = orm.relationship('AddressOfRecord', foreign_keys='Accession.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('accessions', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Accession.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='Accession.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Accession.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    RepositoryAgreement = orm.relationship('RepositoryAgreement', foreign_keys='Accession.RepositoryAgreementID', remote_side='RepositoryAgreement.RepositoryAgreementID', backref=orm.backref('accessions', uselist=True))

class AccessionAgent(Base):
    tableid = 12
    _id = 'accessionAgentId'
    __tablename__ = 'accessionagent'

    accessionAgentId = Column('Accessionagentid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    role = Column('Role', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    accessionID = Column('AccessionID', types.Integer, ForeignKey('Accession.AccessionID'), nullable=True, unique=False)
    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    repositoryAgreementID = Column('RepositoryAgreementID', types.Integer, ForeignKey('RepositoryAgreement.RepositoryAgreementID'), nullable=True, unique=False)

    Accession = orm.relationship('Accession', foreign_keys='AccessionAgent.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('accessionAgents', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='AccessionAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AccessionAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AccessionAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    RepositoryAgreement = orm.relationship('RepositoryAgreement', foreign_keys='AccessionAgent.RepositoryAgreementID', remote_side='RepositoryAgreement.RepositoryAgreementID', backref=orm.backref('repositoryAgreementAgents', uselist=True))

class AccessionAttachment(Base):
    tableid = 108
    _id = 'accessionAttachmentId'
    __tablename__ = 'accessionattachment'

    accessionAttachmentId = Column('Accessionattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    accessionID = Column('AccessionID', types.Integer, ForeignKey('Accession.AccessionID'), nullable=False, unique=False)
    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Accession = orm.relationship('Accession', foreign_keys='AccessionAttachment.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('accessionAttachments', uselist=True))
    Attachment = orm.relationship('Attachment', foreign_keys='AccessionAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('accessionAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AccessionAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AccessionAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AccessionAuthorization(Base):
    tableid = 13
    _id = 'accessionAuthorizationId'
    __tablename__ = 'accessionauthorization'

    accessionAuthorizationId = Column('Accessionauthorizationid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    accessionID = Column('AccessionID', types.Integer, ForeignKey('Accession.AccessionID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    permitID = Column('PermitID', types.Integer, ForeignKey('Permit.PermitID'), nullable=False, unique=False)
    repositoryAgreementID = Column('RepositoryAgreementID', types.Integer, ForeignKey('RepositoryAgreement.RepositoryAgreementID'), nullable=True, unique=False)

    Accession = orm.relationship('Accession', foreign_keys='AccessionAuthorization.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('accessionAuthorizations', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AccessionAuthorization.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AccessionAuthorization.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Permit = orm.relationship('Permit', foreign_keys='AccessionAuthorization.PermitID', remote_side='Permit.PermitID', backref=orm.backref('accessionAuthorizations', uselist=True))
    RepositoryAgreement = orm.relationship('RepositoryAgreement', foreign_keys='AccessionAuthorization.RepositoryAgreementID', remote_side='RepositoryAgreement.RepositoryAgreementID', backref=orm.backref('repositoryAgreementAuthorizations', uselist=True))

class AccessionCitation(Base):
    tableid = 159
    _id = 'accessionCitationId'
    __tablename__ = 'accessioncitation'

    accessionCitationId = Column('Accessioncitationid', types.Integer, primary_key=True)
    figureNumber = Column('FigureNumber', types.String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', types.String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    accessionID = Column('AccessionID', types.Integer, ForeignKey('Accession.AccessionID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)

    Accession = orm.relationship('Accession', foreign_keys='AccessionCitation.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('accessionCitations', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AccessionCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AccessionCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='AccessionCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('None', uselist=True))

class Address(Base):
    tableid = 8
    _id = 'addressId'
    __tablename__ = 'address'

    addressId = Column('Addressid', types.Integer, primary_key=True)
    address = Column('Address', types.String, index=False, unique=False, nullable=True)
    address2 = Column('Address2', types.String, index=False, unique=False, nullable=True)
    address3 = Column('Address3', types.String, index=False, unique=False, nullable=True)
    address4 = Column('Address4', types.String, index=False, unique=False, nullable=True)
    address5 = Column('Address5', types.String, index=False, unique=False, nullable=True)
    city = Column('City', types.String, index=False, unique=False, nullable=True)
    country = Column('Country', types.String, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', types.Date, index=False, unique=False, nullable=True)
    fax = Column('Fax', types.String, index=False, unique=False, nullable=True)
    isCurrent = Column('IsCurrent', mysql_bit_type, index=False, unique=False, nullable=True)
    isPrimary = Column('IsPrimary', mysql_bit_type, index=False, unique=False, nullable=True)
    isShipping = Column('IsShipping', mysql_bit_type, index=False, unique=False, nullable=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=True)
    phone1 = Column('Phone1', types.String, index=False, unique=False, nullable=True)
    phone2 = Column('Phone2', types.String, index=False, unique=False, nullable=True)
    positionHeld = Column('PositionHeld', types.String, index=False, unique=False, nullable=True)
    postalCode = Column('PostalCode', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    roomOrBuilding = Column('RoomOrBuilding', types.String, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', types.Date, index=False, unique=False, nullable=True)
    state = Column('State', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    typeOfAddr = Column('TypeOfAddr', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='Address.AgentID', remote_side='Agent.AgentID', backref=orm.backref('addresses', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Address.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Address.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AddressOfRecord(Base):
    tableid = 125
    _id = 'addressOfRecordId'
    __tablename__ = 'addressofrecord'

    addressOfRecordId = Column('Addressofrecordid', types.Integer, primary_key=True)
    address = Column('Address', types.String, index=False, unique=False, nullable=True)
    address2 = Column('Address2', types.String, index=False, unique=False, nullable=True)
    city = Column('City', types.String, index=False, unique=False, nullable=True)
    country = Column('Country', types.String, index=False, unique=False, nullable=True)
    postalCode = Column('PostalCode', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    state = Column('State', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='AddressOfRecord.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AddressOfRecord.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AddressOfRecord.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Agent(Base):
    tableid = 5
    _id = 'agentId'
    __tablename__ = 'agent'

    agentId = Column('Agentid', types.Integer, primary_key=True)
    abbreviation = Column('Abbreviation', types.String, index=True, unique=False, nullable=True)
    agentType = Column('AgentType', types.Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', types.Integer, index=False, unique=False, nullable=True)
    dateOfBirth = Column('DateOfBirth', types.Date, index=False, unique=False, nullable=True)
    dateOfBirthPrecision = Column('DateOfBirthPrecision', types.Integer, index=False, unique=False, nullable=True)
    dateOfDeath = Column('DateOfDeath', types.Date, index=False, unique=False, nullable=True)
    dateOfDeathPrecision = Column('DateOfDeathPrecision', types.Integer, index=False, unique=False, nullable=True)
    dateType = Column('DateType', types.Integer, index=False, unique=False, nullable=True)
    email = Column('Email', types.String, index=False, unique=False, nullable=True)
    firstName = Column('FirstName', types.String, index=True, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    initials = Column('Initials', types.String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    interests = Column('Interests', types.String, index=False, unique=False, nullable=True)
    jobTitle = Column('JobTitle', types.String, index=False, unique=False, nullable=True)
    lastName = Column('LastName', types.String, index=True, unique=False, nullable=True)
    middleInitial = Column('MiddleInitial', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    suffix = Column('Suffix', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=False, unique=False, nullable=True)
    url = Column('URL', types.String, index=False, unique=False, nullable=True)
    verbatimDate1 = Column('VerbatimDate1', types.String, index=False, unique=False, nullable=True)
    verbatimDate2 = Column('VerbatimDate2', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collContentContactID = Column('CollectionCCID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    collTechContactID = Column('CollectionTCID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=True, unique=False)
    instContentContactID = Column('InstitutionCCID', types.Integer, ForeignKey('Institution.UserGroupScopeId'), nullable=True, unique=False)
    instTechContactID = Column('InstitutionTCID', types.Integer, ForeignKey('Institution.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    organizationID = Column('ParentOrganizationID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=True, unique=False)

    CollectionCC = orm.relationship('Collection', foreign_keys='Agent.CollectionCCID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('contentContacts', uselist=True))
    CollectionTC = orm.relationship('Collection', foreign_keys='Agent.CollectionTCID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('technicalContacts', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Agent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='Agent.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('members', uselist=True))
    InstitutionCC = orm.relationship('Institution', foreign_keys='Agent.InstitutionCCID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('contentContacts', uselist=True))
    InstitutionTC = orm.relationship('Institution', foreign_keys='Agent.InstitutionTCID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('technicalContacts', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Agent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ParentOrganization = orm.relationship('Agent', foreign_keys='Agent.ParentOrganizationID', remote_side='Agent.AgentID', backref=orm.backref('orgMembers', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='Agent.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('agents', uselist=True))

class AgentAttachment(Base):
    tableid = 109
    _id = 'agentAttachmentId'
    __tablename__ = 'agentattachment'

    agentAttachmentId = Column('Agentattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='AgentAttachment.AgentID', remote_side='Agent.AgentID', backref=orm.backref('agentAttachments', uselist=True))
    Attachment = orm.relationship('Attachment', foreign_keys='AgentAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('agentAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AgentAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AgentAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AgentGeography(Base):
    tableid = 78
    _id = 'agentGeographyId'
    __tablename__ = 'agentgeography'

    agentGeographyId = Column('Agentgeographyid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    role = Column('Role', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    geographyID = Column('GeographyID', types.Integer, ForeignKey('Geography.GeographyID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='AgentGeography.AgentID', remote_side='Agent.AgentID', backref=orm.backref('agentGeographies', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AgentGeography.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Geography = orm.relationship('Geography', foreign_keys='AgentGeography.GeographyID', remote_side='Geography.GeographyID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AgentGeography.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AgentIdentifier(Base):
    tableid = 168
    _id = 'agentIdentifierId'
    __tablename__ = 'agentidentifier'

    agentIdentifierId = Column('Agentidentifierid', types.Integer, primary_key=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', types.Integer, index=False, unique=False, nullable=True)
    identifier = Column('Identifier', types.String, index=False, unique=False, nullable=False)
    identifierType = Column('IdentifierType', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='AgentIdentifier.AgentID', remote_side='Agent.AgentID', backref=orm.backref('identifiers', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AgentIdentifier.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AgentIdentifier.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AgentSpecialty(Base):
    tableid = 86
    _id = 'agentSpecialtyId'
    __tablename__ = 'agentspecialty'

    agentSpecialtyId = Column('Agentspecialtyid', types.Integer, primary_key=True)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=False)
    specialtyName = Column('SpecialtyName', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='AgentSpecialty.AgentID', remote_side='Agent.AgentID', backref=orm.backref('agentSpecialties', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AgentSpecialty.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AgentSpecialty.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AgentVariant(Base):
    tableid = 107
    _id = 'agentVariantId'
    __tablename__ = 'agentvariant'

    agentVariantId = Column('Agentvariantid', types.Integer, primary_key=True)
    country = Column('Country', types.String, index=False, unique=False, nullable=True)
    language = Column('Language', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    varType = Column('VarType', types.Integer, index=False, unique=False, nullable=False)
    variant = Column('Variant', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='AgentVariant.AgentID', remote_side='Agent.AgentID', backref=orm.backref('variants', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AgentVariant.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AgentVariant.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Appraisal(Base):
    tableid = 67
    _id = 'appraisalId'
    __tablename__ = 'appraisal'

    appraisalId = Column('Appraisalid', types.Integer, primary_key=True)
    appraisalDate = Column('AppraisalDate', types.Date, index=True, unique=False, nullable=False)
    appraisalNumber = Column('AppraisalNumber', types.String, index=True, unique=True, nullable=False)
    appraisalValue = Column('AppraisalValue', types.Numeric, index=False, unique=False, nullable=True)
    monetaryUnitType = Column('MonetaryUnitType', types.String, index=False, unique=False, nullable=True)
    notes = Column('Notes', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    accessionID = Column('AccessionID', types.Integer, ForeignKey('Accession.AccessionID'), nullable=True, unique=False)
    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Accession = orm.relationship('Accession', foreign_keys='Appraisal.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('appraisals', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='Appraisal.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Appraisal.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Appraisal.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Attachment(Base):
    tableid = 41
    _id = 'attachmentId'
    __tablename__ = 'attachment'

    attachmentId = Column('Attachmentid', types.Integer, primary_key=True)
    attachmentLocation = Column('AttachmentLocation', types.String, index=False, unique=False, nullable=True)
    attachmentStorageConfig = Column('AttachmentStorageConfig', types.Text, index=False, unique=False, nullable=True)
    captureDevice = Column('CaptureDevice', types.String, index=False, unique=False, nullable=True)
    copyrightDate = Column('CopyrightDate', types.String, index=False, unique=False, nullable=True)
    copyrightHolder = Column('CopyrightHolder', types.String, index=False, unique=False, nullable=True)
    credit = Column('Credit', types.String, index=False, unique=False, nullable=True)
    dateImaged = Column('DateImaged', types.String, index=True, unique=False, nullable=True)
    fileCreatedDate = Column('FileCreatedDate', types.Date, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    isPublic = Column('IsPublic', mysql_bit_type, index=False, unique=False, nullable=False)
    license = Column('License', types.String, index=False, unique=False, nullable=True)
    licenseLogoUrl = Column('LicenseLogoUrl', types.String, index=False, unique=False, nullable=True)
    metadataText = Column('MetadataText', types.String, index=False, unique=False, nullable=True)
    mimeType = Column('MimeType', types.String, index=False, unique=False, nullable=True)
    origFilename = Column('OrigFilename', types.Text, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    scopeID = Column('ScopeID', types.Integer, index=True, unique=False, nullable=True)
    scopeType = Column('ScopeType', types.Integer, index=True, unique=False, nullable=True)
    subjectOrientation = Column('SubjectOrientation', types.String, index=False, unique=False, nullable=True)
    subtype = Column('Subtype', types.String, index=False, unique=False, nullable=True)
    tableID = Column('TableID', types.Integer, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=True, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', types.Integer, index=False, unique=False, nullable=True)

    attachmentImageAttributeID = Column('AttachmentImageAttributeID', types.Integer, ForeignKey('AttachmentImageAttribute.AttachmentImageAttributeID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    creatorID = Column('CreatorID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    visibilitySetByID = Column('VisibilitySetByID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=True, unique=False)

    AttachmentImageAttribute = orm.relationship('AttachmentImageAttribute', foreign_keys='Attachment.AttachmentImageAttributeID', remote_side='AttachmentImageAttribute.AttachmentImageAttributeID', backref=orm.backref('attachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Attachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Creator = orm.relationship('Agent', foreign_keys='Attachment.CreatorID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Attachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    VisibilitySetBy = orm.relationship('SpecifyUser', foreign_keys='Attachment.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class AttachmentImageAttribute(Base):
    tableid = 139
    _id = 'attachmentImageAttributeId'
    __tablename__ = 'attachmentimageattribute'

    attachmentImageAttributeId = Column('Attachmentimageattributeid', types.Integer, primary_key=True)
    creativeCommons = Column('CreativeCommons', types.String, index=False, unique=False, nullable=True)
    height = Column('Height', types.Integer, index=False, unique=False, nullable=True)
    imageType = Column('ImageType', types.String, index=False, unique=False, nullable=True)
    magnification = Column('Magnification', types.Float, index=False, unique=False, nullable=True)
    mbImageId = Column('MBImageID', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    resolution = Column('Resolution', types.Float, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampLastSend = Column('TimestampLastSend', types.DateTime, index=False, unique=False, nullable=True)
    timestampLastUpdateCheck = Column('TimestampLastUpdateCheck', types.DateTime, index=False, unique=False, nullable=True)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    viewDescription = Column('ViewDescription', types.String, index=False, unique=False, nullable=True)
    width = Column('Width', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    morphBankViewID = Column('MorphBankViewID', types.Integer, ForeignKey('MorphBankView.MorphBankViewID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='AttachmentImageAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AttachmentImageAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    MorphBankView = orm.relationship('MorphBankView', foreign_keys='AttachmentImageAttribute.MorphBankViewID', remote_side='MorphBankView.MorphBankViewID', backref=orm.backref('attachmentImageAttributes', uselist=True))

class AttachmentMetadata(Base):
    tableid = 42
    _id = 'attachmentMetadataID'
    __tablename__ = 'attachmentmetadata'

    attachmentMetadataID = Column('Attachmentmetadataid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    value = Column('Value', types.String, index=False, unique=False, nullable=False)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='AttachmentMetadata.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('metadata', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AttachmentMetadata.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AttachmentMetadata.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AttachmentTag(Base):
    tableid = 130
    _id = 'attachmentTagID'
    __tablename__ = 'attachmenttag'

    attachmentTagID = Column('Attachmenttagid', types.Integer, primary_key=True)
    tag = Column('Tag', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='AttachmentTag.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('tags', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='AttachmentTag.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AttachmentTag.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AttributeDef(Base):
    tableid = 16
    _id = 'attributeDefId'
    __tablename__ = 'attributedef'

    attributeDefId = Column('Attributedefid', types.Integer, primary_key=True)
    dataType = Column('DataType', types.Integer, index=False, unique=False, nullable=True)
    fieldName = Column('FieldName', types.String, index=False, unique=False, nullable=True)
    tableType = Column('TableType', types.Integer, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    prepTypeID = Column('PrepTypeID', types.Integer, ForeignKey('PrepType.PrepTypeID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='AttributeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='AttributeDef.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('attributeDefs', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AttributeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PrepType = orm.relationship('PrepType', foreign_keys='AttributeDef.PrepTypeID', remote_side='PrepType.PrepTypeID', backref=orm.backref('attributeDefs', uselist=True))

class Author(Base):
    tableid = 17
    _id = 'authorId'
    __tablename__ = 'author'

    authorId = Column('Authorid', types.Integer, primary_key=True)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='Author.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Author.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Author.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='Author.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('authors', uselist=True))

class AutoNumberingScheme(Base):
    tableid = 97
    _id = 'autoNumberingSchemeId'
    __tablename__ = 'autonumberingscheme'

    autoNumberingSchemeId = Column('Autonumberingschemeid', types.Integer, primary_key=True)
    formatName = Column('FormatName', types.String, index=False, unique=False, nullable=True)
    isNumericOnly = Column('IsNumericOnly', mysql_bit_type, index=False, unique=False, nullable=False)
    schemeClassName = Column('SchemeClassName', types.String, index=False, unique=False, nullable=True)
    schemeName = Column('SchemeName', types.String, index=True, unique=False, nullable=True)
    tableNumber = Column('TableNumber', types.Integer, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='AutoNumberingScheme.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='AutoNumberingScheme.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Borrow(Base):
    tableid = 18
    _id = 'borrowId'
    __tablename__ = 'borrow'

    borrowId = Column('Borrowid', types.Integer, primary_key=True)
    borrowDate = Column('BorrowDate', types.Date, index=False, unique=False, nullable=True)
    borrowDatePrecision = Column('BorrowDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    currentDueDate = Column('CurrentDueDate', types.Date, index=False, unique=False, nullable=True)
    dateClosed = Column('DateClosed', types.Date, index=False, unique=False, nullable=True)
    invoiceNumber = Column('InvoiceNumber', types.String, index=True, unique=False, nullable=False)
    isClosed = Column('IsClosed', mysql_bit_type, index=False, unique=False, nullable=True)
    isFinancialResponsibility = Column('IsFinancialResponsibility', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    numberOfItemsBorrowed = Column('NumberOfItemsBorrowed', types.Integer, index=False, unique=False, nullable=True)
    originalDueDate = Column('OriginalDueDate', types.Date, index=False, unique=False, nullable=True)
    receivedDate = Column('ReceivedDate', types.Date, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    status = Column('Status', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    addressOfRecordID = Column('AddressOfRecordID', types.Integer, ForeignKey('AddressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    AddressOfRecord = orm.relationship('AddressOfRecord', foreign_keys='Borrow.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Borrow.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Borrow.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class BorrowAgent(Base):
    tableid = 19
    _id = 'borrowAgentId'
    __tablename__ = 'borrowagent'

    borrowAgentId = Column('Borrowagentid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    role = Column('Role', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    borrowID = Column('BorrowID', types.Integer, ForeignKey('Borrow.BorrowID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='BorrowAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Borrow = orm.relationship('Borrow', foreign_keys='BorrowAgent.BorrowID', remote_side='Borrow.BorrowID', backref=orm.backref('borrowAgents', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='BorrowAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='BorrowAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class BorrowAttachment(Base):
    tableid = 145
    _id = 'borrowAttachmentId'
    __tablename__ = 'borrowattachment'

    borrowAttachmentId = Column('Borrowattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    borrowID = Column('BorrowID', types.Integer, ForeignKey('Borrow.BorrowID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='BorrowAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('borrowAttachments', uselist=True))
    Borrow = orm.relationship('Borrow', foreign_keys='BorrowAttachment.BorrowID', remote_side='Borrow.BorrowID', backref=orm.backref('borrowAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='BorrowAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='BorrowAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class BorrowMaterial(Base):
    tableid = 20
    _id = 'borrowMaterialId'
    __tablename__ = 'borrowmaterial'

    borrowMaterialId = Column('Borrowmaterialid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    description = Column('Description', types.String, index=True, unique=False, nullable=True)
    inComments = Column('InComments', types.Text, index=False, unique=False, nullable=True)
    materialNumber = Column('MaterialNumber', types.String, index=True, unique=False, nullable=False)
    outComments = Column('OutComments', types.Text, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', types.Integer, index=False, unique=False, nullable=True)
    quantityResolved = Column('QuantityResolved', types.Integer, index=False, unique=False, nullable=True)
    quantityReturned = Column('QuantityReturned', types.Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    borrowID = Column('BorrowID', types.Integer, ForeignKey('Borrow.BorrowID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Borrow = orm.relationship('Borrow', foreign_keys='BorrowMaterial.BorrowID', remote_side='Borrow.BorrowID', backref=orm.backref('borrowMaterials', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='BorrowMaterial.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='BorrowMaterial.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class BorrowReturnMaterial(Base):
    tableid = 21
    _id = 'borrowReturnMaterialId'
    __tablename__ = 'borrowreturnmaterial'

    borrowReturnMaterialId = Column('Borrowreturnmaterialid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    quantity = Column('Quantity', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    returnedDate = Column('ReturnedDate', types.Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('ReturnedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    borrowMaterialID = Column('BorrowMaterialID', types.Integer, ForeignKey('BorrowMaterial.BorrowMaterialID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    ReturnedBy = orm.relationship('Agent', foreign_keys='BorrowReturnMaterial.ReturnedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    BorrowMaterial = orm.relationship('BorrowMaterial', foreign_keys='BorrowReturnMaterial.BorrowMaterialID', remote_side='BorrowMaterial.BorrowMaterialID', backref=orm.backref('borrowReturnMaterials', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='BorrowReturnMaterial.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='BorrowReturnMaterial.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingEvent(Base):
    tableid = 10
    _id = 'collectingEventId'
    __tablename__ = 'collectingevent'

    collectingEventId = Column('Collectingeventid', types.Integer, primary_key=True)
    endDate = Column('EndDate', types.Date, index=True, unique=False, nullable=True)
    endDatePrecision = Column('EndDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    endDateVerbatim = Column('EndDateVerbatim', types.String, index=False, unique=False, nullable=True)
    endTime = Column('EndTime', types.Integer, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    method = Column('Method', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', types.Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', types.Integer, index=False, unique=False, nullable=True)
    reservedText1 = Column('ReservedText1', types.String, index=False, unique=False, nullable=True)
    reservedText2 = Column('ReservedText2', types.String, index=False, unique=False, nullable=True)
    sgrStatus = Column('SGRStatus', types.Integer, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', types.Date, index=True, unique=False, nullable=True)
    startDatePrecision = Column('StartDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    startDateVerbatim = Column('StartDateVerbatim', types.String, index=False, unique=False, nullable=True)
    startTime = Column('StartTime', types.Integer, index=False, unique=False, nullable=True)
    stationFieldNumber = Column('StationFieldNumber', types.String, index=True, unique=False, nullable=True)
    stationFieldNumberModifier1 = Column('StationFieldNumberModifier1', types.String, index=False, unique=False, nullable=True)
    stationFieldNumberModifier2 = Column('StationFieldNumberModifier2', types.String, index=False, unique=False, nullable=True)
    stationFieldNumberModifier3 = Column('StationFieldNumberModifier3', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    uniqueIdentifier = Column('UniqueIdentifier', types.String, index=True, unique=False, nullable=True)
    verbatimDate = Column('VerbatimDate', types.String, index=False, unique=False, nullable=True)
    verbatimLocality = Column('VerbatimLocality', types.Text, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', types.Integer, index=False, unique=False, nullable=True)

    collectingEventAttributeID = Column('CollectingEventAttributeID', types.Integer, ForeignKey('CollectingEventAttribute.CollectingEventAttributeID'), nullable=True, unique=False)
    collectingTripID = Column('CollectingTripID', types.Integer, ForeignKey('CollectingTrip.CollectingTripID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    localityID = Column('LocalityID', types.Integer, ForeignKey('Locality.LocalityID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    paleoContextID = Column('PaleoContextID', types.Integer, ForeignKey('PaleoContext.PaleoContextID'), nullable=True, unique=False)
    visibilitySetByID = Column('VisibilitySetByID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=True, unique=False)

    CollectingEventAttribute = orm.relationship('CollectingEventAttribute', foreign_keys='CollectingEvent.CollectingEventAttributeID', remote_side='CollectingEventAttribute.CollectingEventAttributeID', backref=orm.backref('collectingEvents', uselist=True))
    CollectingTrip = orm.relationship('CollectingTrip', foreign_keys='CollectingEvent.CollectingTripID', remote_side='CollectingTrip.CollectingTripID', backref=orm.backref('collectingEvents', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingEvent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='CollectingEvent.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Locality = orm.relationship('Locality', foreign_keys='CollectingEvent.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('collectingEvents', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingEvent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PaleoContext = orm.relationship('PaleoContext', foreign_keys='CollectingEvent.PaleoContextID', remote_side='PaleoContext.PaleoContextID', backref=orm.backref('collectingEvents', uselist=True))
    VisibilitySetBy = orm.relationship('SpecifyUser', foreign_keys='CollectingEvent.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class CollectingEventAttachment(Base):
    tableid = 110
    _id = 'collectingEventAttachmentId'
    __tablename__ = 'collectingeventattachment'

    collectingEventAttachmentId = Column('Collectingeventattachmentid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    collectingEventID = Column('CollectingEventID', types.Integer, ForeignKey('CollectingEvent.CollectingEventID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='CollectingEventAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('collectingEventAttachments', uselist=True))
    CollectingEvent = orm.relationship('CollectingEvent', foreign_keys='CollectingEventAttachment.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectingEventAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingEventAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingEventAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingEventAttr(Base):
    tableid = 25
    _id = 'attrId'
    __tablename__ = 'collectingeventattr'

    attrId = Column('Attrid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    dblValue = Column('DoubleValue', types.Float, index=False, unique=False, nullable=True)
    strValue = Column('StrValue', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectingEventID = Column('CollectingEventID', types.Integer, ForeignKey('CollectingEvent.CollectingEventID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    definitionID = Column('AttributeDefID', types.Integer, ForeignKey('AttributeDef.AttributeDefID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CollectingEvent = orm.relationship('CollectingEvent', foreign_keys='CollectingEventAttr.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectingEventAttrs', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingEventAttr.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    AttributeDef = orm.relationship('AttributeDef', foreign_keys='CollectingEventAttr.AttributeDefID', remote_side='AttributeDef.AttributeDefID', backref=orm.backref('collectingEventAttrs', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingEventAttr.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingEventAttribute(Base):
    tableid = 92
    _id = 'collectingEventAttributeId'
    __tablename__ = 'collectingeventattribute'

    collectingEventAttributeId = Column('Collectingeventattributeid', types.Integer, primary_key=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', types.Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', types.Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', types.Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', types.Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', types.Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', types.Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', types.Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', types.Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', types.Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.Text, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.Text, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.Text, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.Text, index=False, unique=False, nullable=True)
    text14 = Column('Text14', types.Text, index=False, unique=False, nullable=True)
    text15 = Column('Text15', types.Text, index=False, unique=False, nullable=True)
    text16 = Column('Text16', types.Text, index=False, unique=False, nullable=True)
    text17 = Column('Text17', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.Text, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    hostTaxonID = Column('HostTaxonID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingEventAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='CollectingEventAttribute.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    HostTaxon = orm.relationship('Taxon', foreign_keys='CollectingEventAttribute.HostTaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('collectingEventAttributes', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingEventAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingEventAuthorization(Base):
    tableid = 152
    _id = 'collectingEventAuthorizationId'
    __tablename__ = 'collectingeventauthorization'

    collectingEventAuthorizationId = Column('Collectingeventauthorizationid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectingEventID = Column('CollectingEventID', types.Integer, ForeignKey('CollectingEvent.CollectingEventID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    permitID = Column('PermitID', types.Integer, ForeignKey('Permit.PermitID'), nullable=False, unique=False)

    CollectingEvent = orm.relationship('CollectingEvent', foreign_keys='CollectingEventAuthorization.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectingEventAuthorizations', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingEventAuthorization.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingEventAuthorization.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Permit = orm.relationship('Permit', foreign_keys='CollectingEventAuthorization.PermitID', remote_side='Permit.PermitID', backref=orm.backref('collectingEventAuthorizations', uselist=True))

class CollectingTrip(Base):
    tableid = 87
    _id = 'collectingTripId'
    __tablename__ = 'collectingtrip'

    collectingTripId = Column('Collectingtripid', types.Integer, primary_key=True)
    collectingTripName = Column('CollectingTripName', types.String, index=True, unique=False, nullable=True)
    cruise = Column('Cruise', types.String, index=False, unique=False, nullable=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', types.Integer, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', types.Date, index=False, unique=False, nullable=True)
    endDatePrecision = Column('EndDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    endDateVerbatim = Column('EndDateVerbatim', types.String, index=False, unique=False, nullable=True)
    endTime = Column('EndTime', types.Integer, index=False, unique=False, nullable=True)
    expedition = Column('Expedition', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    sponsor = Column('Sponsor', types.String, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', types.Date, index=True, unique=False, nullable=True)
    startDatePrecision = Column('StartDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    startDateVerbatim = Column('StartDateVerbatim', types.String, index=False, unique=False, nullable=True)
    startTime = Column('StartTime', types.Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.Text, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    vessel = Column('Vessel', types.String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    agent1ID = Column('Agent1ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent2ID = Column('Agent2ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    collectingTripAttributeID = Column('CollectingTripAttributeID', types.Integer, ForeignKey('CollectingTripAttribute.CollectingTripAttributeID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent1 = orm.relationship('Agent', foreign_keys='CollectingTrip.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent2 = orm.relationship('Agent', foreign_keys='CollectingTrip.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CollectingTripAttribute = orm.relationship('CollectingTripAttribute', foreign_keys='CollectingTrip.CollectingTripAttributeID', remote_side='CollectingTripAttribute.CollectingTripAttributeID', backref=orm.backref('collectingTrips', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingTrip.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='CollectingTrip.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingTrip.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingTripAttachment(Base):
    tableid = 156
    _id = 'collectingTripAttachmentId'
    __tablename__ = 'collectingtripattachment'

    collectingTripAttachmentId = Column('Collectingtripattachmentid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    collectingTripID = Column('CollectingTripID', types.Integer, ForeignKey('CollectingTrip.CollectingTripID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='CollectingTripAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('collectingTripAttachments', uselist=True))
    CollectingTrip = orm.relationship('CollectingTrip', foreign_keys='CollectingTripAttachment.CollectingTripID', remote_side='CollectingTrip.CollectingTripID', backref=orm.backref('collectingTripAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingTripAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingTripAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingTripAttribute(Base):
    tableid = 157
    _id = 'collectingTripAttributeId'
    __tablename__ = 'collectingtripattribute'

    collectingTripAttributeId = Column('Collectingtripattributeid', types.Integer, primary_key=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', types.Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', types.Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', types.Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', types.Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', types.Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', types.Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', types.Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', types.Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', types.Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', types.String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', types.String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', types.String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingTripAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='CollectingTripAttribute.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingTripAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingTripAuthorization(Base):
    tableid = 158
    _id = 'collectingTripAuthorizationId'
    __tablename__ = 'collectingtripauthorization'

    collectingTripAuthorizationId = Column('Collectingtripauthorizationid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectingTripID = Column('CollectingTripID', types.Integer, ForeignKey('CollectingTrip.CollectingTripID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    permitID = Column('PermitID', types.Integer, ForeignKey('Permit.PermitID'), nullable=False, unique=False)

    CollectingTrip = orm.relationship('CollectingTrip', foreign_keys='CollectingTripAuthorization.CollectingTripID', remote_side='CollectingTrip.CollectingTripID', backref=orm.backref('collectingTripAuthorizations', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectingTripAuthorization.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectingTripAuthorization.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Permit = orm.relationship('Permit', foreign_keys='CollectingTripAuthorization.PermitID', remote_side='Permit.PermitID', backref=orm.backref('collectingTripAuthorizations', uselist=True))

class Collection(Base):
    tableid = 23
    _id = 'userGroupScopeId'
    __tablename__ = 'collection'

    userGroupScopeId = Column('Usergroupscopeid', types.Integer, primary_key=True)
    catalogNumFormatName = Column('CatalogFormatNumName', types.String, index=False, unique=False, nullable=False)
    code = Column('Code', types.String, index=False, unique=False, nullable=True)
    collectionName = Column('CollectionName', types.String, index=True, unique=False, nullable=True)
    collectionType = Column('CollectionType', types.String, index=False, unique=False, nullable=True)
    dbContentVersion = Column('DbContentVersion', types.String, index=False, unique=False, nullable=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    developmentStatus = Column('DevelopmentStatus', types.String, index=False, unique=False, nullable=True)
    estimatedSize = Column('EstimatedSize', types.Integer, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    institutionType = Column('InstitutionType', types.String, index=False, unique=False, nullable=True)
    isEmbeddedCollectingEvent = Column('IsEmbeddedCollectingEvent', mysql_bit_type, index=False, unique=False, nullable=False)
    isaNumber = Column('IsaNumber', types.String, index=False, unique=False, nullable=True)
    kingdomCoverage = Column('KingdomCoverage', types.String, index=False, unique=False, nullable=True)
    preservationMethodType = Column('PreservationMethodType', types.String, index=False, unique=False, nullable=True)
    primaryFocus = Column('PrimaryFocus', types.String, index=False, unique=False, nullable=True)
    primaryPurpose = Column('PrimaryPurpose', types.String, index=False, unique=False, nullable=True)
    regNumber = Column('RegNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    scope = Column('Scope', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    webPortalURI = Column('WebPortalURI', types.String, index=False, unique=False, nullable=True)
    webSiteURI = Column('WebSiteURI', types.String, index=False, unique=False, nullable=True)

    adminContactID = Column('AdminContactID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    institutionNetworkID = Column('InstitutionNetworkID', types.Integer, ForeignKey('Institution.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    AdminContact = orm.relationship('Agent', foreign_keys='Collection.AdminContactID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Collection.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='Collection.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('collections', uselist=True))
    InstitutionNetwork = orm.relationship('Institution', foreign_keys='Collection.InstitutionNetworkID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Collection.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionObject(Base):
    tableid = 1
    _id = 'collectionObjectId'
    __tablename__ = 'collectionobject'

    collectionObjectId = Column('Collectionobjectid', types.Integer, primary_key=True)
    altCatalogNumber = Column('AltCatalogNumber', types.String, index=True, unique=False, nullable=True)
    availability = Column('Availability', types.String, index=False, unique=False, nullable=True)
    catalogNumber = Column('CatalogNumber', types.String, index=True, unique=False, nullable=True)
    catalogedDate = Column('CatalogedDate', types.Date, index=True, unique=False, nullable=True)
    catalogedDatePrecision = Column('CatalogedDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    catalogedDateVerbatim = Column('CatalogedDateVerbatim', types.String, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=False, unique=False, nullable=False)
    countAmt = Column('CountAmt', types.Integer, index=False, unique=False, nullable=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    deaccessioned = Column('Deaccessioned', mysql_bit_type, index=False, unique=False, nullable=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    embargoReason = Column('EmbargoReason', types.Text, index=False, unique=False, nullable=True)
    embargoReleaseDate = Column('EmbargoReleaseDate', types.Date, index=False, unique=False, nullable=True)
    embargoReleaseDatePrecision = Column('EmbargoReleaseDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    embargoStartDate = Column('EmbargoStartDate', types.Date, index=False, unique=False, nullable=True)
    embargoStartDatePrecision = Column('EmbargoStartDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    fieldNumber = Column('FieldNumber', types.String, index=True, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    inventoryDate = Column('InventoryDate', types.Date, index=False, unique=False, nullable=True)
    inventoryDatePrecision = Column('InventoryDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    modifier = Column('Modifier', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=True)
    notifications = Column('Notifications', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    numberOfDuplicates = Column('NumberOfDuplicates', types.Integer, index=False, unique=False, nullable=True)
    objectCondition = Column('ObjectCondition', types.String, index=False, unique=False, nullable=True)
    ocr = Column('OCR', types.Text, index=False, unique=False, nullable=True)
    projectNumber = Column('ProjectNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', types.Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', types.Integer, index=False, unique=False, nullable=True)
    reservedText = Column('ReservedText', types.String, index=False, unique=False, nullable=True)
    reservedText2 = Column('ReservedText2', types.String, index=False, unique=False, nullable=True)
    reservedText3 = Column('ReservedText3', types.String, index=False, unique=False, nullable=True)
    restrictions = Column('Restrictions', types.String, index=False, unique=False, nullable=True)
    sgrStatus = Column('SGRStatus', types.Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    totalValue = Column('TotalValue', types.Numeric, index=False, unique=False, nullable=True)
    uniqueIdentifier = Column('UniqueIdentifier', types.String, index=True, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo6 = Column('YesNo6', mysql_bit_type, index=False, unique=False, nullable=True)

    accessionID = Column('AccessionID', types.Integer, ForeignKey('Accession.AccessionID'), nullable=True, unique=False)
    agent1ID = Column('Agent1ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    appraisalID = Column('AppraisalID', types.Integer, ForeignKey('Appraisal.AppraisalID'), nullable=True, unique=False)
    catalogerID = Column('CatalogerID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    collectingEventID = Column('CollectingEventID', types.Integer, ForeignKey('CollectingEvent.CollectingEventID'), nullable=True, unique=False)
    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=False, unique=False)
    collectionObjectAttributeID = Column('CollectionObjectAttributeID', types.Integer, ForeignKey('CollectionObjectAttribute.CollectionObjectAttributeID'), nullable=True, unique=False)
    containerID = Column('ContainerID', types.Integer, ForeignKey('Container.ContainerID'), nullable=True, unique=False)
    containerOwnerID = Column('ContainerOwnerID', types.Integer, ForeignKey('Container.ContainerID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    embargoAuthorityID = Column('EmbargoAuthorityID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    fieldNotebookPageID = Column('FieldNotebookPageID', types.Integer, ForeignKey('FieldNotebookPage.FieldNotebookPageID'), nullable=True, unique=False)
    inventorizedByID = Column('InventorizedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    paleoContextID = Column('PaleoContextID', types.Integer, ForeignKey('PaleoContext.PaleoContextID'), nullable=True, unique=False)
    visibilitySetByID = Column('VisibilitySetByID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=True, unique=False)

    Accession = orm.relationship('Accession', foreign_keys='CollectionObject.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('collectionObjects', uselist=True))
    Agent1 = orm.relationship('Agent', foreign_keys='CollectionObject.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Appraisal = orm.relationship('Appraisal', foreign_keys='CollectionObject.AppraisalID', remote_side='Appraisal.AppraisalID', backref=orm.backref('collectionObjects', uselist=True))
    Cataloger = orm.relationship('Agent', foreign_keys='CollectionObject.CatalogerID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CollectingEvent = orm.relationship('CollectingEvent', foreign_keys='CollectionObject.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectionObjects', uselist=True))
    Collection = orm.relationship('Collection', foreign_keys='CollectionObject.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    CollectionObjectAttribute = orm.relationship('CollectionObjectAttribute', foreign_keys='CollectionObject.CollectionObjectAttributeID', remote_side='CollectionObjectAttribute.CollectionObjectAttributeID', backref=orm.backref('collectionObjects', uselist=True))
    Container = orm.relationship('Container', foreign_keys='CollectionObject.ContainerID', remote_side='Container.ContainerID', backref=orm.backref('collectionObjects', uselist=True))
    ContainerOwner = orm.relationship('Container', foreign_keys='CollectionObject.ContainerOwnerID', remote_side='Container.ContainerID', backref=orm.backref('collectionObjectKids', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectionObject.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    EmbargoAuthority = orm.relationship('Agent', foreign_keys='CollectionObject.EmbargoAuthorityID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    FieldNotebookPage = orm.relationship('FieldNotebookPage', foreign_keys='CollectionObject.FieldNotebookPageID', remote_side='FieldNotebookPage.FieldNotebookPageID', backref=orm.backref('collectionObjects', uselist=True))
    InventorizedBy = orm.relationship('Agent', foreign_keys='CollectionObject.InventorizedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectionObject.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PaleoContext = orm.relationship('PaleoContext', foreign_keys='CollectionObject.PaleoContextID', remote_side='PaleoContext.PaleoContextID', backref=orm.backref('collectionObjects', uselist=True))
    VisibilitySetBy = orm.relationship('SpecifyUser', foreign_keys='CollectionObject.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class CollectionObjectAttachment(Base):
    tableid = 111
    _id = 'collectionObjectAttachmentId'
    __tablename__ = 'collectionobjectattachment'

    collectionObjectAttachmentId = Column('Collectionobjectattachmentid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='CollectionObjectAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('collectionObjectAttachments', uselist=True))
    CollectionObject = orm.relationship('CollectionObject', foreign_keys='CollectionObjectAttachment.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('collectionObjectAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionObjectAttr(Base):
    tableid = 28
    _id = 'attrId'
    __tablename__ = 'collectionobjectattr'

    attrId = Column('Attrid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    dblValue = Column('DoubleValue', types.Float, index=False, unique=False, nullable=True)
    strValue = Column('StrValue', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    definitionID = Column('AttributeDefID', types.Integer, ForeignKey('AttributeDef.AttributeDefID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CollectionObject = orm.relationship('CollectionObject', foreign_keys='CollectionObjectAttr.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('collectionObjectAttrs', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectAttr.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    AttributeDef = orm.relationship('AttributeDef', foreign_keys='CollectionObjectAttr.AttributeDefID', remote_side='AttributeDef.AttributeDefID', backref=orm.backref('collectionObjectAttrs', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectAttr.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionObjectAttribute(Base):
    tableid = 93
    _id = 'collectionObjectAttributeId'
    __tablename__ = 'collectionobjectattribute'

    collectionObjectAttributeId = Column('Collectionobjectattributeid', types.Integer, primary_key=True)
    bottomDistance = Column('BottomDistance', types.Numeric, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    direction = Column('Direction', types.String, index=False, unique=False, nullable=True)
    distanceUnits = Column('DistanceUnits', types.String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', types.Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', types.Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', types.Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', types.Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', types.Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', types.Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', types.Numeric, index=False, unique=False, nullable=True)
    number14 = Column('Number14', types.Numeric, index=False, unique=False, nullable=True)
    number15 = Column('Number15', types.Numeric, index=False, unique=False, nullable=True)
    number16 = Column('Number16', types.Numeric, index=False, unique=False, nullable=True)
    number17 = Column('Number17', types.Numeric, index=False, unique=False, nullable=True)
    number18 = Column('Number18', types.Numeric, index=False, unique=False, nullable=True)
    number19 = Column('Number19', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number20 = Column('Number20', types.Numeric, index=False, unique=False, nullable=True)
    number21 = Column('Number21', types.Numeric, index=False, unique=False, nullable=True)
    number22 = Column('Number22', types.Numeric, index=False, unique=False, nullable=True)
    number23 = Column('Number23', types.Numeric, index=False, unique=False, nullable=True)
    number24 = Column('Number24', types.Numeric, index=False, unique=False, nullable=True)
    number25 = Column('Number25', types.Numeric, index=False, unique=False, nullable=True)
    number26 = Column('Number26', types.Numeric, index=False, unique=False, nullable=True)
    number27 = Column('Number27', types.Numeric, index=False, unique=False, nullable=True)
    number28 = Column('Number28', types.Numeric, index=False, unique=False, nullable=True)
    number29 = Column('Number29', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number30 = Column('Number30', types.Integer, index=False, unique=False, nullable=True)
    number31 = Column('Number31', types.Numeric, index=False, unique=False, nullable=True)
    number32 = Column('Number32', types.Numeric, index=False, unique=False, nullable=True)
    number33 = Column('Number33', types.Numeric, index=False, unique=False, nullable=True)
    number34 = Column('Number34', types.Numeric, index=False, unique=False, nullable=True)
    number35 = Column('Number35', types.Numeric, index=False, unique=False, nullable=True)
    number36 = Column('Number36', types.Numeric, index=False, unique=False, nullable=True)
    number37 = Column('Number37', types.Numeric, index=False, unique=False, nullable=True)
    number38 = Column('Number38', types.Numeric, index=False, unique=False, nullable=True)
    number39 = Column('Number39', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number40 = Column('Number40', types.Numeric, index=False, unique=False, nullable=True)
    number41 = Column('Number41', types.Numeric, index=False, unique=False, nullable=True)
    number42 = Column('Number42', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', types.Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', types.Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', types.Integer, index=False, unique=False, nullable=True)
    number9 = Column('Number9', types.Numeric, index=False, unique=False, nullable=True)
    positionState = Column('PositionState', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', types.String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', types.String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', types.Text, index=False, unique=False, nullable=True)
    text17 = Column('Text17', types.Text, index=False, unique=False, nullable=True)
    text18 = Column('Text18', types.Text, index=False, unique=False, nullable=True)
    text19 = Column('Text19', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text20 = Column('Text20', types.Text, index=False, unique=False, nullable=True)
    text21 = Column('Text21', types.Text, index=False, unique=False, nullable=True)
    text22 = Column('Text22', types.Text, index=False, unique=False, nullable=True)
    text23 = Column('Text23', types.Text, index=False, unique=False, nullable=True)
    text24 = Column('Text24', types.Text, index=False, unique=False, nullable=True)
    text25 = Column('Text25', types.Text, index=False, unique=False, nullable=True)
    text26 = Column('Text26', types.Text, index=False, unique=False, nullable=True)
    text27 = Column('Text27', types.Text, index=False, unique=False, nullable=True)
    text28 = Column('Text28', types.Text, index=False, unique=False, nullable=True)
    text29 = Column('Text29', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text30 = Column('Text30', types.Text, index=False, unique=False, nullable=True)
    text31 = Column('Text31', types.Text, index=False, unique=False, nullable=True)
    text32 = Column('Text32', types.Text, index=False, unique=False, nullable=True)
    text33 = Column('Text33', types.Text, index=False, unique=False, nullable=True)
    text34 = Column('Text34', types.Text, index=False, unique=False, nullable=True)
    text35 = Column('Text35', types.Text, index=False, unique=False, nullable=True)
    text36 = Column('Text36', types.Text, index=False, unique=False, nullable=True)
    text37 = Column('Text37', types.Text, index=False, unique=False, nullable=True)
    text38 = Column('Text38', types.Text, index=False, unique=False, nullable=True)
    text39 = Column('Text39', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text40 = Column('Text40', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    topDistance = Column('TopDistance', types.Numeric, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo10 = Column('YesNo10', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo11 = Column('YesNo11', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo12 = Column('YesNo12', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo13 = Column('YesNo13', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo14 = Column('YesNo14', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo15 = Column('YesNo15', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo16 = Column('YesNo16', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo17 = Column('YesNo17', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo18 = Column('YesNo18', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo19 = Column('YesNo19', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo20 = Column('YesNo20', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo6 = Column('YesNo6', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo7 = Column('YesNo7', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo8 = Column('YesNo8', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo9 = Column('YesNo9', mysql_bit_type, index=False, unique=False, nullable=True)

    agent1ID = Column('Agent1ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent1 = orm.relationship('Agent', foreign_keys='CollectionObjectAttribute.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionObjectCitation(Base):
    tableid = 29
    _id = 'collectionObjectCitationId'
    __tablename__ = 'collectionobjectcitation'

    collectionObjectCitationId = Column('Collectionobjectcitationid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    figureNumber = Column('FigureNumber', types.String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', types.String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)

    CollectionObject = orm.relationship('CollectionObject', foreign_keys='CollectionObjectCitation.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('collectionObjectCitations', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='CollectionObjectCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('collectionObjectCitations', uselist=True))

class CollectionObjectProperty(Base):
    tableid = 153
    _id = 'collectionObjectPropertyId'
    __tablename__ = 'collectionobjectproperty'

    collectionObjectPropertyId = Column('Collectionobjectpropertyid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date10 = Column('Date10', types.Date, index=False, unique=False, nullable=True)
    date11 = Column('Date11', types.Date, index=False, unique=False, nullable=True)
    date12 = Column('Date12', types.Date, index=False, unique=False, nullable=True)
    date13 = Column('Date13', types.Date, index=False, unique=False, nullable=True)
    date14 = Column('Date14', types.Date, index=False, unique=False, nullable=True)
    date15 = Column('Date15', types.Date, index=False, unique=False, nullable=True)
    date16 = Column('Date16', types.Date, index=False, unique=False, nullable=True)
    date17 = Column('Date17', types.Date, index=False, unique=False, nullable=True)
    date18 = Column('Date18', types.Date, index=False, unique=False, nullable=True)
    date19 = Column('Date19', types.Date, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    date20 = Column('Date20', types.Date, index=False, unique=False, nullable=True)
    date3 = Column('Date3', types.Date, index=False, unique=False, nullable=True)
    date4 = Column('Date4', types.Date, index=False, unique=False, nullable=True)
    date5 = Column('Date5', types.Date, index=False, unique=False, nullable=True)
    date6 = Column('Date6', types.Date, index=False, unique=False, nullable=True)
    date7 = Column('Date7', types.Date, index=False, unique=False, nullable=True)
    date8 = Column('Date8', types.Date, index=False, unique=False, nullable=True)
    date9 = Column('Date9', types.Date, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', types.Integer, index=False, unique=False, nullable=True)
    integer11 = Column('Integer11', types.Integer, index=False, unique=False, nullable=True)
    integer12 = Column('Integer12', types.Integer, index=False, unique=False, nullable=True)
    integer13 = Column('Integer13', types.Integer, index=False, unique=False, nullable=True)
    integer14 = Column('Integer14', types.Integer, index=False, unique=False, nullable=True)
    integer15 = Column('Integer15', types.Integer, index=False, unique=False, nullable=True)
    integer16 = Column('Integer16', types.Integer, index=False, unique=False, nullable=True)
    integer17 = Column('Integer17', types.Integer, index=False, unique=False, nullable=True)
    integer18 = Column('Integer18', types.Integer, index=False, unique=False, nullable=True)
    integer19 = Column('Integer19', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer20 = Column('Integer20', types.Integer, index=False, unique=False, nullable=True)
    integer21 = Column('Integer21', types.Integer, index=False, unique=False, nullable=True)
    integer22 = Column('Integer22', types.Integer, index=False, unique=False, nullable=True)
    integer23 = Column('Integer23', types.Integer, index=False, unique=False, nullable=True)
    integer24 = Column('Integer24', types.Integer, index=False, unique=False, nullable=True)
    integer25 = Column('Integer25', types.Integer, index=False, unique=False, nullable=True)
    integer26 = Column('Integer26', types.Integer, index=False, unique=False, nullable=True)
    integer27 = Column('Integer27', types.Integer, index=False, unique=False, nullable=True)
    integer28 = Column('Integer28', types.Integer, index=False, unique=False, nullable=True)
    integer29 = Column('Integer29', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer30 = Column('Integer30', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', types.Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', types.Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', types.Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', types.Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', types.Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', types.Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', types.Numeric, index=False, unique=False, nullable=True)
    number14 = Column('Number14', types.Numeric, index=False, unique=False, nullable=True)
    number15 = Column('Number15', types.Numeric, index=False, unique=False, nullable=True)
    number16 = Column('Number16', types.Numeric, index=False, unique=False, nullable=True)
    number17 = Column('Number17', types.Numeric, index=False, unique=False, nullable=True)
    number18 = Column('Number18', types.Numeric, index=False, unique=False, nullable=True)
    number19 = Column('Number19', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number20 = Column('Number20', types.Numeric, index=False, unique=False, nullable=True)
    number21 = Column('Number21', types.Numeric, index=False, unique=False, nullable=True)
    number22 = Column('Number22', types.Numeric, index=False, unique=False, nullable=True)
    number23 = Column('Number23', types.Numeric, index=False, unique=False, nullable=True)
    number24 = Column('Number24', types.Numeric, index=False, unique=False, nullable=True)
    number25 = Column('Number25', types.Numeric, index=False, unique=False, nullable=True)
    number26 = Column('Number26', types.Numeric, index=False, unique=False, nullable=True)
    number27 = Column('Number27', types.Numeric, index=False, unique=False, nullable=True)
    number28 = Column('Number28', types.Numeric, index=False, unique=False, nullable=True)
    number29 = Column('Number29', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number30 = Column('Number30', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', types.Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', types.Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', types.Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', types.String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', types.String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', types.String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', types.String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', types.String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text20 = Column('Text20', types.String, index=False, unique=False, nullable=True)
    text21 = Column('Text21', types.String, index=False, unique=False, nullable=True)
    text22 = Column('Text22', types.String, index=False, unique=False, nullable=True)
    text23 = Column('Text23', types.String, index=False, unique=False, nullable=True)
    text24 = Column('Text24', types.String, index=False, unique=False, nullable=True)
    text25 = Column('Text25', types.String, index=False, unique=False, nullable=True)
    text26 = Column('Text26', types.String, index=False, unique=False, nullable=True)
    text27 = Column('Text27', types.String, index=False, unique=False, nullable=True)
    text28 = Column('Text28', types.String, index=False, unique=False, nullable=True)
    text29 = Column('Text29', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    text30 = Column('Text30', types.String, index=False, unique=False, nullable=True)
    text31 = Column('Text31', types.Text, index=False, unique=False, nullable=True)
    text32 = Column('Text32', types.Text, index=False, unique=False, nullable=True)
    text33 = Column('Text33', types.Text, index=False, unique=False, nullable=True)
    text34 = Column('Text34', types.Text, index=False, unique=False, nullable=True)
    text35 = Column('Text35', types.Text, index=False, unique=False, nullable=True)
    text36 = Column('Text36', types.Text, index=False, unique=False, nullable=True)
    text37 = Column('Text37', types.Text, index=False, unique=False, nullable=True)
    text38 = Column('Text38', types.Text, index=False, unique=False, nullable=True)
    text39 = Column('Text39', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text40 = Column('Text40', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo10 = Column('YesNo10', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo11 = Column('YesNo11', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo12 = Column('YesNo12', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo13 = Column('YesNo13', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo14 = Column('YesNo14', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo15 = Column('YesNo15', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo16 = Column('YesNo16', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo17 = Column('YesNo17', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo18 = Column('YesNo18', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo19 = Column('YesNo19', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo20 = Column('YesNo20', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo6 = Column('YesNo6', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo7 = Column('YesNo7', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo8 = Column('YesNo8', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo9 = Column('YesNo9', mysql_bit_type, index=False, unique=False, nullable=True)

    agent1ID = Column('Agent1ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent10ID = Column('Agent10ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent11ID = Column('Agent11ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent12ID = Column('Agent12ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent13ID = Column('Agent13ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent14ID = Column('Agent14ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent15ID = Column('Agent15ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent16ID = Column('Agent16ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent17ID = Column('Agent17ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent18ID = Column('Agent18ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent19ID = Column('Agent19ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent2ID = Column('Agent2ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent20ID = Column('Agent20ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent3ID = Column('Agent3ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent4ID = Column('Agent4ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent5ID = Column('Agent5ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent6ID = Column('Agent6ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent7ID = Column('Agent7ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent8ID = Column('Agent8D', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent9ID = Column('Agent9ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent1 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent10 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent10ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent11 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent11ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent12 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent12ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent13 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent13ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent14 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent14ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent15 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent15ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent16 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent16ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent17 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent17ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent18 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent18ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent19 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent19ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent2 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent20 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent20ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent3 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent3ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent4 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent4ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent5 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent5ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent6 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent6ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent7 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent7ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent8D', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent9 = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.Agent9ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CollectionObject = orm.relationship('CollectionObject', foreign_keys='CollectionObjectProperty.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('collectionObjectProperties', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectionObjectProperty.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionRelType(Base):
    tableid = 98
    _id = 'collectionRelTypeId'
    __tablename__ = 'collectionreltype'

    collectionRelTypeId = Column('Collectionreltypeid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    leftSideCollectionID = Column('LeftSideCollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    rightSideCollectionID = Column('RightSideCollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectionRelType.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    LeftSideCollection = orm.relationship('Collection', foreign_keys='CollectionRelType.LeftSideCollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('leftSideRelTypes', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectionRelType.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    RightSideCollection = orm.relationship('Collection', foreign_keys='CollectionRelType.RightSideCollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('rightSideRelTypes', uselist=True))

class CollectionRelationship(Base):
    tableid = 99
    _id = 'collectionRelationshipId'
    __tablename__ = 'collectionrelationship'

    collectionRelationshipId = Column('Collectionrelationshipid', types.Integer, primary_key=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionRelTypeID = Column('CollectionRelTypeID', types.Integer, ForeignKey('CollectionRelType.CollectionRelTypeID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    leftSideID = Column('LeftSideCollectionID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    rightSideID = Column('RightSideCollectionID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)

    CollectionRelType = orm.relationship('CollectionRelType', foreign_keys='CollectionRelationship.CollectionRelTypeID', remote_side='CollectionRelType.CollectionRelTypeID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CollectionRelationship.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    LeftSideCollection = orm.relationship('CollectionObject', foreign_keys='CollectionRelationship.LeftSideCollectionID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('leftSideRels', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CollectionRelationship.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    RightSideCollection = orm.relationship('CollectionObject', foreign_keys='CollectionRelationship.RightSideCollectionID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('rightSideRels', uselist=True))

class Collector(Base):
    tableid = 30
    _id = 'collectorId'
    __tablename__ = 'collector'

    collectorId = Column('Collectorid', types.Integer, primary_key=True)
    isPrimary = Column('IsPrimary', mysql_bit_type, index=False, unique=False, nullable=False)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    collectingEventID = Column('CollectingEventID', types.Integer, ForeignKey('CollectingEvent.CollectingEventID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='Collector.AgentID', remote_side='Agent.AgentID', backref=orm.backref('collectors', uselist=True))
    CollectingEvent = orm.relationship('CollectingEvent', foreign_keys='Collector.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectors', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Collector.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='Collector.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Collector.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CommonNameTx(Base):
    tableid = 106
    _id = 'commonNameTxId'
    __tablename__ = 'commonnametx'

    commonNameTxId = Column('Commonnametxid', types.Integer, primary_key=True)
    author = Column('Author', types.String, index=False, unique=False, nullable=True)
    country = Column('Country', types.String, index=True, unique=False, nullable=True)
    language = Column('Language', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    variant = Column('Variant', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    taxonID = Column('TaxonID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='CommonNameTx.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CommonNameTx.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Taxon = orm.relationship('Taxon', foreign_keys='CommonNameTx.TaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('commonNames', uselist=True))

class CommonNameTxCitation(Base):
    tableid = 134
    _id = 'commonNameTxCitationId'
    __tablename__ = 'commonnametxcitation'

    commonNameTxCitationId = Column('Commonnametxcitationid', types.Integer, primary_key=True)
    figureNumber = Column('FigureNumber', types.String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', types.String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    commonNameTxID = Column('CommonNameTxID', types.Integer, ForeignKey('CommonNameTx.CommonNameTxID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)

    CommonNameTx = orm.relationship('CommonNameTx', foreign_keys='CommonNameTxCitation.CommonNameTxID', remote_side='CommonNameTx.CommonNameTxID', backref=orm.backref('citations', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='CommonNameTxCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='CommonNameTxCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='CommonNameTxCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('None', uselist=True))

class ConservDescription(Base):
    tableid = 103
    _id = 'conservDescriptionId'
    __tablename__ = 'conservdescription'

    conservDescriptionId = Column('Conservdescriptionid', types.Integer, primary_key=True)
    backgroundInfo = Column('BackgroundInfo', types.Text, index=False, unique=False, nullable=True)
    composition = Column('Composition', types.Text, index=False, unique=False, nullable=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', types.Integer, index=False, unique=False, nullable=True)
    date3 = Column('Date3', types.Date, index=False, unique=False, nullable=True)
    date3Precision = Column('Date3Precision', types.Integer, index=False, unique=False, nullable=True)
    date4 = Column('Date4', types.Date, index=False, unique=False, nullable=True)
    date4Precision = Column('Date4Precision', types.Integer, index=False, unique=False, nullable=True)
    date5 = Column('Date5', types.Date, index=False, unique=False, nullable=True)
    date5Precision = Column('Date5Precision', types.Integer, index=False, unique=False, nullable=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    determinedDate = Column('CatalogedDate', types.Date, index=False, unique=False, nullable=True)
    displayRecommendations = Column('DisplayRecommendations', types.Text, index=False, unique=False, nullable=True)
    height = Column('Height', types.Numeric, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    lightRecommendations = Column('LightRecommendations', types.Text, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    objLength = Column('ObjLength', types.Numeric, index=False, unique=False, nullable=True)
    otherRecommendations = Column('OtherRecommendations', types.Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    shortDesc = Column('ShortDesc', types.String, index=True, unique=False, nullable=True)
    source = Column('Source', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    units = Column('Units', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    width = Column('Width', types.Numeric, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=True, unique=False)

    CollectionObject = orm.relationship('CollectionObject', foreign_keys='ConservDescription.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('conservDescriptions', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ConservDescription.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='ConservDescription.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ConservDescription.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='ConservDescription.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('conservDescriptions', uselist=True))

class ConservDescriptionAttachment(Base):
    tableid = 112
    _id = 'conservDescriptionAttachmentId'
    __tablename__ = 'conservdescriptionattachment'

    conservDescriptionAttachmentId = Column('Conservdescriptionattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    conservDescriptionID = Column('ConservDescriptionID', types.Integer, ForeignKey('ConservDescription.ConservDescriptionID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='ConservDescriptionAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('conservDescriptionAttachments', uselist=True))
    ConservDescription = orm.relationship('ConservDescription', foreign_keys='ConservDescriptionAttachment.ConservDescriptionID', remote_side='ConservDescription.ConservDescriptionID', backref=orm.backref('conservDescriptionAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ConservDescriptionAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ConservDescriptionAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ConservEvent(Base):
    tableid = 73
    _id = 'conservEventId'
    __tablename__ = 'conservevent'

    conservEventId = Column('Conserveventid', types.Integer, primary_key=True)
    advTestingExam = Column('AdvTestingExam', types.Text, index=False, unique=False, nullable=True)
    advTestingExamResults = Column('AdvTestingExamResults', types.Text, index=False, unique=False, nullable=True)
    completedComments = Column('CompletedComments', types.Text, index=False, unique=False, nullable=True)
    completedDate = Column('CompletedDate', types.Date, index=False, unique=False, nullable=True)
    completedDatePrecision = Column('CompletedDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    conditionReport = Column('ConditionReport', types.Text, index=False, unique=False, nullable=True)
    curatorApprovalDate = Column('CuratorApprovalDate', types.Date, index=False, unique=False, nullable=True)
    curatorApprovalDatePrecision = Column('CuratorApprovalDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    examDate = Column('ExamDate', types.Date, index=True, unique=False, nullable=True)
    examDatePrecision = Column('ExamDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Integer, index=False, unique=False, nullable=True)
    photoDocs = Column('PhotoDocs', types.Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    treatmentCompDate = Column('TreatmentCompDate', types.Date, index=False, unique=False, nullable=True)
    treatmentCompDatePrecision = Column('TreatmentCompDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    treatmentReport = Column('TreatmentReport', types.Text, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    conservDescriptionID = Column('ConservDescriptionID', types.Integer, ForeignKey('ConservDescription.ConservDescriptionID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    curatorID = Column('CuratorID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    examinedByAgentID = Column('ExaminedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    treatedByAgentID = Column('TreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    ConservDescription = orm.relationship('ConservDescription', foreign_keys='ConservEvent.ConservDescriptionID', remote_side='ConservDescription.ConservDescriptionID', backref=orm.backref('events', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ConservEvent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Curator = orm.relationship('Agent', foreign_keys='ConservEvent.CuratorID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ExaminedByAgent = orm.relationship('Agent', foreign_keys='ConservEvent.ExaminedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ConservEvent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    TreatedByAgent = orm.relationship('Agent', foreign_keys='ConservEvent.TreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ConservEventAttachment(Base):
    tableid = 113
    _id = 'conservEventAttachmentId'
    __tablename__ = 'conserveventattachment'

    conservEventAttachmentId = Column('Conserveventattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    conservEventID = Column('ConservEventID', types.Integer, ForeignKey('ConservEvent.ConservEventID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='ConservEventAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('conservEventAttachments', uselist=True))
    ConservEvent = orm.relationship('ConservEvent', foreign_keys='ConservEventAttachment.ConservEventID', remote_side='ConservEvent.ConservEventID', backref=orm.backref('conservEventAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ConservEventAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ConservEventAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Container(Base):
    tableid = 31
    _id = 'containerId'
    __tablename__ = 'container'

    containerId = Column('Containerid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=True)
    number = Column('Number', types.Integer, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.Integer, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentID', types.Integer, ForeignKey('Container.ContainerID'), nullable=True, unique=False)
    storageID = Column('StorageID', types.Integer, ForeignKey('Storage.StorageID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='Container.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Container.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Parent = orm.relationship('Container', foreign_keys='Container.ParentID', remote_side='Container.ContainerID', backref=orm.backref('children', uselist=True))
    Storage = orm.relationship('Storage', foreign_keys='Container.StorageID', remote_side='Storage.StorageID', backref=orm.backref('containers', uselist=True))

class DNAPrimer(Base):
    tableid = 150
    _id = 'dnaPrimerId'
    __tablename__ = 'dnaprimer'

    dnaPrimerId = Column('Dnaprimerid', types.Integer, primary_key=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    primerDesignator = Column('PrimerDesignator', types.String, index=True, unique=False, nullable=True)
    primerNameForward = Column('PrimerNameForward', types.String, index=False, unique=False, nullable=True)
    primerNameReverse = Column('PrimerNameReverse', types.String, index=False, unique=False, nullable=True)
    primerReferenceCitationForward = Column('PrimerReferenceCitationForward', types.String, index=False, unique=False, nullable=True)
    primerReferenceCitationReverse = Column('PrimerReferenceCitationReverse', types.String, index=False, unique=False, nullable=True)
    primerReferenceLinkForward = Column('PrimerReferenceLinkForward', types.String, index=False, unique=False, nullable=True)
    primerReferenceLinkReverse = Column('PrimerReferenceLinkReverse', types.String, index=False, unique=False, nullable=True)
    primerSequenceForward = Column('PrimerSequenceForward', types.String, index=False, unique=False, nullable=True)
    primerSequenceReverse = Column('PrimerSequenceReverse', types.String, index=False, unique=False, nullable=True)
    purificationMethod = Column('purificationMethod', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', types.Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', types.Integer, index=False, unique=False, nullable=True)
    reservedNumber3 = Column('ReservedNumber3', types.Numeric, index=False, unique=False, nullable=True)
    reservedNumber4 = Column('ReservedNumber4', types.Numeric, index=False, unique=False, nullable=True)
    reservedText3 = Column('ReservedText3', types.Text, index=False, unique=False, nullable=True)
    reservedText4 = Column('ReservedText4', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='DNAPrimer.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DNAPrimer.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequence(Base):
    tableid = 121
    _id = 'dnaSequenceId'
    __tablename__ = 'dnasequence'

    dnaSequenceId = Column('Dnasequenceid', types.Integer, primary_key=True)
    ambiguousResidues = Column('AmbiguousResidues', types.Integer, index=False, unique=False, nullable=True)
    boldBarcodeId = Column('BOLDBarcodeID', types.String, index=True, unique=False, nullable=True)
    boldLastUpdateDate = Column('BOLDLastUpdateDate', types.Date, index=False, unique=False, nullable=True)
    boldSampleId = Column('BOLDSampleID', types.String, index=True, unique=False, nullable=True)
    boldTranslationMatrix = Column('BOLDTranslationMatrix', types.String, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=False, unique=False, nullable=False)
    compA = Column('CompA', types.Integer, index=False, unique=False, nullable=True)
    compC = Column('CompC', types.Integer, index=False, unique=False, nullable=True)
    compG = Column('CompG', types.Integer, index=False, unique=False, nullable=True)
    compT = Column('compT', types.Integer, index=False, unique=False, nullable=True)
    extractionDate = Column('ExtractionDate', types.Date, index=False, unique=False, nullable=True)
    extractionDatePrecision = Column('ExtractionDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    genbankAccessionNumber = Column('GenBankAccessionNumber', types.String, index=True, unique=False, nullable=True)
    geneSequence = Column('GeneSequence', types.Text, index=False, unique=False, nullable=True)
    moleculeType = Column('MoleculeType', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    sequenceDate = Column('SequenceDate', types.Date, index=False, unique=False, nullable=True)
    sequenceDatePrecision = Column('SequenceDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    targetMarker = Column('TargetMarker', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    totalResidues = Column('TotalResidues', types.Integer, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    extractorID = Column('ExtractorID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    materialSampleID = Column('MaterialSampleID', types.Integer, ForeignKey('MaterialSample.MaterialSampleID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    sequencerID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CollectionObject = orm.relationship('CollectionObject', foreign_keys='DNASequence.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('dnaSequences', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='DNASequence.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Extractor = orm.relationship('Agent', foreign_keys='DNASequence.ExtractorID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    MaterialSample = orm.relationship('MaterialSample', foreign_keys='DNASequence.MaterialSampleID', remote_side='MaterialSample.MaterialSampleID', backref=orm.backref('dnaSequences', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DNASequence.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='DNASequence.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequenceAttachment(Base):
    tableid = 147
    _id = 'dnaSequenceAttachmentId'
    __tablename__ = 'dnasequenceattachment'

    dnaSequenceAttachmentId = Column('Dnasequenceattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    dnaSequenceID = Column('DnaSequenceID', types.Integer, ForeignKey('DNASequence.DnaSequenceID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='DNASequenceAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('dnaSequenceAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='DNASequenceAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    DnaSequence = orm.relationship('DNASequence', foreign_keys='DNASequenceAttachment.DnaSequenceID', remote_side='DNASequence.DnaSequenceID', backref=orm.backref('attachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DNASequenceAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequencingRun(Base):
    tableid = 88
    _id = 'dnaSequencingRunId'
    __tablename__ = 'dnasequencingrun'

    dnaSequencingRunId = Column('Dnasequencingrunid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=False, unique=False, nullable=False)
    dryadDOI = Column('DryadDOI', types.String, index=False, unique=False, nullable=True)
    geneSequence = Column('GeneSequence', types.Text, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=True)
    pcrCocktailPrimer = Column('PCRCocktailPrimer', mysql_bit_type, index=False, unique=False, nullable=True)
    pcrForwardPrimerCode = Column('PCRForwardPrimerCode', types.String, index=False, unique=False, nullable=True)
    pcrPrimerName = Column('PCRPrimerName', types.String, index=False, unique=False, nullable=True)
    pcrPrimerSequence5_3 = Column('PCRPrimerSequence5_3', types.String, index=False, unique=False, nullable=True)
    pcrReversePrimerCode = Column('PCRReversePrimerCode', types.String, index=False, unique=False, nullable=True)
    readDirection = Column('ReadDirection', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    runDate = Column('RunDate', types.Date, index=False, unique=False, nullable=True)
    scoreFileName = Column('ScoreFileName', types.String, index=False, unique=False, nullable=True)
    sequenceCocktailPrimer = Column('SequenceCocktailPrimer', mysql_bit_type, index=False, unique=False, nullable=True)
    sequencePrimerCode = Column('SequencePrimerCode', types.String, index=False, unique=False, nullable=True)
    sequencePrimerName = Column('SequencePrimerName', types.String, index=False, unique=False, nullable=True)
    sequencePrimerSequence5_3 = Column('SequencePrimerSequence5_3', types.String, index=False, unique=False, nullable=True)
    sraExperimentID = Column('SRAExperimentID', types.String, index=False, unique=False, nullable=True)
    sraRunID = Column('SRARunID', types.String, index=False, unique=False, nullable=True)
    sraSubmissionID = Column('SRASubmissionID', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    traceFileName = Column('TraceFileName', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    dnaPrimerID = Column('DNAPrimerID', types.Integer, ForeignKey('DNAPrimer.DNAPrimerID'), nullable=True, unique=False)
    dnaSequenceID = Column('DNASequenceID', types.Integer, ForeignKey('DNASequence.DnaSequenceID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparedByAgentID = Column('PreparedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    runByAgentID = Column('RunByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='DNASequencingRun.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    DNAPrimer = orm.relationship('DNAPrimer', foreign_keys='DNASequencingRun.DNAPrimerID', remote_side='DNAPrimer.DNAPrimerID', backref=orm.backref('dnaSequencingRuns', uselist=True))
    DNASequence = orm.relationship('DNASequence', foreign_keys='DNASequencingRun.DNASequenceID', remote_side='DNASequence.DnaSequenceID', backref=orm.backref('dnaSequencingRuns', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DNASequencingRun.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PreparedByAgent = orm.relationship('Agent', foreign_keys='DNASequencingRun.PreparedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    RunByAgent = orm.relationship('Agent', foreign_keys='DNASequencingRun.RunByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequencingRunAttachment(Base):
    tableid = 135
    _id = 'dnaSequencingRunAttachmentId'
    __tablename__ = 'dnasequencerunattachment'

    dnaSequencingRunAttachmentId = Column('Dnasequencingrunattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    dnaSequencingRunID = Column('DnaSequencingRunID', types.Integer, ForeignKey('DNASequencingRun.DNASequencingRunID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='DNASequencingRunAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('dnaSequencingRunAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='DNASequencingRunAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    DnaSequencingRun = orm.relationship('DNASequencingRun', foreign_keys='DNASequencingRunAttachment.DnaSequencingRunID', remote_side='DNASequencingRun.DNASequencingRunID', backref=orm.backref('attachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DNASequencingRunAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequencingRunCitation(Base):
    tableid = 105
    _id = 'dnaSequencingRunCitationId'
    __tablename__ = 'dnasequencingruncitation'

    dnaSequencingRunCitationId = Column('Dnasequencingruncitationid', types.Integer, primary_key=True)
    figureNumber = Column('FigureNumber', types.String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', types.String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)
    sequencingRunID = Column('DNASequencingRunID', types.Integer, ForeignKey('DNASequencingRun.DNASequencingRunID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='DNASequencingRunCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DNASequencingRunCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='DNASequencingRunCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('None', uselist=True))
    DNASequencingRun = orm.relationship('DNASequencingRun', foreign_keys='DNASequencingRunCitation.DNASequencingRunID', remote_side='DNASequencingRun.DNASequencingRunID', backref=orm.backref('citations', uselist=True))

class DataType(Base):
    tableid = 33
    _id = 'dataTypeId'
    __tablename__ = 'datatype'

    dataTypeId = Column('Datatypeid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='DataType.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DataType.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Deaccession(Base):
    tableid = 163
    _id = 'deaccessionId'
    __tablename__ = 'deaccession'

    deaccessionId = Column('Deaccessionid', types.Integer, primary_key=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    deaccessionDate = Column('DeaccessionDate', types.Date, index=True, unique=False, nullable=True)
    deaccessionNumber = Column('DeaccessionNumber', types.String, index=True, unique=False, nullable=False)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    status = Column('Status', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    agent1ID = Column('Agent1ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent2ID = Column('Agent2ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent1 = orm.relationship('Agent', foreign_keys='Deaccession.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent2 = orm.relationship('Agent', foreign_keys='Deaccession.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Deaccession.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Deaccession.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DeaccessionAgent(Base):
    tableid = 164
    _id = 'deaccessionAgentId'
    __tablename__ = 'deaccessionagent'

    deaccessionAgentId = Column('Deaccessionagentid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    role = Column('Role', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    deaccessionID = Column('DeaccessionID', types.Integer, ForeignKey('Deaccession.DeaccessionID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='DeaccessionAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='DeaccessionAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Deaccession = orm.relationship('Deaccession', foreign_keys='DeaccessionAgent.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('deaccessionAgents', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DeaccessionAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DeaccessionAttachment(Base):
    tableid = 165
    _id = 'deaccessionAttachmentId'
    __tablename__ = 'deaccessionattachment'

    deaccessionAttachmentId = Column('Deaccessionattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    deaccessionID = Column('DeaccessionID', types.Integer, ForeignKey('Deaccession.DeaccessionID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='DeaccessionAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('deaccessionAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='DeaccessionAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Deaccession = orm.relationship('Deaccession', foreign_keys='DeaccessionAttachment.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('deaccessionAttachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DeaccessionAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Determination(Base):
    tableid = 9
    _id = 'determinationId'
    __tablename__ = 'determination'

    determinationId = Column('Determinationid', types.Integer, primary_key=True)
    addendum = Column('Addendum', types.String, index=False, unique=False, nullable=True)
    alternateName = Column('AlternateName', types.String, index=True, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    confidence = Column('Confidence', types.String, index=False, unique=False, nullable=True)
    determinedDate = Column('DeterminedDate', types.Date, index=True, unique=False, nullable=True)
    determinedDatePrecision = Column('DeterminedDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    featureOrBasis = Column('FeatureOrBasis', types.String, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    isCurrent = Column('IsCurrent', mysql_bit_type, index=False, unique=False, nullable=False)
    method = Column('Method', types.String, index=False, unique=False, nullable=True)
    nameUsage = Column('NameUsage', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    qualifier = Column('Qualifier', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    subSpQualifier = Column('SubSpQualifier', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    typeStatusName = Column('TypeStatusName', types.String, index=True, unique=False, nullable=True)
    varQualifier = Column('VarQualifier', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    determinerID = Column('DeterminerID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preferredTaxonID = Column('PreferredTaxonID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=True, unique=False)
    taxonID = Column('TaxonID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=True, unique=False)

    CollectionObject = orm.relationship('CollectionObject', foreign_keys='Determination.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('determinations', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Determination.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Determiner = orm.relationship('Agent', foreign_keys='Determination.DeterminerID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Determination.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PreferredTaxon = orm.relationship('Taxon', foreign_keys='Determination.PreferredTaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('None', uselist=True))
    Taxon = orm.relationship('Taxon', foreign_keys='Determination.TaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('determinations', uselist=True))

class DeterminationCitation(Base):
    tableid = 38
    _id = 'determinationCitationId'
    __tablename__ = 'determinationcitation'

    determinationCitationId = Column('Determinationcitationid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    figureNumber = Column('FigureNumber', types.String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', types.String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    determinationID = Column('DeterminationID', types.Integer, ForeignKey('Determination.DeterminationID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='DeterminationCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Determination = orm.relationship('Determination', foreign_keys='DeterminationCitation.DeterminationID', remote_side='Determination.DeterminationID', backref=orm.backref('determinationCitations', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DeterminationCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='DeterminationCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('determinationCitations', uselist=True))

class Determiner(Base):
    tableid = 167
    _id = 'determinerId'
    __tablename__ = 'determiner'

    determinerId = Column('Determinerid', types.Integer, primary_key=True)
    isPrimary = Column('IsPrimary', mysql_bit_type, index=False, unique=False, nullable=False)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    determinationID = Column('DeterminationID', types.Integer, ForeignKey('Determination.DeterminationID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='Determiner.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Determiner.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Determination = orm.relationship('Determination', foreign_keys='Determiner.DeterminationID', remote_side='Determination.DeterminationID', backref=orm.backref('determiners', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Determiner.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Discipline(Base):
    tableid = 26
    _id = 'userGroupScopeId'
    __tablename__ = 'discipline'

    userGroupScopeId = Column('Usergroupscopeid', types.Integer, primary_key=True)
    isPaleoContextEmbedded = Column('IsPaleoContextEmbedded', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', types.String, index=True, unique=False, nullable=True)
    paleoContextChildTable = Column('PaleoContextChildTable', types.String, index=False, unique=False, nullable=True)
    regNumber = Column('RegNumber', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    dataTypeID = Column('DataTypeID', types.Integer, ForeignKey('DataType.DataTypeID'), nullable=False, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=False, unique=False)
    geographyTreeDefID = Column('GeographyTreeDefID', types.Integer, ForeignKey('GeographyTreeDef.GeographyTreeDefID'), nullable=False, unique=False)
    geologicTimePeriodTreeDefID = Column('GeologicTimePeriodTreeDefID', types.Integer, ForeignKey('GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID'), nullable=False, unique=False)
    lithoStratTreeDefID = Column('LithoStratTreeDefID', types.Integer, ForeignKey('LithoStratTreeDef.LithoStratTreeDefID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    taxonTreeDefID = Column('TaxonTreeDefID', types.Integer, ForeignKey('TaxonTreeDef.TaxonTreeDefID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='Discipline.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    DataType = orm.relationship('DataType', foreign_keys='Discipline.DataTypeID', remote_side='DataType.DataTypeID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='Discipline.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('disciplines', uselist=True))
    GeographyTreeDef = orm.relationship('GeographyTreeDef', foreign_keys='Discipline.GeographyTreeDefID', remote_side='GeographyTreeDef.GeographyTreeDefID', backref=orm.backref('disciplines', uselist=True))
    GeologicTimePeriodTreeDef = orm.relationship('GeologicTimePeriodTreeDef', foreign_keys='Discipline.GeologicTimePeriodTreeDefID', remote_side='GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID', backref=orm.backref('disciplines', uselist=True))
    LithoStratTreeDef = orm.relationship('LithoStratTreeDef', foreign_keys='Discipline.LithoStratTreeDefID', remote_side='LithoStratTreeDef.LithoStratTreeDefID', backref=orm.backref('disciplines', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Discipline.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    TaxonTreeDef = orm.relationship('TaxonTreeDef', foreign_keys='Discipline.TaxonTreeDefID', remote_side='TaxonTreeDef.TaxonTreeDefID', backref=orm.backref('discipline', uselist=False))

class Disposal(Base):
    tableid = 34
    _id = 'disposalId'
    __tablename__ = 'disposal'

    disposalId = Column('Disposalid', types.Integer, primary_key=True)
    disposalDate = Column('DisposalDate', types.Date, index=True, unique=False, nullable=True)
    disposalNumber = Column('DisposalNumber', types.String, index=True, unique=False, nullable=False)
    doNotExport = Column('doNotExport', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    deaccessionID = Column('DeaccessionID', types.Integer, ForeignKey('Deaccession.DeaccessionID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='Disposal.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Deaccession = orm.relationship('Deaccession', foreign_keys='Disposal.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('disposals', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Disposal.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DisposalAgent(Base):
    tableid = 35
    _id = 'disposalAgentId'
    __tablename__ = 'disposalagent'

    disposalAgentId = Column('Disposalagentid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    role = Column('Role', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disposalID = Column('DisposalID', types.Integer, ForeignKey('Disposal.DisposalID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='DisposalAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='DisposalAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Disposal = orm.relationship('Disposal', foreign_keys='DisposalAgent.DisposalID', remote_side='Disposal.DisposalID', backref=orm.backref('disposalAgents', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DisposalAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DisposalAttachment(Base):
    tableid = 166
    _id = 'disposalAttachmentId'
    __tablename__ = 'disposalattachment'

    disposalAttachmentId = Column('Disposalattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disposalID = Column('DisposalID', types.Integer, ForeignKey('Disposal.DisposalID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='DisposalAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('disposalAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='DisposalAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Disposal = orm.relationship('Disposal', foreign_keys='DisposalAttachment.DisposalID', remote_side='Disposal.DisposalID', backref=orm.backref('disposalAttachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DisposalAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DisposalPreparation(Base):
    tableid = 36
    _id = 'disposalPreparationId'
    __tablename__ = 'disposalpreparation'

    disposalPreparationId = Column('Disposalpreparationid', types.Integer, primary_key=True)
    quantity = Column('Quantity', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disposalID = Column('DisposalID', types.Integer, ForeignKey('Disposal.DisposalID'), nullable=False, unique=False)
    loanReturnPreparationID = Column('LoanReturnPreparationID', types.Integer, ForeignKey('LoanReturnPreparation.LoanReturnPreparationID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='DisposalPreparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Disposal = orm.relationship('Disposal', foreign_keys='DisposalPreparation.DisposalID', remote_side='Disposal.DisposalID', backref=orm.backref('disposalPreparations', uselist=True))
    LoanReturnPreparation = orm.relationship('LoanReturnPreparation', foreign_keys='DisposalPreparation.LoanReturnPreparationID', remote_side='LoanReturnPreparation.LoanReturnPreparationID', backref=orm.backref('disposalPreparations', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='DisposalPreparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='DisposalPreparation.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('disposalPreparations', uselist=True))

class Division(Base):
    tableid = 96
    _id = 'userGroupScopeId'
    __tablename__ = 'division'

    userGroupScopeId = Column('Usergroupscopeid', types.Integer, primary_key=True)
    abbrev = Column('Abbrev', types.String, index=False, unique=False, nullable=True)
    altName = Column('AltName', types.String, index=False, unique=False, nullable=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    discipline = Column('DisciplineType', types.String, index=False, unique=False, nullable=True)
    iconURI = Column('IconURI', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=True)
    regNumber = Column('RegNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    uri = Column('Uri', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    addressID = Column('AddressID', types.Integer, ForeignKey('Address.AddressID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    institutionID = Column('InstitutionID', types.Integer, ForeignKey('Institution.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Address = orm.relationship('Address', foreign_keys='Division.AddressID', remote_side='Address.AddressID', backref=orm.backref('divisions', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Division.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Institution = orm.relationship('Institution', foreign_keys='Division.InstitutionID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('divisions', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Division.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeIn(Base):
    tableid = 39
    _id = 'exchangeInId'
    __tablename__ = 'exchangein'

    exchangeInId = Column('Exchangeinid', types.Integer, primary_key=True)
    contents = Column('Contents', types.Text, index=False, unique=False, nullable=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', types.String, index=True, unique=False, nullable=True)
    exchangeDate = Column('ExchangeDate', types.Date, index=True, unique=False, nullable=True)
    exchangeInNumber = Column('ExchangeInNumber', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    quantityExchanged = Column('QuantityExchanged', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    srcGeography = Column('SrcGeography', types.String, index=False, unique=False, nullable=True)
    srcTaxonomy = Column('SrcTaxonomy', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    addressOfRecordID = Column('AddressOfRecordID', types.Integer, ForeignKey('AddressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    agentCatalogedByID = Column('CatalogedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    agentReceivedFromID = Column('ReceivedFromOrganizationID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    AddressOfRecord = orm.relationship('AddressOfRecord', foreign_keys='ExchangeIn.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('exchangeIns', uselist=True))
    CatalogedBy = orm.relationship('Agent', foreign_keys='ExchangeIn.CatalogedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReceivedFromOrganization = orm.relationship('Agent', foreign_keys='ExchangeIn.ReceivedFromOrganizationID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ExchangeIn.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='ExchangeIn.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ExchangeIn.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeInAttachment(Base):
    tableid = 169
    _id = 'exchangeInAttachmentId'
    __tablename__ = 'exchangeinattachment'

    exchangeInAttachmentId = Column('Exchangeinattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    exchangeInID = Column('ExchangeInID', types.Integer, ForeignKey('ExchangeIn.ExchangeInID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='ExchangeInAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('exchangeInAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ExchangeInAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ExchangeIn = orm.relationship('ExchangeIn', foreign_keys='ExchangeInAttachment.ExchangeInID', remote_side='ExchangeIn.ExchangeInID', backref=orm.backref('exchangeInAttachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ExchangeInAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeInPrep(Base):
    tableid = 140
    _id = 'exchangeInPrepId'
    __tablename__ = 'exchangeinprep'

    exchangeInPrepId = Column('Exchangeinprepid', types.Integer, primary_key=True)
    comments = Column('Comments', types.Text, index=False, unique=False, nullable=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Integer, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', types.Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    exchangeInID = Column('ExchangeInID', types.Integer, ForeignKey('ExchangeIn.ExchangeInID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='ExchangeInPrep.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='ExchangeInPrep.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ExchangeIn = orm.relationship('ExchangeIn', foreign_keys='ExchangeInPrep.ExchangeInID', remote_side='ExchangeIn.ExchangeInID', backref=orm.backref('exchangeInPreps', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ExchangeInPrep.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='ExchangeInPrep.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('exchangeInPreps', uselist=True))

class ExchangeOut(Base):
    tableid = 40
    _id = 'exchangeOutId'
    __tablename__ = 'exchangeout'

    exchangeOutId = Column('Exchangeoutid', types.Integer, primary_key=True)
    contents = Column('Contents', types.Text, index=False, unique=False, nullable=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', types.String, index=True, unique=False, nullable=True)
    exchangeDate = Column('ExchangeDate', types.Date, index=True, unique=False, nullable=True)
    exchangeOutNumber = Column('ExchangeOutNumber', types.String, index=True, unique=False, nullable=False)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    quantityExchanged = Column('QuantityExchanged', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    srcGeography = Column('SrcGeography', types.String, index=False, unique=False, nullable=True)
    srcTaxonomy = Column('SrcTaxonomy', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    addressOfRecordID = Column('AddressOfRecordID', types.Integer, ForeignKey('AddressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    agentCatalogedByID = Column('CatalogedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    agentSentToID = Column('SentToOrganizationID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    deaccessionID = Column('DeaccessionID', types.Integer, ForeignKey('Deaccession.DeaccessionID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    AddressOfRecord = orm.relationship('AddressOfRecord', foreign_keys='ExchangeOut.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('exchangeOuts', uselist=True))
    CatalogedBy = orm.relationship('Agent', foreign_keys='ExchangeOut.CatalogedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SentToOrganization = orm.relationship('Agent', foreign_keys='ExchangeOut.SentToOrganizationID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ExchangeOut.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Deaccession = orm.relationship('Deaccession', foreign_keys='ExchangeOut.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('exchangeOuts', uselist=True))
    Division = orm.relationship('Division', foreign_keys='ExchangeOut.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ExchangeOut.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeOutAttachment(Base):
    tableid = 170
    _id = 'exchangeOutAttachmentId'
    __tablename__ = 'exchangeoutattachment'

    exchangeOutAttachmentId = Column('Exchangeoutattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    exchangeOutID = Column('ExchangeOutID', types.Integer, ForeignKey('ExchangeOut.ExchangeOutID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='ExchangeOutAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('exchangeOutAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ExchangeOutAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ExchangeOut = orm.relationship('ExchangeOut', foreign_keys='ExchangeOutAttachment.ExchangeOutID', remote_side='ExchangeOut.ExchangeOutID', backref=orm.backref('exchangeOutAttachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ExchangeOutAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeOutPrep(Base):
    tableid = 141
    _id = 'exchangeOutPrepId'
    __tablename__ = 'exchangeoutprep'

    exchangeOutPrepId = Column('Exchangeoutprepid', types.Integer, primary_key=True)
    comments = Column('Comments', types.Text, index=False, unique=False, nullable=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Integer, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', types.Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    exchangeOutID = Column('ExchangeOutID', types.Integer, ForeignKey('ExchangeOut.ExchangeOutID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='ExchangeOutPrep.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='ExchangeOutPrep.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ExchangeOut = orm.relationship('ExchangeOut', foreign_keys='ExchangeOutPrep.ExchangeOutID', remote_side='ExchangeOut.ExchangeOutID', backref=orm.backref('exchangeOutPreps', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ExchangeOutPrep.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='ExchangeOutPrep.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('exchangeOutPreps', uselist=True))

class Exsiccata(Base):
    tableid = 89
    _id = 'exsiccataId'
    __tablename__ = 'exsiccata'

    exsiccataId = Column('Exsiccataid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    schedae = Column('Schedae', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=False, unique=False, nullable=False)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='Exsiccata.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Exsiccata.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='Exsiccata.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('exsiccatae', uselist=True))

class ExsiccataItem(Base):
    tableid = 104
    _id = 'exsiccataItemId'
    __tablename__ = 'exsiccataitem'

    exsiccataItemId = Column('Exsiccataitemid', types.Integer, primary_key=True)
    fascicle = Column('Fascicle', types.String, index=False, unique=False, nullable=True)
    number = Column('Number', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    exsiccataID = Column('ExsiccataID', types.Integer, ForeignKey('Exsiccata.ExsiccataID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CollectionObject = orm.relationship('CollectionObject', foreign_keys='ExsiccataItem.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('exsiccataItems', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ExsiccataItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Exsiccata = orm.relationship('Exsiccata', foreign_keys='ExsiccataItem.ExsiccataID', remote_side='Exsiccata.ExsiccataID', backref=orm.backref('exsiccataItems', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ExsiccataItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Extractor(Base):
    tableid = 160
    _id = 'extractorId'
    __tablename__ = 'extractor'

    extractorId = Column('Extractorid', types.Integer, primary_key=True)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    dnaSequenceID = Column('DNASequenceID', types.Integer, ForeignKey('DNASequence.DnaSequenceID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='Extractor.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Extractor.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    DNASequence = orm.relationship('DNASequence', foreign_keys='Extractor.DNASequenceID', remote_side='DNASequence.DnaSequenceID', backref=orm.backref('extractors', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Extractor.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebook(Base):
    tableid = 83
    _id = 'fieldNotebookId'
    __tablename__ = 'fieldnotebook'

    fieldNotebookId = Column('Fieldnotebookid', types.Integer, primary_key=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', types.Date, index=True, unique=False, nullable=True)
    location = Column('Storage', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=True)
    startDate = Column('StartDate', types.Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    ownerAgentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='FieldNotebook.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebook.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='FieldNotebook.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebook.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='FieldNotebook.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebookAttachment(Base):
    tableid = 127
    _id = 'fieldNotebookAttachmentId'
    __tablename__ = 'fieldnotebookattachment'

    fieldNotebookAttachmentId = Column('Fieldnotebookattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    fieldNotebookID = Column('FieldNotebookID', types.Integer, ForeignKey('FieldNotebook.FieldNotebookID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='FieldNotebookAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('fieldNotebookAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    FieldNotebook = orm.relationship('FieldNotebook', foreign_keys='FieldNotebookAttachment.FieldNotebookID', remote_side='FieldNotebook.FieldNotebookID', backref=orm.backref('attachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebookPage(Base):
    tableid = 85
    _id = 'fieldNotebookPageId'
    __tablename__ = 'fieldnotebookpage'

    fieldNotebookPageId = Column('Fieldnotebookpageid', types.Integer, primary_key=True)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', types.String, index=True, unique=False, nullable=False)
    scanDate = Column('ScanDate', types.Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    pageSetID = Column('FieldNotebookPageSetID', types.Integer, ForeignKey('FieldNotebookPageSet.FieldNotebookPageSetID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookPage.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='FieldNotebookPage.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookPage.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    FieldNotebookPageSet = orm.relationship('FieldNotebookPageSet', foreign_keys='FieldNotebookPage.FieldNotebookPageSetID', remote_side='FieldNotebookPageSet.FieldNotebookPageSetID', backref=orm.backref('pages', uselist=True))

class FieldNotebookPageAttachment(Base):
    tableid = 129
    _id = 'fieldNotebookPageAttachmentId'
    __tablename__ = 'fieldnotebookpageattachment'

    fieldNotebookPageAttachmentId = Column('Fieldnotebookpageattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    fieldNotebookPageID = Column('FieldNotebookPageID', types.Integer, ForeignKey('FieldNotebookPage.FieldNotebookPageID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='FieldNotebookPageAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('fieldNotebookPageAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookPageAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    FieldNotebookPage = orm.relationship('FieldNotebookPage', foreign_keys='FieldNotebookPageAttachment.FieldNotebookPageID', remote_side='FieldNotebookPage.FieldNotebookPageID', backref=orm.backref('attachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookPageAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebookPageSet(Base):
    tableid = 84
    _id = 'fieldNotebookPageSetId'
    __tablename__ = 'fieldnotebookpageset'

    fieldNotebookPageSetId = Column('Fieldnotebookpagesetid', types.Integer, primary_key=True)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', types.Date, index=True, unique=False, nullable=True)
    method = Column('Method', types.String, index=False, unique=False, nullable=True)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', types.Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    fieldNotebookID = Column('FieldNotebookID', types.Integer, ForeignKey('FieldNotebook.FieldNotebookID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    sourceAgentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookPageSet.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='FieldNotebookPageSet.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    FieldNotebook = orm.relationship('FieldNotebook', foreign_keys='FieldNotebookPageSet.FieldNotebookID', remote_side='FieldNotebook.FieldNotebookID', backref=orm.backref('pageSets', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookPageSet.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='FieldNotebookPageSet.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebookPageSetAttachment(Base):
    tableid = 128
    _id = 'fieldNotebookPageSetAttachmentId'
    __tablename__ = 'fieldnotebookpagesetattachment'

    fieldNotebookPageSetAttachmentId = Column('Fieldnotebookpagesetattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    fieldNotebookPageSetID = Column('FieldNotebookPageSetID', types.Integer, ForeignKey('FieldNotebookPageSet.FieldNotebookPageSetID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='FieldNotebookPageSetAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('fieldNotebookPageSetAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookPageSetAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    FieldNotebookPageSet = orm.relationship('FieldNotebookPageSet', foreign_keys='FieldNotebookPageSetAttachment.FieldNotebookPageSetID', remote_side='FieldNotebookPageSet.FieldNotebookPageSetID', backref=orm.backref('attachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='FieldNotebookPageSetAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FundingAgent(Base):
    tableid = 146
    _id = 'fundingAgentId'
    __tablename__ = 'fundingagent'

    fundingAgentId = Column('Fundingagentid', types.Integer, primary_key=True)
    isPrimary = Column('IsPrimary', mysql_bit_type, index=False, unique=False, nullable=False)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    collectingTripID = Column('CollectingTripID', types.Integer, ForeignKey('CollectingTrip.CollectingTripID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='FundingAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CollectingTrip = orm.relationship('CollectingTrip', foreign_keys='FundingAgent.CollectingTripID', remote_side='CollectingTrip.CollectingTripID', backref=orm.backref('fundingAgents', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='FundingAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='FundingAgent.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='FundingAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GeoCoordDetail(Base):
    tableid = 123
    _id = 'geoCoordDetailId'
    __tablename__ = 'geocoorddetail'

    geoCoordDetailId = Column('Geocoorddetailid', types.Integer, primary_key=True)
    errorPolygon = Column('ErrorPolygon', types.Text, index=False, unique=False, nullable=True)
    geoRefAccuracy = Column('GeoRefAccuracy', types.Numeric, index=False, unique=False, nullable=True)
    geoRefAccuracyUnits = Column('GeoRefAccuracyUnits', types.String, index=False, unique=False, nullable=True)
    geoRefCompiledDate = Column('GeoRefCompiledDate', types.Date, index=False, unique=False, nullable=True)
    geoRefDetDate = Column('GeoRefDetDate', types.Date, index=False, unique=False, nullable=True)
    geoRefDetRef = Column('GeoRefDetRef', types.String, index=False, unique=False, nullable=True)
    geoRefRemarks = Column('GeoRefRemarks', types.Text, index=False, unique=False, nullable=True)
    geoRefVerificationStatus = Column('GeoRefVerificationStatus', types.String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    maxUncertaintyEst = Column('MaxUncertaintyEst', types.Numeric, index=False, unique=False, nullable=True)
    maxUncertaintyEstUnit = Column('MaxUncertaintyEstUnit', types.String, index=False, unique=False, nullable=True)
    namedPlaceExtent = Column('NamedPlaceExtent', types.Numeric, index=False, unique=False, nullable=True)
    noGeoRefBecause = Column('NoGeoRefBecause', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    originalCoordSystem = Column('OriginalCoordSystem', types.String, index=False, unique=False, nullable=True)
    protocol = Column('Protocol', types.String, index=False, unique=False, nullable=True)
    source = Column('Source', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    uncertaintyPolygon = Column('UncertaintyPolygon', types.Text, index=False, unique=False, nullable=True)
    validation = Column('Validation', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    geoRefCompiledByID = Column('CompiledByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    geoRefDetByID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    localityID = Column('LocalityID', types.Integer, ForeignKey('Locality.LocalityID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='GeoCoordDetail.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CompiledBy = orm.relationship('Agent', foreign_keys='GeoCoordDetail.CompiledByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='GeoCoordDetail.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Locality = orm.relationship('Locality', foreign_keys='GeoCoordDetail.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('geoCoordDetails', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GeoCoordDetail.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Geography(Base):
    tableid = 3
    _id = 'geographyId'
    __tablename__ = 'geography'

    geographyId = Column('Geographyid', types.Integer, primary_key=True)
    abbrev = Column('Abbrev', types.String, index=False, unique=False, nullable=True)
    centroidLat = Column('CentroidLat', types.Numeric, index=False, unique=False, nullable=True)
    centroidLon = Column('CentroidLon', types.Numeric, index=False, unique=False, nullable=True)
    commonName = Column('CommonName', types.String, index=False, unique=False, nullable=True)
    fullName = Column('FullName', types.String, index=True, unique=False, nullable=True)
    geographyCode = Column('GeographyCode', types.String, index=False, unique=False, nullable=True)
    gml = Column('GML', types.Text, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=False, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', types.Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    isCurrent = Column('IsCurrent', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    nodeNumber = Column('NodeNumber', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Integer, index=False, unique=False, nullable=True)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    timestampVersion = Column('TimestampVersion', types.Date, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    acceptedGeographyID = Column('AcceptedID', types.Integer, ForeignKey('Geography.GeographyID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    definitionID = Column('GeographyTreeDefID', types.Integer, ForeignKey('GeographyTreeDef.GeographyTreeDefID'), nullable=False, unique=False)
    definitionItemID = Column('GeographyTreeDefItemID', types.Integer, ForeignKey('GeographyTreeDefItem.GeographyTreeDefItemID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentID', types.Integer, ForeignKey('Geography.GeographyID'), nullable=True, unique=False)

    Accepted = orm.relationship('Geography', foreign_keys='Geography.AcceptedID', remote_side='Geography.GeographyID', backref=orm.backref('acceptedChildren', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Geography.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    GeographyTreeDef = orm.relationship('GeographyTreeDef', foreign_keys='Geography.GeographyTreeDefID', remote_side='GeographyTreeDef.GeographyTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    GeographyTreeDefItem = orm.relationship('GeographyTreeDefItem', foreign_keys='Geography.GeographyTreeDefItemID', remote_side='GeographyTreeDefItem.GeographyTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Geography.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Parent = orm.relationship('Geography', foreign_keys='Geography.ParentID', remote_side='Geography.GeographyID', backref=orm.backref('children', uselist=True))

class GeographyTreeDef(Base):
    tableid = 44
    _id = 'geographyTreeDefId'
    __tablename__ = 'geographytreedef'

    geographyTreeDefId = Column('Geographytreedefid', types.Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', types.Integer, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='GeographyTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GeographyTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GeographyTreeDefItem(Base):
    tableid = 45
    _id = 'geographyTreeDefItemId'
    __tablename__ = 'geographytreedefitem'

    geographyTreeDefItemId = Column('Geographytreedefitemid', types.Integer, primary_key=True)
    fullNameSeparator = Column('FullNameSeparator', types.String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', types.String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentItemID', types.Integer, ForeignKey('GeographyTreeDefItem.GeographyTreeDefItemID'), nullable=True, unique=False)
    treeDefID = Column('GeographyTreeDefID', types.Integer, ForeignKey('GeographyTreeDef.GeographyTreeDefID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='GeographyTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GeographyTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ParentItem = orm.relationship('GeographyTreeDefItem', foreign_keys='GeographyTreeDefItem.ParentItemID', remote_side='GeographyTreeDefItem.GeographyTreeDefItemID', backref=orm.backref('children', uselist=True))
    GeographyTreeDef = orm.relationship('GeographyTreeDef', foreign_keys='GeographyTreeDefItem.GeographyTreeDefID', remote_side='GeographyTreeDef.GeographyTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class GeologicTimePeriod(Base):
    tableid = 46
    _id = 'geologicTimePeriodId'
    __tablename__ = 'geologictimeperiod'

    geologicTimePeriodId = Column('Geologictimeperiodid', types.Integer, primary_key=True)
    endPeriod = Column('EndPeriod', types.Numeric, index=False, unique=False, nullable=True)
    endUncertainty = Column('EndUncertainty', types.Numeric, index=False, unique=False, nullable=True)
    fullName = Column('FullName', types.String, index=True, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', types.Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    isBioStrat = Column('IsBioStrat', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    nodeNumber = Column('NodeNumber', types.Integer, index=False, unique=False, nullable=True)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    standard = Column('Standard', types.String, index=False, unique=False, nullable=True)
    startPeriod = Column('StartPeriod', types.Numeric, index=False, unique=False, nullable=True)
    startUncertainty = Column('StartUncertainty', types.Numeric, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    acceptedGeologicTimePeriodID = Column('AcceptedID', types.Integer, ForeignKey('GeologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    definitionID = Column('GeologicTimePeriodTreeDefID', types.Integer, ForeignKey('GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID'), nullable=False, unique=False)
    definitionItemID = Column('GeologicTimePeriodTreeDefItemID', types.Integer, ForeignKey('GeologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefItemID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentID', types.Integer, ForeignKey('GeologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)

    Accepted = orm.relationship('GeologicTimePeriod', foreign_keys='GeologicTimePeriod.AcceptedID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('acceptedChildren', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='GeologicTimePeriod.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    GeologicTimePeriodTreeDef = orm.relationship('GeologicTimePeriodTreeDef', foreign_keys='GeologicTimePeriod.GeologicTimePeriodTreeDefID', remote_side='GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    GeologicTimePeriodTreeDefItem = orm.relationship('GeologicTimePeriodTreeDefItem', foreign_keys='GeologicTimePeriod.GeologicTimePeriodTreeDefItemID', remote_side='GeologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GeologicTimePeriod.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Parent = orm.relationship('GeologicTimePeriod', foreign_keys='GeologicTimePeriod.ParentID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('children', uselist=True))

class GeologicTimePeriodTreeDef(Base):
    tableid = 47
    _id = 'geologicTimePeriodTreeDefId'
    __tablename__ = 'geologictimeperiodtreedef'

    geologicTimePeriodTreeDefId = Column('Geologictimeperiodtreedefid', types.Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', types.Integer, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='GeologicTimePeriodTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GeologicTimePeriodTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GeologicTimePeriodTreeDefItem(Base):
    tableid = 48
    _id = 'geologicTimePeriodTreeDefItemId'
    __tablename__ = 'geologictimeperiodtreedefitem'

    geologicTimePeriodTreeDefItemId = Column('Geologictimeperiodtreedefitemid', types.Integer, primary_key=True)
    fullNameSeparator = Column('FullNameSeparator', types.String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', types.String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentItemID', types.Integer, ForeignKey('GeologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefItemID'), nullable=True, unique=False)
    treeDefID = Column('GeologicTimePeriodTreeDefID', types.Integer, ForeignKey('GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='GeologicTimePeriodTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GeologicTimePeriodTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ParentItem = orm.relationship('GeologicTimePeriodTreeDefItem', foreign_keys='GeologicTimePeriodTreeDefItem.ParentItemID', remote_side='GeologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefItemID', backref=orm.backref('children', uselist=True))
    GeologicTimePeriodTreeDef = orm.relationship('GeologicTimePeriodTreeDef', foreign_keys='GeologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefID', remote_side='GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class Gift(Base):
    tableid = 131
    _id = 'giftId'
    __tablename__ = 'gift'

    giftId = Column('Giftid', types.Integer, primary_key=True)
    contents = Column('Contents', types.Text, index=False, unique=False, nullable=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    dateReceived = Column('DateReceived', types.Date, index=False, unique=False, nullable=True)
    giftDate = Column('GiftDate', types.Date, index=True, unique=False, nullable=True)
    giftNumber = Column('GiftNumber', types.String, index=True, unique=False, nullable=False)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    isFinancialResponsibility = Column('IsFinancialResponsibility', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    purposeOfGift = Column('PurposeOfGift', types.String, index=False, unique=False, nullable=True)
    receivedComments = Column('ReceivedComments', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    specialConditions = Column('SpecialConditions', types.Text, index=False, unique=False, nullable=True)
    srcGeography = Column('SrcGeography', types.String, index=False, unique=False, nullable=True)
    srcTaxonomy = Column('SrcTaxonomy', types.String, index=False, unique=False, nullable=True)
    status = Column('Status', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    addressOfRecordID = Column('AddressOfRecordID', types.Integer, ForeignKey('AddressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    deaccessionID = Column('DeaccessionID', types.Integer, ForeignKey('Deaccession.DeaccessionID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    AddressOfRecord = orm.relationship('AddressOfRecord', foreign_keys='Gift.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Gift.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Deaccession = orm.relationship('Deaccession', foreign_keys='Gift.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('gifts', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='Gift.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='Gift.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Gift.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GiftAgent(Base):
    tableid = 133
    _id = 'giftAgentId'
    __tablename__ = 'giftagent'

    giftAgentId = Column('Giftagentid', types.Integer, primary_key=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    role = Column('Role', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    giftID = Column('GiftID', types.Integer, ForeignKey('Gift.GiftID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='GiftAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='GiftAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='GiftAgent.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Gift = orm.relationship('Gift', foreign_keys='GiftAgent.GiftID', remote_side='Gift.GiftID', backref=orm.backref('giftAgents', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GiftAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GiftAttachment(Base):
    tableid = 144
    _id = 'giftAttachmentId'
    __tablename__ = 'giftattachment'

    giftAttachmentId = Column('Giftattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    giftID = Column('GiftID', types.Integer, ForeignKey('Gift.GiftID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='GiftAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('giftAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='GiftAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Gift = orm.relationship('Gift', foreign_keys='GiftAttachment.GiftID', remote_side='Gift.GiftID', backref=orm.backref('giftAttachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GiftAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GiftPreparation(Base):
    tableid = 132
    _id = 'giftPreparationId'
    __tablename__ = 'giftpreparation'

    giftPreparationId = Column('Giftpreparationid', types.Integer, primary_key=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', types.String, index=False, unique=False, nullable=True)
    inComments = Column('InComments', types.Text, index=False, unique=False, nullable=True)
    outComments = Column('OutComments', types.Text, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', types.Integer, index=False, unique=False, nullable=True)
    receivedComments = Column('ReceivedComments', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    giftID = Column('GiftID', types.Integer, ForeignKey('Gift.GiftID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='GiftPreparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='GiftPreparation.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Gift = orm.relationship('Gift', foreign_keys='GiftPreparation.GiftID', remote_side='Gift.GiftID', backref=orm.backref('giftPreparations', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GiftPreparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='GiftPreparation.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('giftPreparations', uselist=True))

class GroupPerson(Base):
    tableid = 49
    _id = 'groupPersonId'
    __tablename__ = 'groupperson'

    groupPersonId = Column('Grouppersonid', types.Integer, primary_key=True)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=False, unique=False)
    groupID = Column('GroupID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    memberID = Column('MemberID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='GroupPerson.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='GroupPerson.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Group = orm.relationship('Agent', foreign_keys='GroupPerson.GroupID', remote_side='Agent.AgentID', backref=orm.backref('groups', uselist=True))
    Member = orm.relationship('Agent', foreign_keys='GroupPerson.MemberID', remote_side='Agent.AgentID', backref=orm.backref('members', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='GroupPerson.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class InfoRequest(Base):
    tableid = 50
    _id = 'infoRequestID'
    __tablename__ = 'inforequest'

    infoRequestID = Column('Inforequestid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    email = Column('Email', types.String, index=False, unique=False, nullable=True)
    firstName = Column('Firstname', types.String, index=False, unique=False, nullable=True)
    infoReqNumber = Column('InfoReqNumber', types.String, index=False, unique=False, nullable=True)
    institution = Column('Institution', types.String, index=False, unique=False, nullable=True)
    lastName = Column('Lastname', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    replyDate = Column('ReplyDate', types.Date, index=False, unique=False, nullable=True)
    requestDate = Column('RequestDate', types.Date, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='InfoRequest.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='InfoRequest.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='InfoRequest.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Institution(Base):
    tableid = 94
    _id = 'userGroupScopeId'
    __tablename__ = 'institution'

    userGroupScopeId = Column('Usergroupscopeid', types.Integer, primary_key=True)
    altName = Column('AltName', types.String, index=False, unique=False, nullable=True)
    code = Column('Code', types.String, index=False, unique=False, nullable=True)
    copyright = Column('Copyright', types.Text, index=False, unique=False, nullable=True)
    currentManagedRelVersion = Column('CurrentManagedRelVersion', types.String, index=False, unique=False, nullable=True)
    currentManagedSchemaVersion = Column('CurrentManagedSchemaVersion', types.String, index=False, unique=False, nullable=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    disclaimer = Column('Disclaimer', types.Text, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    hasBeenAsked = Column('HasBeenAsked', mysql_bit_type, index=False, unique=False, nullable=True)
    iconURI = Column('IconURI', types.String, index=False, unique=False, nullable=True)
    ipr = Column('Ipr', types.Text, index=False, unique=False, nullable=True)
    isAccessionsGlobal = Column('IsAccessionsGlobal', mysql_bit_type, index=False, unique=False, nullable=False)
    isAnonymous = Column('IsAnonymous', mysql_bit_type, index=False, unique=False, nullable=True)
    isReleaseManagedGlobally = Column('IsReleaseManagedGlobally', mysql_bit_type, index=False, unique=False, nullable=True)
    isSecurityOn = Column('IsSecurityOn', mysql_bit_type, index=False, unique=False, nullable=False)
    isServerBased = Column('IsServerBased', mysql_bit_type, index=False, unique=False, nullable=False)
    isSharingLocalities = Column('IsSharingLocalities', mysql_bit_type, index=False, unique=False, nullable=False)
    isSingleGeographyTree = Column('IsSingleGeographyTree', mysql_bit_type, index=False, unique=False, nullable=False)
    license = Column('License', types.Text, index=False, unique=False, nullable=True)
    lsidAuthority = Column('LsidAuthority', types.String, index=False, unique=False, nullable=True)
    minimumPwdLength = Column('MinimumPwdLength', types.Integer, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=True)
    regNumber = Column('RegNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    termsOfUse = Column('TermsOfUse', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    uri = Column('Uri', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    addressID = Column('AddressID', types.Integer, ForeignKey('Address.AddressID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    storageTreeDefID = Column('StorageTreeDefID', types.Integer, ForeignKey('StorageTreeDef.StorageTreeDefID'), nullable=True, unique=False)

    Address = orm.relationship('Address', foreign_keys='Institution.AddressID', remote_side='Address.AddressID', backref=orm.backref('insitutions', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Institution.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Institution.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    StorageTreeDef = orm.relationship('StorageTreeDef', foreign_keys='Institution.StorageTreeDefID', remote_side='StorageTreeDef.StorageTreeDefID', backref=orm.backref('institutions', uselist=True))

class InstitutionNetwork(Base):
    tableid = 142
    _id = 'institutionNetworkId'
    __tablename__ = 'institutionnetwork'

    institutionNetworkId = Column('Institutionnetworkid', types.Integer, primary_key=True)
    altName = Column('AltName', types.String, index=False, unique=False, nullable=True)
    code = Column('Code', types.String, index=False, unique=False, nullable=True)
    copyright = Column('Copyright', types.Text, index=False, unique=False, nullable=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    disclaimer = Column('Disclaimer', types.Text, index=False, unique=False, nullable=True)
    iconURI = Column('IconURI', types.String, index=False, unique=False, nullable=True)
    ipr = Column('Ipr', types.Text, index=False, unique=False, nullable=True)
    license = Column('License', types.Text, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    termsOfUse = Column('TermsOfUse', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    uri = Column('Uri', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    addressID = Column('AddressID', types.Integer, ForeignKey('Address.AddressID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Address = orm.relationship('Address', foreign_keys='InstitutionNetwork.AddressID', remote_side='Address.AddressID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='InstitutionNetwork.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='InstitutionNetwork.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Journal(Base):
    tableid = 51
    _id = 'journalId'
    __tablename__ = 'journal'

    journalId = Column('Journalid', types.Integer, primary_key=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    issn = Column('ISSN', types.String, index=False, unique=False, nullable=True)
    journalAbbreviation = Column('JournalAbbreviation', types.String, index=False, unique=False, nullable=True)
    journalName = Column('JournalName', types.String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    institutionID = Column('InstitutionID', types.Integer, ForeignKey('Institution.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='Journal.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Institution = orm.relationship('Institution', foreign_keys='Journal.InstitutionID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Journal.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LatLonPolygon(Base):
    tableid = 136
    _id = 'latLonPolygonId'
    __tablename__ = 'latlonpolygon'

    latLonPolygonId = Column('Latlonpolygonid', types.Integer, primary_key=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    isPolyline = Column('IsPolyline', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    localityID = Column('LocalityID', types.Integer, ForeignKey('Locality.LocalityID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    visualQueryID = Column('SpVisualQueryID', types.Integer, ForeignKey('SpVisualQuery.SpVisualQueryID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='LatLonPolygon.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Locality = orm.relationship('Locality', foreign_keys='LatLonPolygon.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('latLonpolygons', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LatLonPolygon.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpVisualQuery = orm.relationship('SpVisualQuery', foreign_keys='LatLonPolygon.SpVisualQueryID', remote_side='SpVisualQuery.SpVisualQueryID', backref=orm.backref('polygons', uselist=True))

class LatLonPolygonPnt(Base):
    tableid = 137
    _id = 'latLonPolygonPntId'
    __tablename__ = 'latlonpolygonpnt'

    latLonPolygonPntId = Column('Latlonpolygonpntid', types.Integer, primary_key=True)
    elevation = Column('Elevation', types.Integer, index=False, unique=False, nullable=True)
    latitude = Column('Latitude', types.Numeric, index=False, unique=False, nullable=False)
    longitude = Column('Longitude', types.Numeric, index=False, unique=False, nullable=False)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)

    latLonPolygonID = Column('LatLonPolygonID', types.Integer, ForeignKey('LatLonPolygon.LatLonPolygonID'), nullable=False, unique=False)

    LatLonPolygon = orm.relationship('LatLonPolygon', foreign_keys='LatLonPolygonPnt.LatLonPolygonID', remote_side='LatLonPolygon.LatLonPolygonID', backref=orm.backref('points', uselist=True))

class LithoStrat(Base):
    tableid = 100
    _id = 'lithoStratId'
    __tablename__ = 'lithostrat'

    lithoStratId = Column('Lithostratid', types.Integer, primary_key=True)
    fullName = Column('FullName', types.String, index=True, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', types.Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    nodeNumber = Column('NodeNumber', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    acceptedLithoStratID = Column('AcceptedID', types.Integer, ForeignKey('LithoStrat.LithoStratID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    definitionID = Column('LithoStratTreeDefID', types.Integer, ForeignKey('LithoStratTreeDef.LithoStratTreeDefID'), nullable=False, unique=False)
    definitionItemID = Column('LithoStratTreeDefItemID', types.Integer, ForeignKey('LithoStratTreeDefItem.LithoStratTreeDefItemID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentID', types.Integer, ForeignKey('LithoStrat.LithoStratID'), nullable=True, unique=False)

    Accepted = orm.relationship('LithoStrat', foreign_keys='LithoStrat.AcceptedID', remote_side='LithoStrat.LithoStratID', backref=orm.backref('acceptedChildren', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='LithoStrat.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    LithoStratTreeDef = orm.relationship('LithoStratTreeDef', foreign_keys='LithoStrat.LithoStratTreeDefID', remote_side='LithoStratTreeDef.LithoStratTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    LithoStratTreeDefItem = orm.relationship('LithoStratTreeDefItem', foreign_keys='LithoStrat.LithoStratTreeDefItemID', remote_side='LithoStratTreeDefItem.LithoStratTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LithoStrat.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Parent = orm.relationship('LithoStrat', foreign_keys='LithoStrat.ParentID', remote_side='LithoStrat.LithoStratID', backref=orm.backref('children', uselist=True))

class LithoStratTreeDef(Base):
    tableid = 101
    _id = 'lithoStratTreeDefId'
    __tablename__ = 'lithostrattreedef'

    lithoStratTreeDefId = Column('Lithostrattreedefid', types.Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', types.Integer, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='LithoStratTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LithoStratTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LithoStratTreeDefItem(Base):
    tableid = 102
    _id = 'lithoStratTreeDefItemId'
    __tablename__ = 'lithostrattreedefitem'

    lithoStratTreeDefItemId = Column('Lithostrattreedefitemid', types.Integer, primary_key=True)
    fullNameSeparator = Column('FullNameSeparator', types.String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', types.String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentItemID', types.Integer, ForeignKey('LithoStratTreeDefItem.LithoStratTreeDefItemID'), nullable=True, unique=False)
    treeDefID = Column('LithoStratTreeDefID', types.Integer, ForeignKey('LithoStratTreeDef.LithoStratTreeDefID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='LithoStratTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LithoStratTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ParentItem = orm.relationship('LithoStratTreeDefItem', foreign_keys='LithoStratTreeDefItem.ParentItemID', remote_side='LithoStratTreeDefItem.LithoStratTreeDefItemID', backref=orm.backref('children', uselist=True))
    LithoStratTreeDef = orm.relationship('LithoStratTreeDef', foreign_keys='LithoStratTreeDefItem.LithoStratTreeDefID', remote_side='LithoStratTreeDef.LithoStratTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class Loan(Base):
    tableid = 52
    _id = 'loanId'
    __tablename__ = 'loan'

    loanId = Column('Loanid', types.Integer, primary_key=True)
    contents = Column('Contents', types.Text, index=False, unique=False, nullable=True)
    currentDueDate = Column('CurrentDueDate', types.Date, index=True, unique=False, nullable=True)
    dateClosed = Column('DateClosed', types.Date, index=False, unique=False, nullable=True)
    dateReceived = Column('DateReceived', types.Date, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    isClosed = Column('IsClosed', mysql_bit_type, index=False, unique=False, nullable=True)
    isFinancialResponsibility = Column('IsFinancialResponsibility', mysql_bit_type, index=False, unique=False, nullable=True)
    loanDate = Column('LoanDate', types.Date, index=True, unique=False, nullable=True)
    loanNumber = Column('LoanNumber', types.String, index=True, unique=False, nullable=False)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    originalDueDate = Column('OriginalDueDate', types.Date, index=False, unique=False, nullable=True)
    overdueNotiSentDate = Column('OverdueNotiSetDate', types.Date, index=False, unique=False, nullable=True)
    purposeOfLoan = Column('PurposeOfLoan', types.String, index=False, unique=False, nullable=True)
    receivedComments = Column('ReceivedComments', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    specialConditions = Column('SpecialConditions', types.Text, index=False, unique=False, nullable=True)
    srcGeography = Column('SrcGeography', types.String, index=False, unique=False, nullable=True)
    srcTaxonomy = Column('SrcTaxonomy', types.String, index=False, unique=False, nullable=True)
    status = Column('Status', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    addressOfRecordID = Column('AddressOfRecordID', types.Integer, ForeignKey('AddressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    AddressOfRecord = orm.relationship('AddressOfRecord', foreign_keys='Loan.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('loans', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Loan.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='Loan.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='Loan.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Loan.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LoanAgent(Base):
    tableid = 53
    _id = 'loanAgentId'
    __tablename__ = 'loanagent'

    loanAgentId = Column('Loanagentid', types.Integer, primary_key=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    role = Column('Role', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    loanID = Column('LoanID', types.Integer, ForeignKey('Loan.LoanID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='LoanAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='LoanAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='LoanAgent.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Loan = orm.relationship('Loan', foreign_keys='LoanAgent.LoanID', remote_side='Loan.LoanID', backref=orm.backref('loanAgents', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LoanAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LoanAttachment(Base):
    tableid = 114
    _id = 'loanAttachmentId'
    __tablename__ = 'loanattachment'

    loanAttachmentId = Column('Loanattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    loanID = Column('LoanID', types.Integer, ForeignKey('Loan.LoanID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='LoanAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('loanAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='LoanAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Loan = orm.relationship('Loan', foreign_keys='LoanAttachment.LoanID', remote_side='Loan.LoanID', backref=orm.backref('loanAttachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LoanAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LoanPreparation(Base):
    tableid = 54
    _id = 'loanPreparationId'
    __tablename__ = 'loanpreparation'

    loanPreparationId = Column('Loanpreparationid', types.Integer, primary_key=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', types.String, index=False, unique=False, nullable=True)
    inComments = Column('InComments', types.Text, index=False, unique=False, nullable=True)
    isResolved = Column('IsResolved', mysql_bit_type, index=False, unique=False, nullable=False)
    outComments = Column('OutComments', types.Text, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', types.Integer, index=False, unique=False, nullable=True)
    quantityResolved = Column('QuantityResolved', types.Integer, index=False, unique=False, nullable=True)
    quantityReturned = Column('QuantityReturned', types.Integer, index=False, unique=False, nullable=True)
    receivedComments = Column('ReceivedComments', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    loanID = Column('LoanID', types.Integer, ForeignKey('Loan.LoanID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='LoanPreparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='LoanPreparation.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Loan = orm.relationship('Loan', foreign_keys='LoanPreparation.LoanID', remote_side='Loan.LoanID', backref=orm.backref('loanPreparations', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LoanPreparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='LoanPreparation.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('loanPreparations', uselist=True))

class LoanReturnPreparation(Base):
    tableid = 55
    _id = 'loanReturnPreparationId'
    __tablename__ = 'loanreturnpreparation'

    loanReturnPreparationId = Column('Loanreturnpreparationid', types.Integer, primary_key=True)
    quantityResolved = Column('QuantityResolved', types.Integer, index=False, unique=False, nullable=True)
    quantityReturned = Column('QuantityReturned', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    returnedDate = Column('ReturnedDate', types.Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    loanPreparationID = Column('LoanPreparationID', types.Integer, ForeignKey('LoanPreparation.LoanPreparationID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    receivedByID = Column('ReceivedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='LoanReturnPreparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='LoanReturnPreparation.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    LoanPreparation = orm.relationship('LoanPreparation', foreign_keys='LoanReturnPreparation.LoanPreparationID', remote_side='LoanPreparation.LoanPreparationID', backref=orm.backref('loanReturnPreparations', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LoanReturnPreparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReceivedBy = orm.relationship('Agent', foreign_keys='LoanReturnPreparation.ReceivedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Locality(Base):
    tableid = 2
    _id = 'localityId'
    __tablename__ = 'locality'

    localityId = Column('Localityid', types.Integer, primary_key=True)
    datum = Column('Datum', types.String, index=False, unique=False, nullable=True)
    elevationAccuracy = Column('ElevationAccuracy', types.Numeric, index=False, unique=False, nullable=True)
    elevationMethod = Column('ElevationMethod', types.String, index=False, unique=False, nullable=True)
    gml = Column('GML', types.Text, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=False, unique=False, nullable=True)
    lat1text = Column('Lat1Text', types.String, index=False, unique=False, nullable=True)
    lat2text = Column('Lat2Text', types.String, index=False, unique=False, nullable=True)
    latLongAccuracy = Column('LatLongAccuracy', types.Numeric, index=False, unique=False, nullable=True)
    latLongMethod = Column('LatLongMethod', types.String, index=False, unique=False, nullable=True)
    latLongType = Column('LatLongType', types.String, index=False, unique=False, nullable=True)
    latitude1 = Column('Latitude1', types.Numeric, index=False, unique=False, nullable=True)
    latitude2 = Column('Latitude2', types.Numeric, index=False, unique=False, nullable=True)
    localityName = Column('LocalityName', types.String, index=True, unique=False, nullable=False)
    long1text = Column('Long1Text', types.String, index=False, unique=False, nullable=True)
    long2text = Column('Long2Text', types.String, index=False, unique=False, nullable=True)
    longitude1 = Column('Longitude1', types.Numeric, index=False, unique=False, nullable=True)
    longitude2 = Column('Longitude2', types.Numeric, index=False, unique=False, nullable=True)
    maxElevation = Column('MaxElevation', types.Numeric, index=False, unique=False, nullable=True)
    minElevation = Column('MinElevation', types.Numeric, index=False, unique=False, nullable=True)
    namedPlace = Column('NamedPlace', types.String, index=True, unique=False, nullable=True)
    originalElevationUnit = Column('OriginalElevationUnit', types.String, index=False, unique=False, nullable=True)
    originalLatLongUnit = Column('OriginalLatLongUnit', types.Integer, index=False, unique=False, nullable=True)
    relationToNamedPlace = Column('RelationToNamedPlace', types.String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    sgrStatus = Column('SGRStatus', types.Integer, index=False, unique=False, nullable=True)
    shortName = Column('ShortName', types.String, index=False, unique=False, nullable=True)
    srcLatLongUnit = Column('SrcLatLongUnit', types.Integer, index=False, unique=False, nullable=False)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    uniqueIdentifier = Column('UniqueIdentifier', types.String, index=True, unique=False, nullable=True)
    verbatimElevation = Column('VerbatimElevation', types.String, index=False, unique=False, nullable=True)
    verbatimLatitude = Column('VerbatimLatitude', types.String, index=False, unique=False, nullable=True)
    verbatimLongitude = Column('VerbatimLongitude', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    geographyID = Column('GeographyID', types.Integer, ForeignKey('Geography.GeographyID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    paleoContextID = Column('PaleoContextID', types.Integer, ForeignKey('PaleoContext.PaleoContextID'), nullable=True, unique=False)
    visibilitySetByID = Column('VisibilitySetByID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='Locality.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='Locality.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Geography = orm.relationship('Geography', foreign_keys='Locality.GeographyID', remote_side='Geography.GeographyID', backref=orm.backref('localities', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Locality.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PaleoContext = orm.relationship('PaleoContext', foreign_keys='Locality.PaleoContextID', remote_side='PaleoContext.PaleoContextID', backref=orm.backref('localities', uselist=True))
    VisibilitySetBy = orm.relationship('SpecifyUser', foreign_keys='Locality.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class LocalityAttachment(Base):
    tableid = 115
    _id = 'localityAttachmentId'
    __tablename__ = 'localityattachment'

    localityAttachmentId = Column('Localityattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    localityID = Column('LocalityID', types.Integer, ForeignKey('Locality.LocalityID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='LocalityAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('localityAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='LocalityAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Locality = orm.relationship('Locality', foreign_keys='LocalityAttachment.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('localityAttachments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LocalityAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LocalityCitation(Base):
    tableid = 57
    _id = 'localityCitationId'
    __tablename__ = 'localitycitation'

    localityCitationId = Column('Localitycitationid', types.Integer, primary_key=True)
    figureNumber = Column('FigureNumber', types.String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', types.String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    localityID = Column('LocalityID', types.Integer, ForeignKey('Locality.LocalityID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='LocalityCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='LocalityCitation.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Locality = orm.relationship('Locality', foreign_keys='LocalityCitation.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('localityCitations', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LocalityCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='LocalityCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('localityCitations', uselist=True))

class LocalityDetail(Base):
    tableid = 124
    _id = 'localityDetailId'
    __tablename__ = 'localitydetail'

    localityDetailId = Column('Localitydetailid', types.Integer, primary_key=True)
    baseMeridian = Column('BaseMeridian', types.String, index=False, unique=False, nullable=True)
    drainage = Column('Drainage', types.String, index=False, unique=False, nullable=True)
    endDepth = Column('EndDepth', types.Numeric, index=False, unique=False, nullable=True)
    endDepthUnit = Column('EndDepthUnit', types.String, index=False, unique=False, nullable=True)
    endDepthVerbatim = Column('EndDepthVerbatim', types.String, index=False, unique=False, nullable=True)
    gml = Column('GML', types.Text, index=False, unique=False, nullable=True)
    hucCode = Column('HucCode', types.String, index=False, unique=False, nullable=True)
    island = Column('Island', types.String, index=False, unique=False, nullable=True)
    islandGroup = Column('IslandGroup', types.String, index=False, unique=False, nullable=True)
    mgrsZone = Column('MgrsZone', types.String, index=False, unique=False, nullable=True)
    nationalParkName = Column('NationalParkName', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    paleoLat = Column('PaleoLat', types.String, index=False, unique=False, nullable=True)
    paleoLng = Column('PaleoLng', types.String, index=False, unique=False, nullable=True)
    rangeDesc = Column('RangeDesc', types.String, index=False, unique=False, nullable=True)
    rangeDirection = Column('RangeDirection', types.String, index=False, unique=False, nullable=True)
    section = Column('Section', types.String, index=False, unique=False, nullable=True)
    sectionPart = Column('SectionPart', types.String, index=False, unique=False, nullable=True)
    startDepth = Column('StartDepth', types.Numeric, index=False, unique=False, nullable=True)
    startDepthUnit = Column('StartDepthUnit', types.String, index=False, unique=False, nullable=True)
    startDepthVerbatim = Column('StartDepthVerbatim', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    township = Column('Township', types.String, index=False, unique=False, nullable=True)
    townshipDirection = Column('TownshipDirection', types.String, index=False, unique=False, nullable=True)
    utmDatum = Column('UtmDatum', types.String, index=False, unique=False, nullable=True)
    utmEasting = Column('UtmEasting', types.Numeric, index=False, unique=False, nullable=True)
    utmFalseEasting = Column('UtmFalseEasting', types.Integer, index=False, unique=False, nullable=True)
    utmFalseNorthing = Column('UtmFalseNorthing', types.Integer, index=False, unique=False, nullable=True)
    utmNorthing = Column('UtmNorthing', types.Numeric, index=False, unique=False, nullable=True)
    utmOrigLatitude = Column('UtmOrigLatitude', types.Numeric, index=False, unique=False, nullable=True)
    utmOrigLongitude = Column('UtmOrigLongitude', types.Numeric, index=False, unique=False, nullable=True)
    utmScale = Column('UtmScale', types.Numeric, index=False, unique=False, nullable=True)
    utmZone = Column('UtmZone', types.Integer, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    waterBody = Column('WaterBody', types.String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    localityID = Column('LocalityID', types.Integer, ForeignKey('Locality.LocalityID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='LocalityDetail.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Locality = orm.relationship('Locality', foreign_keys='LocalityDetail.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('localityDetails', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LocalityDetail.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LocalityNameAlias(Base):
    tableid = 120
    _id = 'localityNameAliasId'
    __tablename__ = 'localitynamealias'

    localityNameAliasId = Column('Localitynamealiasid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    source = Column('Source', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    localityID = Column('LocalityID', types.Integer, ForeignKey('Locality.LocalityID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='LocalityNameAlias.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='LocalityNameAlias.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Locality = orm.relationship('Locality', foreign_keys='LocalityNameAlias.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('localityNameAliass', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='LocalityNameAlias.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class MaterialSample(Base):
    tableid = 151
    _id = 'materialSampleId'
    __tablename__ = 'materialsample'

    materialSampleId = Column('Materialsampleid', types.Integer, primary_key=True)
    GGBN_absorbanceRatio260_230 = Column('GGBNAbsorbanceRatio260_230', types.Numeric, index=False, unique=False, nullable=True)
    GGBN_absorbanceRatio260_280 = Column('GGBNAbsorbanceRatio260_280', types.Numeric, index=False, unique=False, nullable=True)
    GGBN_absorbanceRatioMethod = Column('GGBNRAbsorbanceRatioMethod', types.String, index=False, unique=False, nullable=True)
    GGBN_concentration = Column('GGBNConcentration', types.Numeric, index=False, unique=False, nullable=True)
    GGBN_concentrationUnit = Column('GGBNConcentrationUnit', types.String, index=False, unique=False, nullable=True)
    GGBN_materialSampleType = Column('GGBNMaterialSampleType', types.String, index=False, unique=False, nullable=True)
    GGBN_medium = Column('GGBNMedium', types.String, index=False, unique=False, nullable=True)
    GGBN_purificationMethod = Column('GGBNPurificationMethod', types.String, index=False, unique=False, nullable=True)
    GGBN_quality = Column('GGBNQuality', types.String, index=False, unique=False, nullable=True)
    GGBN_qualityCheckDate = Column('GGBNQualityCheckDate', types.Date, index=False, unique=False, nullable=True)
    GGBN_qualityRemarks = Column('GGBNQualityRemarks', types.Text, index=False, unique=False, nullable=True)
    GGBN_sampleDesignation = Column('GGBNSampleDesignation', types.String, index=True, unique=False, nullable=True)
    GGBN_sampleSize = Column('GGBNSampleSize', types.Numeric, index=False, unique=False, nullable=True)
    GGBN_volume = Column('GGBNVolume', types.Numeric, index=False, unique=False, nullable=True)
    GGBN_volumeUnit = Column('GGBNVolumeUnit', types.String, index=False, unique=False, nullable=True)
    GGBN_weight = Column('GGBNWeight', types.Numeric, index=False, unique=False, nullable=True)
    GGBN_weightMethod = Column('GGBNWeightMethod', types.String, index=False, unique=False, nullable=True)
    GGBN_weightUnit = Column('GGBNWeightUnit', types.String, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=False, unique=False, nullable=False)
    extractionDate = Column('ExtractionDate', types.Date, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', types.Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', types.Integer, index=False, unique=False, nullable=True)
    reservedNumber3 = Column('ReservedNumber3', types.Numeric, index=False, unique=False, nullable=True)
    reservedNumber4 = Column('ReservedNumber4', types.Numeric, index=False, unique=False, nullable=True)
    reservedText3 = Column('ReservedText3', types.Text, index=False, unique=False, nullable=True)
    reservedText4 = Column('ReservedText4', types.Text, index=False, unique=False, nullable=True)
    sraBioProjectID = Column('SRABioProjectID', types.String, index=False, unique=False, nullable=True)
    sraBioSampleID = Column('SRABioSampleID', types.String, index=False, unique=False, nullable=True)
    sraProjectID = Column('SRAProjectID', types.String, index=False, unique=False, nullable=True)
    sraSampleID = Column('SRASampleID', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    extractorID = Column('ExtractorID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='MaterialSample.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Extractor = orm.relationship('Agent', foreign_keys='MaterialSample.ExtractorID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='MaterialSample.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='MaterialSample.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('materialSamples', uselist=True))

class MorphBankView(Base):
    tableid = 138
    _id = 'morphBankViewId'
    __tablename__ = 'morphbankview'

    morphBankViewId = Column('Morphbankviewid', types.Integer, primary_key=True)
    developmentState = Column('DevelopmentState', types.String, index=False, unique=False, nullable=True)
    form = Column('Form', types.String, index=False, unique=False, nullable=True)
    imagingPreparationTechnique = Column('ImagingPreparationTechnique', types.String, index=False, unique=False, nullable=True)
    imagingTechnique = Column('ImagingTechnique', types.String, index=False, unique=False, nullable=True)
    morphBankExternalViewId = Column('MorphBankExternalViewID', types.Integer, index=False, unique=False, nullable=True)
    sex = Column('Sex', types.String, index=False, unique=False, nullable=True)
    specimenPart = Column('SpecimenPart', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    viewAngle = Column('ViewAngle', types.String, index=False, unique=False, nullable=True)
    viewName = Column('ViewName', types.String, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='MorphBankView.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='MorphBankView.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class OtherIdentifier(Base):
    tableid = 61
    _id = 'otherIdentifierId'
    __tablename__ = 'otheridentifier'

    otherIdentifierId = Column('Otheridentifierid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', types.Integer, index=False, unique=False, nullable=True)
    identifier = Column('Identifier', types.String, index=False, unique=False, nullable=False)
    institution = Column('Institution', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    agent1ID = Column('Agent1ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent2ID = Column('Agent2ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent1 = orm.relationship('Agent', foreign_keys='OtherIdentifier.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent2 = orm.relationship('Agent', foreign_keys='OtherIdentifier.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CollectionObject = orm.relationship('CollectionObject', foreign_keys='OtherIdentifier.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('otherIdentifiers', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='OtherIdentifier.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='OtherIdentifier.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PaleoContext(Base):
    tableid = 32
    _id = 'paleoContextId'
    __tablename__ = 'paleocontext'

    paleoContextId = Column('Paleocontextid', types.Integer, primary_key=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    paleoContextName = Column('PaleoContextName', types.String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    bioStratID = Column('BioStratID', types.Integer, ForeignKey('GeologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)
    chronosStratID = Column('ChronosStratID', types.Integer, ForeignKey('GeologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)
    chronosStratEndID = Column('ChronosStratEndID', types.Integer, ForeignKey('GeologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    lithoStratID = Column('LithoStratID', types.Integer, ForeignKey('LithoStrat.LithoStratID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    BioStrat = orm.relationship('GeologicTimePeriod', foreign_keys='PaleoContext.BioStratID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('bioStratsPaleoContext', uselist=True))
    ChronosStrat = orm.relationship('GeologicTimePeriod', foreign_keys='PaleoContext.ChronosStratID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('chronosStratsPaleoContext', uselist=True))
    ChronosStratEnd = orm.relationship('GeologicTimePeriod', foreign_keys='PaleoContext.ChronosStratEndID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='PaleoContext.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='PaleoContext.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    LithoStrat = orm.relationship('LithoStrat', foreign_keys='PaleoContext.LithoStratID', remote_side='LithoStrat.LithoStratID', backref=orm.backref('paleoContexts', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PaleoContext.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PcrPerson(Base):
    tableid = 161
    _id = 'pcrPersonId'
    __tablename__ = 'pcrperson'

    pcrPersonId = Column('Pcrpersonid', types.Integer, primary_key=True)
    orderNumber = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    agentID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    dnaSequenceID = Column('DNASequenceID', types.Integer, ForeignKey('DNASequence.DnaSequenceID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent = orm.relationship('Agent', foreign_keys='PcrPerson.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='PcrPerson.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    DNASequence = orm.relationship('DNASequence', foreign_keys='PcrPerson.DNASequenceID', remote_side='DNASequence.DnaSequenceID', backref=orm.backref('pcrPersons', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PcrPerson.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Permit(Base):
    tableid = 6
    _id = 'permitId'
    __tablename__ = 'permit'

    permitId = Column('Permitid', types.Integer, primary_key=True)
    copyright = Column('Copyright', types.String, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', types.Date, index=False, unique=False, nullable=True)
    isAvailable = Column('IsAvailable', mysql_bit_type, index=False, unique=False, nullable=True)
    isRequired = Column('IsRequired', mysql_bit_type, index=False, unique=False, nullable=True)
    issuedDate = Column('IssuedDate', types.Date, index=True, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    permitNumber = Column('PermitNumber', types.String, index=True, unique=False, nullable=False)
    permitText = Column('PermitText', types.Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    renewalDate = Column('RenewalDate', types.Date, index=False, unique=False, nullable=True)
    reservedInteger1 = Column('ReservedInteger1', types.Integer, index=False, unique=False, nullable=True)
    reservedInteger2 = Column('ReservedInteger2', types.Integer, index=False, unique=False, nullable=True)
    reservedText3 = Column('ReservedText3', types.String, index=False, unique=False, nullable=True)
    reservedText4 = Column('ReservedText4', types.String, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', types.Date, index=False, unique=False, nullable=True)
    status = Column('Status', types.String, index=False, unique=False, nullable=True)
    statusQualifier = Column('StatusQualifier', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    institutionID = Column('InstitutionID', types.Integer, ForeignKey('Institution.UserGroupScopeId'), nullable=False, unique=False)
    issuedByID = Column('IssuedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    issuedToID = Column('IssuedToID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='Permit.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Institution = orm.relationship('Institution', foreign_keys='Permit.InstitutionID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    IssuedBy = orm.relationship('Agent', foreign_keys='Permit.IssuedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    IssuedTo = orm.relationship('Agent', foreign_keys='Permit.IssuedToID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Permit.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PermitAttachment(Base):
    tableid = 116
    _id = 'permitAttachmentId'
    __tablename__ = 'permitattachment'

    permitAttachmentId = Column('Permitattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    permitID = Column('PermitID', types.Integer, ForeignKey('Permit.PermitID'), nullable=False, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='PermitAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('permitAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='PermitAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PermitAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Permit = orm.relationship('Permit', foreign_keys='PermitAttachment.PermitID', remote_side='Permit.PermitID', backref=orm.backref('permitAttachments', uselist=True))

class PickList(Base):
    tableid = 500
    _id = 'pickListId'
    __tablename__ = 'picklist'

    pickListId = Column('Picklistid', types.Integer, primary_key=True)
    fieldName = Column('FieldName', types.String, index=False, unique=False, nullable=True)
    filterFieldName = Column('FilterFieldName', types.String, index=False, unique=False, nullable=True)
    filterValue = Column('FilterValue', types.String, index=False, unique=False, nullable=True)
    formatter = Column('Formatter', types.String, index=False, unique=False, nullable=True)
    isSystem = Column('IsSystem', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    readOnly = Column('ReadOnly', mysql_bit_type, index=False, unique=False, nullable=False)
    sizeLimit = Column('SizeLimit', types.Integer, index=False, unique=False, nullable=True)
    sortType = Column('SortType', types.Integer, index=False, unique=False, nullable=True)
    tableName = Column('TableName', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.Integer, index=False, unique=False, nullable=False)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='PickList.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('pickLists', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='PickList.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PickList.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PickListItem(Base):
    tableid = 501
    _id = 'pickListItemId'
    __tablename__ = 'picklistitem'

    pickListItemId = Column('Picklistitemid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=False, unique=False, nullable=False)
    value = Column('Value', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    pickListID = Column('PickListID', types.Integer, ForeignKey('PickList.PickListID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='PickListItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PickListItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PickList = orm.relationship('PickList', foreign_keys='PickListItem.PickListID', remote_side='PickList.PickListID', backref=orm.backref('pickListItems', uselist=True))

class PrepType(Base):
    tableid = 65
    _id = 'prepTypeId'
    __tablename__ = 'preptype'

    prepTypeId = Column('Preptypeid', types.Integer, primary_key=True)
    isLoanable = Column('IsLoanable', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='PrepType.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('prepTypes', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='PrepType.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PrepType.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Preparation(Base):
    tableid = 63
    _id = 'preparationId'
    __tablename__ = 'preparation'

    preparationId = Column('Preparationid', types.Integer, primary_key=True)
    barCode = Column('BarCode', types.String, index=True, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    countAmt = Column('CountAmt', types.Integer, index=False, unique=False, nullable=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', types.Integer, index=False, unique=False, nullable=True)
    date3 = Column('Date3', types.Date, index=False, unique=False, nullable=True)
    date3Precision = Column('Date3Precision', types.Integer, index=False, unique=False, nullable=True)
    date4 = Column('Date4', types.Date, index=False, unique=False, nullable=True)
    date4Precision = Column('Date4Precision', types.Integer, index=False, unique=False, nullable=True)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    preparedDate = Column('PreparedDate', types.Date, index=False, unique=False, nullable=True)
    preparedDatePrecision = Column('PreparedDatePrecision', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', types.Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', types.Integer, index=False, unique=False, nullable=True)
    sampleNumber = Column('SampleNumber', types.String, index=True, unique=False, nullable=True)
    status = Column('Status', types.String, index=False, unique=False, nullable=True)
    storageLocation = Column('StorageLocation', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.Text, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.Text, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.Text, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    alternateStorageID = Column('AlternateStorageID', types.Integer, ForeignKey('Storage.StorageID'), nullable=True, unique=False)
    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    prepTypeID = Column('PrepTypeID', types.Integer, ForeignKey('PrepType.PrepTypeID'), nullable=False, unique=False)
    preparationAttributeID = Column('PreparationAttributeID', types.Integer, ForeignKey('PreparationAttribute.PreparationAttributeID'), nullable=True, unique=False)
    preparedByAgentID = Column('PreparedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    storageID = Column('StorageID', types.Integer, ForeignKey('Storage.StorageID'), nullable=True, unique=False)

    AlternateStorage = orm.relationship('Storage', foreign_keys='Preparation.AlternateStorageID', remote_side='Storage.StorageID', backref=orm.backref('None', uselist=True))
    CollectionObject = orm.relationship('CollectionObject', foreign_keys='Preparation.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('preparations', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Preparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Preparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PrepType = orm.relationship('PrepType', foreign_keys='Preparation.PrepTypeID', remote_side='PrepType.PrepTypeID', backref=orm.backref('None', uselist=True))
    PreparationAttribute = orm.relationship('PreparationAttribute', foreign_keys='Preparation.PreparationAttributeID', remote_side='PreparationAttribute.PreparationAttributeID', backref=orm.backref('preparations', uselist=True))
    PreparedBy = orm.relationship('Agent', foreign_keys='Preparation.PreparedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Storage = orm.relationship('Storage', foreign_keys='Preparation.StorageID', remote_side='Storage.StorageID', backref=orm.backref('preparations', uselist=True))

class PreparationAttachment(Base):
    tableid = 117
    _id = 'preparationAttachmentId'
    __tablename__ = 'preparationattachment'

    preparationAttachmentId = Column('Preparationattachmentid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=False, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='PreparationAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('preparationAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='PreparationAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PreparationAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='PreparationAttachment.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('preparationAttachments', uselist=True))

class PreparationAttr(Base):
    tableid = 64
    _id = 'attrId'
    __tablename__ = 'preparationattr'

    attrId = Column('Attrid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    dblValue = Column('DoubleValue', types.Float, index=False, unique=False, nullable=True)
    strValue = Column('StrValue', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    definitionID = Column('AttributeDefID', types.Integer, ForeignKey('AttributeDef.AttributeDefID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationId', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='PreparationAttr.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    AttributeDef = orm.relationship('AttributeDef', foreign_keys='PreparationAttr.AttributeDefID', remote_side='AttributeDef.AttributeDefID', backref=orm.backref('preparationAttrs', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PreparationAttr.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='PreparationAttr.PreparationId', remote_side='Preparation.PreparationID', backref=orm.backref('preparationAttrs', uselist=True))

class PreparationAttribute(Base):
    tableid = 91
    _id = 'preparationAttributeId'
    __tablename__ = 'preparationattribute'

    preparationAttributeId = Column('Preparationattributeid', types.Integer, primary_key=True)
    attrDate = Column('AttrDate', types.Date, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Integer, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Integer, index=False, unique=False, nullable=True)
    number6 = Column('Number6', types.Integer, index=False, unique=False, nullable=True)
    number7 = Column('Number7', types.Integer, index=False, unique=False, nullable=True)
    number8 = Column('Number8', types.Integer, index=False, unique=False, nullable=True)
    number9 = Column('Number9', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.Text, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', types.String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', types.String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', types.String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', types.String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', types.String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text20 = Column('Text20', types.String, index=False, unique=False, nullable=True)
    text21 = Column('Text21', types.String, index=False, unique=False, nullable=True)
    text22 = Column('Text22', types.String, index=False, unique=False, nullable=True)
    text23 = Column('Text23', types.String, index=False, unique=False, nullable=True)
    text24 = Column('Text24', types.String, index=False, unique=False, nullable=True)
    text25 = Column('Text25', types.String, index=False, unique=False, nullable=True)
    text26 = Column('Text26', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='PreparationAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PreparationAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PreparationProperty(Base):
    tableid = 154
    _id = 'preparationPropertyId'
    __tablename__ = 'preparationproperty'

    preparationPropertyId = Column('Preparationpropertyid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date10 = Column('Date10', types.Date, index=False, unique=False, nullable=True)
    date11 = Column('Date11', types.Date, index=False, unique=False, nullable=True)
    date12 = Column('Date12', types.Date, index=False, unique=False, nullable=True)
    date13 = Column('Date13', types.Date, index=False, unique=False, nullable=True)
    date14 = Column('Date14', types.Date, index=False, unique=False, nullable=True)
    date15 = Column('Date15', types.Date, index=False, unique=False, nullable=True)
    date16 = Column('Date16', types.Date, index=False, unique=False, nullable=True)
    date17 = Column('Date17', types.Date, index=False, unique=False, nullable=True)
    date18 = Column('Date18', types.Date, index=False, unique=False, nullable=True)
    date19 = Column('Date19', types.Date, index=False, unique=False, nullable=True)
    date2 = Column('Date2', types.Date, index=False, unique=False, nullable=True)
    date20 = Column('Date20', types.Date, index=False, unique=False, nullable=True)
    date3 = Column('Date3', types.Date, index=False, unique=False, nullable=True)
    date4 = Column('Date4', types.Date, index=False, unique=False, nullable=True)
    date5 = Column('Date5', types.Date, index=False, unique=False, nullable=True)
    date6 = Column('Date6', types.Date, index=False, unique=False, nullable=True)
    date7 = Column('Date7', types.Date, index=False, unique=False, nullable=True)
    date8 = Column('Date8', types.Date, index=False, unique=False, nullable=True)
    date9 = Column('Date9', types.Date, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', types.Integer, index=False, unique=False, nullable=True)
    integer11 = Column('Integer11', types.Integer, index=False, unique=False, nullable=True)
    integer12 = Column('Integer12', types.Integer, index=False, unique=False, nullable=True)
    integer13 = Column('Integer13', types.Integer, index=False, unique=False, nullable=True)
    integer14 = Column('Integer14', types.Integer, index=False, unique=False, nullable=True)
    integer15 = Column('Integer15', types.Integer, index=False, unique=False, nullable=True)
    integer16 = Column('Integer16', types.Integer, index=False, unique=False, nullable=True)
    integer17 = Column('Integer17', types.Integer, index=False, unique=False, nullable=True)
    integer18 = Column('Integer18', types.Integer, index=False, unique=False, nullable=True)
    integer19 = Column('Integer19', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer20 = Column('Integer20', types.Integer, index=False, unique=False, nullable=True)
    integer21 = Column('Integer21', types.Integer, index=False, unique=False, nullable=True)
    integer22 = Column('Integer22', types.Integer, index=False, unique=False, nullable=True)
    integer23 = Column('Integer23', types.Integer, index=False, unique=False, nullable=True)
    integer24 = Column('Integer24', types.Integer, index=False, unique=False, nullable=True)
    integer25 = Column('Integer25', types.Integer, index=False, unique=False, nullable=True)
    integer26 = Column('Integer26', types.Integer, index=False, unique=False, nullable=True)
    integer27 = Column('Integer27', types.Integer, index=False, unique=False, nullable=True)
    integer28 = Column('Integer28', types.Integer, index=False, unique=False, nullable=True)
    integer29 = Column('Integer29', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer30 = Column('Integer30', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', types.Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', types.Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', types.Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', types.Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', types.Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', types.Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', types.Numeric, index=False, unique=False, nullable=True)
    number14 = Column('Number14', types.Numeric, index=False, unique=False, nullable=True)
    number15 = Column('Number15', types.Numeric, index=False, unique=False, nullable=True)
    number16 = Column('Number16', types.Numeric, index=False, unique=False, nullable=True)
    number17 = Column('Number17', types.Numeric, index=False, unique=False, nullable=True)
    number18 = Column('Number18', types.Numeric, index=False, unique=False, nullable=True)
    number19 = Column('Number19', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number20 = Column('Number20', types.Numeric, index=False, unique=False, nullable=True)
    number21 = Column('Number21', types.Numeric, index=False, unique=False, nullable=True)
    number22 = Column('Number22', types.Numeric, index=False, unique=False, nullable=True)
    number23 = Column('Number23', types.Numeric, index=False, unique=False, nullable=True)
    number24 = Column('Number24', types.Numeric, index=False, unique=False, nullable=True)
    number25 = Column('Number25', types.Numeric, index=False, unique=False, nullable=True)
    number26 = Column('Number26', types.Numeric, index=False, unique=False, nullable=True)
    number27 = Column('Number27', types.Numeric, index=False, unique=False, nullable=True)
    number28 = Column('Number28', types.Numeric, index=False, unique=False, nullable=True)
    number29 = Column('Number29', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number30 = Column('Number30', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', types.Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', types.Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', types.Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', types.String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', types.String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', types.String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', types.String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', types.String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text20 = Column('Text20', types.String, index=False, unique=False, nullable=True)
    text21 = Column('Text21', types.String, index=False, unique=False, nullable=True)
    text22 = Column('Text22', types.String, index=False, unique=False, nullable=True)
    text23 = Column('Text23', types.String, index=False, unique=False, nullable=True)
    text24 = Column('Text24', types.String, index=False, unique=False, nullable=True)
    text25 = Column('Text25', types.String, index=False, unique=False, nullable=True)
    text26 = Column('Text26', types.String, index=False, unique=False, nullable=True)
    text27 = Column('Text27', types.String, index=False, unique=False, nullable=True)
    text28 = Column('Text28', types.String, index=False, unique=False, nullable=True)
    text29 = Column('Text29', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    text30 = Column('Text30', types.String, index=False, unique=False, nullable=True)
    text31 = Column('Text31', types.Text, index=False, unique=False, nullable=True)
    text32 = Column('Text32', types.Text, index=False, unique=False, nullable=True)
    text33 = Column('Text33', types.Text, index=False, unique=False, nullable=True)
    text34 = Column('Text34', types.Text, index=False, unique=False, nullable=True)
    text35 = Column('Text35', types.Text, index=False, unique=False, nullable=True)
    text36 = Column('Text36', types.Text, index=False, unique=False, nullable=True)
    text37 = Column('Text37', types.Text, index=False, unique=False, nullable=True)
    text38 = Column('Text38', types.Text, index=False, unique=False, nullable=True)
    text39 = Column('Text39', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text40 = Column('Text40', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo10 = Column('YesNo10', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo11 = Column('YesNo11', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo12 = Column('YesNo12', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo13 = Column('YesNo13', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo14 = Column('YesNo14', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo15 = Column('YesNo15', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo16 = Column('YesNo16', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo17 = Column('YesNo17', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo18 = Column('YesNo18', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo19 = Column('YesNo19', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo20 = Column('YesNo20', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo6 = Column('YesNo6', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo7 = Column('YesNo7', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo8 = Column('YesNo8', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo9 = Column('YesNo9', mysql_bit_type, index=False, unique=False, nullable=True)

    agent1ID = Column('Agent1ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent10ID = Column('Agent10ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent11ID = Column('Agent11ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent12ID = Column('Agent12ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent13ID = Column('Agent13ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent14ID = Column('Agent14ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent15ID = Column('Agent15ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent16ID = Column('Agent16ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent17ID = Column('Agent17ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent18ID = Column('Agent18ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent19ID = Column('Agent19ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent2ID = Column('Agent2ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent20ID = Column('Agent20ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent3ID = Column('Agent3ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent4ID = Column('Agent4ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent5ID = Column('Agent5ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent6ID = Column('Agent6ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent7ID = Column('Agent7ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent8ID = Column('Agent8D', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    agent9ID = Column('Agent9ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    preparationID = Column('PreparationID', types.Integer, ForeignKey('Preparation.PreparationID'), nullable=False, unique=False)

    Agent1 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent10 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent10ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent11 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent11ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent12 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent12ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent13 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent13ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent14 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent14ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent15 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent15ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent16 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent16ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent17 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent17ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent18 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent18ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent19 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent19ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent2 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent20 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent20ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent3 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent3ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent4 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent4ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent5 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent5ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent6 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent6ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent7 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent7ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent8D', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent9 = orm.relationship('Agent', foreign_keys='PreparationProperty.Agent9ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='PreparationProperty.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='PreparationProperty.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Preparation = orm.relationship('Preparation', foreign_keys='PreparationProperty.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('preparationProperties', uselist=True))

class Project(Base):
    tableid = 66
    _id = 'projectId'
    __tablename__ = 'project'

    projectId = Column('Projectid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=False, unique=False, nullable=False)
    endDate = Column('EndDate', types.Date, index=False, unique=False, nullable=True)
    grantAgency = Column('GrantAgency', types.String, index=False, unique=False, nullable=True)
    grantNumber = Column('GrantNumber', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    projectDescription = Column('ProjectDescription', types.String, index=False, unique=False, nullable=True)
    projectName = Column('ProjectName', types.String, index=True, unique=False, nullable=False)
    projectNumber = Column('ProjectNumber', types.String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', types.Date, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    url = Column('URL', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    agentID = Column('ProjectAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    ProjectAgent = orm.relationship('Agent', foreign_keys='Project.ProjectAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Project.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Project.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class RecordSet(Base):
    tableid = 68
    _id = 'recordSetId'
    __tablename__ = 'recordset'

    recordSetId = Column('Recordsetid', types.Integer, primary_key=True)
    allPermissionLevel = Column('AllPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=False, unique=False, nullable=False)
    dbTableId = Column('TableID', types.Integer, index=False, unique=False, nullable=False)
    groupPermissionLevel = Column('GroupPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    ownerPermissionLevel = Column('OwnerPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.Integer, index=False, unique=False, nullable=False)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    groupID = Column('SpPrincipalID', types.Integer, ForeignKey('SpPrincipal.SpPrincipalID'), nullable=True, unique=False)
    infoRequestID = Column('InfoRequestID', types.Integer, ForeignKey('InfoRequest.InfoRequestID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='RecordSet.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpPrincipal = orm.relationship('SpPrincipal', foreign_keys='RecordSet.SpPrincipalID', remote_side='SpPrincipal.SpPrincipalID', backref=orm.backref('None', uselist=True))
    InfoRequest = orm.relationship('InfoRequest', foreign_keys='RecordSet.InfoRequestID', remote_side='InfoRequest.InfoRequestID', backref=orm.backref('recordSets', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='RecordSet.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='RecordSet.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class RecordSetItem(Base):
    tableid = 502
    _id = 'recordSetItemId'
    __tablename__ = 'recordsetitem'

    recordSetItemId = Column('Recordsetitemid', types.Integer, primary_key=True)
    order = Column('OrderNumber', types.Integer, index=False, unique=False, nullable=True)
    recordId = Column('RecordId', types.Integer, index=False, unique=False, nullable=False)

    recordSetID = Column('RecordSetID', types.Integer, ForeignKey('RecordSet.RecordSetID'), nullable=False, unique=False)

    RecordSet = orm.relationship('RecordSet', foreign_keys='RecordSetItem.RecordSetID', remote_side='RecordSet.RecordSetID', backref=orm.backref('recordSetItems', uselist=True))

class ReferenceWork(Base):
    tableid = 69
    _id = 'referenceWorkId'
    __tablename__ = 'referencework'

    referenceWorkId = Column('Referenceworkid', types.Integer, primary_key=True)
    doi = Column('Doi', types.Text, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    isPublished = Column('IsPublished', mysql_bit_type, index=False, unique=False, nullable=True)
    isbn = Column('ISBN', types.String, index=True, unique=False, nullable=True)
    libraryNumber = Column('LibraryNumber', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    pages = Column('Pages', types.String, index=False, unique=False, nullable=True)
    placeOfPublication = Column('PlaceOfPublication', types.String, index=False, unique=False, nullable=True)
    publisher = Column('Publisher', types.String, index=True, unique=False, nullable=True)
    referenceWorkType = Column('ReferenceWorkType', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=True, unique=False, nullable=False)
    uri = Column('Uri', types.Text, index=False, unique=False, nullable=True)
    url = Column('URL', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    volume = Column('Volume', types.String, index=False, unique=False, nullable=True)
    workDate = Column('WorkDate', types.String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    containedRFParentID = Column('ContainedRFParentID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    institutionID = Column('InstitutionID', types.Integer, ForeignKey('Institution.UserGroupScopeId'), nullable=False, unique=False)
    journalID = Column('JournalID', types.Integer, ForeignKey('Journal.JournalID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    ContainedRFParent = orm.relationship('ReferenceWork', foreign_keys='ReferenceWork.ContainedRFParentID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('containedReferenceWorks', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ReferenceWork.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Institution = orm.relationship('Institution', foreign_keys='ReferenceWork.InstitutionID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    Journal = orm.relationship('Journal', foreign_keys='ReferenceWork.JournalID', remote_side='Journal.JournalID', backref=orm.backref('referenceWorks', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ReferenceWork.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ReferenceWorkAttachment(Base):
    tableid = 143
    _id = 'referenceWorkAttachmentId'
    __tablename__ = 'referenceworkattachment'

    referenceWorkAttachmentId = Column('Referenceworkattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='ReferenceWorkAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('referenceWorkAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='ReferenceWorkAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='ReferenceWorkAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='ReferenceWorkAttachment.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('referenceWorkAttachments', uselist=True))

class RepositoryAgreement(Base):
    tableid = 70
    _id = 'repositoryAgreementId'
    __tablename__ = 'repositoryagreement'

    repositoryAgreementId = Column('Repositoryagreementid', types.Integer, primary_key=True)
    dateReceived = Column('DateReceived', types.Date, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', types.Date, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    repositoryAgreementNumber = Column('RepositoryAgreementNumber', types.String, index=True, unique=False, nullable=False)
    startDate = Column('StartDate', types.Date, index=True, unique=False, nullable=True)
    status = Column('Status', types.String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    addressOfRecordID = Column('AddressOfRecordID', types.Integer, ForeignKey('AddressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    originatorID = Column('AgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=False, unique=False)

    AddressOfRecord = orm.relationship('AddressOfRecord', foreign_keys='RepositoryAgreement.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('repositoryAgreements', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='RepositoryAgreement.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='RepositoryAgreement.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='RepositoryAgreement.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Agent = orm.relationship('Agent', foreign_keys='RepositoryAgreement.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class RepositoryAgreementAttachment(Base):
    tableid = 118
    _id = 'repositoryAgreementAttachmentId'
    __tablename__ = 'repositoryagreementattachment'

    repositoryAgreementAttachmentId = Column('Repositoryagreementattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    repositoryAgreementID = Column('RepositoryAgreementID', types.Integer, ForeignKey('RepositoryAgreement.RepositoryAgreementID'), nullable=False, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='RepositoryAgreementAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('repositoryAgreementAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='RepositoryAgreementAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='RepositoryAgreementAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    RepositoryAgreement = orm.relationship('RepositoryAgreement', foreign_keys='RepositoryAgreementAttachment.RepositoryAgreementID', remote_side='RepositoryAgreement.RepositoryAgreementID', backref=orm.backref('repositoryAgreementAttachments', uselist=True))

class Shipment(Base):
    tableid = 71
    _id = 'shipmentId'
    __tablename__ = 'shipment'

    shipmentId = Column('Shipmentid', types.Integer, primary_key=True)
    insuredForAmount = Column('InsuredForAmount', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    numberOfPackages = Column('NumberOfPackages', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    shipmentDate = Column('ShipmentDate', types.Date, index=True, unique=False, nullable=True)
    shipmentMethod = Column('ShipmentMethod', types.String, index=True, unique=False, nullable=True)
    shipmentNumber = Column('ShipmentNumber', types.String, index=True, unique=False, nullable=False)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    weight = Column('Weight', types.String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    borrowID = Column('BorrowID', types.Integer, ForeignKey('Borrow.BorrowID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    exchangeOutID = Column('ExchangeOutID', types.Integer, ForeignKey('ExchangeOut.ExchangeOutID'), nullable=True, unique=False)
    giftID = Column('GiftID', types.Integer, ForeignKey('Gift.GiftID'), nullable=True, unique=False)
    loanID = Column('LoanID', types.Integer, ForeignKey('Loan.LoanID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    shippedByID = Column('ShippedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    shippedToID = Column('ShippedToID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    shipperID = Column('ShipperID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Borrow = orm.relationship('Borrow', foreign_keys='Shipment.BorrowID', remote_side='Borrow.BorrowID', backref=orm.backref('shipments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Shipment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='Shipment.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ExchangeOut = orm.relationship('ExchangeOut', foreign_keys='Shipment.ExchangeOutID', remote_side='ExchangeOut.ExchangeOutID', backref=orm.backref('shipments', uselist=True))
    Gift = orm.relationship('Gift', foreign_keys='Shipment.GiftID', remote_side='Gift.GiftID', backref=orm.backref('shipments', uselist=True))
    Loan = orm.relationship('Loan', foreign_keys='Shipment.LoanID', remote_side='Loan.LoanID', backref=orm.backref('shipments', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Shipment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ShippedBy = orm.relationship('Agent', foreign_keys='Shipment.ShippedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ShippedTo = orm.relationship('Agent', foreign_keys='Shipment.ShippedToID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Shipper = orm.relationship('Agent', foreign_keys='Shipment.ShipperID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpAppResource(Base):
    tableid = 514
    _id = 'spAppResourceId'
    __tablename__ = 'spappresource'

    spAppResourceId = Column('Spappresourceid', types.Integer, primary_key=True)
    allPermissionLevel = Column('AllPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    groupPermissionLevel = Column('GroupPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    level = Column('Level', types.Integer, index=False, unique=False, nullable=False)
    metaData = Column('MetaData', types.String, index=False, unique=False, nullable=True)
    mimeType = Column('MimeType', types.String, index=True, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    ownerPermissionLevel = Column('OwnerPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    groupID = Column('SpPrincipalID', types.Integer, ForeignKey('SpPrincipal.SpPrincipalID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    spAppResourceDirID = Column('SpAppResourceDirID', types.Integer, ForeignKey('SpAppResourceDir.SpAppResourceDirID'), nullable=False, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpAppResource.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpPrincipal = orm.relationship('SpPrincipal', foreign_keys='SpAppResource.SpPrincipalID', remote_side='SpPrincipal.SpPrincipalID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpAppResource.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpAppResourceDir = orm.relationship('SpAppResourceDir', foreign_keys='SpAppResource.SpAppResourceDirID', remote_side='SpAppResourceDir.SpAppResourceDirID', backref=orm.backref('spPersistedAppResources', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='SpAppResource.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('spAppResources', uselist=True))

class SpAppResourceData(Base):
    tableid = 515
    _id = 'spAppResourceDataId'
    __tablename__ = 'spappresourcedata'

    spAppResourceDataId = Column('Spappresourcedataid', types.Integer, primary_key=True)
    data = Column('data', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    spAppResourceID = Column('SpAppResourceID', types.Integer, ForeignKey('SpAppResource.SpAppResourceID'), nullable=True, unique=False)
    spViewSetObjID = Column('SpViewSetObjID', types.Integer, ForeignKey('SpViewSetObj.SpViewSetObjID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpAppResourceData.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpAppResourceData.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpAppResource = orm.relationship('SpAppResource', foreign_keys='SpAppResourceData.SpAppResourceID', remote_side='SpAppResource.SpAppResourceID', backref=orm.backref('spAppResourceDatas', uselist=True))
    SpViewSetObj = orm.relationship('SpViewSetObj', foreign_keys='SpAppResourceData.SpViewSetObjID', remote_side='SpViewSetObj.SpViewSetObjID', backref=orm.backref('spAppResourceDatas', uselist=True))

class SpAppResourceDir(Base):
    tableid = 516
    _id = 'spAppResourceDirId'
    __tablename__ = 'spappresourcedir'

    spAppResourceDirId = Column('Spappresourcedirid', types.Integer, primary_key=True)
    disciplineType = Column('DisciplineType', types.String, index=True, unique=False, nullable=True)
    isPersonal = Column('IsPersonal', mysql_bit_type, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    userType = Column('UserType', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=True, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='SpAppResourceDir.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpAppResourceDir.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='SpAppResourceDir.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpAppResourceDir.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='SpAppResourceDir.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('spAppResourceDirs', uselist=True))

class SpAuditLog(Base):
    tableid = 530
    _id = 'spAuditLogId'
    __tablename__ = 'spauditlog'

    spAuditLogId = Column('Spauditlogid', types.Integer, primary_key=True)
    action = Column('Action', types.Integer, index=False, unique=False, nullable=False)
    parentRecordId = Column('ParentRecordId', types.Integer, index=False, unique=False, nullable=True)
    parentTableNum = Column('ParentTableNum', types.Integer, index=False, unique=False, nullable=True)
    recordId = Column('RecordId', types.Integer, index=False, unique=False, nullable=True)
    recordVersion = Column('RecordVersion', types.Integer, index=False, unique=False, nullable=False)
    tableNum = Column('TableNum', types.Integer, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpAuditLog.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpAuditLog.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpAuditLogField(Base):
    tableid = 531
    _id = 'spAuditLogFieldId'
    __tablename__ = 'spauditlogfield'

    spAuditLogFieldId = Column('Spauditlogfieldid', types.Integer, primary_key=True)
    fieldName = Column('FieldName', types.String, index=False, unique=False, nullable=False)
    newValue = Column('NewValue', types.Text, index=False, unique=False, nullable=True)
    oldValue = Column('OldValue', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    spAuditLogID = Column('SpAuditLogID', types.Integer, ForeignKey('SpAuditLog.SpAuditLogID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpAuditLogField.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpAuditLogField.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpAuditLog = orm.relationship('SpAuditLog', foreign_keys='SpAuditLogField.SpAuditLogID', remote_side='SpAuditLog.SpAuditLogID', backref=orm.backref('fields', uselist=True))

class SpExportSchema(Base):
    tableid = 524
    _id = 'spExportSchemaId'
    __tablename__ = 'spexportschema'

    spExportSchemaId = Column('Spexportschemaid', types.Integer, primary_key=True)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    schemaName = Column('SchemaName', types.String, index=False, unique=False, nullable=True)
    schemaVersion = Column('SchemaVersion', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpExportSchema.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='SpExportSchema.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('spExportSchemas', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpExportSchema.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpExportSchemaItem(Base):
    tableid = 525
    _id = 'spExportSchemaItemId'
    __tablename__ = 'spexportschemaitem'

    spExportSchemaItemId = Column('Spexportschemaitemid', types.Integer, primary_key=True)
    dataType = Column('DataType', types.String, index=False, unique=False, nullable=True)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    fieldName = Column('FieldName', types.String, index=False, unique=False, nullable=True)
    formatter = Column('Formatter', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    spExportSchemaID = Column('SpExportSchemaID', types.Integer, ForeignKey('SpExportSchema.SpExportSchemaID'), nullable=False, unique=False)
    spLocaleContainerItemID = Column('SpLocaleContainerItemID', types.Integer, ForeignKey('SpLocaleContainerItem.SpLocaleContainerItemID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpExportSchemaItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpExportSchemaItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpExportSchema = orm.relationship('SpExportSchema', foreign_keys='SpExportSchemaItem.SpExportSchemaID', remote_side='SpExportSchema.SpExportSchemaID', backref=orm.backref('spExportSchemaItems', uselist=True))
    SpLocaleContainerItem = orm.relationship('SpLocaleContainerItem', foreign_keys='SpExportSchemaItem.SpLocaleContainerItemID', remote_side='SpLocaleContainerItem.SpLocaleContainerItemID', backref=orm.backref('spExportSchemaItems', uselist=True))

class SpExportSchemaItemMapping(Base):
    tableid = 527
    _id = 'spExportSchemaItemMappingId'
    __tablename__ = 'spexportschemaitemmapping'

    spExportSchemaItemMappingId = Column('Spexportschemaitemmappingid', types.Integer, primary_key=True)
    exportedFieldName = Column('ExportedFieldName', types.String, index=False, unique=False, nullable=True)
    extensionItem = Column('ExtensionItem', mysql_bit_type, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.String, index=False, unique=False, nullable=True)
    rowType = Column('RowType', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    exportSchemaItemID = Column('ExportSchemaItemID', types.Integer, ForeignKey('SpExportSchemaItem.SpExportSchemaItemID'), nullable=True, unique=False)
    exportSchemaMappingID = Column('SpExportSchemaMappingID', types.Integer, ForeignKey('SpExportSchemaMapping.SpExportSchemaMappingID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    queryFieldID = Column('SpQueryFieldID', types.Integer, ForeignKey('SpQueryField.SpQueryFieldID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpExportSchemaItemMapping.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ExportSchemaItem = orm.relationship('SpExportSchemaItem', foreign_keys='SpExportSchemaItemMapping.ExportSchemaItemID', remote_side='SpExportSchemaItem.SpExportSchemaItemID', backref=orm.backref('None', uselist=True))
    SpExportSchemaMapping = orm.relationship('SpExportSchemaMapping', foreign_keys='SpExportSchemaItemMapping.SpExportSchemaMappingID', remote_side='SpExportSchemaMapping.SpExportSchemaMappingID', backref=orm.backref('mappings', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpExportSchemaItemMapping.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpQueryField = orm.relationship('SpQueryField', foreign_keys='SpExportSchemaItemMapping.SpQueryFieldID', remote_side='SpQueryField.SpQueryFieldID', backref=orm.backref('mappings', uselist=True))

class SpExportSchemaMapping(Base):
    tableid = 528
    _id = 'spExportSchemaMappingId'
    __tablename__ = 'spexportschemamapping'

    spExportSchemaMappingId = Column('Spexportschemamappingid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    mappingName = Column('MappingName', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampExported = Column('TimeStampExported', types.DateTime, index=False, unique=False, nullable=True)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpExportSchemaMapping.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpExportSchemaMapping.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpFieldValueDefault(Base):
    tableid = 520
    _id = 'spFieldValueDefaultId'
    __tablename__ = 'spfieldvaluedefault'

    spFieldValueDefaultId = Column('Spfieldvaluedefaultid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    fieldName = Column('FieldName', types.String, index=False, unique=False, nullable=True)
    idValue = Column('IdValue', types.Integer, index=False, unique=False, nullable=True)
    strValue = Column('StrValue', types.String, index=False, unique=False, nullable=True)
    tableName = Column('TableName', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpFieldValueDefault.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpFieldValueDefault.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpLocaleContainer(Base):
    tableid = 503
    _id = 'spLocaleContainerId'
    __tablename__ = 'splocalecontainer'

    spLocaleContainerId = Column('Splocalecontainerid', types.Integer, primary_key=True)
    aggregator = Column('Aggregator', types.String, index=False, unique=False, nullable=True)
    defaultUI = Column('DefaultUI', types.String, index=False, unique=False, nullable=True)
    format = Column('Format', types.String, index=False, unique=False, nullable=True)
    isHidden = Column('IsHidden', mysql_bit_type, index=False, unique=False, nullable=False)
    isSystem = Column('IsSystem', mysql_bit_type, index=False, unique=False, nullable=False)
    isUIFormatter = Column('IsUIFormatter', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    pickListName = Column('PickListName', types.String, index=False, unique=False, nullable=True)
    schemaType = Column('SchemaType', types.Integer, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpLocaleContainer.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='SpLocaleContainer.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('spLocaleContainers', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpLocaleContainer.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpLocaleContainerItem(Base):
    tableid = 504
    _id = 'spLocaleContainerItemId'
    __tablename__ = 'splocalecontaineritem'

    spLocaleContainerItemId = Column('Splocalecontaineritemid', types.Integer, primary_key=True)
    format = Column('Format', types.String, index=False, unique=False, nullable=True)
    isHidden = Column('IsHidden', mysql_bit_type, index=False, unique=False, nullable=False)
    isRequired = Column('IsRequired', mysql_bit_type, index=False, unique=False, nullable=True)
    isSystem = Column('IsSystem', mysql_bit_type, index=False, unique=False, nullable=False)
    isUIFormatter = Column('IsUIFormatter', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    pickListName = Column('PickListName', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    webLinkName = Column('WebLinkName', types.String, index=False, unique=False, nullable=True)

    containerID = Column('SpLocaleContainerID', types.Integer, ForeignKey('SpLocaleContainer.SpLocaleContainerID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    SpLocaleContainer = orm.relationship('SpLocaleContainer', foreign_keys='SpLocaleContainerItem.SpLocaleContainerID', remote_side='SpLocaleContainer.SpLocaleContainerID', backref=orm.backref('items', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpLocaleContainerItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpLocaleContainerItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpLocaleItemStr(Base):
    tableid = 505
    _id = 'spLocaleItemStrId'
    __tablename__ = 'splocaleitemstr'

    spLocaleItemStrId = Column('Splocaleitemstrid', types.Integer, primary_key=True)
    country = Column('Country', types.String, index=True, unique=False, nullable=True)
    language = Column('Language', types.String, index=True, unique=False, nullable=False)
    text = Column('Text', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    variant = Column('Variant', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    containerDescID = Column('SpLocaleContainerDescID', types.Integer, ForeignKey('SpLocaleContainer.SpLocaleContainerID'), nullable=True, unique=False)
    containerNameID = Column('SpLocaleContainerNameID', types.Integer, ForeignKey('SpLocaleContainer.SpLocaleContainerID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    itemDescID = Column('SpLocaleContainerItemDescID', types.Integer, ForeignKey('SpLocaleContainerItem.SpLocaleContainerItemID'), nullable=True, unique=False)
    itemNameID = Column('SpLocaleContainerItemNameID', types.Integer, ForeignKey('SpLocaleContainerItem.SpLocaleContainerItemID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    SpLocaleContainerDesc = orm.relationship('SpLocaleContainer', foreign_keys='SpLocaleItemStr.SpLocaleContainerDescID', remote_side='SpLocaleContainer.SpLocaleContainerID', backref=orm.backref('descs', uselist=True))
    SpLocaleContainerName = orm.relationship('SpLocaleContainer', foreign_keys='SpLocaleItemStr.SpLocaleContainerNameID', remote_side='SpLocaleContainer.SpLocaleContainerID', backref=orm.backref('names', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpLocaleItemStr.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpLocaleContainerItemDesc = orm.relationship('SpLocaleContainerItem', foreign_keys='SpLocaleItemStr.SpLocaleContainerItemDescID', remote_side='SpLocaleContainerItem.SpLocaleContainerItemID', backref=orm.backref('descs', uselist=True))
    SpLocaleContainerItemName = orm.relationship('SpLocaleContainerItem', foreign_keys='SpLocaleItemStr.SpLocaleContainerItemNameID', remote_side='SpLocaleContainerItem.SpLocaleContainerItemID', backref=orm.backref('names', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpLocaleItemStr.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpPermission(Base):
    tableid = 521
    _id = 'permissionId'
    __tablename__ = 'sppermission'

    permissionId = Column('Permissionid', types.Integer, primary_key=True)
    actions = Column('Actions', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=True)
    permissionClass = Column('PermissionClass', types.String, index=False, unique=False, nullable=False)
    targetId = Column('TargetId', types.Integer, index=False, unique=False, nullable=True)



class SpPrincipal(Base):
    tableid = 522
    _id = 'userGroupId'
    __tablename__ = 'spprincipal'

    userGroupId = Column('Usergroupid', types.Integer, primary_key=True)
    groupSubClass = Column('GroupSubClass', types.String, index=False, unique=False, nullable=False)
    groupType = Column('groupType', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    priority = Column('Priority', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpPrincipal.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpPrincipal.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpQuery(Base):
    tableid = 517
    _id = 'spQueryId'
    __tablename__ = 'spquery'

    spQueryId = Column('Spqueryid', types.Integer, primary_key=True)
    contextName = Column('ContextName', types.String, index=False, unique=False, nullable=False)
    contextTableId = Column('ContextTableId', types.Integer, index=False, unique=False, nullable=False)
    countOnly = Column('CountOnly', mysql_bit_type, index=False, unique=False, nullable=True)
    formatAuditRecIds = Column('FormatAuditRecIds', mysql_bit_type, index=False, unique=False, nullable=True)
    isFavorite = Column('IsFavorite', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    searchSynonymy = Column('SearchSynonymy', mysql_bit_type, index=False, unique=False, nullable=True)
    selectDistinct = Column('SelectDistinct', mysql_bit_type, index=False, unique=False, nullable=True)
    smushed = Column('Smushed', mysql_bit_type, index=False, unique=False, nullable=True)
    sqlStr = Column('SqlStr', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpQuery.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpQuery.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='SpQuery.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('spQuerys', uselist=True))

class SpQueryField(Base):
    tableid = 518
    _id = 'spQueryFieldId'
    __tablename__ = 'spqueryfield'

    spQueryFieldId = Column('Spqueryfieldid', types.Integer, primary_key=True)
    allowNulls = Column('AllowNulls', mysql_bit_type, index=False, unique=False, nullable=True)
    alwaysFilter = Column('AlwaysFilter', mysql_bit_type, index=False, unique=False, nullable=True)
    columnAlias = Column('ColumnAlias', types.String, index=False, unique=False, nullable=True)
    contextTableIdent = Column('ContextTableIdent', types.Integer, index=False, unique=False, nullable=True)
    endValue = Column('EndValue', types.Text, index=False, unique=False, nullable=True)
    fieldName = Column('FieldName', types.String, index=False, unique=False, nullable=False)
    formatName = Column('FormatName', types.String, index=False, unique=False, nullable=True)
    isDisplay = Column('IsDisplay', mysql_bit_type, index=False, unique=False, nullable=False)
    isNot = Column('IsNot', mysql_bit_type, index=False, unique=False, nullable=False)
    isPrompt = Column('IsPrompt', mysql_bit_type, index=False, unique=False, nullable=True)
    isRelFld = Column('IsRelFld', mysql_bit_type, index=False, unique=False, nullable=True)
    operEnd = Column('OperEnd', types.Integer, index=False, unique=False, nullable=True)
    operStart = Column('OperStart', types.Integer, index=False, unique=False, nullable=False)
    position = Column('Position', types.Integer, index=False, unique=False, nullable=False)
    sortType = Column('SortType', types.Integer, index=False, unique=False, nullable=False)
    startValue = Column('StartValue', types.Text, index=False, unique=False, nullable=False)
    stringId = Column('StringId', types.String, index=False, unique=False, nullable=False)
    tableList = Column('TableList', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    queryID = Column('SpQueryID', types.Integer, ForeignKey('SpQuery.SpQueryID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpQueryField.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpQueryField.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpQuery = orm.relationship('SpQuery', foreign_keys='SpQueryField.SpQueryID', remote_side='SpQuery.SpQueryID', backref=orm.backref('fields', uselist=True))

class SpReport(Base):
    tableid = 519
    _id = 'spReportId'
    __tablename__ = 'spreport'

    spReportId = Column('Spreportid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    repeatCount = Column('RepeatCount', types.Integer, index=False, unique=False, nullable=True)
    repeatField = Column('RepeatField', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    appResourceID = Column('AppResourceID', types.Integer, ForeignKey('SpAppResource.SpAppResourceID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    queryID = Column('SpQueryID', types.Integer, ForeignKey('SpQuery.SpQueryID'), nullable=True, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)
    workbenchTemplateID = Column('WorkbenchTemplateID', types.Integer, ForeignKey('WorkbenchTemplate.WorkbenchTemplateID'), nullable=True, unique=False)

    AppResource = orm.relationship('SpAppResource', foreign_keys='SpReport.AppResourceID', remote_side='SpAppResource.SpAppResourceID', backref=orm.backref('spReports', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpReport.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpReport.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpQuery = orm.relationship('SpQuery', foreign_keys='SpReport.SpQueryID', remote_side='SpQuery.SpQueryID', backref=orm.backref('reports', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='SpReport.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    WorkbenchTemplate = orm.relationship('WorkbenchTemplate', foreign_keys='SpReport.WorkbenchTemplateID', remote_side='WorkbenchTemplate.WorkbenchTemplateID', backref=orm.backref('None', uselist=False))

class SpSymbiotaInstance(Base):
    tableid = 533
    _id = 'spSymbiotaInstanceId'
    __tablename__ = 'spsymbiotainstance'

    spSymbiotaInstanceId = Column('Spsymbiotainstanceid', types.Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    instanceName = Column('InstanceName', types.String, index=False, unique=False, nullable=True)
    lastCacheBuild = Column('LastCacheBuild', types.Date, index=False, unique=False, nullable=True)
    lastPull = Column('LastPull', types.Date, index=False, unique=False, nullable=True)
    lastPush = Column('LastPush', types.Date, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    symbiotaKey = Column('SymbiotaKey', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    schemaMappingID = Column('SchemaMappingID', types.Integer, ForeignKey('SpExportSchemaMapping.SpExportSchemaMappingID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpSymbiotaInstance.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpSymbiotaInstance.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SchemaMapping = orm.relationship('SpExportSchemaMapping', foreign_keys='SpSymbiotaInstance.SchemaMappingID', remote_side='SpExportSchemaMapping.SpExportSchemaMappingID', backref=orm.backref('symbiotaInstances', uselist=True))

class SpTaskSemaphore(Base):
    tableid = 526
    _id = 'spTaskSemaphoreId'
    __tablename__ = 'sptasksemaphore'

    spTaskSemaphoreId = Column('Sptasksemaphoreid', types.Integer, primary_key=True)
    context = Column('Context', types.String, index=False, unique=False, nullable=True)
    isLocked = Column('IsLocked', mysql_bit_type, index=False, unique=False, nullable=True)
    lockedTime = Column('LockedTime', types.DateTime, index=False, unique=False, nullable=True)
    machineName = Column('MachineName', types.String, index=False, unique=False, nullable=True)
    scope = Column('Scope', types.Integer, index=False, unique=False, nullable=True)
    taskName = Column('TaskName', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    usageCount = Column('UsageCount', types.Integer, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    ownerID = Column('OwnerID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=True, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='SpTaskSemaphore.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpTaskSemaphore.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Discipline = orm.relationship('Discipline', foreign_keys='SpTaskSemaphore.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpTaskSemaphore.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Owner = orm.relationship('SpecifyUser', foreign_keys='SpTaskSemaphore.OwnerID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('taskSemaphores', uselist=True))

class SpVersion(Base):
    tableid = 529
    _id = 'spVersionId'
    __tablename__ = 'spversion'

    spVersionId = Column('Spversionid', types.Integer, primary_key=True)
    appName = Column('AppName', types.String, index=False, unique=False, nullable=True)
    appVersion = Column('AppVersion', types.String, index=False, unique=False, nullable=True)
    dbClosedBy = Column('DbClosedBy', types.String, index=False, unique=False, nullable=True)
    isDBClosed = Column('IsDBClosed', mysql_bit_type, index=False, unique=False, nullable=True)
    schemaVersion = Column('SchemaVersion', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    workbenchSchemaVersion = Column('WorkbenchSchemaVersion', types.String, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpVersion.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpVersion.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpViewSetObj(Base):
    tableid = 513
    _id = 'spViewSetObjId'
    __tablename__ = 'spviewsetobj'

    spViewSetObjId = Column('Spviewsetobjid', types.Integer, primary_key=True)
    description = Column('Description', types.String, index=False, unique=False, nullable=True)
    fileName = Column('FileName', types.String, index=False, unique=False, nullable=True)
    level = Column('Level', types.Integer, index=False, unique=False, nullable=False)
    metaData = Column('MetaData', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    spAppResourceDirID = Column('SpAppResourceDirID', types.Integer, ForeignKey('SpAppResourceDir.SpAppResourceDirID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpViewSetObj.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpViewSetObj.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpAppResourceDir = orm.relationship('SpAppResourceDir', foreign_keys='SpViewSetObj.SpAppResourceDirID', remote_side='SpAppResourceDir.SpAppResourceDirID', backref=orm.backref('spPersistedViewSets', uselist=True))

class SpVisualQuery(Base):
    tableid = 532
    _id = 'spVisualQueryId'
    __tablename__ = 'spvisualquery'

    spVisualQueryId = Column('Spvisualqueryid', types.Integer, primary_key=True)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpVisualQuery.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpVisualQuery.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='SpVisualQuery.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class SpecifyUser(Base):
    tableid = 72
    _id = 'specifyUserId'
    __tablename__ = 'specifyuser'

    specifyUserId = Column('Specifyuserid', types.Integer, primary_key=True)
    accumMinLoggedIn = Column('AccumMinLoggedIn', types.Integer, index=False, unique=False, nullable=True)
    email = Column('EMail', types.String, index=False, unique=False, nullable=True)
    isLoggedIn = Column('IsLoggedIn', mysql_bit_type, index=False, unique=False, nullable=False)
    isLoggedInReport = Column('IsLoggedInReport', mysql_bit_type, index=False, unique=False, nullable=False)
    loginCollectionName = Column('LoginCollectionName', types.String, index=False, unique=False, nullable=True)
    loginDisciplineName = Column('LoginDisciplineName', types.String, index=False, unique=False, nullable=True)
    loginOutTime = Column('LoginOutTime', types.DateTime, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=True, nullable=False)
    password = Column('Password', types.String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    userType = Column('UserType', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='SpecifyUser.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='SpecifyUser.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Storage(Base):
    tableid = 58
    _id = 'storageId'
    __tablename__ = 'storage'

    storageId = Column('Storageid', types.Integer, primary_key=True)
    abbrev = Column('Abbrev', types.String, index=False, unique=False, nullable=True)
    fullName = Column('FullName', types.String, index=True, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', types.Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    nodeNumber = Column('NodeNumber', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Integer, index=False, unique=False, nullable=True)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    timestampVersion = Column('TimestampVersion', types.Date, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    acceptedStorageID = Column('AcceptedID', types.Integer, ForeignKey('Storage.StorageID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    definitionID = Column('StorageTreeDefID', types.Integer, ForeignKey('StorageTreeDef.StorageTreeDefID'), nullable=False, unique=False)
    definitionItemID = Column('StorageTreeDefItemID', types.Integer, ForeignKey('StorageTreeDefItem.StorageTreeDefItemID'), nullable=False, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentID', types.Integer, ForeignKey('Storage.StorageID'), nullable=True, unique=False)

    Accepted = orm.relationship('Storage', foreign_keys='Storage.AcceptedID', remote_side='Storage.StorageID', backref=orm.backref('acceptedChildren', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Storage.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    StorageTreeDef = orm.relationship('StorageTreeDef', foreign_keys='Storage.StorageTreeDefID', remote_side='StorageTreeDef.StorageTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    StorageTreeDefItem = orm.relationship('StorageTreeDefItem', foreign_keys='Storage.StorageTreeDefItemID', remote_side='StorageTreeDefItem.StorageTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Storage.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Parent = orm.relationship('Storage', foreign_keys='Storage.ParentID', remote_side='Storage.StorageID', backref=orm.backref('children', uselist=True))

class StorageAttachment(Base):
    tableid = 148
    _id = 'storageAttachmentId'
    __tablename__ = 'storageattachment'

    storageAttachmentId = Column('Storageattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    storageID = Column('StorageID', types.Integer, ForeignKey('Storage.StorageID'), nullable=False, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='StorageAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('storageAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='StorageAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='StorageAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Storage = orm.relationship('Storage', foreign_keys='StorageAttachment.StorageID', remote_side='Storage.StorageID', backref=orm.backref('storageAttachments', uselist=True))

class StorageTreeDef(Base):
    tableid = 59
    _id = 'storageTreeDefId'
    __tablename__ = 'storagetreedef'

    storageTreeDefId = Column('Storagetreedefid', types.Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', types.Integer, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='StorageTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='StorageTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class StorageTreeDefItem(Base):
    tableid = 60
    _id = 'storageTreeDefItemId'
    __tablename__ = 'storagetreedefitem'

    storageTreeDefItemId = Column('Storagetreedefitemid', types.Integer, primary_key=True)
    fullNameSeparator = Column('FullNameSeparator', types.String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', types.String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentItemID', types.Integer, ForeignKey('StorageTreeDefItem.StorageTreeDefItemID'), nullable=True, unique=False)
    treeDefID = Column('StorageTreeDefID', types.Integer, ForeignKey('StorageTreeDef.StorageTreeDefID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='StorageTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='StorageTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ParentItem = orm.relationship('StorageTreeDefItem', foreign_keys='StorageTreeDefItem.ParentItemID', remote_side='StorageTreeDefItem.StorageTreeDefItemID', backref=orm.backref('children', uselist=True))
    StorageTreeDef = orm.relationship('StorageTreeDef', foreign_keys='StorageTreeDefItem.StorageTreeDefID', remote_side='StorageTreeDef.StorageTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class Taxon(Base):
    tableid = 4
    _id = 'taxonId'
    __tablename__ = 'taxon'

    taxonId = Column('Taxonid', types.Integer, primary_key=True)
    author = Column('Author', types.String, index=False, unique=False, nullable=True)
    citesStatus = Column('CitesStatus', types.String, index=False, unique=False, nullable=True)
    colStatus = Column('COLStatus', types.String, index=False, unique=False, nullable=True)
    commonName = Column('CommonName', types.String, index=True, unique=False, nullable=True)
    cultivarName = Column('CultivarName', types.String, index=False, unique=False, nullable=True)
    environmentalProtectionStatus = Column('EnvironmentalProtectionStatus', types.String, index=True, unique=False, nullable=True)
    esaStatus = Column('EsaStatus', types.String, index=False, unique=False, nullable=True)
    fullName = Column('FullName', types.String, index=True, unique=False, nullable=True)
    groupNumber = Column('GroupNumber', types.String, index=False, unique=False, nullable=True)
    guid = Column('GUID', types.String, index=True, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', types.Integer, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', types.Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', types.Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    isHybrid = Column('IsHybrid', mysql_bit_type, index=False, unique=False, nullable=False)
    isisNumber = Column('IsisNumber', types.String, index=False, unique=False, nullable=True)
    labelFormat = Column('LabelFormat', types.String, index=False, unique=False, nullable=True)
    lsid = Column('LSID', types.Text, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=True, unique=False, nullable=False)
    ncbiTaxonNumber = Column('NcbiTaxonNumber', types.String, index=False, unique=False, nullable=True)
    nodeNumber = Column('NodeNumber', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Integer, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    source = Column('Source', types.String, index=False, unique=False, nullable=True)
    taxonomicSerialNumber = Column('TaxonomicSerialNumber', types.String, index=True, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', types.String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', types.String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', types.String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', types.String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', types.String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text20 = Column('Text20', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.Text, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    unitInd1 = Column('UnitInd1', types.String, index=False, unique=False, nullable=True)
    unitInd2 = Column('UnitInd2', types.String, index=False, unique=False, nullable=True)
    unitInd3 = Column('UnitInd3', types.String, index=False, unique=False, nullable=True)
    unitInd4 = Column('UnitInd4', types.String, index=False, unique=False, nullable=True)
    unitName1 = Column('UnitName1', types.String, index=False, unique=False, nullable=True)
    unitName2 = Column('UnitName2', types.String, index=False, unique=False, nullable=True)
    unitName3 = Column('UnitName3', types.String, index=False, unique=False, nullable=True)
    unitName4 = Column('UnitName4', types.String, index=False, unique=False, nullable=True)
    usfwsCode = Column('UsfwsCode', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo10 = Column('YesNo10', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo11 = Column('YesNo11', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo12 = Column('YesNo12', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo13 = Column('YesNo13', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo14 = Column('YesNo14', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo15 = Column('YesNo15', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo16 = Column('YesNo16', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo17 = Column('YesNo17', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo18 = Column('YesNo18', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo19 = Column('YesNo19', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo6 = Column('YesNo6', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo7 = Column('YesNo7', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo8 = Column('YesNo8', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo9 = Column('YesNo9', mysql_bit_type, index=False, unique=False, nullable=True)

    acceptedTaxonID = Column('AcceptedID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    definitionID = Column('TaxonTreeDefID', types.Integer, ForeignKey('TaxonTreeDef.TaxonTreeDefID'), nullable=False, unique=False)
    definitionItemID = Column('TaxonTreeDefItemID', types.Integer, ForeignKey('TaxonTreeDefItem.TaxonTreeDefItemID'), nullable=False, unique=False)
    hybridParent1ID = Column('HybridParent1ID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=True, unique=False)
    hybridParent2ID = Column('HybridParent2ID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=True, unique=False)
    taxonAttributeID = Column('TaxonAttributeID', types.Integer, ForeignKey('TaxonAttribute.TaxonAttributeID'), nullable=True, unique=False)
    visibilitySetByID = Column('VisibilitySetByID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=True, unique=False)

    Accepted = orm.relationship('Taxon', foreign_keys='Taxon.AcceptedID', remote_side='Taxon.TaxonID', backref=orm.backref('acceptedChildren', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Taxon.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    TaxonTreeDef = orm.relationship('TaxonTreeDef', foreign_keys='Taxon.TaxonTreeDefID', remote_side='TaxonTreeDef.TaxonTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    TaxonTreeDefItem = orm.relationship('TaxonTreeDefItem', foreign_keys='Taxon.TaxonTreeDefItemID', remote_side='TaxonTreeDefItem.TaxonTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    HybridParent1 = orm.relationship('Taxon', foreign_keys='Taxon.HybridParent1ID', remote_side='Taxon.TaxonID', backref=orm.backref('hybridChildren1', uselist=True))
    HybridParent2 = orm.relationship('Taxon', foreign_keys='Taxon.HybridParent2ID', remote_side='Taxon.TaxonID', backref=orm.backref('hybridChildren2', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Taxon.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Parent = orm.relationship('Taxon', foreign_keys='Taxon.ParentID', remote_side='Taxon.TaxonID', backref=orm.backref('children', uselist=True))
    TaxonAttribute = orm.relationship('TaxonAttribute', foreign_keys='Taxon.TaxonAttributeID', remote_side='TaxonAttribute.TaxonAttributeID', backref=orm.backref('taxons', uselist=True))
    VisibilitySetBy = orm.relationship('SpecifyUser', foreign_keys='Taxon.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class TaxonAttachment(Base):
    tableid = 119
    _id = 'taxonAttachmentId'
    __tablename__ = 'taxonattachment'

    taxonAttachmentId = Column('Taxonattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    taxonID = Column('TaxonID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=False, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='TaxonAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('taxonAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='TaxonAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='TaxonAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Taxon = orm.relationship('Taxon', foreign_keys='TaxonAttachment.TaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('taxonAttachments', uselist=True))

class TaxonAttribute(Base):
    tableid = 162
    _id = 'taxonAttributeId'
    __tablename__ = 'taxonattribute'

    taxonAttributeId = Column('Taxonattributeid', types.Integer, primary_key=True)
    date1 = Column('Date1', types.Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', types.Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', types.Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', types.Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', types.Numeric, index=False, unique=False, nullable=True)
    number14 = Column('Number14', types.Numeric, index=False, unique=False, nullable=True)
    number15 = Column('Number15', types.Numeric, index=False, unique=False, nullable=True)
    number16 = Column('Number16', types.Numeric, index=False, unique=False, nullable=True)
    number17 = Column('Number17', types.Numeric, index=False, unique=False, nullable=True)
    number18 = Column('Number18', types.Numeric, index=False, unique=False, nullable=True)
    number19 = Column('Number19', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number20 = Column('Number20', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', types.Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', types.Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', types.Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.String, index=False, unique=False, nullable=True)
    text10 = Column('Text10', types.String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', types.String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', types.String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', types.String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', types.String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', types.String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', types.String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', types.String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', types.String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', types.String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.String, index=False, unique=False, nullable=True)
    text20 = Column('Text20', types.String, index=False, unique=False, nullable=True)
    text21 = Column('Text21', types.String, index=False, unique=False, nullable=True)
    text22 = Column('Text22', types.String, index=False, unique=False, nullable=True)
    text23 = Column('Text23', types.String, index=False, unique=False, nullable=True)
    text24 = Column('Text24', types.String, index=False, unique=False, nullable=True)
    text25 = Column('Text25', types.String, index=False, unique=False, nullable=True)
    text26 = Column('Text26', types.String, index=False, unique=False, nullable=True)
    text27 = Column('Text27', types.String, index=False, unique=False, nullable=True)
    text28 = Column('Text28', types.String, index=False, unique=False, nullable=True)
    text29 = Column('Text29', types.String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.String, index=False, unique=False, nullable=True)
    text30 = Column('Text30', types.String, index=False, unique=False, nullable=True)
    text31 = Column('Text31', types.String, index=False, unique=False, nullable=True)
    text32 = Column('Text32', types.String, index=False, unique=False, nullable=True)
    text33 = Column('Text33', types.String, index=False, unique=False, nullable=True)
    text34 = Column('Text34', types.String, index=False, unique=False, nullable=True)
    text35 = Column('Text35', types.String, index=False, unique=False, nullable=True)
    text36 = Column('Text36', types.String, index=False, unique=False, nullable=True)
    text37 = Column('Text37', types.String, index=False, unique=False, nullable=True)
    text38 = Column('Text38', types.String, index=False, unique=False, nullable=True)
    text39 = Column('Text39', types.String, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.String, index=False, unique=False, nullable=True)
    text40 = Column('Text40', types.String, index=False, unique=False, nullable=True)
    text41 = Column('Text41', types.String, index=False, unique=False, nullable=True)
    text42 = Column('Text42', types.String, index=False, unique=False, nullable=True)
    text43 = Column('Text43', types.String, index=False, unique=False, nullable=True)
    text44 = Column('Text44', types.String, index=False, unique=False, nullable=True)
    text45 = Column('Text45', types.String, index=False, unique=False, nullable=True)
    text46 = Column('Text46', types.String, index=False, unique=False, nullable=True)
    text47 = Column('Text47', types.String, index=False, unique=False, nullable=True)
    text48 = Column('Text48', types.String, index=False, unique=False, nullable=True)
    text49 = Column('Text49', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.String, index=False, unique=False, nullable=True)
    text50 = Column('Text50', types.Text, index=False, unique=False, nullable=True)
    text51 = Column('Text51', types.Text, index=False, unique=False, nullable=True)
    text52 = Column('Text52', types.Text, index=False, unique=False, nullable=True)
    text53 = Column('Text53', types.Text, index=False, unique=False, nullable=True)
    text54 = Column('Text54', types.Text, index=False, unique=False, nullable=True)
    text55 = Column('Text55', types.Text, index=False, unique=False, nullable=True)
    text56 = Column('Text56', types.Text, index=False, unique=False, nullable=True)
    text57 = Column('Text57', types.Text, index=False, unique=False, nullable=True)
    text58 = Column('Text58', types.Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', types.String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', types.String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', types.String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo10 = Column('YesNo10', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo11 = Column('YesNo11', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo12 = Column('YesNo12', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo13 = Column('YesNo13', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo14 = Column('YesNo14', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo15 = Column('YesNo15', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo16 = Column('YesNo16', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo17 = Column('YesNo17', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo18 = Column('YesNo18', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo19 = Column('YesNo19', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo20 = Column('YesNo20', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo21 = Column('YesNo21', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo22 = Column('YesNo22', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo23 = Column('YesNo23', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo24 = Column('YesNo24', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo25 = Column('YesNo25', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo26 = Column('YesNo26', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo27 = Column('YesNo27', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo28 = Column('YesNo28', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo29 = Column('YesNo29', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo30 = Column('YesNo30', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo31 = Column('YesNo31', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo32 = Column('YesNo32', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo33 = Column('YesNo33', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo34 = Column('YesNo34', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo35 = Column('YesNo35', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo36 = Column('YesNo36', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo37 = Column('YesNo37', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo38 = Column('YesNo38', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo39 = Column('YesNo39', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo40 = Column('YesNo40', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo41 = Column('YesNo41', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo42 = Column('YesNo42', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo43 = Column('YesNo43', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo44 = Column('YesNo44', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo45 = Column('YesNo45', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo46 = Column('YesNo46', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo47 = Column('YesNo47', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo48 = Column('YesNo48', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo49 = Column('YesNo49', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo50 = Column('YesNo50', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo51 = Column('YesNo51', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo52 = Column('YesNo52', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo53 = Column('YesNo53', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo54 = Column('YesNo54', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo55 = Column('YesNo55', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo56 = Column('YesNo56', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo57 = Column('YesNo57', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo58 = Column('YesNo58', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo59 = Column('YesNo59', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo6 = Column('YesNo6', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo60 = Column('YesNo60', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo61 = Column('YesNo61', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo62 = Column('YesNo62', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo63 = Column('YesNo63', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo64 = Column('YesNo64', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo65 = Column('YesNo65', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo66 = Column('YesNo66', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo67 = Column('YesNo67', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo68 = Column('YesNo68', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo69 = Column('YesNo69', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo7 = Column('YesNo7', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo70 = Column('YesNo70', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo71 = Column('YesNo71', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo72 = Column('YesNo72', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo73 = Column('YesNo73', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo74 = Column('YesNo74', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo75 = Column('YesNo75', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo76 = Column('YesNo76', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo77 = Column('YesNo77', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo78 = Column('YesNo78', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo79 = Column('YesNo79', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo8 = Column('YesNo8', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo80 = Column('YesNo80', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo81 = Column('YesNo81', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo82 = Column('YesNo82', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo9 = Column('YesNo9', mysql_bit_type, index=False, unique=False, nullable=True)

    agent1ID = Column('Agent1ID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Agent1 = orm.relationship('Agent', foreign_keys='TaxonAttribute.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='TaxonAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='TaxonAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class TaxonCitation(Base):
    tableid = 75
    _id = 'taxonCitationId'
    __tablename__ = 'taxoncitation'

    taxonCitationId = Column('Taxoncitationid', types.Integer, primary_key=True)
    figureNumber = Column('FigureNumber', types.String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', types.String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    referenceWorkID = Column('ReferenceWorkID', types.Integer, ForeignKey('ReferenceWork.ReferenceWorkID'), nullable=False, unique=False)
    taxonID = Column('TaxonID', types.Integer, ForeignKey('Taxon.TaxonID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='TaxonCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='TaxonCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ReferenceWork = orm.relationship('ReferenceWork', foreign_keys='TaxonCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('taxonCitations', uselist=True))
    Taxon = orm.relationship('Taxon', foreign_keys='TaxonCitation.TaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('taxonCitations', uselist=True))

class TaxonTreeDef(Base):
    tableid = 76
    _id = 'taxonTreeDefId'
    __tablename__ = 'taxontreedef'

    taxonTreeDefId = Column('Taxontreedefid', types.Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', types.Integer, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    disciplineID = Column('None', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='TaxonTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='TaxonTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class TaxonTreeDefItem(Base):
    tableid = 77
    _id = 'taxonTreeDefItemId'
    __tablename__ = 'taxontreedefitem'

    taxonTreeDefItemId = Column('Taxontreedefitemid', types.Integer, primary_key=True)
    formatToken = Column('FormatToken', types.String, index=False, unique=False, nullable=True)
    fullNameSeparator = Column('FullNameSeparator', types.String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', types.String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    parentID = Column('ParentItemID', types.Integer, ForeignKey('TaxonTreeDefItem.TaxonTreeDefItemID'), nullable=True, unique=False)
    treeDefID = Column('TaxonTreeDefID', types.Integer, ForeignKey('TaxonTreeDef.TaxonTreeDefID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='TaxonTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='TaxonTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ParentItem = orm.relationship('TaxonTreeDefItem', foreign_keys='TaxonTreeDefItem.ParentItemID', remote_side='TaxonTreeDefItem.TaxonTreeDefItemID', backref=orm.backref('children', uselist=True))
    TaxonTreeDef = orm.relationship('TaxonTreeDef', foreign_keys='TaxonTreeDefItem.TaxonTreeDefID', remote_side='TaxonTreeDef.TaxonTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class TreatmentEvent(Base):
    tableid = 122
    _id = 'treatmentEventId'
    __tablename__ = 'treatmentevent'

    treatmentEventId = Column('Treatmenteventid', types.Integer, primary_key=True)
    dateBoxed = Column('DateBoxed', types.Date, index=False, unique=False, nullable=True)
    dateCleaned = Column('DateCleaned', types.Date, index=False, unique=False, nullable=True)
    dateCompleted = Column('DateCompleted', types.Date, index=False, unique=False, nullable=True)
    dateReceived = Column('DateReceived', types.Date, index=True, unique=False, nullable=True)
    dateToIsolation = Column('DateToIsolation', types.Date, index=False, unique=False, nullable=True)
    dateTreatmentEnded = Column('DateTreatmentEnded', types.Date, index=False, unique=False, nullable=True)
    dateTreatmentStarted = Column('DateTreatmentStarted', types.Date, index=True, unique=False, nullable=True)
    fieldNumber = Column('FieldNumber', types.String, index=True, unique=False, nullable=True)
    location = Column('Storage', types.String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Integer, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', types.Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', types.Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    treatmentNumber = Column('TreatmentNumber', types.String, index=True, unique=False, nullable=True)
    type = Column('Type', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    accessionID = Column('AccessionID', types.Integer, ForeignKey('Accession.AccessionID'), nullable=True, unique=False)
    authorizedByID = Column('AuthorizedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=True, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    divisionID = Column('DivisionID', types.Integer, ForeignKey('Division.UserGroupScopeId'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    performedByID = Column('PerformedByID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Accession = orm.relationship('Accession', foreign_keys='TreatmentEvent.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('treatmentEvents', uselist=True))
    AuthorizedBy = orm.relationship('Agent', foreign_keys='TreatmentEvent.AuthorizedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    CollectionObject = orm.relationship('CollectionObject', foreign_keys='TreatmentEvent.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('treatmentEvents', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='TreatmentEvent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    Division = orm.relationship('Division', foreign_keys='TreatmentEvent.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='TreatmentEvent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    PerformedBy = orm.relationship('Agent', foreign_keys='TreatmentEvent.PerformedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class TreatmentEventAttachment(Base):
    tableid = 149
    _id = 'treatmentEventAttachmentId'
    __tablename__ = 'treatmenteventattachment'

    treatmentEventAttachmentId = Column('Treatmenteventattachmentid', types.Integer, primary_key=True)
    ordinal = Column('Ordinal', types.Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    attachmentID = Column('AttachmentID', types.Integer, ForeignKey('Attachment.AttachmentID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    treatmentEventID = Column('TreatmentEventID', types.Integer, ForeignKey('TreatmentEvent.TreatmentEventID'), nullable=False, unique=False)

    Attachment = orm.relationship('Attachment', foreign_keys='TreatmentEventAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('treatmentEventAttachments', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='TreatmentEventAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='TreatmentEventAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    TreatmentEvent = orm.relationship('TreatmentEvent', foreign_keys='TreatmentEventAttachment.TreatmentEventID', remote_side='TreatmentEvent.TreatmentEventID', backref=orm.backref('treatmentEventAttachments', uselist=True))

class VoucherRelationship(Base):
    tableid = 155
    _id = 'voucherRelationshipId'
    __tablename__ = 'voucherrelationship'

    voucherRelationshipId = Column('Voucherrelationshipid', types.Integer, primary_key=True)
    collectionCode = Column('CollectionCode', types.String, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', types.Integer, index=True, unique=False, nullable=False)
    institutionCode = Column('InstitutionCode', types.String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', types.Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', types.Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', types.Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', types.Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', types.Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', types.Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', types.Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', types.Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', types.Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    urlLink = Column('UrlLink', types.String, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    voucherNumber = Column('VoucherNumber', types.String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    collectionObjectID = Column('CollectionObjectID', types.Integer, ForeignKey('CollectionObject.CollectionObjectID'), nullable=False, unique=False)
    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    CollectionObject = orm.relationship('CollectionObject', foreign_keys='VoucherRelationship.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('voucherRelationships', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='VoucherRelationship.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='VoucherRelationship.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Workbench(Base):
    tableid = 79
    _id = 'workbenchId'
    __tablename__ = 'workbench'

    workbenchId = Column('Workbenchid', types.Integer, primary_key=True)
    allPermissionLevel = Column('AllPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    dbTableId = Column('TableID', types.Integer, index=False, unique=False, nullable=True)
    exportInstitutionName = Column('ExportInstitutionName', types.String, index=False, unique=False, nullable=True)
    exportedFromTableName = Column('ExportedFromTableName', types.String, index=False, unique=False, nullable=True)
    formId = Column('FormId', types.Integer, index=False, unique=False, nullable=True)
    groupPermissionLevel = Column('GroupPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    lockedByUserName = Column('LockedByUserName', types.String, index=False, unique=False, nullable=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=True)
    ownerPermissionLevel = Column('OwnerPermissionLevel', types.Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    srcFilePath = Column('SrcFilePath', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    groupID = Column('SpPrincipalID', types.Integer, ForeignKey('SpPrincipal.SpPrincipalID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)
    workbenchTemplateID = Column('WorkbenchTemplateID', types.Integer, ForeignKey('WorkbenchTemplate.WorkbenchTemplateID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='Workbench.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpPrincipal = orm.relationship('SpPrincipal', foreign_keys='Workbench.SpPrincipalID', remote_side='SpPrincipal.SpPrincipalID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Workbench.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='Workbench.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('workbenches', uselist=True))
    WorkbenchTemplate = orm.relationship('WorkbenchTemplate', foreign_keys='Workbench.WorkbenchTemplateID', remote_side='WorkbenchTemplate.WorkbenchTemplateID', backref=orm.backref('workbenches', uselist=True))

class WorkbenchDataItem(Base):
    tableid = 80
    _id = 'workbenchDataItemId'
    __tablename__ = 'workbenchdataitem'

    workbenchDataItemId = Column('Workbenchdataitemid', types.Integer, primary_key=True)
    cellData = Column('CellData', types.Text, index=False, unique=False, nullable=True)
    rowNumber = Column('RowNumber', types.Integer, index=False, unique=False, nullable=True)
    validationStatus = Column('ValidationStatus', types.Integer, index=False, unique=False, nullable=True)

    workbenchRowID = Column('WorkbenchRowID', types.Integer, ForeignKey('WorkbenchRow.WorkbenchRowID'), nullable=False, unique=False)
    workbenchTemplateMappingItemID = Column('WorkbenchTemplateMappingItemID', types.Integer, ForeignKey('WorkbenchTemplateMappingItem.WorkbenchTemplateMappingItemID'), nullable=False, unique=False)

    WorkbenchRow = orm.relationship('WorkbenchRow', foreign_keys='WorkbenchDataItem.WorkbenchRowID', remote_side='WorkbenchRow.WorkbenchRowID', backref=orm.backref('workbenchDataItems', uselist=True))
    WorkbenchTemplateMappingItem = orm.relationship('WorkbenchTemplateMappingItem', foreign_keys='WorkbenchDataItem.WorkbenchTemplateMappingItemID', remote_side='WorkbenchTemplateMappingItem.WorkbenchTemplateMappingItemID', backref=orm.backref('workbenchDataItems', uselist=True))

class WorkbenchRow(Base):
    tableid = 90
    _id = 'workbenchRowId'
    __tablename__ = 'workbenchrow'

    workbenchRowId = Column('Workbenchrowid', types.Integer, primary_key=True)
    bioGeomancerResults = Column('BioGeomancerResults', types.Text, index=False, unique=False, nullable=True)
    cardImageData = Column('CardImageData', types.Text, index=False, unique=False, nullable=True)
    cardImageFullPath = Column('CardImageFullPath', types.String, index=False, unique=False, nullable=True)
    errorEstimate = Column('ErrorEstimate', types.Numeric, index=False, unique=False, nullable=True)
    errorPolygon = Column('ErrorPolygon', types.Text, index=False, unique=False, nullable=True)
    lat1Text = Column('Lat1Text', types.String, index=False, unique=False, nullable=True)
    lat2Text = Column('Lat2Text', types.String, index=False, unique=False, nullable=True)
    long1Text = Column('Long1Text', types.String, index=False, unique=False, nullable=True)
    long2Text = Column('Long2Text', types.String, index=False, unique=False, nullable=True)
    recordId = Column('RecordID', types.Integer, index=False, unique=False, nullable=True)
    rowNumber = Column('RowNumber', types.Integer, index=True, unique=False, nullable=True)
    sgrStatus = Column('SGRStatus', types.Integer, index=False, unique=False, nullable=True)
    uploadStatus = Column('UploadStatus', types.Integer, index=False, unique=False, nullable=True)

    workbenchID = Column('WorkbenchID', types.Integer, ForeignKey('Workbench.WorkbenchID'), nullable=False, unique=False)

    Workbench = orm.relationship('Workbench', foreign_keys='WorkbenchRow.WorkbenchID', remote_side='Workbench.WorkbenchID', backref=orm.backref('workbenchRows', uselist=True))

class WorkbenchRowExportedRelationship(Base):
    tableid = 126
    _id = 'workbenchRowExportedRelationshipId'
    __tablename__ = 'workbenchrowexportedrelationship'

    workbenchRowExportedRelationshipId = Column('Workbenchrowexportedrelationshipid', types.Integer, primary_key=True)
    recordId = Column('RecordID', types.Integer, index=False, unique=False, nullable=True)
    relationshipName = Column('RelationshipName', types.String, index=False, unique=False, nullable=True)
    sequence = Column('Sequence', types.Integer, index=False, unique=False, nullable=True)
    tableName = Column('TableName', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    workbenchRowID = Column('WorkbenchRowID', types.Integer, ForeignKey('WorkbenchRow.WorkbenchRowID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='WorkbenchRowExportedRelationship.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='WorkbenchRowExportedRelationship.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    WorkbenchRow = orm.relationship('WorkbenchRow', foreign_keys='WorkbenchRowExportedRelationship.WorkbenchRowID', remote_side='WorkbenchRow.WorkbenchRowID', backref=orm.backref('workbenchRowExportedRelationships', uselist=True))

class WorkbenchRowImage(Base):
    tableid = 95
    _id = 'workbenchRowImageId'
    __tablename__ = 'workbenchrowimage'

    workbenchRowImageId = Column('Workbenchrowimageid', types.Integer, primary_key=True)
    attachToTableName = Column('AttachToTableName', types.String, index=False, unique=False, nullable=True)
    cardImageData = Column('CardImageData', types.Text, index=False, unique=False, nullable=True)
    cardImageFullPath = Column('CardImageFullPath', types.String, index=False, unique=False, nullable=True)
    imageOrder = Column('ImageOrder', types.Integer, index=False, unique=False, nullable=True)

    workbenchRowID = Column('WorkbenchRowID', types.Integer, ForeignKey('WorkbenchRow.WorkbenchRowID'), nullable=False, unique=False)

    WorkbenchRow = orm.relationship('WorkbenchRow', foreign_keys='WorkbenchRowImage.WorkbenchRowID', remote_side='WorkbenchRow.WorkbenchRowID', backref=orm.backref('workbenchRowImages', uselist=True))

class WorkbenchTemplate(Base):
    tableid = 81
    _id = 'workbenchTemplateId'
    __tablename__ = 'workbenchtemplate'

    workbenchTemplateId = Column('Workbenchtemplateid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    srcFilePath = Column('SrcFilePath', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    specifyUserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='WorkbenchTemplate.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='WorkbenchTemplate.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='WorkbenchTemplate.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('workbenchTemplates', uselist=True))

class WorkbenchTemplateMappingItem(Base):
    tableid = 82
    _id = 'workbenchTemplateMappingItemId'
    __tablename__ = 'workbenchtemplatemappingitem'

    workbenchTemplateMappingItemId = Column('Workbenchtemplatemappingitemid', types.Integer, primary_key=True)
    caption = Column('Caption', types.String, index=False, unique=False, nullable=True)
    carryForward = Column('CarryForward', mysql_bit_type, index=False, unique=False, nullable=True)
    dataFieldLength = Column('DataFieldLength', types.Integer, index=False, unique=False, nullable=True)
    fieldName = Column('FieldName', types.String, index=False, unique=False, nullable=True)
    fieldType = Column('FieldType', types.Integer, index=False, unique=False, nullable=True)
    importedColName = Column('ImportedColName', types.String, index=False, unique=False, nullable=True)
    isEditable = Column('IsEditable', mysql_bit_type, index=False, unique=False, nullable=True)
    isExportableToContent = Column('IsExportableToContent', mysql_bit_type, index=False, unique=False, nullable=True)
    isIncludedInTitle = Column('IsIncludedInTitle', mysql_bit_type, index=False, unique=False, nullable=True)
    isRequired = Column('IsRequired', mysql_bit_type, index=False, unique=False, nullable=True)
    metaData = Column('MetaData', types.String, index=False, unique=False, nullable=True)
    origImportColumnIndex = Column('DataColumnIndex', types.Integer, index=False, unique=False, nullable=True)
    srcTableId = Column('TableId', types.Integer, index=False, unique=False, nullable=True)
    tableName = Column('TableName', types.String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', types.Integer, index=False, unique=False, nullable=True)
    viewOrder = Column('ViewOrder', types.Integer, index=False, unique=False, nullable=True)
    xCoord = Column('XCoord', types.Integer, index=False, unique=False, nullable=True)
    yCoord = Column('YCoord', types.Integer, index=False, unique=False, nullable=True)

    createdByAgentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedByAgentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    workbenchTemplateID = Column('WorkbenchTemplateID', types.Integer, ForeignKey('WorkbenchTemplate.WorkbenchTemplateID'), nullable=False, unique=False)

    CreatedByAgent = orm.relationship('Agent', foreign_keys='WorkbenchTemplateMappingItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='WorkbenchTemplateMappingItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    WorkbenchTemplate = orm.relationship('WorkbenchTemplate', foreign_keys='WorkbenchTemplateMappingItem.WorkbenchTemplateID', remote_side='WorkbenchTemplate.WorkbenchTemplateID', backref=orm.backref('workbenchTemplateMappingItems', uselist=True))

class Spuserexternalid(Base):
    tableid = 1000
    _id = 'spUserExternalIdId'
    __tablename__ = 'None'

    spUserExternalIdId = Column('Spuserexternalidid', types.Integer, primary_key=True)
    provider = Column('Provider', types.String, index=False, unique=False, nullable=False)
    providerid = Column('ProviderId', types.String, index=False, unique=False, nullable=False)
    enabled = Column('Enabled', mysql_bit_type, index=False, unique=False, nullable=False)
    idtoken = Column('IdToken', types.String, index=False, unique=False, nullable=True)

    specifyuserID = Column('SpUserId', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)

    SpUser = orm.relationship('SpecifyUser', foreign_keys='Spuserexternalid.SpUserId', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class Spattachmentdataset(Base):
    tableid = 1001
    _id = 'spAttachmentDataSetId'
    __tablename__ = 'spattachmentdataset'

    spAttachmentDataSetId = Column('Spattachmentdatasetid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    columns = Column('Columns', types.JSON, index=False, unique=False, nullable=False)
    data = Column('Data', types.JSON, index=False, unique=False, nullable=True)
    uploadplan = Column('UploadPlan', types.Text, index=False, unique=False, nullable=True)
    uploadresult = Column('UploadResult', types.JSON, index=False, unique=False, nullable=True)
    rowresults = Column('RowResults', types.String, index=False, unique=False, nullable=True)
    visualorder = Column('VisualOrder', types.JSON, index=False, unique=False, nullable=True)
    importedfilename = Column('ImportedFileName', types.Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampcreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampmodified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    specifyuserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)
    createdbyagentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedbyagentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='Spattachmentdataset.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='Spattachmentdataset.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Spattachmentdataset.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Spattachmentdataset.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class UniquenessRule(Base):
    tableid = 1002
    _id = 'uniquenessRuleId'
    __tablename__ = 'uniquenessrule'

    uniquenessRuleId = Column('Uniquenessruleid', types.Integer, primary_key=True)
    id = Column('UniquenessRuleID', types.Integer, index=True, unique=True, nullable=False)
    isdatabaseconstraint = Column('IsDatabaseConstraint', mysql_bit_type, index=False, unique=False, nullable=False)
    modelname = Column('ModelName', types.String, index=True, unique=False, nullable=False)

    disciplineID = Column('DisciplineID', types.Integer, ForeignKey('Discipline.UserGroupScopeId'), nullable=True, unique=False)

    Discipline = orm.relationship('Discipline', foreign_keys='UniquenessRule.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))

class UniquenessRuleField(Base):
    tableid = 1003
    _id = 'uniquenessRuleFieldId'
    __tablename__ = 'uniquenessrule_field'

    uniquenessRuleFieldId = Column('Uniquenessrulefieldid', types.Integer, primary_key=True)
    id = Column('UniquenessRule_FieldID', types.Integer, index=True, unique=True, nullable=False)
    fieldpath = Column('FieldPath', types.Text, index=True, unique=False, nullable=False)
    isscope = Column('IsScope', mysql_bit_type, index=False, unique=False, nullable=False)

    uniquenessruleID = Column('UniquenessRuleID', types.Integer, ForeignKey('UniquenessRule.UniquenessRuleID'), nullable=False, unique=False)

    UniquenessRule = orm.relationship('UniquenessRule', foreign_keys='UniquenessRuleField.UniquenessRuleID', remote_side='UniquenessRule.UniquenessRuleID', backref=orm.backref('None', uselist=True))

class Message(Base):
    tableid = 1004
    _id = 'messageId'
    __tablename__ = 'notifications_message'

    messageId = Column('Messageid', types.Integer, primary_key=True)
    timestampcreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    content = Column('Content', types.Text, index=False, unique=False, nullable=True)
    read = Column('Read', mysql_bit_type, index=False, unique=False, nullable=False)

    userID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)

    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='Message.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class Spmerging(Base):
    tableid = 1005
    _id = 'spMergingId'
    __tablename__ = 'spmerging'

    spMergingId = Column('Spmergingid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    taskid = Column('TaskID', types.String, index=False, unique=False, nullable=False)
    mergingstatus = Column('MergingStatus', types.String, index=False, unique=False, nullable=False)
    resonses = Column('Resonses', types.Text, index=False, unique=False, nullable=True)
    table = Column('Table', types.String, index=False, unique=False, nullable=False)
    newrecordid = Column('NewRecordID', types.Integer, index=False, unique=False, nullable=False)
    newrecordata = Column('NewRecordData', types.JSON, index=False, unique=False, nullable=True)
    oldrecordids = Column('OldRecordIDs', types.JSON, index=False, unique=False, nullable=True)
    timestampcreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampmodified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    specifyuserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)
    createdbyagentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedbyagentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='Spmerging.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='Spmerging.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Spmerging.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Spmerging.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class UserPolicy(Base):
    tableid = 1006
    _id = 'userPolicyId'
    __tablename__ = 'spuserpolicy'

    userPolicyId = Column('Userpolicyid', types.Integer, primary_key=True)
    resource = Column('Resource', types.String, index=False, unique=False, nullable=False)
    action = Column('Action', types.String, index=False, unique=False, nullable=False)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    specifyuserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='UserPolicy.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='UserPolicy.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class Role(Base):
    tableid = 1007
    _id = 'roleId'
    __tablename__ = 'sprole'

    roleId = Column('Roleid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    description = Column('Description', types.Text, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='Role.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))

class LibraryRole(Base):
    tableid = 1008
    _id = 'libraryRoleId'
    __tablename__ = 'splibraryrole'

    libraryRoleId = Column('Libraryroleid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    descr1iption = Column('Description', types.Text, index=False, unique=False, nullable=True)



class UserRole(Base):
    tableid = 1009
    _id = 'userRoleId'
    __tablename__ = 'spuserrole'

    userRoleId = Column('Userroleid', types.Integer, primary_key=True)

    specifyuserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)
    roleID = Column('RoleID', types.Integer, ForeignKey('Role.RoleID'), nullable=False, unique=False)

    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='UserRole.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    Role = orm.relationship('Role', foreign_keys='UserRole.RoleID', remote_side='Role.RoleID', backref=orm.backref('None', uselist=True))

class RolePolicy(Base):
    tableid = 1010
    _id = 'rolePolicyId'
    __tablename__ = 'sprolepolicy'

    rolePolicyId = Column('Rolepolicyid', types.Integer, primary_key=True)
    resource = Column('Resource', types.String, index=False, unique=False, nullable=False)
    action = Column('Action', types.String, index=False, unique=False, nullable=False)

    roleID = Column('RoleID', types.Integer, ForeignKey('Role.RoleID'), nullable=False, unique=False)

    Role = orm.relationship('Role', foreign_keys='RolePolicy.RoleID', remote_side='Role.RoleID', backref=orm.backref('None', uselist=True))

class LibraryRolePolicy(Base):
    tableid = 1011
    _id = 'libraryRolePolicyId'
    __tablename__ = 'splibraryrolepolicy'

    libraryRolePolicyId = Column('Libraryrolepolicyid', types.Integer, primary_key=True)
    resource = Column('Resource', types.String, index=False, unique=False, nullable=False)
    action = Column('Action', types.String, index=False, unique=False, nullable=False)

    libraryroleID = Column('LibraryRoleID', types.Integer, ForeignKey('LibraryRole.LibraryRoleID'), nullable=False, unique=False)

    LibraryRole = orm.relationship('LibraryRole', foreign_keys='LibraryRolePolicy.LibraryRoleID', remote_side='LibraryRole.LibraryRoleID', backref=orm.backref('None', uselist=True))

class Spdataset(Base):
    tableid = 1012
    _id = 'spDataSetId'
    __tablename__ = 'spdataset'

    spDataSetId = Column('Spdatasetid', types.Integer, primary_key=True)
    name = Column('Name', types.String, index=False, unique=False, nullable=False)
    columns = Column('Columns', types.JSON, index=False, unique=False, nullable=False)
    data = Column('Data', types.JSON, index=False, unique=False, nullable=True)
    uploadplan = Column('UploadPlan', types.Text, index=False, unique=False, nullable=True)
    uploadresult = Column('UploadResult', types.JSON, index=False, unique=False, nullable=True)
    rowresults = Column('RowResults', types.String, index=False, unique=False, nullable=True)
    visualorder = Column('VisualOrder', types.JSON, index=False, unique=False, nullable=True)
    importedfilename = Column('ImportedFileName', types.Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', types.Text, index=False, unique=False, nullable=True)
    timestampcreated = Column('TimestampCreated', types.DateTime, index=False, unique=False, nullable=False)
    timestampmodified = Column('TimestampModified', types.DateTime, index=False, unique=False, nullable=True)

    collectionID = Column('CollectionID', types.Integer, ForeignKey('Collection.UserGroupScopeId'), nullable=True, unique=False)
    specifyuserID = Column('SpecifyUserID', types.Integer, ForeignKey('SpecifyUser.SpecifyUserID'), nullable=False, unique=False)
    createdbyagentID = Column('CreatedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)
    modifiedbyagentID = Column('ModifiedByAgentID', types.Integer, ForeignKey('Agent.AgentID'), nullable=True, unique=False)

    Collection = orm.relationship('Collection', foreign_keys='Spdataset.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    SpecifyUser = orm.relationship('SpecifyUser', foreign_keys='Spdataset.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    CreatedByAgent = orm.relationship('Agent', foreign_keys='Spdataset.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    ModifiedByAgent = orm.relationship('Agent', foreign_keys='Spdataset.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

classes = {
    'Accession': Accession,
    'AccessionAgent': AccessionAgent,
    'AccessionAttachment': AccessionAttachment,
    'AccessionAuthorization': AccessionAuthorization,
    'AccessionCitation': AccessionCitation,
    'Address': Address,
    'AddressOfRecord': AddressOfRecord,
    'Agent': Agent,
    'AgentAttachment': AgentAttachment,
    'AgentGeography': AgentGeography,
    'AgentIdentifier': AgentIdentifier,
    'AgentSpecialty': AgentSpecialty,
    'AgentVariant': AgentVariant,
    'Appraisal': Appraisal,
    'Attachment': Attachment,
    'AttachmentImageAttribute': AttachmentImageAttribute,
    'AttachmentMetadata': AttachmentMetadata,
    'AttachmentTag': AttachmentTag,
    'AttributeDef': AttributeDef,
    'Author': Author,
    'AutoNumberingScheme': AutoNumberingScheme,
    'Borrow': Borrow,
    'BorrowAgent': BorrowAgent,
    'BorrowAttachment': BorrowAttachment,
    'BorrowMaterial': BorrowMaterial,
    'BorrowReturnMaterial': BorrowReturnMaterial,
    'CollectingEvent': CollectingEvent,
    'CollectingEventAttachment': CollectingEventAttachment,
    'CollectingEventAttr': CollectingEventAttr,
    'CollectingEventAttribute': CollectingEventAttribute,
    'CollectingEventAuthorization': CollectingEventAuthorization,
    'CollectingTrip': CollectingTrip,
    'CollectingTripAttachment': CollectingTripAttachment,
    'CollectingTripAttribute': CollectingTripAttribute,
    'CollectingTripAuthorization': CollectingTripAuthorization,
    'Collection': Collection,
    'CollectionObject': CollectionObject,
    'CollectionObjectAttachment': CollectionObjectAttachment,
    'CollectionObjectAttr': CollectionObjectAttr,
    'CollectionObjectAttribute': CollectionObjectAttribute,
    'CollectionObjectCitation': CollectionObjectCitation,
    'CollectionObjectProperty': CollectionObjectProperty,
    'CollectionRelType': CollectionRelType,
    'CollectionRelationship': CollectionRelationship,
    'Collector': Collector,
    'CommonNameTx': CommonNameTx,
    'CommonNameTxCitation': CommonNameTxCitation,
    'ConservDescription': ConservDescription,
    'ConservDescriptionAttachment': ConservDescriptionAttachment,
    'ConservEvent': ConservEvent,
    'ConservEventAttachment': ConservEventAttachment,
    'Container': Container,
    'DNAPrimer': DNAPrimer,
    'DNASequence': DNASequence,
    'DNASequenceAttachment': DNASequenceAttachment,
    'DNASequencingRun': DNASequencingRun,
    'DNASequencingRunAttachment': DNASequencingRunAttachment,
    'DNASequencingRunCitation': DNASequencingRunCitation,
    'DataType': DataType,
    'Deaccession': Deaccession,
    'DeaccessionAgent': DeaccessionAgent,
    'DeaccessionAttachment': DeaccessionAttachment,
    'Determination': Determination,
    'DeterminationCitation': DeterminationCitation,
    'Determiner': Determiner,
    'Discipline': Discipline,
    'Disposal': Disposal,
    'DisposalAgent': DisposalAgent,
    'DisposalAttachment': DisposalAttachment,
    'DisposalPreparation': DisposalPreparation,
    'Division': Division,
    'ExchangeIn': ExchangeIn,
    'ExchangeInAttachment': ExchangeInAttachment,
    'ExchangeInPrep': ExchangeInPrep,
    'ExchangeOut': ExchangeOut,
    'ExchangeOutAttachment': ExchangeOutAttachment,
    'ExchangeOutPrep': ExchangeOutPrep,
    'Exsiccata': Exsiccata,
    'ExsiccataItem': ExsiccataItem,
    'Extractor': Extractor,
    'FieldNotebook': FieldNotebook,
    'FieldNotebookAttachment': FieldNotebookAttachment,
    'FieldNotebookPage': FieldNotebookPage,
    'FieldNotebookPageAttachment': FieldNotebookPageAttachment,
    'FieldNotebookPageSet': FieldNotebookPageSet,
    'FieldNotebookPageSetAttachment': FieldNotebookPageSetAttachment,
    'FundingAgent': FundingAgent,
    'GeoCoordDetail': GeoCoordDetail,
    'Geography': Geography,
    'GeographyTreeDef': GeographyTreeDef,
    'GeographyTreeDefItem': GeographyTreeDefItem,
    'GeologicTimePeriod': GeologicTimePeriod,
    'GeologicTimePeriodTreeDef': GeologicTimePeriodTreeDef,
    'GeologicTimePeriodTreeDefItem': GeologicTimePeriodTreeDefItem,
    'Gift': Gift,
    'GiftAgent': GiftAgent,
    'GiftAttachment': GiftAttachment,
    'GiftPreparation': GiftPreparation,
    'GroupPerson': GroupPerson,
    'InfoRequest': InfoRequest,
    'Institution': Institution,
    'InstitutionNetwork': InstitutionNetwork,
    'Journal': Journal,
    'LatLonPolygon': LatLonPolygon,
    'LatLonPolygonPnt': LatLonPolygonPnt,
    'LithoStrat': LithoStrat,
    'LithoStratTreeDef': LithoStratTreeDef,
    'LithoStratTreeDefItem': LithoStratTreeDefItem,
    'Loan': Loan,
    'LoanAgent': LoanAgent,
    'LoanAttachment': LoanAttachment,
    'LoanPreparation': LoanPreparation,
    'LoanReturnPreparation': LoanReturnPreparation,
    'Locality': Locality,
    'LocalityAttachment': LocalityAttachment,
    'LocalityCitation': LocalityCitation,
    'LocalityDetail': LocalityDetail,
    'LocalityNameAlias': LocalityNameAlias,
    'MaterialSample': MaterialSample,
    'MorphBankView': MorphBankView,
    'OtherIdentifier': OtherIdentifier,
    'PaleoContext': PaleoContext,
    'PcrPerson': PcrPerson,
    'Permit': Permit,
    'PermitAttachment': PermitAttachment,
    'PickList': PickList,
    'PickListItem': PickListItem,
    'PrepType': PrepType,
    'Preparation': Preparation,
    'PreparationAttachment': PreparationAttachment,
    'PreparationAttr': PreparationAttr,
    'PreparationAttribute': PreparationAttribute,
    'PreparationProperty': PreparationProperty,
    'Project': Project,
    'RecordSet': RecordSet,
    'RecordSetItem': RecordSetItem,
    'ReferenceWork': ReferenceWork,
    'ReferenceWorkAttachment': ReferenceWorkAttachment,
    'RepositoryAgreement': RepositoryAgreement,
    'RepositoryAgreementAttachment': RepositoryAgreementAttachment,
    'Shipment': Shipment,
    'SpAppResource': SpAppResource,
    'SpAppResourceData': SpAppResourceData,
    'SpAppResourceDir': SpAppResourceDir,
    'SpAuditLog': SpAuditLog,
    'SpAuditLogField': SpAuditLogField,
    'SpExportSchema': SpExportSchema,
    'SpExportSchemaItem': SpExportSchemaItem,
    'SpExportSchemaItemMapping': SpExportSchemaItemMapping,
    'SpExportSchemaMapping': SpExportSchemaMapping,
    'SpFieldValueDefault': SpFieldValueDefault,
    'SpLocaleContainer': SpLocaleContainer,
    'SpLocaleContainerItem': SpLocaleContainerItem,
    'SpLocaleItemStr': SpLocaleItemStr,
    'SpPermission': SpPermission,
    'SpPrincipal': SpPrincipal,
    'SpQuery': SpQuery,
    'SpQueryField': SpQueryField,
    'SpReport': SpReport,
    'SpSymbiotaInstance': SpSymbiotaInstance,
    'SpTaskSemaphore': SpTaskSemaphore,
    'SpVersion': SpVersion,
    'SpViewSetObj': SpViewSetObj,
    'SpVisualQuery': SpVisualQuery,
    'SpecifyUser': SpecifyUser,
    'Storage': Storage,
    'StorageAttachment': StorageAttachment,
    'StorageTreeDef': StorageTreeDef,
    'StorageTreeDefItem': StorageTreeDefItem,
    'Taxon': Taxon,
    'TaxonAttachment': TaxonAttachment,
    'TaxonAttribute': TaxonAttribute,
    'TaxonCitation': TaxonCitation,
    'TaxonTreeDef': TaxonTreeDef,
    'TaxonTreeDefItem': TaxonTreeDefItem,
    'TreatmentEvent': TreatmentEvent,
    'TreatmentEventAttachment': TreatmentEventAttachment,
    'VoucherRelationship': VoucherRelationship,
    'Workbench': Workbench,
    'WorkbenchDataItem': WorkbenchDataItem,
    'WorkbenchRow': WorkbenchRow,
    'WorkbenchRowExportedRelationship': WorkbenchRowExportedRelationship,
    'WorkbenchRowImage': WorkbenchRowImage,
    'WorkbenchTemplate': WorkbenchTemplate,
    'WorkbenchTemplateMappingItem': WorkbenchTemplateMappingItem,
    'Spuserexternalid': Spuserexternalid,
    'Spattachmentdataset': Spattachmentdataset,
    'UniquenessRule': UniquenessRule,
    'UniquenessRuleField': UniquenessRuleField,
    'Message': Message,
    'Spmerging': Spmerging,
    'UserPolicy': UserPolicy,
    'Role': Role,
    'LibraryRole': LibraryRole,
    'UserRole': UserRole,
    'RolePolicy': RolePolicy,
    'LibraryRolePolicy': LibraryRolePolicy,
    'Spdataset': Spdataset,
}

models_by_tableid = dict((cls.tableid, cls) for cls in list(classes.values()))
