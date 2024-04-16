# from sqlalchemy import Column, ForeignKey, types, orm
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.dialects.mysql import BIT as mysql_bit_type
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Date, Text, ForeignKey, PrimaryKeyConstraint, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.mysql import BIT as mysql_bit_type

Base = declarative_base()

import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.DEBUG)

class AddressOfRecord(Base):
    __tablename__ = 'addressofrecord'
    AddressOfRecordID = Column(Integer, primary_key=True)
    City = Column(String(64))
    accessions = relationship("Accession", back_populates="address_of_record")

class Accession(Base):
    __tablename__ = 'accession'
    AccessionID = Column(Integer, primary_key=True)
    AddressOfRecordID = Column(Integer, ForeignKey('addressofrecord.AddressOfRecordID'))
    address_of_record = relationship("AddressOfRecord", back_populates="accessions")

# class Accession(Base):
#     tableid = 7
#     __tablename__ = 'accession'
#     # _id = 'AccessionID'
#     AccessionID = Column(Integer, primary_key=True, autoincrement=True)
#     # TimestampCreated = Column(DateTime, nullable=False)
#     # TimestampModified = Column(DateTime)
#     # Version = Column(Integer)
#     # AccessionCondition = Column(String(255))
#     # AccessionNumber = Column(String(60), nullable=False, index=True)
#     # DateAccessioned = Column(Date, index=True)
#     # DateAcknowledged = Column(Date)
#     # DateReceived = Column(Date)
#     # Integer1 = Column(Integer)
#     # Integer2 = Column(Integer)
#     # Integer3 = Column(Integer)
#     # Number1 = Column(Decimal(20, 10))
#     # Number2 = Column(Decimal(20, 10))
#     # Remarks = Column(Text)
#     # Status = Column(String(32))
#     # Text1 = Column(Text)
#     # Text2 = Column(Text)
#     # Text3 = Column(Text)
#     # Text4 = Column(Text)
#     # Text5 = Column(Text)
#     # TotalValue = Column(Decimal(12, 2))
#     # Type = Column(String(32))
#     # VerbatimDate = Column(String(50))
#     # YesNo1 = Column(mysql_bit_type(1))
#     # YesNo2 = Column(mysql_bit_type(1))
#     # ModifiedByAgentID = Column(Integer, ForeignKey('agent.AgentID'))
#     # RepositoryAgreementID = Column(Integer, ForeignKey('repositoryagreement.RepositoryAgreementID'))
#     AddressOfRecordID = Column(Integer, ForeignKey('addressofrecord.AddressOfRecordID'))
#     # DivisionID = Column(Integer, ForeignKey('division.UserGroupScopeId'), nullable=False)
#     # CreatedByAgentID = Column(Integer, ForeignKey('agent.AgentID'))

#     # Relationships
#     # modified_by_agent = relationship("Agent", foreign_keys=[ModifiedByAgentID])
#     # created_by_agent = relationship("Agent", foreign_keys=[CreatedByAgentID])
#     # repository_agreement = relationship("RepositoryAgreement")
#     address_of_record = relationship("AddressOfRecord")
#     # division = relationship("Division")

# class AddressOfRecord(Base):
#     tableid = 125
#     __tablename__ = 'addressofrecord'
#     # _id = 'AddressOfRecordID'
#     AddressOfRecordID = Column(Integer, primary_key=True, autoincrement=True)
#     # TimestampCreated = Column(DateTime, nullable=False)
#     # TimestampModified = Column(DateTime)
#     # Version = Column(Integer)
#     # Address = Column(String(255))
#     # Address2 = Column(String(255))
#     City = Column(String(64))
#     # Country = Column(String(64))
#     # PostalCode = Column(String(32))
#     # Remarks = Column(Text)
#     # State = Column(String(64))
#     # ModifiedByAgentID = Column(Integer, ForeignKey('agent.AgentID'))
#     # AgentID = Column(Integer, ForeignKey('agent.AgentID'))
#     # CreatedByAgentID = Column(Integer, ForeignKey('agent.AgentID'))

#     # Relationships
#     # modified_by_agent = relationship("Agent", foreign_keys=[ModifiedByAgentID])
#     # created_by_agent = relationship("Agent", foreign_keys=[CreatedByAgentID])
#     # agent = relationship("Agent", foreign_keys=[AgentID])

# class Accession(Base):
#     tableid = 7
#     _id = 'accessionId'
#     __tablename__ = 'accession'

#     accessionId = Column('Accessionid', Integer, primary_key=True)
#     accessionCondition = Column('AccessionCondition', String, index=False, unique=False, nullable=True)
#     accessionNumber = Column('AccessionNumber', String, index=True, unique=False, nullable=False)
#     dateAccessioned = Column('DateAccessioned', Date, index=True, unique=False, nullable=True)
#     dateAcknowledged = Column('DateAcknowledged', Date, index=False, unique=False, nullable=True)
#     dateReceived = Column('DateReceived', Date, index=False, unique=False, nullable=True)
#     integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
#     integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
#     integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
#     number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
#     number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
#     remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
#     status = Column('Status', String, index=False, unique=False, nullable=True)
#     text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
#     text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
#     text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
#     text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
#     text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
#     timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
#     timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
#     totalValue = Column('TotalValue', Numeric, index=False, unique=False, nullable=True)
#     type = Column('Type', String, index=False, unique=False, nullable=True)
#     verbatimDate = Column('VerbatimDate', String, index=False, unique=False, nullable=True)
#     version = Column('Version', Integer, index=False, unique=False, nullable=True)
#     yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
#     yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

#     # AddressofrecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
#     # AddressOfRecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressofrecord.AddressOfRecordID'), nullable=True, unique=False)
#     AddressOfRecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressofrecord.AddressOfRecordID'), nullable=True, unique=False)
#     # AddressOfRecordID = Column(Integer, ForeignKey('addressofrecord.AddressOfRecordID'))
#     CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
#     DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=False, unique=False)
#     ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
#     RepositoryagreementID = Column('RepositoryAgreementID', Integer, ForeignKey('repositoryAgreement.RepositoryAgreementID'), nullable=True, unique=False)

#     # addressOfRecord = relationship('AddressOfRecord', foreign_keys=[AddressOfRecordID], remote_side='addressofrecord.AddressOfRecordID', backref=orm.backref('accessions', uselist=True))
#     addressOfRecord = relationship('AddressOfRecord', foreign_keys=[AddressOfRecordID], remote_side='AddressOfRecord.AddressOfRecordID', backref=backref('accessions', uselist=True))
#     # addressOfRecord = relationship('AddressOfRecord', foreign_keys=['addressOfRecord.AddressOfRecordID'], remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('accessions', uselist=True))
#     # addressOfRecord = relationship('AddressOfRecord', backref='accessions')
#     createdByAgent = relationship('Agent', foreign_keys='Accession.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
#     division = relationship('Division', foreign_keys='Accession.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
#     modifiedByAgent = relationship('Agent', foreign_keys='Accession.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
#     repositoryAgreement = relationship('RepositoryAgreement', foreign_keys='Accession.RepositoryAgreementID', remote_side='RepositoryAgreement.RepositoryAgreementID', backref=orm.backref('accessions', uselist=True))

class AccessionAgent(Base):
    tableid = 12
    _id = 'accessionAgentId'
    __tablename__ = 'accessionagent'

    accessionAgentId = Column('Accessionagentid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    role = Column('Role', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AccessionID = Column('AccessionID', Integer, ForeignKey('accession.AccessionID'), nullable=True, unique=False)
    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    RepositoryagreementID = Column('RepositoryAgreementID', Integer, ForeignKey('repositoryAgreement.RepositoryAgreementID'), nullable=True, unique=False)

    accession = relationship('Accession', foreign_keys='AccessionAgent.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('accessionAgents', uselist=True))
    agent = relationship('Agent', foreign_keys='AccessionAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AccessionAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AccessionAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    repositoryAgreement = relationship('RepositoryAgreement', foreign_keys='AccessionAgent.RepositoryAgreementID', remote_side='RepositoryAgreement.RepositoryAgreementID', backref=orm.backref('repositoryAgreementAgents', uselist=True))

class AccessionAttachment(Base):
    tableid = 108
    _id = 'accessionAttachmentId'
    __tablename__ = 'accessionattachment'

    accessionAttachmentId = Column('Accessionattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AccessionID = Column('AccessionID', Integer, ForeignKey('accession.AccessionID'), nullable=False, unique=False)
    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    accession = relationship('Accession', foreign_keys='AccessionAttachment.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('accessionAttachments', uselist=True))
    attachment = relationship('Attachment', foreign_keys='AccessionAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('accessionAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AccessionAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AccessionAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AccessionAuthorization(Base):
    tableid = 13
    _id = 'accessionAuthorizationId'
    __tablename__ = 'accessionauthorization'

    accessionAuthorizationId = Column('Accessionauthorizationid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AccessionID = Column('AccessionID', Integer, ForeignKey('accession.AccessionID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PermitID = Column('PermitID', Integer, ForeignKey('permit.PermitID'), nullable=False, unique=False)
    RepositoryagreementID = Column('RepositoryAgreementID', Integer, ForeignKey('repositoryAgreement.RepositoryAgreementID'), nullable=True, unique=False)

    accession = relationship('Accession', foreign_keys='AccessionAuthorization.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('accessionAuthorizations', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AccessionAuthorization.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AccessionAuthorization.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    permit = relationship('Permit', foreign_keys='AccessionAuthorization.PermitID', remote_side='Permit.PermitID', backref=orm.backref('accessionAuthorizations', uselist=True))
    repositoryAgreement = relationship('RepositoryAgreement', foreign_keys='AccessionAuthorization.RepositoryAgreementID', remote_side='RepositoryAgreement.RepositoryAgreementID', backref=orm.backref('repositoryAgreementAuthorizations', uselist=True))

class AccessionCitation(Base):
    tableid = 159
    _id = 'accessionCitationId'
    __tablename__ = 'accessioncitation'

    accessionCitationId = Column('Accessioncitationid', Integer, primary_key=True)
    figureNumber = Column('FigureNumber', String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AccessionID = Column('AccessionID', Integer, ForeignKey('accession.AccessionID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)

    accession = relationship('Accession', foreign_keys='AccessionCitation.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('accessionCitations', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AccessionCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AccessionCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='AccessionCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('None', uselist=True))

class Address(Base):
    tableid = 8
    _id = 'addressId'
    __tablename__ = 'address'

    addressId = Column('Addressid', Integer, primary_key=True)
    address = Column('Address', String, index=False, unique=False, nullable=True)
    address2 = Column('Address2', String, index=False, unique=False, nullable=True)
    address3 = Column('Address3', String, index=False, unique=False, nullable=True)
    address4 = Column('Address4', String, index=False, unique=False, nullable=True)
    address5 = Column('Address5', String, index=False, unique=False, nullable=True)
    city = Column('City', String, index=False, unique=False, nullable=True)
    country = Column('Country', String, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', Date, index=False, unique=False, nullable=True)
    fax = Column('Fax', String, index=False, unique=False, nullable=True)
    isCurrent = Column('IsCurrent', mysql_bit_type, index=False, unique=False, nullable=True)
    isPrimary = Column('IsPrimary', mysql_bit_type, index=False, unique=False, nullable=True)
    isShipping = Column('IsShipping', mysql_bit_type, index=False, unique=False, nullable=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=True)
    phone1 = Column('Phone1', String, index=False, unique=False, nullable=True)
    phone2 = Column('Phone2', String, index=False, unique=False, nullable=True)
    positionHeld = Column('PositionHeld', String, index=False, unique=False, nullable=True)
    postalCode = Column('PostalCode', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    roomOrBuilding = Column('RoomOrBuilding', String, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', Date, index=False, unique=False, nullable=True)
    state = Column('State', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    typeOfAddr = Column('TypeOfAddr', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='Address.AgentID', remote_side='Agent.AgentID', backref=orm.backref('addresses', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Address.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Address.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

# class AddressOfRecord(Base):
#     tableid = 125
#     _id = 'AddressOfRecordID'
#     __tablename__ = 'addressofrecord'

#     # addressOfRecordId = Column('Addressofrecordid', Integer, primary_key=True)
#     # AddressOfRecordID = Column('AddressOfRecordID', Integer, primary_key=True)
#     AddressOfRecordID = Column('AddressOfRecordID', Integer, primary_key=True)
#     address = Column('Address', String, index=False, unique=False, nullable=True)
#     address2 = Column('Address2', String, index=False, unique=False, nullable=True)
#     city = Column('City', String, index=False, unique=False, nullable=True)
#     country = Column('Country', String, index=False, unique=False, nullable=True)
#     postalCode = Column('PostalCode', String, index=False, unique=False, nullable=True)
#     remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
#     state = Column('State', String, index=False, unique=False, nullable=True)
#     timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
#     timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
#     version = Column('Version', Integer, index=False, unique=False, nullable=True)

#     AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
#     CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
#     ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

#     agent = relationship('Agent', foreign_keys='AddressOfRecord.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
#     createdByAgent = relationship('Agent', foreign_keys='AddressOfRecord.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
#     modifiedByAgent = relationship('Agent', foreign_keys='AddressOfRecord.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Agent(Base):
    tableid = 5
    _id = 'agentId'
    __tablename__ = 'agent'

    agentId = Column('Agentid', Integer, primary_key=True)
    abbreviation = Column('Abbreviation', String, index=True, unique=False, nullable=True)
    agentType = Column('AgentType', Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', Integer, index=False, unique=False, nullable=True)
    dateOfBirth = Column('DateOfBirth', Date, index=False, unique=False, nullable=True)
    dateOfBirthPrecision = Column('DateOfBirthPrecision', Integer, index=False, unique=False, nullable=True)
    dateOfDeath = Column('DateOfDeath', Date, index=False, unique=False, nullable=True)
    dateOfDeathPrecision = Column('DateOfDeathPrecision', Integer, index=False, unique=False, nullable=True)
    dateType = Column('DateType', Integer, index=False, unique=False, nullable=True)
    email = Column('Email', String, index=False, unique=False, nullable=True)
    firstName = Column('FirstName', String, index=True, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    initials = Column('Initials', String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    interests = Column('Interests', String, index=False, unique=False, nullable=True)
    jobTitle = Column('JobTitle', String, index=False, unique=False, nullable=True)
    lastName = Column('LastName', String, index=True, unique=False, nullable=True)
    middleInitial = Column('MiddleInitial', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    suffix = Column('Suffix', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=False, unique=False, nullable=True)
    url = Column('URL', String, index=False, unique=False, nullable=True)
    verbatimDate1 = Column('VerbatimDate1', String, index=False, unique=False, nullable=True)
    verbatimDate2 = Column('VerbatimDate2', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollcontentcontactID = Column('CollectionCCID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    ColltechcontactID = Column('CollectionTCID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=True, unique=False)
    InstcontentcontactID = Column('InstitutionCCID', Integer, ForeignKey('institution.UserGroupScopeId'), nullable=True, unique=False)
    InsttechcontactID = Column('InstitutionTCID', Integer, ForeignKey('institution.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    OrganizationID = Column('ParentOrganizationID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=True, unique=False)

    collectionCC = relationship('Collection', foreign_keys='Agent.CollectionCCID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('contentContacts', uselist=True))
    collectionTC = relationship('Collection', foreign_keys='Agent.CollectionTCID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('technicalContacts', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Agent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='Agent.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('members', uselist=True))
    institutionCC = relationship('Institution', foreign_keys='Agent.InstitutionCCID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('contentContacts', uselist=True))
    institutionTC = relationship('Institution', foreign_keys='Agent.InstitutionTCID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('technicalContacts', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Agent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parentOrganization = relationship('Agent', foreign_keys='Agent.ParentOrganizationID', remote_side='Agent.AgentID', backref=orm.backref('orgMembers', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='Agent.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('agents', uselist=True))

class AgentAttachment(Base):
    tableid = 109
    _id = 'agentAttachmentId'
    __tablename__ = 'agentattachment'

    agentAttachmentId = Column('Agentattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='AgentAttachment.AgentID', remote_side='Agent.AgentID', backref=orm.backref('agentAttachments', uselist=True))
    attachment = relationship('Attachment', foreign_keys='AgentAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('agentAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AgentAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AgentAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AgentGeography(Base):
    tableid = 78
    _id = 'agentGeographyId'
    __tablename__ = 'agentgeography'

    agentGeographyId = Column('Agentgeographyid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    role = Column('Role', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    GeographyID = Column('GeographyID', Integer, ForeignKey('geography.GeographyID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='AgentGeography.AgentID', remote_side='Agent.AgentID', backref=orm.backref('agentGeographies', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AgentGeography.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    geography = relationship('Geography', foreign_keys='AgentGeography.GeographyID', remote_side='Geography.GeographyID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AgentGeography.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AgentIdentifier(Base):
    tableid = 168
    _id = 'agentIdentifierId'
    __tablename__ = 'agentidentifier'

    agentIdentifierId = Column('Agentidentifierid', Integer, primary_key=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', Integer, index=False, unique=False, nullable=True)
    identifier = Column('Identifier', String, index=False, unique=False, nullable=False)
    identifierType = Column('IdentifierType', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='AgentIdentifier.AgentID', remote_side='Agent.AgentID', backref=orm.backref('identifiers', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AgentIdentifier.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AgentIdentifier.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AgentSpecialty(Base):
    tableid = 86
    _id = 'agentSpecialtyId'
    __tablename__ = 'agentspecialty'

    agentSpecialtyId = Column('Agentspecialtyid', Integer, primary_key=True)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=False)
    specialtyName = Column('SpecialtyName', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='AgentSpecialty.AgentID', remote_side='Agent.AgentID', backref=orm.backref('agentSpecialties', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AgentSpecialty.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AgentSpecialty.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AgentVariant(Base):
    tableid = 107
    _id = 'agentVariantId'
    __tablename__ = 'agentvariant'

    agentVariantId = Column('Agentvariantid', Integer, primary_key=True)
    country = Column('Country', String, index=False, unique=False, nullable=True)
    language = Column('Language', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    varType = Column('VarType', Integer, index=False, unique=False, nullable=False)
    variant = Column('Variant', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='AgentVariant.AgentID', remote_side='Agent.AgentID', backref=orm.backref('variants', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AgentVariant.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AgentVariant.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Appraisal(Base):
    tableid = 67
    _id = 'appraisalId'
    __tablename__ = 'appraisal'

    appraisalId = Column('Appraisalid', Integer, primary_key=True)
    appraisalDate = Column('AppraisalDate', Date, index=True, unique=False, nullable=False)
    appraisalNumber = Column('AppraisalNumber', String, index=True, unique=True, nullable=False)
    appraisalValue = Column('AppraisalValue', Numeric, index=False, unique=False, nullable=True)
    monetaryUnitType = Column('MonetaryUnitType', String, index=False, unique=False, nullable=True)
    notes = Column('Notes', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AccessionID = Column('AccessionID', Integer, ForeignKey('accession.AccessionID'), nullable=True, unique=False)
    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    accession = relationship('Accession', foreign_keys='Appraisal.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('appraisals', uselist=True))
    agent = relationship('Agent', foreign_keys='Appraisal.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Appraisal.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Appraisal.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Attachment(Base):
    tableid = 41
    _id = 'attachmentId'
    __tablename__ = 'attachment'

    attachmentId = Column('Attachmentid', Integer, primary_key=True)
    attachmentLocation = Column('AttachmentLocation', String, index=False, unique=False, nullable=True)
    attachmentStorageConfig = Column('AttachmentStorageConfig', Text, index=False, unique=False, nullable=True)
    captureDevice = Column('CaptureDevice', String, index=False, unique=False, nullable=True)
    copyrightDate = Column('CopyrightDate', String, index=False, unique=False, nullable=True)
    copyrightHolder = Column('CopyrightHolder', String, index=False, unique=False, nullable=True)
    credit = Column('Credit', String, index=False, unique=False, nullable=True)
    dateImaged = Column('DateImaged', String, index=True, unique=False, nullable=True)
    fileCreatedDate = Column('FileCreatedDate', Date, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    isPublic = Column('IsPublic', mysql_bit_type, index=False, unique=False, nullable=False)
    license = Column('License', String, index=False, unique=False, nullable=True)
    licenseLogoUrl = Column('LicenseLogoUrl', String, index=False, unique=False, nullable=True)
    metadataText = Column('MetadataText', String, index=False, unique=False, nullable=True)
    mimeType = Column('MimeType', String, index=False, unique=False, nullable=True)
    origFilename = Column('OrigFilename', Text, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    scopeID = Column('ScopeID', Integer, index=True, unique=False, nullable=True)
    scopeType = Column('ScopeType', Integer, index=True, unique=False, nullable=True)
    subjectOrientation = Column('SubjectOrientation', String, index=False, unique=False, nullable=True)
    subtype = Column('Subtype', String, index=False, unique=False, nullable=True)
    tableID = Column('TableID', Integer, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=True, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', Integer, index=False, unique=False, nullable=True)

    AttachmentimageattributeID = Column('AttachmentImageAttributeID', Integer, ForeignKey('attachmentImageAttribute.AttachmentImageAttributeID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatorID = Column('CreatorID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    VisibilitysetbyID = Column('VisibilitySetByID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=True, unique=False)

    attachmentImageAttribute = relationship('AttachmentImageAttribute', foreign_keys='Attachment.AttachmentImageAttributeID', remote_side='AttachmentImageAttribute.AttachmentImageAttributeID', backref=orm.backref('attachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Attachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    creator = relationship('Agent', foreign_keys='Attachment.CreatorID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Attachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    visibilitySetBy = relationship('SpecifyUser', foreign_keys='Attachment.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class AttachmentImageAttribute(Base):
    tableid = 139
    _id = 'attachmentImageAttributeId'
    __tablename__ = 'attachmentimageattribute'

    attachmentImageAttributeId = Column('Attachmentimageattributeid', Integer, primary_key=True)
    creativeCommons = Column('CreativeCommons', String, index=False, unique=False, nullable=True)
    height = Column('Height', Integer, index=False, unique=False, nullable=True)
    imageType = Column('ImageType', String, index=False, unique=False, nullable=True)
    magnification = Column('Magnification', Float, index=False, unique=False, nullable=True)
    mbImageId = Column('MBImageID', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    resolution = Column('Resolution', Float, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampLastSend = Column('TimestampLastSend', DateTime, index=False, unique=False, nullable=True)
    timestampLastUpdateCheck = Column('TimestampLastUpdateCheck', DateTime, index=False, unique=False, nullable=True)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    viewDescription = Column('ViewDescription', String, index=False, unique=False, nullable=True)
    width = Column('Width', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    MorphbankviewID = Column('MorphBankViewID', Integer, ForeignKey('morphBankView.MorphBankViewID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='AttachmentImageAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AttachmentImageAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    morphBankView = relationship('MorphBankView', foreign_keys='AttachmentImageAttribute.MorphBankViewID', remote_side='MorphBankView.MorphBankViewID', backref=orm.backref('attachmentImageAttributes', uselist=True))

class AttachmentMetadata(Base):
    tableid = 42
    _id = 'attachmentMetadataID'
    __tablename__ = 'attachmentmetadata'

    attachmentMetadataID = Column('Attachmentmetadataid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    value = Column('Value', String, index=False, unique=False, nullable=False)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='AttachmentMetadata.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('metadata', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AttachmentMetadata.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AttachmentMetadata.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AttachmentTag(Base):
    tableid = 130
    _id = 'attachmentTagID'
    __tablename__ = 'attachmenttag'

    attachmentTagID = Column('Attachmenttagid', Integer, primary_key=True)
    tag = Column('Tag', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='AttachmentTag.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('tags', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='AttachmentTag.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AttachmentTag.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class AttributeDef(Base):
    tableid = 16
    _id = 'attributeDefId'
    __tablename__ = 'attributedef'

    attributeDefId = Column('Attributedefid', Integer, primary_key=True)
    dataType = Column('DataType', Integer, index=False, unique=False, nullable=True)
    fieldName = Column('FieldName', String, index=False, unique=False, nullable=True)
    tableType = Column('TableType', Integer, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreptypeID = Column('PrepTypeID', Integer, ForeignKey('prepType.PrepTypeID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='AttributeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='AttributeDef.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('attributeDefs', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AttributeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    prepType = relationship('PrepType', foreign_keys='AttributeDef.PrepTypeID', remote_side='PrepType.PrepTypeID', backref=orm.backref('attributeDefs', uselist=True))

class Author(Base):
    tableid = 17
    _id = 'authorId'
    __tablename__ = 'author'

    authorId = Column('Authorid', Integer, primary_key=True)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)

    agent = relationship('Agent', foreign_keys='Author.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Author.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Author.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='Author.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('authors', uselist=True))

class AutoNumberingScheme(Base):
    tableid = 97
    _id = 'autoNumberingSchemeId'
    __tablename__ = 'autonumberingscheme'

    autoNumberingSchemeId = Column('Autonumberingschemeid', Integer, primary_key=True)
    formatName = Column('FormatName', String, index=False, unique=False, nullable=True)
    isNumericOnly = Column('IsNumericOnly', mysql_bit_type, index=False, unique=False, nullable=False)
    schemeClassName = Column('SchemeClassName', String, index=False, unique=False, nullable=True)
    schemeName = Column('SchemeName', String, index=True, unique=False, nullable=True)
    tableNumber = Column('TableNumber', Integer, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='AutoNumberingScheme.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='AutoNumberingScheme.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Borrow(Base):
    tableid = 18
    _id = 'borrowId'
    __tablename__ = 'borrow'

    borrowId = Column('Borrowid', Integer, primary_key=True)
    borrowDate = Column('BorrowDate', Date, index=False, unique=False, nullable=True)
    borrowDatePrecision = Column('BorrowDatePrecision', Integer, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    currentDueDate = Column('CurrentDueDate', Date, index=False, unique=False, nullable=True)
    dateClosed = Column('DateClosed', Date, index=False, unique=False, nullable=True)
    invoiceNumber = Column('InvoiceNumber', String, index=True, unique=False, nullable=False)
    isClosed = Column('IsClosed', mysql_bit_type, index=False, unique=False, nullable=True)
    isFinancialResponsibility = Column('IsFinancialResponsibility', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    numberOfItemsBorrowed = Column('NumberOfItemsBorrowed', Integer, index=False, unique=False, nullable=True)
    originalDueDate = Column('OriginalDueDate', Date, index=False, unique=False, nullable=True)
    receivedDate = Column('ReceivedDate', Date, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    status = Column('Status', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AddressofrecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    addressOfRecord = relationship('AddressOfRecord', foreign_keys='Borrow.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Borrow.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Borrow.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class BorrowAgent(Base):
    tableid = 19
    _id = 'borrowAgentId'
    __tablename__ = 'borrowagent'

    borrowAgentId = Column('Borrowagentid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    role = Column('Role', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    BorrowID = Column('BorrowID', Integer, ForeignKey('borrow.BorrowID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='BorrowAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    borrow = relationship('Borrow', foreign_keys='BorrowAgent.BorrowID', remote_side='Borrow.BorrowID', backref=orm.backref('borrowAgents', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='BorrowAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='BorrowAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class BorrowAttachment(Base):
    tableid = 145
    _id = 'borrowAttachmentId'
    __tablename__ = 'borrowattachment'

    borrowAttachmentId = Column('Borrowattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    BorrowID = Column('BorrowID', Integer, ForeignKey('borrow.BorrowID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='BorrowAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('borrowAttachments', uselist=True))
    borrow = relationship('Borrow', foreign_keys='BorrowAttachment.BorrowID', remote_side='Borrow.BorrowID', backref=orm.backref('borrowAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='BorrowAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='BorrowAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class BorrowMaterial(Base):
    tableid = 20
    _id = 'borrowMaterialId'
    __tablename__ = 'borrowmaterial'

    borrowMaterialId = Column('Borrowmaterialid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    description = Column('Description', String, index=True, unique=False, nullable=True)
    inComments = Column('InComments', Text, index=False, unique=False, nullable=True)
    materialNumber = Column('MaterialNumber', String, index=True, unique=False, nullable=False)
    outComments = Column('OutComments', Text, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', Integer, index=False, unique=False, nullable=True)
    quantityResolved = Column('QuantityResolved', Integer, index=False, unique=False, nullable=True)
    quantityReturned = Column('QuantityReturned', Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    BorrowID = Column('BorrowID', Integer, ForeignKey('borrow.BorrowID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    borrow = relationship('Borrow', foreign_keys='BorrowMaterial.BorrowID', remote_side='Borrow.BorrowID', backref=orm.backref('borrowMaterials', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='BorrowMaterial.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='BorrowMaterial.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class BorrowReturnMaterial(Base):
    tableid = 21
    _id = 'borrowReturnMaterialId'
    __tablename__ = 'borrowreturnmaterial'

    borrowReturnMaterialId = Column('Borrowreturnmaterialid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    quantity = Column('Quantity', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    returnedDate = Column('ReturnedDate', Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('ReturnedByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    BorrowmaterialID = Column('BorrowMaterialID', Integer, ForeignKey('borrowMaterial.BorrowMaterialID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    returnedBy = relationship('Agent', foreign_keys='BorrowReturnMaterial.ReturnedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    borrowMaterial = relationship('BorrowMaterial', foreign_keys='BorrowReturnMaterial.BorrowMaterialID', remote_side='BorrowMaterial.BorrowMaterialID', backref=orm.backref('borrowReturnMaterials', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='BorrowReturnMaterial.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='BorrowReturnMaterial.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingEvent(Base):
    tableid = 10
    _id = 'collectingEventId'
    __tablename__ = 'collectingevent'

    collectingEventId = Column('Collectingeventid', Integer, primary_key=True)
    endDate = Column('EndDate', Date, index=True, unique=False, nullable=True)
    endDatePrecision = Column('EndDatePrecision', Integer, index=False, unique=False, nullable=True)
    endDateVerbatim = Column('EndDateVerbatim', String, index=False, unique=False, nullable=True)
    endTime = Column('EndTime', Integer, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    method = Column('Method', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', Integer, index=False, unique=False, nullable=True)
    reservedText1 = Column('ReservedText1', String, index=False, unique=False, nullable=True)
    reservedText2 = Column('ReservedText2', String, index=False, unique=False, nullable=True)
    sgrStatus = Column('SGRStatus', Integer, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', Date, index=True, unique=False, nullable=True)
    startDatePrecision = Column('StartDatePrecision', Integer, index=False, unique=False, nullable=True)
    startDateVerbatim = Column('StartDateVerbatim', String, index=False, unique=False, nullable=True)
    startTime = Column('StartTime', Integer, index=False, unique=False, nullable=True)
    stationFieldNumber = Column('StationFieldNumber', String, index=True, unique=False, nullable=True)
    stationFieldNumberModifier1 = Column('StationFieldNumberModifier1', String, index=False, unique=False, nullable=True)
    stationFieldNumberModifier2 = Column('StationFieldNumberModifier2', String, index=False, unique=False, nullable=True)
    stationFieldNumberModifier3 = Column('StationFieldNumberModifier3', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    uniqueIdentifier = Column('UniqueIdentifier', String, index=True, unique=False, nullable=True)
    verbatimDate = Column('VerbatimDate', String, index=False, unique=False, nullable=True)
    verbatimLocality = Column('VerbatimLocality', Text, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', Integer, index=False, unique=False, nullable=True)

    CollectingeventattributeID = Column('CollectingEventAttributeID', Integer, ForeignKey('collectingEventAttribute.CollectingEventAttributeID'), nullable=True, unique=False)
    CollectingtripID = Column('CollectingTripID', Integer, ForeignKey('collectingTrip.CollectingTripID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    LocalityID = Column('LocalityID', Integer, ForeignKey('locality.LocalityID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PaleocontextID = Column('PaleoContextID', Integer, ForeignKey('paleoContext.PaleoContextID'), nullable=True, unique=False)
    VisibilitysetbyID = Column('VisibilitySetByID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=True, unique=False)

    collectingEventAttribute = relationship('CollectingEventAttribute', foreign_keys='CollectingEvent.CollectingEventAttributeID', remote_side='CollectingEventAttribute.CollectingEventAttributeID', backref=orm.backref('collectingEvents', uselist=True))
    collectingTrip = relationship('CollectingTrip', foreign_keys='CollectingEvent.CollectingTripID', remote_side='CollectingTrip.CollectingTripID', backref=orm.backref('collectingEvents', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectingEvent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='CollectingEvent.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    locality = relationship('Locality', foreign_keys='CollectingEvent.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('collectingEvents', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingEvent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    paleoContext = relationship('PaleoContext', foreign_keys='CollectingEvent.PaleoContextID', remote_side='PaleoContext.PaleoContextID', backref=orm.backref('collectingEvents', uselist=True))
    visibilitySetBy = relationship('SpecifyUser', foreign_keys='CollectingEvent.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class CollectingEventAttachment(Base):
    tableid = 110
    _id = 'collectingEventAttachmentId'
    __tablename__ = 'collectingeventattachment'

    collectingEventAttachmentId = Column('Collectingeventattachmentid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CollectingeventID = Column('CollectingEventID', Integer, ForeignKey('collectingEvent.CollectingEventID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='CollectingEventAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('collectingEventAttachments', uselist=True))
    collectingEvent = relationship('CollectingEvent', foreign_keys='CollectingEventAttachment.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectingEventAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectingEventAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingEventAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingEventAttr(Base):
    tableid = 25
    _id = 'attrId'
    __tablename__ = 'collectingeventattr'

    attrId = Column('Attrid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    dblValue = Column('DoubleValue', Float, index=False, unique=False, nullable=True)
    strValue = Column('StrValue', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectingeventID = Column('CollectingEventID', Integer, ForeignKey('collectingEvent.CollectingEventID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DefinitionID = Column('AttributeDefID', Integer, ForeignKey('attributeDef.AttributeDefID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collectingEvent = relationship('CollectingEvent', foreign_keys='CollectingEventAttr.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectingEventAttrs', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectingEventAttr.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    attributeDef = relationship('AttributeDef', foreign_keys='CollectingEventAttr.AttributeDefID', remote_side='AttributeDef.AttributeDefID', backref=orm.backref('collectingEventAttrs', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingEventAttr.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingEventAttribute(Base):
    tableid = 92
    _id = 'collectingEventAttributeId'
    __tablename__ = 'collectingeventattribute'

    collectingEventAttributeId = Column('Collectingeventattributeid', Integer, primary_key=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', Text, index=False, unique=False, nullable=True)
    text11 = Column('Text11', Text, index=False, unique=False, nullable=True)
    text12 = Column('Text12', Text, index=False, unique=False, nullable=True)
    text13 = Column('Text13', Text, index=False, unique=False, nullable=True)
    text14 = Column('Text14', Text, index=False, unique=False, nullable=True)
    text15 = Column('Text15', Text, index=False, unique=False, nullable=True)
    text16 = Column('Text16', Text, index=False, unique=False, nullable=True)
    text17 = Column('Text17', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', Text, index=False, unique=False, nullable=True)
    text9 = Column('Text9', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    HosttaxonID = Column('HostTaxonID', Integer, ForeignKey('taxon.TaxonID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='CollectingEventAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='CollectingEventAttribute.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    hostTaxon = relationship('Taxon', foreign_keys='CollectingEventAttribute.HostTaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('collectingEventAttributes', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingEventAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingEventAuthorization(Base):
    tableid = 152
    _id = 'collectingEventAuthorizationId'
    __tablename__ = 'collectingeventauthorization'

    collectingEventAuthorizationId = Column('Collectingeventauthorizationid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectingeventID = Column('CollectingEventID', Integer, ForeignKey('collectingEvent.CollectingEventID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PermitID = Column('PermitID', Integer, ForeignKey('permit.PermitID'), nullable=False, unique=False)

    collectingEvent = relationship('CollectingEvent', foreign_keys='CollectingEventAuthorization.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectingEventAuthorizations', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectingEventAuthorization.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingEventAuthorization.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    permit = relationship('Permit', foreign_keys='CollectingEventAuthorization.PermitID', remote_side='Permit.PermitID', backref=orm.backref('collectingEventAuthorizations', uselist=True))

class CollectingTrip(Base):
    tableid = 87
    _id = 'collectingTripId'
    __tablename__ = 'collectingtrip'

    collectingTripId = Column('Collectingtripid', Integer, primary_key=True)
    collectingTripName = Column('CollectingTripName', String, index=True, unique=False, nullable=True)
    cruise = Column('Cruise', String, index=False, unique=False, nullable=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', Integer, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', Date, index=False, unique=False, nullable=True)
    endDatePrecision = Column('EndDatePrecision', Integer, index=False, unique=False, nullable=True)
    endDateVerbatim = Column('EndDateVerbatim', String, index=False, unique=False, nullable=True)
    endTime = Column('EndTime', Integer, index=False, unique=False, nullable=True)
    expedition = Column('Expedition', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    sponsor = Column('Sponsor', String, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', Date, index=True, unique=False, nullable=True)
    startDatePrecision = Column('StartDatePrecision', Integer, index=False, unique=False, nullable=True)
    startDateVerbatim = Column('StartDateVerbatim', String, index=False, unique=False, nullable=True)
    startTime = Column('StartTime', Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', Text, index=False, unique=False, nullable=True)
    text9 = Column('Text9', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    vessel = Column('Vessel', String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    Agent1ID = Column('Agent1ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent2ID = Column('Agent2ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CollectingtripattributeID = Column('CollectingTripAttributeID', Integer, ForeignKey('collectingTripAttribute.CollectingTripAttributeID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent1 = relationship('Agent', foreign_keys='CollectingTrip.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent2 = relationship('Agent', foreign_keys='CollectingTrip.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    collectingTripAttribute = relationship('CollectingTripAttribute', foreign_keys='CollectingTrip.CollectingTripAttributeID', remote_side='CollectingTripAttribute.CollectingTripAttributeID', backref=orm.backref('collectingTrips', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectingTrip.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='CollectingTrip.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingTrip.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingTripAttachment(Base):
    tableid = 156
    _id = 'collectingTripAttachmentId'
    __tablename__ = 'collectingtripattachment'

    collectingTripAttachmentId = Column('Collectingtripattachmentid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CollectingtripID = Column('CollectingTripID', Integer, ForeignKey('collectingTrip.CollectingTripID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='CollectingTripAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('collectingTripAttachments', uselist=True))
    collectingTrip = relationship('CollectingTrip', foreign_keys='CollectingTripAttachment.CollectingTripID', remote_side='CollectingTrip.CollectingTripID', backref=orm.backref('collectingTripAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectingTripAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingTripAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingTripAttribute(Base):
    tableid = 157
    _id = 'collectingTripAttributeId'
    __tablename__ = 'collectingtripattribute'

    collectingTripAttributeId = Column('Collectingtripattributeid', Integer, primary_key=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='CollectingTripAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='CollectingTripAttribute.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingTripAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectingTripAuthorization(Base):
    tableid = 158
    _id = 'collectingTripAuthorizationId'
    __tablename__ = 'collectingtripauthorization'

    collectingTripAuthorizationId = Column('Collectingtripauthorizationid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectingtripID = Column('CollectingTripID', Integer, ForeignKey('collectingTrip.CollectingTripID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PermitID = Column('PermitID', Integer, ForeignKey('permit.PermitID'), nullable=False, unique=False)

    collectingTrip = relationship('CollectingTrip', foreign_keys='CollectingTripAuthorization.CollectingTripID', remote_side='CollectingTrip.CollectingTripID', backref=orm.backref('collectingTripAuthorizations', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectingTripAuthorization.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectingTripAuthorization.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    permit = relationship('Permit', foreign_keys='CollectingTripAuthorization.PermitID', remote_side='Permit.PermitID', backref=orm.backref('collectingTripAuthorizations', uselist=True))

class Collection(Base):
    tableid = 23
    _id = 'userGroupScopeId'
    __tablename__ = 'collection'

    userGroupScopeId = Column('Usergroupscopeid', Integer, primary_key=True)
    catalogNumFormatName = Column('CatalogFormatNumName', String, index=False, unique=False, nullable=False)
    code = Column('Code', String, index=False, unique=False, nullable=True)
    collectionName = Column('CollectionName', String, index=True, unique=False, nullable=True)
    collectionType = Column('CollectionType', String, index=False, unique=False, nullable=True)
    dbContentVersion = Column('DbContentVersion', String, index=False, unique=False, nullable=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    developmentStatus = Column('DevelopmentStatus', String, index=False, unique=False, nullable=True)
    estimatedSize = Column('EstimatedSize', Integer, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    institutionType = Column('InstitutionType', String, index=False, unique=False, nullable=True)
    isEmbeddedCollectingEvent = Column('IsEmbeddedCollectingEvent', mysql_bit_type, index=False, unique=False, nullable=False)
    isaNumber = Column('IsaNumber', String, index=False, unique=False, nullable=True)
    kingdomCoverage = Column('KingdomCoverage', String, index=False, unique=False, nullable=True)
    preservationMethodType = Column('PreservationMethodType', String, index=False, unique=False, nullable=True)
    primaryFocus = Column('PrimaryFocus', String, index=False, unique=False, nullable=True)
    primaryPurpose = Column('PrimaryPurpose', String, index=False, unique=False, nullable=True)
    regNumber = Column('RegNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    scope = Column('Scope', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    webPortalURI = Column('WebPortalURI', String, index=False, unique=False, nullable=True)
    webSiteURI = Column('WebSiteURI', String, index=False, unique=False, nullable=True)

    AdmincontactID = Column('AdminContactID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    InstitutionnetworkID = Column('InstitutionNetworkID', Integer, ForeignKey('institution.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    adminContact = relationship('Agent', foreign_keys='Collection.AdminContactID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Collection.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='Collection.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('collections', uselist=True))
    institutionNetwork = relationship('Institution', foreign_keys='Collection.InstitutionNetworkID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Collection.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionObject(Base):
    tableid = 1
    _id = 'collectionObjectId'
    __tablename__ = 'collectionobject'

    collectionObjectId = Column('Collectionobjectid', Integer, primary_key=True)
    altCatalogNumber = Column('AltCatalogNumber', String, index=True, unique=False, nullable=True)
    availability = Column('Availability', String, index=False, unique=False, nullable=True)
    catalogNumber = Column('CatalogNumber', String, index=True, unique=False, nullable=True)
    catalogedDate = Column('CatalogedDate', Date, index=True, unique=False, nullable=True)
    catalogedDatePrecision = Column('CatalogedDatePrecision', Integer, index=False, unique=False, nullable=True)
    catalogedDateVerbatim = Column('CatalogedDateVerbatim', String, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=False, unique=False, nullable=False)
    countAmt = Column('CountAmt', Integer, index=False, unique=False, nullable=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    deaccessioned = Column('Deaccessioned', mysql_bit_type, index=False, unique=False, nullable=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    embargoReason = Column('EmbargoReason', Text, index=False, unique=False, nullable=True)
    embargoReleaseDate = Column('EmbargoReleaseDate', Date, index=False, unique=False, nullable=True)
    embargoReleaseDatePrecision = Column('EmbargoReleaseDatePrecision', Integer, index=False, unique=False, nullable=True)
    embargoStartDate = Column('EmbargoStartDate', Date, index=False, unique=False, nullable=True)
    embargoStartDatePrecision = Column('EmbargoStartDatePrecision', Integer, index=False, unique=False, nullable=True)
    fieldNumber = Column('FieldNumber', String, index=True, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    inventoryDate = Column('InventoryDate', Date, index=False, unique=False, nullable=True)
    inventoryDatePrecision = Column('InventoryDatePrecision', Integer, index=False, unique=False, nullable=True)
    modifier = Column('Modifier', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=True)
    notifications = Column('Notifications', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    numberOfDuplicates = Column('NumberOfDuplicates', Integer, index=False, unique=False, nullable=True)
    objectCondition = Column('ObjectCondition', String, index=False, unique=False, nullable=True)
    ocr = Column('OCR', Text, index=False, unique=False, nullable=True)
    projectNumber = Column('ProjectNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', Integer, index=False, unique=False, nullable=True)
    reservedText = Column('ReservedText', String, index=False, unique=False, nullable=True)
    reservedText2 = Column('ReservedText2', String, index=False, unique=False, nullable=True)
    reservedText3 = Column('ReservedText3', String, index=False, unique=False, nullable=True)
    restrictions = Column('Restrictions', String, index=False, unique=False, nullable=True)
    sgrStatus = Column('SGRStatus', Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    totalValue = Column('TotalValue', Numeric, index=False, unique=False, nullable=True)
    uniqueIdentifier = Column('UniqueIdentifier', String, index=True, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo6 = Column('YesNo6', mysql_bit_type, index=False, unique=False, nullable=True)

    AccessionID = Column('AccessionID', Integer, ForeignKey('accession.AccessionID'), nullable=True, unique=False)
    Agent1ID = Column('Agent1ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    AppraisalID = Column('AppraisalID', Integer, ForeignKey('appraisal.AppraisalID'), nullable=True, unique=False)
    CatalogerID = Column('CatalogerID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CollectingeventID = Column('CollectingEventID', Integer, ForeignKey('collectingEvent.CollectingEventID'), nullable=True, unique=False)
    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=False, unique=False)
    CollectionobjectattributeID = Column('CollectionObjectAttributeID', Integer, ForeignKey('collectionObjectAttribute.CollectionObjectAttributeID'), nullable=True, unique=False)
    ContainerID = Column('ContainerID', Integer, ForeignKey('container.ContainerID'), nullable=True, unique=False)
    ContainerownerID = Column('ContainerOwnerID', Integer, ForeignKey('container.ContainerID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    EmbargoauthorityID = Column('EmbargoAuthorityID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    FieldnotebookpageID = Column('FieldNotebookPageID', Integer, ForeignKey('fieldNotebookPage.FieldNotebookPageID'), nullable=True, unique=False)
    InventorizedbyID = Column('InventorizedByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PaleocontextID = Column('PaleoContextID', Integer, ForeignKey('paleoContext.PaleoContextID'), nullable=True, unique=False)
    VisibilitysetbyID = Column('VisibilitySetByID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=True, unique=False)

    accession = relationship('Accession', foreign_keys='CollectionObject.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('collectionObjects', uselist=True))
    agent1 = relationship('Agent', foreign_keys='CollectionObject.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    appraisal = relationship('Appraisal', foreign_keys='CollectionObject.AppraisalID', remote_side='Appraisal.AppraisalID', backref=orm.backref('collectionObjects', uselist=True))
    cataloger = relationship('Agent', foreign_keys='CollectionObject.CatalogerID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    collectingEvent = relationship('CollectingEvent', foreign_keys='CollectionObject.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectionObjects', uselist=True))
    collection = relationship('Collection', foreign_keys='CollectionObject.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    collectionObjectAttribute = relationship('CollectionObjectAttribute', foreign_keys='CollectionObject.CollectionObjectAttributeID', remote_side='CollectionObjectAttribute.CollectionObjectAttributeID', backref=orm.backref('collectionObjects', uselist=True))
    container = relationship('Container', foreign_keys='CollectionObject.ContainerID', remote_side='Container.ContainerID', backref=orm.backref('collectionObjects', uselist=True))
    containerOwner = relationship('Container', foreign_keys='CollectionObject.ContainerOwnerID', remote_side='Container.ContainerID', backref=orm.backref('collectionObjectKids', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectionObject.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    embargoAuthority = relationship('Agent', foreign_keys='CollectionObject.EmbargoAuthorityID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    fieldNotebookPage = relationship('FieldNotebookPage', foreign_keys='CollectionObject.FieldNotebookPageID', remote_side='FieldNotebookPage.FieldNotebookPageID', backref=orm.backref('collectionObjects', uselist=True))
    inventorizedBy = relationship('Agent', foreign_keys='CollectionObject.InventorizedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectionObject.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    paleoContext = relationship('PaleoContext', foreign_keys='CollectionObject.PaleoContextID', remote_side='PaleoContext.PaleoContextID', backref=orm.backref('collectionObjects', uselist=True))
    visibilitySetBy = relationship('SpecifyUser', foreign_keys='CollectionObject.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class CollectionObjectAttachment(Base):
    tableid = 111
    _id = 'collectionObjectAttachmentId'
    __tablename__ = 'collectionobjectattachment'

    collectionObjectAttachmentId = Column('Collectionobjectattachmentid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='CollectionObjectAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('collectionObjectAttachments', uselist=True))
    collectionObject = relationship('CollectionObject', foreign_keys='CollectionObjectAttachment.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('collectionObjectAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectionObjectAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectionObjectAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionObjectAttr(Base):
    tableid = 28
    _id = 'attrId'
    __tablename__ = 'collectionobjectattr'

    attrId = Column('Attrid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    dblValue = Column('DoubleValue', Float, index=False, unique=False, nullable=True)
    strValue = Column('StrValue', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DefinitionID = Column('AttributeDefID', Integer, ForeignKey('attributeDef.AttributeDefID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collectionObject = relationship('CollectionObject', foreign_keys='CollectionObjectAttr.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('collectionObjectAttrs', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectionObjectAttr.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    attributeDef = relationship('AttributeDef', foreign_keys='CollectionObjectAttr.AttributeDefID', remote_side='AttributeDef.AttributeDefID', backref=orm.backref('collectionObjectAttrs', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectionObjectAttr.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionObjectAttribute(Base):
    tableid = 93
    _id = 'collectionObjectAttributeId'
    __tablename__ = 'collectionobjectattribute'

    collectionObjectAttributeId = Column('Collectionobjectattributeid', Integer, primary_key=True)
    bottomDistance = Column('BottomDistance', Numeric, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    direction = Column('Direction', String, index=False, unique=False, nullable=True)
    distanceUnits = Column('DistanceUnits', String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', Numeric, index=False, unique=False, nullable=True)
    number14 = Column('Number14', Numeric, index=False, unique=False, nullable=True)
    number15 = Column('Number15', Numeric, index=False, unique=False, nullable=True)
    number16 = Column('Number16', Numeric, index=False, unique=False, nullable=True)
    number17 = Column('Number17', Numeric, index=False, unique=False, nullable=True)
    number18 = Column('Number18', Numeric, index=False, unique=False, nullable=True)
    number19 = Column('Number19', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number20 = Column('Number20', Numeric, index=False, unique=False, nullable=True)
    number21 = Column('Number21', Numeric, index=False, unique=False, nullable=True)
    number22 = Column('Number22', Numeric, index=False, unique=False, nullable=True)
    number23 = Column('Number23', Numeric, index=False, unique=False, nullable=True)
    number24 = Column('Number24', Numeric, index=False, unique=False, nullable=True)
    number25 = Column('Number25', Numeric, index=False, unique=False, nullable=True)
    number26 = Column('Number26', Numeric, index=False, unique=False, nullable=True)
    number27 = Column('Number27', Numeric, index=False, unique=False, nullable=True)
    number28 = Column('Number28', Numeric, index=False, unique=False, nullable=True)
    number29 = Column('Number29', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number30 = Column('Number30', Integer, index=False, unique=False, nullable=True)
    number31 = Column('Number31', Numeric, index=False, unique=False, nullable=True)
    number32 = Column('Number32', Numeric, index=False, unique=False, nullable=True)
    number33 = Column('Number33', Numeric, index=False, unique=False, nullable=True)
    number34 = Column('Number34', Numeric, index=False, unique=False, nullable=True)
    number35 = Column('Number35', Numeric, index=False, unique=False, nullable=True)
    number36 = Column('Number36', Numeric, index=False, unique=False, nullable=True)
    number37 = Column('Number37', Numeric, index=False, unique=False, nullable=True)
    number38 = Column('Number38', Numeric, index=False, unique=False, nullable=True)
    number39 = Column('Number39', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number40 = Column('Number40', Numeric, index=False, unique=False, nullable=True)
    number41 = Column('Number41', Numeric, index=False, unique=False, nullable=True)
    number42 = Column('Number42', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', Integer, index=False, unique=False, nullable=True)
    number9 = Column('Number9', Numeric, index=False, unique=False, nullable=True)
    positionState = Column('PositionState', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', Text, index=False, unique=False, nullable=True)
    text17 = Column('Text17', Text, index=False, unique=False, nullable=True)
    text18 = Column('Text18', Text, index=False, unique=False, nullable=True)
    text19 = Column('Text19', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text20 = Column('Text20', Text, index=False, unique=False, nullable=True)
    text21 = Column('Text21', Text, index=False, unique=False, nullable=True)
    text22 = Column('Text22', Text, index=False, unique=False, nullable=True)
    text23 = Column('Text23', Text, index=False, unique=False, nullable=True)
    text24 = Column('Text24', Text, index=False, unique=False, nullable=True)
    text25 = Column('Text25', Text, index=False, unique=False, nullable=True)
    text26 = Column('Text26', Text, index=False, unique=False, nullable=True)
    text27 = Column('Text27', Text, index=False, unique=False, nullable=True)
    text28 = Column('Text28', Text, index=False, unique=False, nullable=True)
    text29 = Column('Text29', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text30 = Column('Text30', Text, index=False, unique=False, nullable=True)
    text31 = Column('Text31', Text, index=False, unique=False, nullable=True)
    text32 = Column('Text32', Text, index=False, unique=False, nullable=True)
    text33 = Column('Text33', Text, index=False, unique=False, nullable=True)
    text34 = Column('Text34', Text, index=False, unique=False, nullable=True)
    text35 = Column('Text35', Text, index=False, unique=False, nullable=True)
    text36 = Column('Text36', Text, index=False, unique=False, nullable=True)
    text37 = Column('Text37', Text, index=False, unique=False, nullable=True)
    text38 = Column('Text38', Text, index=False, unique=False, nullable=True)
    text39 = Column('Text39', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text40 = Column('Text40', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    topDistance = Column('TopDistance', Numeric, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
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

    Agent1ID = Column('Agent1ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent1 = relationship('Agent', foreign_keys='CollectionObjectAttribute.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectionObjectAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectionObjectAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionObjectCitation(Base):
    tableid = 29
    _id = 'collectionObjectCitationId'
    __tablename__ = 'collectionobjectcitation'

    collectionObjectCitationId = Column('Collectionobjectcitationid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    figureNumber = Column('FigureNumber', String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)

    collectionObject = relationship('CollectionObject', foreign_keys='CollectionObjectCitation.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('collectionObjectCitations', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectionObjectCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectionObjectCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='CollectionObjectCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('collectionObjectCitations', uselist=True))

class CollectionObjectProperty(Base):
    tableid = 153
    _id = 'collectionObjectPropertyId'
    __tablename__ = 'collectionobjectproperty'

    collectionObjectPropertyId = Column('Collectionobjectpropertyid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date10 = Column('Date10', Date, index=False, unique=False, nullable=True)
    date11 = Column('Date11', Date, index=False, unique=False, nullable=True)
    date12 = Column('Date12', Date, index=False, unique=False, nullable=True)
    date13 = Column('Date13', Date, index=False, unique=False, nullable=True)
    date14 = Column('Date14', Date, index=False, unique=False, nullable=True)
    date15 = Column('Date15', Date, index=False, unique=False, nullable=True)
    date16 = Column('Date16', Date, index=False, unique=False, nullable=True)
    date17 = Column('Date17', Date, index=False, unique=False, nullable=True)
    date18 = Column('Date18', Date, index=False, unique=False, nullable=True)
    date19 = Column('Date19', Date, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    date20 = Column('Date20', Date, index=False, unique=False, nullable=True)
    date3 = Column('Date3', Date, index=False, unique=False, nullable=True)
    date4 = Column('Date4', Date, index=False, unique=False, nullable=True)
    date5 = Column('Date5', Date, index=False, unique=False, nullable=True)
    date6 = Column('Date6', Date, index=False, unique=False, nullable=True)
    date7 = Column('Date7', Date, index=False, unique=False, nullable=True)
    date8 = Column('Date8', Date, index=False, unique=False, nullable=True)
    date9 = Column('Date9', Date, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', Integer, index=False, unique=False, nullable=True)
    integer11 = Column('Integer11', Integer, index=False, unique=False, nullable=True)
    integer12 = Column('Integer12', Integer, index=False, unique=False, nullable=True)
    integer13 = Column('Integer13', Integer, index=False, unique=False, nullable=True)
    integer14 = Column('Integer14', Integer, index=False, unique=False, nullable=True)
    integer15 = Column('Integer15', Integer, index=False, unique=False, nullable=True)
    integer16 = Column('Integer16', Integer, index=False, unique=False, nullable=True)
    integer17 = Column('Integer17', Integer, index=False, unique=False, nullable=True)
    integer18 = Column('Integer18', Integer, index=False, unique=False, nullable=True)
    integer19 = Column('Integer19', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer20 = Column('Integer20', Integer, index=False, unique=False, nullable=True)
    integer21 = Column('Integer21', Integer, index=False, unique=False, nullable=True)
    integer22 = Column('Integer22', Integer, index=False, unique=False, nullable=True)
    integer23 = Column('Integer23', Integer, index=False, unique=False, nullable=True)
    integer24 = Column('Integer24', Integer, index=False, unique=False, nullable=True)
    integer25 = Column('Integer25', Integer, index=False, unique=False, nullable=True)
    integer26 = Column('Integer26', Integer, index=False, unique=False, nullable=True)
    integer27 = Column('Integer27', Integer, index=False, unique=False, nullable=True)
    integer28 = Column('Integer28', Integer, index=False, unique=False, nullable=True)
    integer29 = Column('Integer29', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer30 = Column('Integer30', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', Numeric, index=False, unique=False, nullable=True)
    number14 = Column('Number14', Numeric, index=False, unique=False, nullable=True)
    number15 = Column('Number15', Numeric, index=False, unique=False, nullable=True)
    number16 = Column('Number16', Numeric, index=False, unique=False, nullable=True)
    number17 = Column('Number17', Numeric, index=False, unique=False, nullable=True)
    number18 = Column('Number18', Numeric, index=False, unique=False, nullable=True)
    number19 = Column('Number19', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number20 = Column('Number20', Numeric, index=False, unique=False, nullable=True)
    number21 = Column('Number21', Numeric, index=False, unique=False, nullable=True)
    number22 = Column('Number22', Numeric, index=False, unique=False, nullable=True)
    number23 = Column('Number23', Numeric, index=False, unique=False, nullable=True)
    number24 = Column('Number24', Numeric, index=False, unique=False, nullable=True)
    number25 = Column('Number25', Numeric, index=False, unique=False, nullable=True)
    number26 = Column('Number26', Numeric, index=False, unique=False, nullable=True)
    number27 = Column('Number27', Numeric, index=False, unique=False, nullable=True)
    number28 = Column('Number28', Numeric, index=False, unique=False, nullable=True)
    number29 = Column('Number29', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number30 = Column('Number30', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text10 = Column('Text10', String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text20 = Column('Text20', String, index=False, unique=False, nullable=True)
    text21 = Column('Text21', String, index=False, unique=False, nullable=True)
    text22 = Column('Text22', String, index=False, unique=False, nullable=True)
    text23 = Column('Text23', String, index=False, unique=False, nullable=True)
    text24 = Column('Text24', String, index=False, unique=False, nullable=True)
    text25 = Column('Text25', String, index=False, unique=False, nullable=True)
    text26 = Column('Text26', String, index=False, unique=False, nullable=True)
    text27 = Column('Text27', String, index=False, unique=False, nullable=True)
    text28 = Column('Text28', String, index=False, unique=False, nullable=True)
    text29 = Column('Text29', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    text30 = Column('Text30', String, index=False, unique=False, nullable=True)
    text31 = Column('Text31', Text, index=False, unique=False, nullable=True)
    text32 = Column('Text32', Text, index=False, unique=False, nullable=True)
    text33 = Column('Text33', Text, index=False, unique=False, nullable=True)
    text34 = Column('Text34', Text, index=False, unique=False, nullable=True)
    text35 = Column('Text35', Text, index=False, unique=False, nullable=True)
    text36 = Column('Text36', Text, index=False, unique=False, nullable=True)
    text37 = Column('Text37', Text, index=False, unique=False, nullable=True)
    text38 = Column('Text38', Text, index=False, unique=False, nullable=True)
    text39 = Column('Text39', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text40 = Column('Text40', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
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

    Agent1ID = Column('Agent1ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent10ID = Column('Agent10ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent11ID = Column('Agent11ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent12ID = Column('Agent12ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent13ID = Column('Agent13ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent14ID = Column('Agent14ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent15ID = Column('Agent15ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent16ID = Column('Agent16ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent17ID = Column('Agent17ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent18ID = Column('Agent18ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent19ID = Column('Agent19ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent2ID = Column('Agent2ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent20ID = Column('Agent20ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent3ID = Column('Agent3ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent4ID = Column('Agent4ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent5ID = Column('Agent5ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent6ID = Column('Agent6ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent7ID = Column('Agent7ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent8ID = Column('Agent8D', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent9ID = Column('Agent9ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent1 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent10 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent10ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent11 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent11ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent12 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent12ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent13 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent13ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent14 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent14ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent15 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent15ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent16 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent16ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent17 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent17ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent18 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent18ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent19 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent19ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent2 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent20 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent20ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent3 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent3ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent4 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent4ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent5 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent5ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent6 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent6ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent7 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent7ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent8D', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent9 = relationship('Agent', foreign_keys='CollectionObjectProperty.Agent9ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    collectionObject = relationship('CollectionObject', foreign_keys='CollectionObjectProperty.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('collectionObjectProperties', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectionObjectProperty.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectionObjectProperty.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CollectionRelType(Base):
    tableid = 98
    _id = 'collectionRelTypeId'
    __tablename__ = 'collectionreltype'

    collectionRelTypeId = Column('Collectionreltypeid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    LeftsidecollectionID = Column('LeftSideCollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    RightsidecollectionID = Column('RightSideCollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='CollectionRelType.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    leftSideCollection = relationship('Collection', foreign_keys='CollectionRelType.LeftSideCollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('leftSideRelTypes', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectionRelType.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    rightSideCollection = relationship('Collection', foreign_keys='CollectionRelType.RightSideCollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('rightSideRelTypes', uselist=True))

class CollectionRelationship(Base):
    tableid = 99
    _id = 'collectionRelationshipId'
    __tablename__ = 'collectionrelationship'

    collectionRelationshipId = Column('Collectionrelationshipid', Integer, primary_key=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionreltypeID = Column('CollectionRelTypeID', Integer, ForeignKey('collectionRelType.CollectionRelTypeID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    LeftsideID = Column('LeftSideCollectionID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    RightsideID = Column('RightSideCollectionID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)

    collectionRelType = relationship('CollectionRelType', foreign_keys='CollectionRelationship.CollectionRelTypeID', remote_side='CollectionRelType.CollectionRelTypeID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CollectionRelationship.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    leftSideCollection = relationship('CollectionObject', foreign_keys='CollectionRelationship.LeftSideCollectionID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('leftSideRels', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CollectionRelationship.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    rightSideCollection = relationship('CollectionObject', foreign_keys='CollectionRelationship.RightSideCollectionID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('rightSideRels', uselist=True))

class Collector(Base):
    tableid = 30
    _id = 'collectorId'
    __tablename__ = 'collector'

    collectorId = Column('Collectorid', Integer, primary_key=True)
    isPrimary = Column('IsPrimary', mysql_bit_type, index=False, unique=False, nullable=False)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CollectingeventID = Column('CollectingEventID', Integer, ForeignKey('collectingEvent.CollectingEventID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='Collector.AgentID', remote_side='Agent.AgentID', backref=orm.backref('collectors', uselist=True))
    collectingEvent = relationship('CollectingEvent', foreign_keys='Collector.CollectingEventID', remote_side='CollectingEvent.CollectingEventID', backref=orm.backref('collectors', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Collector.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='Collector.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Collector.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class CommonNameTx(Base):
    tableid = 106
    _id = 'commonNameTxId'
    __tablename__ = 'commonnametx'

    commonNameTxId = Column('Commonnametxid', Integer, primary_key=True)
    author = Column('Author', String, index=False, unique=False, nullable=True)
    country = Column('Country', String, index=True, unique=False, nullable=True)
    language = Column('Language', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    variant = Column('Variant', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    TaxonID = Column('TaxonID', Integer, ForeignKey('taxon.TaxonID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='CommonNameTx.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CommonNameTx.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    taxon = relationship('Taxon', foreign_keys='CommonNameTx.TaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('commonNames', uselist=True))

class CommonNameTxCitation(Base):
    tableid = 134
    _id = 'commonNameTxCitationId'
    __tablename__ = 'commonnametxcitation'

    commonNameTxCitationId = Column('Commonnametxcitationid', Integer, primary_key=True)
    figureNumber = Column('FigureNumber', String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    CommonnametxID = Column('CommonNameTxID', Integer, ForeignKey('commonNameTx.CommonNameTxID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)

    commonNameTx = relationship('CommonNameTx', foreign_keys='CommonNameTxCitation.CommonNameTxID', remote_side='CommonNameTx.CommonNameTxID', backref=orm.backref('citations', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='CommonNameTxCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='CommonNameTxCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='CommonNameTxCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('None', uselist=True))

class ConservDescription(Base):
    tableid = 103
    _id = 'conservDescriptionId'
    __tablename__ = 'conservdescription'

    conservDescriptionId = Column('Conservdescriptionid', Integer, primary_key=True)
    backgroundInfo = Column('BackgroundInfo', Text, index=False, unique=False, nullable=True)
    composition = Column('Composition', Text, index=False, unique=False, nullable=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', Integer, index=False, unique=False, nullable=True)
    date3 = Column('Date3', Date, index=False, unique=False, nullable=True)
    date3Precision = Column('Date3Precision', Integer, index=False, unique=False, nullable=True)
    date4 = Column('Date4', Date, index=False, unique=False, nullable=True)
    date4Precision = Column('Date4Precision', Integer, index=False, unique=False, nullable=True)
    date5 = Column('Date5', Date, index=False, unique=False, nullable=True)
    date5Precision = Column('Date5Precision', Integer, index=False, unique=False, nullable=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    determinedDate = Column('CatalogedDate', Date, index=False, unique=False, nullable=True)
    displayRecommendations = Column('DisplayRecommendations', Text, index=False, unique=False, nullable=True)
    height = Column('Height', Numeric, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    lightRecommendations = Column('LightRecommendations', Text, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    objLength = Column('ObjLength', Numeric, index=False, unique=False, nullable=True)
    otherRecommendations = Column('OtherRecommendations', Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    shortDesc = Column('ShortDesc', String, index=True, unique=False, nullable=True)
    source = Column('Source', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    units = Column('Units', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    width = Column('Width', Numeric, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=True, unique=False)

    collectionObject = relationship('CollectionObject', foreign_keys='ConservDescription.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('conservDescriptions', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ConservDescription.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='ConservDescription.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ConservDescription.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='ConservDescription.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('conservDescriptions', uselist=True))

class ConservDescriptionAttachment(Base):
    tableid = 112
    _id = 'conservDescriptionAttachmentId'
    __tablename__ = 'conservdescriptionattachment'

    conservDescriptionAttachmentId = Column('Conservdescriptionattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    ConservdescriptionID = Column('ConservDescriptionID', Integer, ForeignKey('conservDescription.ConservDescriptionID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='ConservDescriptionAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('conservDescriptionAttachments', uselist=True))
    conservDescription = relationship('ConservDescription', foreign_keys='ConservDescriptionAttachment.ConservDescriptionID', remote_side='ConservDescription.ConservDescriptionID', backref=orm.backref('conservDescriptionAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ConservDescriptionAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ConservDescriptionAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ConservEvent(Base):
    tableid = 73
    _id = 'conservEventId'
    __tablename__ = 'conservevent'

    conservEventId = Column('Conserveventid', Integer, primary_key=True)
    advTestingExam = Column('AdvTestingExam', Text, index=False, unique=False, nullable=True)
    advTestingExamResults = Column('AdvTestingExamResults', Text, index=False, unique=False, nullable=True)
    completedComments = Column('CompletedComments', Text, index=False, unique=False, nullable=True)
    completedDate = Column('CompletedDate', Date, index=False, unique=False, nullable=True)
    completedDatePrecision = Column('CompletedDatePrecision', Integer, index=False, unique=False, nullable=True)
    conditionReport = Column('ConditionReport', Text, index=False, unique=False, nullable=True)
    curatorApprovalDate = Column('CuratorApprovalDate', Date, index=False, unique=False, nullable=True)
    curatorApprovalDatePrecision = Column('CuratorApprovalDatePrecision', Integer, index=False, unique=False, nullable=True)
    examDate = Column('ExamDate', Date, index=True, unique=False, nullable=True)
    examDatePrecision = Column('ExamDatePrecision', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Integer, index=False, unique=False, nullable=True)
    photoDocs = Column('PhotoDocs', Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    treatmentCompDate = Column('TreatmentCompDate', Date, index=False, unique=False, nullable=True)
    treatmentCompDatePrecision = Column('TreatmentCompDatePrecision', Integer, index=False, unique=False, nullable=True)
    treatmentReport = Column('TreatmentReport', Text, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    ConservdescriptionID = Column('ConservDescriptionID', Integer, ForeignKey('conservDescription.ConservDescriptionID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CuratorID = Column('CuratorID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ExaminedbyagentID = Column('ExaminedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    TreatedbyagentID = Column('TreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    conservDescription = relationship('ConservDescription', foreign_keys='ConservEvent.ConservDescriptionID', remote_side='ConservDescription.ConservDescriptionID', backref=orm.backref('events', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ConservEvent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    curator = relationship('Agent', foreign_keys='ConservEvent.CuratorID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    examinedByAgent = relationship('Agent', foreign_keys='ConservEvent.ExaminedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ConservEvent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    treatedByAgent = relationship('Agent', foreign_keys='ConservEvent.TreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ConservEventAttachment(Base):
    tableid = 113
    _id = 'conservEventAttachmentId'
    __tablename__ = 'conserveventattachment'

    conservEventAttachmentId = Column('Conserveventattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    ConserveventID = Column('ConservEventID', Integer, ForeignKey('conservEvent.ConservEventID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='ConservEventAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('conservEventAttachments', uselist=True))
    conservEvent = relationship('ConservEvent', foreign_keys='ConservEventAttachment.ConservEventID', remote_side='ConservEvent.ConservEventID', backref=orm.backref('conservEventAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ConservEventAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ConservEventAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Container(Base):
    tableid = 31
    _id = 'containerId'
    __tablename__ = 'container'

    containerId = Column('Containerid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=True)
    number = Column('Number', Integer, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', Integer, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentID', Integer, ForeignKey('container.ContainerID'), nullable=True, unique=False)
    StorageID = Column('StorageID', Integer, ForeignKey('storage.StorageID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='Container.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Container.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parent = relationship('Container', foreign_keys='Container.ParentID', remote_side='Container.ContainerID', backref=orm.backref('children', uselist=True))
    storage = relationship('Storage', foreign_keys='Container.StorageID', remote_side='Storage.StorageID', backref=orm.backref('containers', uselist=True))

class DNAPrimer(Base):
    tableid = 150
    _id = 'dnaPrimerId'
    __tablename__ = 'dnaprimer'

    dnaPrimerId = Column('Dnaprimerid', Integer, primary_key=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    primerDesignator = Column('PrimerDesignator', String, index=True, unique=False, nullable=True)
    primerNameForward = Column('PrimerNameForward', String, index=False, unique=False, nullable=True)
    primerNameReverse = Column('PrimerNameReverse', String, index=False, unique=False, nullable=True)
    primerReferenceCitationForward = Column('PrimerReferenceCitationForward', String, index=False, unique=False, nullable=True)
    primerReferenceCitationReverse = Column('PrimerReferenceCitationReverse', String, index=False, unique=False, nullable=True)
    primerReferenceLinkForward = Column('PrimerReferenceLinkForward', String, index=False, unique=False, nullable=True)
    primerReferenceLinkReverse = Column('PrimerReferenceLinkReverse', String, index=False, unique=False, nullable=True)
    primerSequenceForward = Column('PrimerSequenceForward', String, index=False, unique=False, nullable=True)
    primerSequenceReverse = Column('PrimerSequenceReverse', String, index=False, unique=False, nullable=True)
    purificationMethod = Column('purificationMethod', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', Integer, index=False, unique=False, nullable=True)
    reservedNumber3 = Column('ReservedNumber3', Numeric, index=False, unique=False, nullable=True)
    reservedNumber4 = Column('ReservedNumber4', Numeric, index=False, unique=False, nullable=True)
    reservedText3 = Column('ReservedText3', Text, index=False, unique=False, nullable=True)
    reservedText4 = Column('ReservedText4', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='DNAPrimer.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DNAPrimer.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequence(Base):
    tableid = 121
    _id = 'dnaSequenceId'
    __tablename__ = 'dnasequence'

    dnaSequenceId = Column('Dnasequenceid', Integer, primary_key=True)
    ambiguousResidues = Column('AmbiguousResidues', Integer, index=False, unique=False, nullable=True)
    boldBarcodeId = Column('BOLDBarcodeID', String, index=True, unique=False, nullable=True)
    boldLastUpdateDate = Column('BOLDLastUpdateDate', Date, index=False, unique=False, nullable=True)
    boldSampleId = Column('BOLDSampleID', String, index=True, unique=False, nullable=True)
    boldTranslationMatrix = Column('BOLDTranslationMatrix', String, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=False, unique=False, nullable=False)
    compA = Column('CompA', Integer, index=False, unique=False, nullable=True)
    compC = Column('CompC', Integer, index=False, unique=False, nullable=True)
    compG = Column('CompG', Integer, index=False, unique=False, nullable=True)
    compT = Column('compT', Integer, index=False, unique=False, nullable=True)
    extractionDate = Column('ExtractionDate', Date, index=False, unique=False, nullable=True)
    extractionDatePrecision = Column('ExtractionDatePrecision', Integer, index=False, unique=False, nullable=True)
    genbankAccessionNumber = Column('GenBankAccessionNumber', String, index=True, unique=False, nullable=True)
    geneSequence = Column('GeneSequence', Text, index=False, unique=False, nullable=True)
    moleculeType = Column('MoleculeType', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    sequenceDate = Column('SequenceDate', Date, index=False, unique=False, nullable=True)
    sequenceDatePrecision = Column('SequenceDatePrecision', Integer, index=False, unique=False, nullable=True)
    targetMarker = Column('TargetMarker', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    totalResidues = Column('TotalResidues', Integer, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ExtractorID = Column('ExtractorID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    MaterialsampleID = Column('MaterialSampleID', Integer, ForeignKey('materialSample.MaterialSampleID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SequencerID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collectionObject = relationship('CollectionObject', foreign_keys='DNASequence.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('dnaSequences', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='DNASequence.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    extractor = relationship('Agent', foreign_keys='DNASequence.ExtractorID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    materialSample = relationship('MaterialSample', foreign_keys='DNASequence.MaterialSampleID', remote_side='MaterialSample.MaterialSampleID', backref=orm.backref('dnaSequences', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DNASequence.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent = relationship('Agent', foreign_keys='DNASequence.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequenceAttachment(Base):
    tableid = 147
    _id = 'dnaSequenceAttachmentId'
    __tablename__ = 'dnasequenceattachment'

    dnaSequenceAttachmentId = Column('Dnasequenceattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DnasequenceID = Column('DnaSequenceID', Integer, ForeignKey('dNASequence.DnaSequenceID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='DNASequenceAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('dnaSequenceAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='DNASequenceAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    dnaSequence = relationship('DNASequence', foreign_keys='DNASequenceAttachment.DnaSequenceID', remote_side='DNASequence.DnaSequenceID', backref=orm.backref('attachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DNASequenceAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequencingRun(Base):
    tableid = 88
    _id = 'dnaSequencingRunId'
    __tablename__ = 'dnasequencingrun'

    dnaSequencingRunId = Column('Dnasequencingrunid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=False, unique=False, nullable=False)
    dryadDOI = Column('DryadDOI', String, index=False, unique=False, nullable=True)
    geneSequence = Column('GeneSequence', Text, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=True)
    pcrCocktailPrimer = Column('PCRCocktailPrimer', mysql_bit_type, index=False, unique=False, nullable=True)
    pcrForwardPrimerCode = Column('PCRForwardPrimerCode', String, index=False, unique=False, nullable=True)
    pcrPrimerName = Column('PCRPrimerName', String, index=False, unique=False, nullable=True)
    pcrPrimerSequence5_3 = Column('PCRPrimerSequence5_3', String, index=False, unique=False, nullable=True)
    pcrReversePrimerCode = Column('PCRReversePrimerCode', String, index=False, unique=False, nullable=True)
    readDirection = Column('ReadDirection', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    runDate = Column('RunDate', Date, index=False, unique=False, nullable=True)
    scoreFileName = Column('ScoreFileName', String, index=False, unique=False, nullable=True)
    sequenceCocktailPrimer = Column('SequenceCocktailPrimer', mysql_bit_type, index=False, unique=False, nullable=True)
    sequencePrimerCode = Column('SequencePrimerCode', String, index=False, unique=False, nullable=True)
    sequencePrimerName = Column('SequencePrimerName', String, index=False, unique=False, nullable=True)
    sequencePrimerSequence5_3 = Column('SequencePrimerSequence5_3', String, index=False, unique=False, nullable=True)
    sraExperimentID = Column('SRAExperimentID', String, index=False, unique=False, nullable=True)
    sraRunID = Column('SRARunID', String, index=False, unique=False, nullable=True)
    sraSubmissionID = Column('SRASubmissionID', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    traceFileName = Column('TraceFileName', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DnaprimerID = Column('DNAPrimerID', Integer, ForeignKey('dNAPrimer.DNAPrimerID'), nullable=True, unique=False)
    DnasequenceID = Column('DNASequenceID', Integer, ForeignKey('dNASequence.DnaSequenceID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparedbyagentID = Column('PreparedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    RunbyagentID = Column('RunByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='DNASequencingRun.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    dNAPrimer = relationship('DNAPrimer', foreign_keys='DNASequencingRun.DNAPrimerID', remote_side='DNAPrimer.DNAPrimerID', backref=orm.backref('dnaSequencingRuns', uselist=True))
    dNASequence = relationship('DNASequence', foreign_keys='DNASequencingRun.DNASequenceID', remote_side='DNASequence.DnaSequenceID', backref=orm.backref('dnaSequencingRuns', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DNASequencingRun.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparedByAgent = relationship('Agent', foreign_keys='DNASequencingRun.PreparedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    runByAgent = relationship('Agent', foreign_keys='DNASequencingRun.RunByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequencingRunAttachment(Base):
    tableid = 135
    _id = 'dnaSequencingRunAttachmentId'
    __tablename__ = 'dnasequencerunattachment'

    dnaSequencingRunAttachmentId = Column('Dnasequencingrunattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DnasequencingrunID = Column('DnaSequencingRunID', Integer, ForeignKey('dNASequencingRun.DNASequencingRunID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='DNASequencingRunAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('dnaSequencingRunAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='DNASequencingRunAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    dnaSequencingRun = relationship('DNASequencingRun', foreign_keys='DNASequencingRunAttachment.DnaSequencingRunID', remote_side='DNASequencingRun.DNASequencingRunID', backref=orm.backref('attachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DNASequencingRunAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DNASequencingRunCitation(Base):
    tableid = 105
    _id = 'dnaSequencingRunCitationId'
    __tablename__ = 'dnasequencingruncitation'

    dnaSequencingRunCitationId = Column('Dnasequencingruncitationid', Integer, primary_key=True)
    figureNumber = Column('FigureNumber', String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)
    SequencingrunID = Column('DNASequencingRunID', Integer, ForeignKey('dNASequencingRun.DNASequencingRunID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='DNASequencingRunCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DNASequencingRunCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='DNASequencingRunCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('None', uselist=True))
    dNASequencingRun = relationship('DNASequencingRun', foreign_keys='DNASequencingRunCitation.DNASequencingRunID', remote_side='DNASequencingRun.DNASequencingRunID', backref=orm.backref('citations', uselist=True))

class DataType(Base):
    tableid = 33
    _id = 'dataTypeId'
    __tablename__ = 'datatype'

    dataTypeId = Column('Datatypeid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='DataType.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DataType.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Deaccession(Base):
    tableid = 163
    _id = 'deaccessionId'
    __tablename__ = 'deaccession'

    deaccessionId = Column('Deaccessionid', Integer, primary_key=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    deaccessionDate = Column('DeaccessionDate', Date, index=True, unique=False, nullable=True)
    deaccessionNumber = Column('DeaccessionNumber', String, index=True, unique=False, nullable=False)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    status = Column('Status', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    Agent1ID = Column('Agent1ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent2ID = Column('Agent2ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent1 = relationship('Agent', foreign_keys='Deaccession.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent2 = relationship('Agent', foreign_keys='Deaccession.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Deaccession.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Deaccession.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DeaccessionAgent(Base):
    tableid = 164
    _id = 'deaccessionAgentId'
    __tablename__ = 'deaccessionagent'

    deaccessionAgentId = Column('Deaccessionagentid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    role = Column('Role', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DeaccessionID = Column('DeaccessionID', Integer, ForeignKey('deaccession.DeaccessionID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='DeaccessionAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='DeaccessionAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    deaccession = relationship('Deaccession', foreign_keys='DeaccessionAgent.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('deaccessionAgents', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DeaccessionAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DeaccessionAttachment(Base):
    tableid = 165
    _id = 'deaccessionAttachmentId'
    __tablename__ = 'deaccessionattachment'

    deaccessionAttachmentId = Column('Deaccessionattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DeaccessionID = Column('DeaccessionID', Integer, ForeignKey('deaccession.DeaccessionID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='DeaccessionAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('deaccessionAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='DeaccessionAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    deaccession = relationship('Deaccession', foreign_keys='DeaccessionAttachment.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('deaccessionAttachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DeaccessionAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Determination(Base):
    tableid = 9
    _id = 'determinationId'
    __tablename__ = 'determination'

    determinationId = Column('Determinationid', Integer, primary_key=True)
    addendum = Column('Addendum', String, index=False, unique=False, nullable=True)
    alternateName = Column('AlternateName', String, index=True, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    confidence = Column('Confidence', String, index=False, unique=False, nullable=True)
    determinedDate = Column('DeterminedDate', Date, index=True, unique=False, nullable=True)
    determinedDatePrecision = Column('DeterminedDatePrecision', Integer, index=False, unique=False, nullable=True)
    featureOrBasis = Column('FeatureOrBasis', String, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    isCurrent = Column('IsCurrent', mysql_bit_type, index=False, unique=False, nullable=False)
    method = Column('Method', String, index=False, unique=False, nullable=True)
    nameUsage = Column('NameUsage', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    qualifier = Column('Qualifier', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    subSpQualifier = Column('SubSpQualifier', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    typeStatusName = Column('TypeStatusName', String, index=True, unique=False, nullable=True)
    varQualifier = Column('VarQualifier', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DeterminerID = Column('DeterminerID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreferredtaxonID = Column('PreferredTaxonID', Integer, ForeignKey('taxon.TaxonID'), nullable=True, unique=False)
    TaxonID = Column('TaxonID', Integer, ForeignKey('taxon.TaxonID'), nullable=True, unique=False)

    collectionObject = relationship('CollectionObject', foreign_keys='Determination.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('determinations', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Determination.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    determiner = relationship('Agent', foreign_keys='Determination.DeterminerID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Determination.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preferredTaxon = relationship('Taxon', foreign_keys='Determination.PreferredTaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('None', uselist=True))
    taxon = relationship('Taxon', foreign_keys='Determination.TaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('determinations', uselist=True))

class DeterminationCitation(Base):
    tableid = 38
    _id = 'determinationCitationId'
    __tablename__ = 'determinationcitation'

    determinationCitationId = Column('Determinationcitationid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    figureNumber = Column('FigureNumber', String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DeterminationID = Column('DeterminationID', Integer, ForeignKey('determination.DeterminationID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='DeterminationCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    determination = relationship('Determination', foreign_keys='DeterminationCitation.DeterminationID', remote_side='Determination.DeterminationID', backref=orm.backref('determinationCitations', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DeterminationCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='DeterminationCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('determinationCitations', uselist=True))

class Determiner(Base):
    tableid = 167
    _id = 'determinerId'
    __tablename__ = 'determiner'

    determinerId = Column('Determinerid', Integer, primary_key=True)
    isPrimary = Column('IsPrimary', mysql_bit_type, index=False, unique=False, nullable=False)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DeterminationID = Column('DeterminationID', Integer, ForeignKey('determination.DeterminationID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='Determiner.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Determiner.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    determination = relationship('Determination', foreign_keys='Determiner.DeterminationID', remote_side='Determination.DeterminationID', backref=orm.backref('determiners', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Determiner.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Discipline(Base):
    tableid = 26
    _id = 'userGroupScopeId'
    __tablename__ = 'discipline'

    userGroupScopeId = Column('Usergroupscopeid', Integer, primary_key=True)
    isPaleoContextEmbedded = Column('IsPaleoContextEmbedded', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', String, index=True, unique=False, nullable=True)
    paleoContextChildTable = Column('PaleoContextChildTable', String, index=False, unique=False, nullable=True)
    regNumber = Column('RegNumber', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DatatypeID = Column('DataTypeID', Integer, ForeignKey('dataType.DataTypeID'), nullable=False, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=False, unique=False)
    GeographytreedefID = Column('GeographyTreeDefID', Integer, ForeignKey('geographyTreeDef.GeographyTreeDefID'), nullable=False, unique=False)
    GeologictimeperiodtreedefID = Column('GeologicTimePeriodTreeDefID', Integer, ForeignKey('geologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID'), nullable=False, unique=False)
    LithostrattreedefID = Column('LithoStratTreeDefID', Integer, ForeignKey('lithoStratTreeDef.LithoStratTreeDefID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    TaxontreedefID = Column('TaxonTreeDefID', Integer, ForeignKey('taxonTreeDef.TaxonTreeDefID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='Discipline.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    dataType = relationship('DataType', foreign_keys='Discipline.DataTypeID', remote_side='DataType.DataTypeID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='Discipline.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('disciplines', uselist=True))
    geographyTreeDef = relationship('GeographyTreeDef', foreign_keys='Discipline.GeographyTreeDefID', remote_side='GeographyTreeDef.GeographyTreeDefID', backref=orm.backref('disciplines', uselist=True))
    geologicTimePeriodTreeDef = relationship('GeologicTimePeriodTreeDef', foreign_keys='Discipline.GeologicTimePeriodTreeDefID', remote_side='GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID', backref=orm.backref('disciplines', uselist=True))
    lithoStratTreeDef = relationship('LithoStratTreeDef', foreign_keys='Discipline.LithoStratTreeDefID', remote_side='LithoStratTreeDef.LithoStratTreeDefID', backref=orm.backref('disciplines', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Discipline.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    taxonTreeDef = relationship('TaxonTreeDef', foreign_keys='Discipline.TaxonTreeDefID', remote_side='TaxonTreeDef.TaxonTreeDefID', backref=orm.backref('discipline', uselist=False))

class Disposal(Base):
    tableid = 34
    _id = 'disposalId'
    __tablename__ = 'disposal'

    disposalId = Column('Disposalid', Integer, primary_key=True)
    disposalDate = Column('DisposalDate', Date, index=True, unique=False, nullable=True)
    disposalNumber = Column('DisposalNumber', String, index=True, unique=False, nullable=False)
    doNotExport = Column('doNotExport', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DeaccessionID = Column('DeaccessionID', Integer, ForeignKey('deaccession.DeaccessionID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='Disposal.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    deaccession = relationship('Deaccession', foreign_keys='Disposal.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('disposals', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Disposal.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DisposalAgent(Base):
    tableid = 35
    _id = 'disposalAgentId'
    __tablename__ = 'disposalagent'

    disposalAgentId = Column('Disposalagentid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    role = Column('Role', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisposalID = Column('DisposalID', Integer, ForeignKey('disposal.DisposalID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='DisposalAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='DisposalAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    disposal = relationship('Disposal', foreign_keys='DisposalAgent.DisposalID', remote_side='Disposal.DisposalID', backref=orm.backref('disposalAgents', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DisposalAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DisposalAttachment(Base):
    tableid = 166
    _id = 'disposalAttachmentId'
    __tablename__ = 'disposalattachment'

    disposalAttachmentId = Column('Disposalattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisposalID = Column('DisposalID', Integer, ForeignKey('disposal.DisposalID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='DisposalAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('disposalAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='DisposalAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    disposal = relationship('Disposal', foreign_keys='DisposalAttachment.DisposalID', remote_side='Disposal.DisposalID', backref=orm.backref('disposalAttachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DisposalAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class DisposalPreparation(Base):
    tableid = 36
    _id = 'disposalPreparationId'
    __tablename__ = 'disposalpreparation'

    disposalPreparationId = Column('Disposalpreparationid', Integer, primary_key=True)
    quantity = Column('Quantity', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisposalID = Column('DisposalID', Integer, ForeignKey('disposal.DisposalID'), nullable=False, unique=False)
    LoanreturnpreparationID = Column('LoanReturnPreparationID', Integer, ForeignKey('loanReturnPreparation.LoanReturnPreparationID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='DisposalPreparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    disposal = relationship('Disposal', foreign_keys='DisposalPreparation.DisposalID', remote_side='Disposal.DisposalID', backref=orm.backref('disposalPreparations', uselist=True))
    loanReturnPreparation = relationship('LoanReturnPreparation', foreign_keys='DisposalPreparation.LoanReturnPreparationID', remote_side='LoanReturnPreparation.LoanReturnPreparationID', backref=orm.backref('disposalPreparations', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='DisposalPreparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='DisposalPreparation.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('disposalPreparations', uselist=True))

class Division(Base):
    tableid = 96
    _id = 'userGroupScopeId'
    __tablename__ = 'division'

    userGroupScopeId = Column('Usergroupscopeid', Integer, primary_key=True)
    abbrev = Column('Abbrev', String, index=False, unique=False, nullable=True)
    altName = Column('AltName', String, index=False, unique=False, nullable=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    discipline = Column('DisciplineType', String, index=False, unique=False, nullable=True)
    iconURI = Column('IconURI', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=True)
    regNumber = Column('RegNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    uri = Column('Uri', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AddressID = Column('AddressID', Integer, ForeignKey('address.AddressID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    InstitutionID = Column('InstitutionID', Integer, ForeignKey('institution.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    address = relationship('Address', foreign_keys='Division.AddressID', remote_side='Address.AddressID', backref=orm.backref('divisions', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Division.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    institution = relationship('Institution', foreign_keys='Division.InstitutionID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('divisions', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Division.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeIn(Base):
    tableid = 39
    _id = 'exchangeInId'
    __tablename__ = 'exchangein'

    exchangeInId = Column('Exchangeinid', Integer, primary_key=True)
    contents = Column('Contents', Text, index=False, unique=False, nullable=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', String, index=True, unique=False, nullable=True)
    exchangeDate = Column('ExchangeDate', Date, index=True, unique=False, nullable=True)
    exchangeInNumber = Column('ExchangeInNumber', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    quantityExchanged = Column('QuantityExchanged', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    srcGeography = Column('SrcGeography', String, index=False, unique=False, nullable=True)
    srcTaxonomy = Column('SrcTaxonomy', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AddressofrecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    AgentcatalogedbyID = Column('CatalogedByID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    AgentreceivedfromID = Column('ReceivedFromOrganizationID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    addressOfRecord = relationship('AddressOfRecord', foreign_keys='ExchangeIn.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('exchangeIns', uselist=True))
    catalogedBy = relationship('Agent', foreign_keys='ExchangeIn.CatalogedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    receivedFromOrganization = relationship('Agent', foreign_keys='ExchangeIn.ReceivedFromOrganizationID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ExchangeIn.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='ExchangeIn.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ExchangeIn.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeInAttachment(Base):
    tableid = 169
    _id = 'exchangeInAttachmentId'
    __tablename__ = 'exchangeinattachment'

    exchangeInAttachmentId = Column('Exchangeinattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ExchangeinID = Column('ExchangeInID', Integer, ForeignKey('exchangeIn.ExchangeInID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='ExchangeInAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('exchangeInAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ExchangeInAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    exchangeIn = relationship('ExchangeIn', foreign_keys='ExchangeInAttachment.ExchangeInID', remote_side='ExchangeIn.ExchangeInID', backref=orm.backref('exchangeInAttachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ExchangeInAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeInPrep(Base):
    tableid = 140
    _id = 'exchangeInPrepId'
    __tablename__ = 'exchangeinprep'

    exchangeInPrepId = Column('Exchangeinprepid', Integer, primary_key=True)
    comments = Column('Comments', Text, index=False, unique=False, nullable=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Integer, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ExchangeinID = Column('ExchangeInID', Integer, ForeignKey('exchangeIn.ExchangeInID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='ExchangeInPrep.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='ExchangeInPrep.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    exchangeIn = relationship('ExchangeIn', foreign_keys='ExchangeInPrep.ExchangeInID', remote_side='ExchangeIn.ExchangeInID', backref=orm.backref('exchangeInPreps', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ExchangeInPrep.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='ExchangeInPrep.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('exchangeInPreps', uselist=True))

class ExchangeOut(Base):
    tableid = 40
    _id = 'exchangeOutId'
    __tablename__ = 'exchangeout'

    exchangeOutId = Column('Exchangeoutid', Integer, primary_key=True)
    contents = Column('Contents', Text, index=False, unique=False, nullable=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', String, index=True, unique=False, nullable=True)
    exchangeDate = Column('ExchangeDate', Date, index=True, unique=False, nullable=True)
    exchangeOutNumber = Column('ExchangeOutNumber', String, index=True, unique=False, nullable=False)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    quantityExchanged = Column('QuantityExchanged', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    srcGeography = Column('SrcGeography', String, index=False, unique=False, nullable=True)
    srcTaxonomy = Column('SrcTaxonomy', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AddressofrecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    AgentcatalogedbyID = Column('CatalogedByID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    AgentsenttoID = Column('SentToOrganizationID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DeaccessionID = Column('DeaccessionID', Integer, ForeignKey('deaccession.DeaccessionID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    addressOfRecord = relationship('AddressOfRecord', foreign_keys='ExchangeOut.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('exchangeOuts', uselist=True))
    catalogedBy = relationship('Agent', foreign_keys='ExchangeOut.CatalogedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    sentToOrganization = relationship('Agent', foreign_keys='ExchangeOut.SentToOrganizationID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ExchangeOut.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    deaccession = relationship('Deaccession', foreign_keys='ExchangeOut.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('exchangeOuts', uselist=True))
    division = relationship('Division', foreign_keys='ExchangeOut.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ExchangeOut.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeOutAttachment(Base):
    tableid = 170
    _id = 'exchangeOutAttachmentId'
    __tablename__ = 'exchangeoutattachment'

    exchangeOutAttachmentId = Column('Exchangeoutattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ExchangeoutID = Column('ExchangeOutID', Integer, ForeignKey('exchangeOut.ExchangeOutID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='ExchangeOutAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('exchangeOutAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ExchangeOutAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    exchangeOut = relationship('ExchangeOut', foreign_keys='ExchangeOutAttachment.ExchangeOutID', remote_side='ExchangeOut.ExchangeOutID', backref=orm.backref('exchangeOutAttachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ExchangeOutAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ExchangeOutPrep(Base):
    tableid = 141
    _id = 'exchangeOutPrepId'
    __tablename__ = 'exchangeoutprep'

    exchangeOutPrepId = Column('Exchangeoutprepid', Integer, primary_key=True)
    comments = Column('Comments', Text, index=False, unique=False, nullable=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Integer, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', Integer, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ExchangeoutID = Column('ExchangeOutID', Integer, ForeignKey('exchangeOut.ExchangeOutID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='ExchangeOutPrep.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='ExchangeOutPrep.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    exchangeOut = relationship('ExchangeOut', foreign_keys='ExchangeOutPrep.ExchangeOutID', remote_side='ExchangeOut.ExchangeOutID', backref=orm.backref('exchangeOutPreps', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ExchangeOutPrep.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='ExchangeOutPrep.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('exchangeOutPreps', uselist=True))

class Exsiccata(Base):
    tableid = 89
    _id = 'exsiccataId'
    __tablename__ = 'exsiccata'

    exsiccataId = Column('Exsiccataid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    schedae = Column('Schedae', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=False, unique=False, nullable=False)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='Exsiccata.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Exsiccata.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='Exsiccata.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('exsiccatae', uselist=True))

class ExsiccataItem(Base):
    tableid = 104
    _id = 'exsiccataItemId'
    __tablename__ = 'exsiccataitem'

    exsiccataItemId = Column('Exsiccataitemid', Integer, primary_key=True)
    fascicle = Column('Fascicle', String, index=False, unique=False, nullable=True)
    number = Column('Number', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ExsiccataID = Column('ExsiccataID', Integer, ForeignKey('exsiccata.ExsiccataID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collectionObject = relationship('CollectionObject', foreign_keys='ExsiccataItem.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('exsiccataItems', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ExsiccataItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    exsiccata = relationship('Exsiccata', foreign_keys='ExsiccataItem.ExsiccataID', remote_side='Exsiccata.ExsiccataID', backref=orm.backref('exsiccataItems', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ExsiccataItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Extractor(Base):
    tableid = 160
    _id = 'extractorId'
    __tablename__ = 'extractor'

    extractorId = Column('Extractorid', Integer, primary_key=True)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DnasequenceID = Column('DNASequenceID', Integer, ForeignKey('dNASequence.DnaSequenceID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='Extractor.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Extractor.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    dNASequence = relationship('DNASequence', foreign_keys='Extractor.DNASequenceID', remote_side='DNASequence.DnaSequenceID', backref=orm.backref('extractors', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Extractor.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebook(Base):
    tableid = 83
    _id = 'fieldNotebookId'
    __tablename__ = 'fieldnotebook'

    fieldNotebookId = Column('Fieldnotebookid', Integer, primary_key=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', Date, index=True, unique=False, nullable=True)
    location = Column('Storage', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=True)
    startDate = Column('StartDate', Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    OwneragentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)

    collection = relationship('Collection', foreign_keys='FieldNotebook.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='FieldNotebook.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='FieldNotebook.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='FieldNotebook.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent = relationship('Agent', foreign_keys='FieldNotebook.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebookAttachment(Base):
    tableid = 127
    _id = 'fieldNotebookAttachmentId'
    __tablename__ = 'fieldnotebookattachment'

    fieldNotebookAttachmentId = Column('Fieldnotebookattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    FieldnotebookID = Column('FieldNotebookID', Integer, ForeignKey('fieldNotebook.FieldNotebookID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='FieldNotebookAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('fieldNotebookAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='FieldNotebookAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    fieldNotebook = relationship('FieldNotebook', foreign_keys='FieldNotebookAttachment.FieldNotebookID', remote_side='FieldNotebook.FieldNotebookID', backref=orm.backref('attachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='FieldNotebookAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebookPage(Base):
    tableid = 85
    _id = 'fieldNotebookPageId'
    __tablename__ = 'fieldnotebookpage'

    fieldNotebookPageId = Column('Fieldnotebookpageid', Integer, primary_key=True)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', String, index=True, unique=False, nullable=False)
    scanDate = Column('ScanDate', Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PagesetID = Column('FieldNotebookPageSetID', Integer, ForeignKey('fieldNotebookPageSet.FieldNotebookPageSetID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='FieldNotebookPage.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='FieldNotebookPage.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='FieldNotebookPage.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    fieldNotebookPageSet = relationship('FieldNotebookPageSet', foreign_keys='FieldNotebookPage.FieldNotebookPageSetID', remote_side='FieldNotebookPageSet.FieldNotebookPageSetID', backref=orm.backref('pages', uselist=True))

class FieldNotebookPageAttachment(Base):
    tableid = 129
    _id = 'fieldNotebookPageAttachmentId'
    __tablename__ = 'fieldnotebookpageattachment'

    fieldNotebookPageAttachmentId = Column('Fieldnotebookpageattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    FieldnotebookpageID = Column('FieldNotebookPageID', Integer, ForeignKey('fieldNotebookPage.FieldNotebookPageID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='FieldNotebookPageAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('fieldNotebookPageAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='FieldNotebookPageAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    fieldNotebookPage = relationship('FieldNotebookPage', foreign_keys='FieldNotebookPageAttachment.FieldNotebookPageID', remote_side='FieldNotebookPage.FieldNotebookPageID', backref=orm.backref('attachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='FieldNotebookPageAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebookPageSet(Base):
    tableid = 84
    _id = 'fieldNotebookPageSetId'
    __tablename__ = 'fieldnotebookpageset'

    fieldNotebookPageSetId = Column('Fieldnotebookpagesetid', Integer, primary_key=True)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', Date, index=True, unique=False, nullable=True)
    method = Column('Method', String, index=False, unique=False, nullable=True)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    FieldnotebookID = Column('FieldNotebookID', Integer, ForeignKey('fieldNotebook.FieldNotebookID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SourceagentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='FieldNotebookPageSet.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='FieldNotebookPageSet.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    fieldNotebook = relationship('FieldNotebook', foreign_keys='FieldNotebookPageSet.FieldNotebookID', remote_side='FieldNotebook.FieldNotebookID', backref=orm.backref('pageSets', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='FieldNotebookPageSet.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent = relationship('Agent', foreign_keys='FieldNotebookPageSet.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FieldNotebookPageSetAttachment(Base):
    tableid = 128
    _id = 'fieldNotebookPageSetAttachmentId'
    __tablename__ = 'fieldnotebookpagesetattachment'

    fieldNotebookPageSetAttachmentId = Column('Fieldnotebookpagesetattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    FieldnotebookpagesetID = Column('FieldNotebookPageSetID', Integer, ForeignKey('fieldNotebookPageSet.FieldNotebookPageSetID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='FieldNotebookPageSetAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('fieldNotebookPageSetAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='FieldNotebookPageSetAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    fieldNotebookPageSet = relationship('FieldNotebookPageSet', foreign_keys='FieldNotebookPageSetAttachment.FieldNotebookPageSetID', remote_side='FieldNotebookPageSet.FieldNotebookPageSetID', backref=orm.backref('attachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='FieldNotebookPageSetAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class FundingAgent(Base):
    tableid = 146
    _id = 'fundingAgentId'
    __tablename__ = 'fundingagent'

    fundingAgentId = Column('Fundingagentid', Integer, primary_key=True)
    isPrimary = Column('IsPrimary', mysql_bit_type, index=False, unique=False, nullable=False)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CollectingtripID = Column('CollectingTripID', Integer, ForeignKey('collectingTrip.CollectingTripID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='FundingAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    collectingTrip = relationship('CollectingTrip', foreign_keys='FundingAgent.CollectingTripID', remote_side='CollectingTrip.CollectingTripID', backref=orm.backref('fundingAgents', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='FundingAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='FundingAgent.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='FundingAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GeoCoordDetail(Base):
    tableid = 123
    _id = 'geoCoordDetailId'
    __tablename__ = 'geocoorddetail'

    geoCoordDetailId = Column('Geocoorddetailid', Integer, primary_key=True)
    errorPolygon = Column('ErrorPolygon', Text, index=False, unique=False, nullable=True)
    geoRefAccuracy = Column('GeoRefAccuracy', Numeric, index=False, unique=False, nullable=True)
    geoRefAccuracyUnits = Column('GeoRefAccuracyUnits', String, index=False, unique=False, nullable=True)
    geoRefCompiledDate = Column('GeoRefCompiledDate', Date, index=False, unique=False, nullable=True)
    geoRefDetDate = Column('GeoRefDetDate', Date, index=False, unique=False, nullable=True)
    geoRefDetRef = Column('GeoRefDetRef', String, index=False, unique=False, nullable=True)
    geoRefRemarks = Column('GeoRefRemarks', Text, index=False, unique=False, nullable=True)
    geoRefVerificationStatus = Column('GeoRefVerificationStatus', String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    maxUncertaintyEst = Column('MaxUncertaintyEst', Numeric, index=False, unique=False, nullable=True)
    maxUncertaintyEstUnit = Column('MaxUncertaintyEstUnit', String, index=False, unique=False, nullable=True)
    namedPlaceExtent = Column('NamedPlaceExtent', Numeric, index=False, unique=False, nullable=True)
    noGeoRefBecause = Column('NoGeoRefBecause', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    originalCoordSystem = Column('OriginalCoordSystem', String, index=False, unique=False, nullable=True)
    protocol = Column('Protocol', String, index=False, unique=False, nullable=True)
    source = Column('Source', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    uncertaintyPolygon = Column('UncertaintyPolygon', Text, index=False, unique=False, nullable=True)
    validation = Column('Validation', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    GeorefcompiledbyID = Column('CompiledByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    GeorefdetbyID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    LocalityID = Column('LocalityID', Integer, ForeignKey('locality.LocalityID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='GeoCoordDetail.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    compiledBy = relationship('Agent', foreign_keys='GeoCoordDetail.CompiledByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent = relationship('Agent', foreign_keys='GeoCoordDetail.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    locality = relationship('Locality', foreign_keys='GeoCoordDetail.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('geoCoordDetails', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GeoCoordDetail.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Geography(Base):
    tableid = 3
    _id = 'geographyId'
    __tablename__ = 'geography'

    geographyId = Column('Geographyid', Integer, primary_key=True)
    abbrev = Column('Abbrev', String, index=False, unique=False, nullable=True)
    centroidLat = Column('CentroidLat', Numeric, index=False, unique=False, nullable=True)
    centroidLon = Column('CentroidLon', Numeric, index=False, unique=False, nullable=True)
    commonName = Column('CommonName', String, index=False, unique=False, nullable=True)
    fullName = Column('FullName', String, index=True, unique=False, nullable=True)
    geographyCode = Column('GeographyCode', String, index=False, unique=False, nullable=True)
    gml = Column('GML', Text, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=False, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    isCurrent = Column('IsCurrent', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    nodeNumber = Column('NodeNumber', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Integer, index=False, unique=False, nullable=True)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    timestampVersion = Column('TimestampVersion', Date, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AcceptedgeographyID = Column('AcceptedID', Integer, ForeignKey('geography.GeographyID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DefinitionID = Column('GeographyTreeDefID', Integer, ForeignKey('geographyTreeDef.GeographyTreeDefID'), nullable=False, unique=False)
    DefinitionitemID = Column('GeographyTreeDefItemID', Integer, ForeignKey('geographyTreeDefItem.GeographyTreeDefItemID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentID', Integer, ForeignKey('geography.GeographyID'), nullable=True, unique=False)

    accepted = relationship('Geography', foreign_keys='Geography.AcceptedID', remote_side='Geography.GeographyID', backref=orm.backref('acceptedChildren', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Geography.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    geographyTreeDef = relationship('GeographyTreeDef', foreign_keys='Geography.GeographyTreeDefID', remote_side='GeographyTreeDef.GeographyTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    geographyTreeDefItem = relationship('GeographyTreeDefItem', foreign_keys='Geography.GeographyTreeDefItemID', remote_side='GeographyTreeDefItem.GeographyTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Geography.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parent = relationship('Geography', foreign_keys='Geography.ParentID', remote_side='Geography.GeographyID', backref=orm.backref('children', uselist=True))

class GeographyTreeDef(Base):
    tableid = 44
    _id = 'geographyTreeDefId'
    __tablename__ = 'geographytreedef'

    geographyTreeDefId = Column('Geographytreedefid', Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', Integer, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='GeographyTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GeographyTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GeographyTreeDefItem(Base):
    tableid = 45
    _id = 'geographyTreeDefItemId'
    __tablename__ = 'geographytreedefitem'

    geographyTreeDefItemId = Column('Geographytreedefitemid', Integer, primary_key=True)
    fullNameSeparator = Column('FullNameSeparator', String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentItemID', Integer, ForeignKey('geographyTreeDefItem.GeographyTreeDefItemID'), nullable=True, unique=False)
    TreedefID = Column('GeographyTreeDefID', Integer, ForeignKey('geographyTreeDef.GeographyTreeDefID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='GeographyTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GeographyTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parentItem = relationship('GeographyTreeDefItem', foreign_keys='GeographyTreeDefItem.ParentItemID', remote_side='GeographyTreeDefItem.GeographyTreeDefItemID', backref=orm.backref('children', uselist=True))
    geographyTreeDef = relationship('GeographyTreeDef', foreign_keys='GeographyTreeDefItem.GeographyTreeDefID', remote_side='GeographyTreeDef.GeographyTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class GeologicTimePeriod(Base):
    tableid = 46
    _id = 'geologicTimePeriodId'
    __tablename__ = 'geologictimeperiod'

    geologicTimePeriodId = Column('Geologictimeperiodid', Integer, primary_key=True)
    endPeriod = Column('EndPeriod', Numeric, index=False, unique=False, nullable=True)
    endUncertainty = Column('EndUncertainty', Numeric, index=False, unique=False, nullable=True)
    fullName = Column('FullName', String, index=True, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    isBioStrat = Column('IsBioStrat', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    nodeNumber = Column('NodeNumber', Integer, index=False, unique=False, nullable=True)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    standard = Column('Standard', String, index=False, unique=False, nullable=True)
    startPeriod = Column('StartPeriod', Numeric, index=False, unique=False, nullable=True)
    startUncertainty = Column('StartUncertainty', Numeric, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AcceptedgeologictimeperiodID = Column('AcceptedID', Integer, ForeignKey('geologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DefinitionID = Column('GeologicTimePeriodTreeDefID', Integer, ForeignKey('geologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID'), nullable=False, unique=False)
    DefinitionitemID = Column('GeologicTimePeriodTreeDefItemID', Integer, ForeignKey('geologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefItemID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentID', Integer, ForeignKey('geologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)

    accepted = relationship('GeologicTimePeriod', foreign_keys='GeologicTimePeriod.AcceptedID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('acceptedChildren', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='GeologicTimePeriod.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    geologicTimePeriodTreeDef = relationship('GeologicTimePeriodTreeDef', foreign_keys='GeologicTimePeriod.GeologicTimePeriodTreeDefID', remote_side='GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    geologicTimePeriodTreeDefItem = relationship('GeologicTimePeriodTreeDefItem', foreign_keys='GeologicTimePeriod.GeologicTimePeriodTreeDefItemID', remote_side='GeologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GeologicTimePeriod.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parent = relationship('GeologicTimePeriod', foreign_keys='GeologicTimePeriod.ParentID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('children', uselist=True))

class GeologicTimePeriodTreeDef(Base):
    tableid = 47
    _id = 'geologicTimePeriodTreeDefId'
    __tablename__ = 'geologictimeperiodtreedef'

    geologicTimePeriodTreeDefId = Column('Geologictimeperiodtreedefid', Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', Integer, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='GeologicTimePeriodTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GeologicTimePeriodTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GeologicTimePeriodTreeDefItem(Base):
    tableid = 48
    _id = 'geologicTimePeriodTreeDefItemId'
    __tablename__ = 'geologictimeperiodtreedefitem'

    geologicTimePeriodTreeDefItemId = Column('Geologictimeperiodtreedefitemid', Integer, primary_key=True)
    fullNameSeparator = Column('FullNameSeparator', String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentItemID', Integer, ForeignKey('geologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefItemID'), nullable=True, unique=False)
    TreedefID = Column('GeologicTimePeriodTreeDefID', Integer, ForeignKey('geologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='GeologicTimePeriodTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GeologicTimePeriodTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parentItem = relationship('GeologicTimePeriodTreeDefItem', foreign_keys='GeologicTimePeriodTreeDefItem.ParentItemID', remote_side='GeologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefItemID', backref=orm.backref('children', uselist=True))
    geologicTimePeriodTreeDef = relationship('GeologicTimePeriodTreeDef', foreign_keys='GeologicTimePeriodTreeDefItem.GeologicTimePeriodTreeDefID', remote_side='GeologicTimePeriodTreeDef.GeologicTimePeriodTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class Gift(Base):
    tableid = 131
    _id = 'giftId'
    __tablename__ = 'gift'

    giftId = Column('Giftid', Integer, primary_key=True)
    contents = Column('Contents', Text, index=False, unique=False, nullable=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    dateReceived = Column('DateReceived', Date, index=False, unique=False, nullable=True)
    giftDate = Column('GiftDate', Date, index=True, unique=False, nullable=True)
    giftNumber = Column('GiftNumber', String, index=True, unique=False, nullable=False)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    isFinancialResponsibility = Column('IsFinancialResponsibility', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    purposeOfGift = Column('PurposeOfGift', String, index=False, unique=False, nullable=True)
    receivedComments = Column('ReceivedComments', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    specialConditions = Column('SpecialConditions', Text, index=False, unique=False, nullable=True)
    srcGeography = Column('SrcGeography', String, index=False, unique=False, nullable=True)
    srcTaxonomy = Column('SrcTaxonomy', String, index=False, unique=False, nullable=True)
    status = Column('Status', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AddressofrecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DeaccessionID = Column('DeaccessionID', Integer, ForeignKey('deaccession.DeaccessionID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    addressOfRecord = relationship('AddressOfRecord', foreign_keys='Gift.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Gift.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    deaccession = relationship('Deaccession', foreign_keys='Gift.DeaccessionID', remote_side='Deaccession.DeaccessionID', backref=orm.backref('gifts', uselist=True))
    discipline = relationship('Discipline', foreign_keys='Gift.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='Gift.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Gift.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GiftAgent(Base):
    tableid = 133
    _id = 'giftAgentId'
    __tablename__ = 'giftagent'

    giftAgentId = Column('Giftagentid', Integer, primary_key=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    role = Column('Role', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    GiftID = Column('GiftID', Integer, ForeignKey('gift.GiftID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='GiftAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='GiftAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='GiftAgent.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    gift = relationship('Gift', foreign_keys='GiftAgent.GiftID', remote_side='Gift.GiftID', backref=orm.backref('giftAgents', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GiftAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GiftAttachment(Base):
    tableid = 144
    _id = 'giftAttachmentId'
    __tablename__ = 'giftattachment'

    giftAttachmentId = Column('Giftattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    GiftID = Column('GiftID', Integer, ForeignKey('gift.GiftID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='GiftAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('giftAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='GiftAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    gift = relationship('Gift', foreign_keys='GiftAttachment.GiftID', remote_side='Gift.GiftID', backref=orm.backref('giftAttachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GiftAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class GiftPreparation(Base):
    tableid = 132
    _id = 'giftPreparationId'
    __tablename__ = 'giftpreparation'

    giftPreparationId = Column('Giftpreparationid', Integer, primary_key=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', String, index=False, unique=False, nullable=True)
    inComments = Column('InComments', Text, index=False, unique=False, nullable=True)
    outComments = Column('OutComments', Text, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', Integer, index=False, unique=False, nullable=True)
    receivedComments = Column('ReceivedComments', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    GiftID = Column('GiftID', Integer, ForeignKey('gift.GiftID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='GiftPreparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='GiftPreparation.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    gift = relationship('Gift', foreign_keys='GiftPreparation.GiftID', remote_side='Gift.GiftID', backref=orm.backref('giftPreparations', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GiftPreparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='GiftPreparation.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('giftPreparations', uselist=True))

class GroupPerson(Base):
    tableid = 49
    _id = 'groupPersonId'
    __tablename__ = 'groupperson'

    groupPersonId = Column('Grouppersonid', Integer, primary_key=True)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=False, unique=False)
    GroupID = Column('GroupID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    MemberID = Column('MemberID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='GroupPerson.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='GroupPerson.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    group = relationship('Agent', foreign_keys='GroupPerson.GroupID', remote_side='Agent.AgentID', backref=orm.backref('groups', uselist=True))
    member = relationship('Agent', foreign_keys='GroupPerson.MemberID', remote_side='Agent.AgentID', backref=orm.backref('members', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='GroupPerson.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class InfoRequest(Base):
    tableid = 50
    _id = 'infoRequestID'
    __tablename__ = 'inforequest'

    infoRequestID = Column('Inforequestid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    email = Column('Email', String, index=False, unique=False, nullable=True)
    firstName = Column('Firstname', String, index=False, unique=False, nullable=True)
    infoReqNumber = Column('InfoReqNumber', String, index=False, unique=False, nullable=True)
    institution = Column('Institution', String, index=False, unique=False, nullable=True)
    lastName = Column('Lastname', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    replyDate = Column('ReplyDate', Date, index=False, unique=False, nullable=True)
    requestDate = Column('RequestDate', Date, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='InfoRequest.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='InfoRequest.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='InfoRequest.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Institution(Base):
    tableid = 94
    _id = 'userGroupScopeId'
    __tablename__ = 'institution'

    userGroupScopeId = Column('Usergroupscopeid', Integer, primary_key=True)
    altName = Column('AltName', String, index=False, unique=False, nullable=True)
    code = Column('Code', String, index=False, unique=False, nullable=True)
    copyright = Column('Copyright', Text, index=False, unique=False, nullable=True)
    currentManagedRelVersion = Column('CurrentManagedRelVersion', String, index=False, unique=False, nullable=True)
    currentManagedSchemaVersion = Column('CurrentManagedSchemaVersion', String, index=False, unique=False, nullable=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    disclaimer = Column('Disclaimer', Text, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    hasBeenAsked = Column('HasBeenAsked', mysql_bit_type, index=False, unique=False, nullable=True)
    iconURI = Column('IconURI', String, index=False, unique=False, nullable=True)
    ipr = Column('Ipr', Text, index=False, unique=False, nullable=True)
    isAccessionsGlobal = Column('IsAccessionsGlobal', mysql_bit_type, index=False, unique=False, nullable=False)
    isAnonymous = Column('IsAnonymous', mysql_bit_type, index=False, unique=False, nullable=True)
    isReleaseManagedGlobally = Column('IsReleaseManagedGlobally', mysql_bit_type, index=False, unique=False, nullable=True)
    isSecurityOn = Column('IsSecurityOn', mysql_bit_type, index=False, unique=False, nullable=False)
    isServerBased = Column('IsServerBased', mysql_bit_type, index=False, unique=False, nullable=False)
    isSharingLocalities = Column('IsSharingLocalities', mysql_bit_type, index=False, unique=False, nullable=False)
    isSingleGeographyTree = Column('IsSingleGeographyTree', mysql_bit_type, index=False, unique=False, nullable=False)
    license = Column('License', Text, index=False, unique=False, nullable=True)
    lsidAuthority = Column('LsidAuthority', String, index=False, unique=False, nullable=True)
    minimumPwdLength = Column('MinimumPwdLength', Integer, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=True)
    regNumber = Column('RegNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    termsOfUse = Column('TermsOfUse', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    uri = Column('Uri', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AddressID = Column('AddressID', Integer, ForeignKey('address.AddressID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    StoragetreedefID = Column('StorageTreeDefID', Integer, ForeignKey('storageTreeDef.StorageTreeDefID'), nullable=True, unique=False)

    address = relationship('Address', foreign_keys='Institution.AddressID', remote_side='Address.AddressID', backref=orm.backref('insitutions', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Institution.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Institution.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    storageTreeDef = relationship('StorageTreeDef', foreign_keys='Institution.StorageTreeDefID', remote_side='StorageTreeDef.StorageTreeDefID', backref=orm.backref('institutions', uselist=True))

class InstitutionNetwork(Base):
    tableid = 142
    _id = 'institutionNetworkId'
    __tablename__ = 'institutionnetwork'

    institutionNetworkId = Column('Institutionnetworkid', Integer, primary_key=True)
    altName = Column('AltName', String, index=False, unique=False, nullable=True)
    code = Column('Code', String, index=False, unique=False, nullable=True)
    copyright = Column('Copyright', Text, index=False, unique=False, nullable=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    disclaimer = Column('Disclaimer', Text, index=False, unique=False, nullable=True)
    iconURI = Column('IconURI', String, index=False, unique=False, nullable=True)
    ipr = Column('Ipr', Text, index=False, unique=False, nullable=True)
    license = Column('License', Text, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    termsOfUse = Column('TermsOfUse', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    uri = Column('Uri', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AddressID = Column('AddressID', Integer, ForeignKey('address.AddressID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    address = relationship('Address', foreign_keys='InstitutionNetwork.AddressID', remote_side='Address.AddressID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='InstitutionNetwork.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='InstitutionNetwork.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Journal(Base):
    tableid = 51
    _id = 'journalId'
    __tablename__ = 'journal'

    journalId = Column('Journalid', Integer, primary_key=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    issn = Column('ISSN', String, index=False, unique=False, nullable=True)
    journalAbbreviation = Column('JournalAbbreviation', String, index=False, unique=False, nullable=True)
    journalName = Column('JournalName', String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    InstitutionID = Column('InstitutionID', Integer, ForeignKey('institution.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='Journal.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    institution = relationship('Institution', foreign_keys='Journal.InstitutionID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Journal.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LatLonPolygon(Base):
    tableid = 136
    _id = 'latLonPolygonId'
    __tablename__ = 'latlonpolygon'

    latLonPolygonId = Column('Latlonpolygonid', Integer, primary_key=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    isPolyline = Column('IsPolyline', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    LocalityID = Column('LocalityID', Integer, ForeignKey('locality.LocalityID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    VisualqueryID = Column('SpVisualQueryID', Integer, ForeignKey('spVisualQuery.SpVisualQueryID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='LatLonPolygon.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    locality = relationship('Locality', foreign_keys='LatLonPolygon.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('latLonpolygons', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LatLonPolygon.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spVisualQuery = relationship('SpVisualQuery', foreign_keys='LatLonPolygon.SpVisualQueryID', remote_side='SpVisualQuery.SpVisualQueryID', backref=orm.backref('polygons', uselist=True))

class LatLonPolygonPnt(Base):
    tableid = 137
    _id = 'latLonPolygonPntId'
    __tablename__ = 'latlonpolygonpnt'

    latLonPolygonPntId = Column('Latlonpolygonpntid', Integer, primary_key=True)
    elevation = Column('Elevation', Integer, index=False, unique=False, nullable=True)
    latitude = Column('Latitude', Numeric, index=False, unique=False, nullable=False)
    longitude = Column('Longitude', Numeric, index=False, unique=False, nullable=False)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)

    LatlonpolygonID = Column('LatLonPolygonID', Integer, ForeignKey('latLonPolygon.LatLonPolygonID'), nullable=False, unique=False)

    latLonPolygon = relationship('LatLonPolygon', foreign_keys='LatLonPolygonPnt.LatLonPolygonID', remote_side='LatLonPolygon.LatLonPolygonID', backref=orm.backref('points', uselist=True))

class LithoStrat(Base):
    tableid = 100
    _id = 'lithoStratId'
    __tablename__ = 'lithostrat'

    lithoStratId = Column('Lithostratid', Integer, primary_key=True)
    fullName = Column('FullName', String, index=True, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    nodeNumber = Column('NodeNumber', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AcceptedlithostratID = Column('AcceptedID', Integer, ForeignKey('lithoStrat.LithoStratID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DefinitionID = Column('LithoStratTreeDefID', Integer, ForeignKey('lithoStratTreeDef.LithoStratTreeDefID'), nullable=False, unique=False)
    DefinitionitemID = Column('LithoStratTreeDefItemID', Integer, ForeignKey('lithoStratTreeDefItem.LithoStratTreeDefItemID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentID', Integer, ForeignKey('lithoStrat.LithoStratID'), nullable=True, unique=False)

    accepted = relationship('LithoStrat', foreign_keys='LithoStrat.AcceptedID', remote_side='LithoStrat.LithoStratID', backref=orm.backref('acceptedChildren', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='LithoStrat.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    lithoStratTreeDef = relationship('LithoStratTreeDef', foreign_keys='LithoStrat.LithoStratTreeDefID', remote_side='LithoStratTreeDef.LithoStratTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    lithoStratTreeDefItem = relationship('LithoStratTreeDefItem', foreign_keys='LithoStrat.LithoStratTreeDefItemID', remote_side='LithoStratTreeDefItem.LithoStratTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LithoStrat.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parent = relationship('LithoStrat', foreign_keys='LithoStrat.ParentID', remote_side='LithoStrat.LithoStratID', backref=orm.backref('children', uselist=True))

class LithoStratTreeDef(Base):
    tableid = 101
    _id = 'lithoStratTreeDefId'
    __tablename__ = 'lithostrattreedef'

    lithoStratTreeDefId = Column('Lithostrattreedefid', Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', Integer, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='LithoStratTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LithoStratTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LithoStratTreeDefItem(Base):
    tableid = 102
    _id = 'lithoStratTreeDefItemId'
    __tablename__ = 'lithostrattreedefitem'

    lithoStratTreeDefItemId = Column('Lithostrattreedefitemid', Integer, primary_key=True)
    fullNameSeparator = Column('FullNameSeparator', String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentItemID', Integer, ForeignKey('lithoStratTreeDefItem.LithoStratTreeDefItemID'), nullable=True, unique=False)
    TreedefID = Column('LithoStratTreeDefID', Integer, ForeignKey('lithoStratTreeDef.LithoStratTreeDefID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='LithoStratTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LithoStratTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parentItem = relationship('LithoStratTreeDefItem', foreign_keys='LithoStratTreeDefItem.ParentItemID', remote_side='LithoStratTreeDefItem.LithoStratTreeDefItemID', backref=orm.backref('children', uselist=True))
    lithoStratTreeDef = relationship('LithoStratTreeDef', foreign_keys='LithoStratTreeDefItem.LithoStratTreeDefID', remote_side='LithoStratTreeDef.LithoStratTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class Loan(Base):
    tableid = 52
    _id = 'loanId'
    __tablename__ = 'loan'

    loanId = Column('Loanid', Integer, primary_key=True)
    contents = Column('Contents', Text, index=False, unique=False, nullable=True)
    currentDueDate = Column('CurrentDueDate', Date, index=True, unique=False, nullable=True)
    dateClosed = Column('DateClosed', Date, index=False, unique=False, nullable=True)
    dateReceived = Column('DateReceived', Date, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    isClosed = Column('IsClosed', mysql_bit_type, index=False, unique=False, nullable=True)
    isFinancialResponsibility = Column('IsFinancialResponsibility', mysql_bit_type, index=False, unique=False, nullable=True)
    loanDate = Column('LoanDate', Date, index=True, unique=False, nullable=True)
    loanNumber = Column('LoanNumber', String, index=True, unique=False, nullable=False)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    originalDueDate = Column('OriginalDueDate', Date, index=False, unique=False, nullable=True)
    overdueNotiSentDate = Column('OverdueNotiSetDate', Date, index=False, unique=False, nullable=True)
    purposeOfLoan = Column('PurposeOfLoan', String, index=False, unique=False, nullable=True)
    receivedComments = Column('ReceivedComments', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    specialConditions = Column('SpecialConditions', Text, index=False, unique=False, nullable=True)
    srcGeography = Column('SrcGeography', String, index=False, unique=False, nullable=True)
    srcTaxonomy = Column('SrcTaxonomy', String, index=False, unique=False, nullable=True)
    status = Column('Status', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AddressofrecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    addressOfRecord = relationship('AddressOfRecord', foreign_keys='Loan.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('loans', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Loan.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='Loan.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='Loan.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Loan.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LoanAgent(Base):
    tableid = 53
    _id = 'loanAgentId'
    __tablename__ = 'loanagent'

    loanAgentId = Column('Loanagentid', Integer, primary_key=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    role = Column('Role', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    LoanID = Column('LoanID', Integer, ForeignKey('loan.LoanID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='LoanAgent.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='LoanAgent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='LoanAgent.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    loan = relationship('Loan', foreign_keys='LoanAgent.LoanID', remote_side='Loan.LoanID', backref=orm.backref('loanAgents', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LoanAgent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LoanAttachment(Base):
    tableid = 114
    _id = 'loanAttachmentId'
    __tablename__ = 'loanattachment'

    loanAttachmentId = Column('Loanattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    LoanID = Column('LoanID', Integer, ForeignKey('loan.LoanID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='LoanAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('loanAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='LoanAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    loan = relationship('Loan', foreign_keys='LoanAttachment.LoanID', remote_side='Loan.LoanID', backref=orm.backref('loanAttachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LoanAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LoanPreparation(Base):
    tableid = 54
    _id = 'loanPreparationId'
    __tablename__ = 'loanpreparation'

    loanPreparationId = Column('Loanpreparationid', Integer, primary_key=True)
    descriptionOfMaterial = Column('DescriptionOfMaterial', String, index=False, unique=False, nullable=True)
    inComments = Column('InComments', Text, index=False, unique=False, nullable=True)
    isResolved = Column('IsResolved', mysql_bit_type, index=False, unique=False, nullable=False)
    outComments = Column('OutComments', Text, index=False, unique=False, nullable=True)
    quantity = Column('Quantity', Integer, index=False, unique=False, nullable=True)
    quantityResolved = Column('QuantityResolved', Integer, index=False, unique=False, nullable=True)
    quantityReturned = Column('QuantityReturned', Integer, index=False, unique=False, nullable=True)
    receivedComments = Column('ReceivedComments', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    LoanID = Column('LoanID', Integer, ForeignKey('loan.LoanID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='LoanPreparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='LoanPreparation.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    loan = relationship('Loan', foreign_keys='LoanPreparation.LoanID', remote_side='Loan.LoanID', backref=orm.backref('loanPreparations', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LoanPreparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='LoanPreparation.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('loanPreparations', uselist=True))

class LoanReturnPreparation(Base):
    tableid = 55
    _id = 'loanReturnPreparationId'
    __tablename__ = 'loanreturnpreparation'

    loanReturnPreparationId = Column('Loanreturnpreparationid', Integer, primary_key=True)
    quantityResolved = Column('QuantityResolved', Integer, index=False, unique=False, nullable=True)
    quantityReturned = Column('QuantityReturned', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    returnedDate = Column('ReturnedDate', Date, index=True, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    LoanpreparationID = Column('LoanPreparationID', Integer, ForeignKey('loanPreparation.LoanPreparationID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReceivedbyID = Column('ReceivedByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='LoanReturnPreparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='LoanReturnPreparation.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    loanPreparation = relationship('LoanPreparation', foreign_keys='LoanReturnPreparation.LoanPreparationID', remote_side='LoanPreparation.LoanPreparationID', backref=orm.backref('loanReturnPreparations', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LoanReturnPreparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    receivedBy = relationship('Agent', foreign_keys='LoanReturnPreparation.ReceivedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Locality(Base):
    tableid = 2
    _id = 'localityId'
    __tablename__ = 'locality'

    localityId = Column('Localityid', Integer, primary_key=True)
    datum = Column('Datum', String, index=False, unique=False, nullable=True)
    elevationAccuracy = Column('ElevationAccuracy', Numeric, index=False, unique=False, nullable=True)
    elevationMethod = Column('ElevationMethod', String, index=False, unique=False, nullable=True)
    gml = Column('GML', Text, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=False, unique=False, nullable=True)
    lat1text = Column('Lat1Text', String, index=False, unique=False, nullable=True)
    lat2text = Column('Lat2Text', String, index=False, unique=False, nullable=True)
    latLongAccuracy = Column('LatLongAccuracy', Numeric, index=False, unique=False, nullable=True)
    latLongMethod = Column('LatLongMethod', String, index=False, unique=False, nullable=True)
    latLongType = Column('LatLongType', String, index=False, unique=False, nullable=True)
    latitude1 = Column('Latitude1', Numeric, index=False, unique=False, nullable=True)
    latitude2 = Column('Latitude2', Numeric, index=False, unique=False, nullable=True)
    localityName = Column('LocalityName', String, index=True, unique=False, nullable=False)
    long1text = Column('Long1Text', String, index=False, unique=False, nullable=True)
    long2text = Column('Long2Text', String, index=False, unique=False, nullable=True)
    longitude1 = Column('Longitude1', Numeric, index=False, unique=False, nullable=True)
    longitude2 = Column('Longitude2', Numeric, index=False, unique=False, nullable=True)
    maxElevation = Column('MaxElevation', Numeric, index=False, unique=False, nullable=True)
    minElevation = Column('MinElevation', Numeric, index=False, unique=False, nullable=True)
    namedPlace = Column('NamedPlace', String, index=True, unique=False, nullable=True)
    originalElevationUnit = Column('OriginalElevationUnit', String, index=False, unique=False, nullable=True)
    originalLatLongUnit = Column('OriginalLatLongUnit', Integer, index=False, unique=False, nullable=True)
    relationToNamedPlace = Column('RelationToNamedPlace', String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    sgrStatus = Column('SGRStatus', Integer, index=False, unique=False, nullable=True)
    shortName = Column('ShortName', String, index=False, unique=False, nullable=True)
    srcLatLongUnit = Column('SrcLatLongUnit', Integer, index=False, unique=False, nullable=False)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    uniqueIdentifier = Column('UniqueIdentifier', String, index=True, unique=False, nullable=True)
    verbatimElevation = Column('VerbatimElevation', String, index=False, unique=False, nullable=True)
    verbatimLatitude = Column('VerbatimLatitude', String, index=False, unique=False, nullable=True)
    verbatimLongitude = Column('VerbatimLongitude', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    GeographyID = Column('GeographyID', Integer, ForeignKey('geography.GeographyID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PaleocontextID = Column('PaleoContextID', Integer, ForeignKey('paleoContext.PaleoContextID'), nullable=True, unique=False)
    VisibilitysetbyID = Column('VisibilitySetByID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='Locality.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='Locality.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    geography = relationship('Geography', foreign_keys='Locality.GeographyID', remote_side='Geography.GeographyID', backref=orm.backref('localities', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Locality.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    paleoContext = relationship('PaleoContext', foreign_keys='Locality.PaleoContextID', remote_side='PaleoContext.PaleoContextID', backref=orm.backref('localities', uselist=True))
    visibilitySetBy = relationship('SpecifyUser', foreign_keys='Locality.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class LocalityAttachment(Base):
    tableid = 115
    _id = 'localityAttachmentId'
    __tablename__ = 'localityattachment'

    localityAttachmentId = Column('Localityattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    LocalityID = Column('LocalityID', Integer, ForeignKey('locality.LocalityID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    attachment = relationship('Attachment', foreign_keys='LocalityAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('localityAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='LocalityAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    locality = relationship('Locality', foreign_keys='LocalityAttachment.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('localityAttachments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LocalityAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LocalityCitation(Base):
    tableid = 57
    _id = 'localityCitationId'
    __tablename__ = 'localitycitation'

    localityCitationId = Column('Localitycitationid', Integer, primary_key=True)
    figureNumber = Column('FigureNumber', String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    LocalityID = Column('LocalityID', Integer, ForeignKey('locality.LocalityID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='LocalityCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='LocalityCitation.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    locality = relationship('Locality', foreign_keys='LocalityCitation.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('localityCitations', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LocalityCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='LocalityCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('localityCitations', uselist=True))

class LocalityDetail(Base):
    tableid = 124
    _id = 'localityDetailId'
    __tablename__ = 'localitydetail'

    localityDetailId = Column('Localitydetailid', Integer, primary_key=True)
    baseMeridian = Column('BaseMeridian', String, index=False, unique=False, nullable=True)
    drainage = Column('Drainage', String, index=False, unique=False, nullable=True)
    endDepth = Column('EndDepth', Numeric, index=False, unique=False, nullable=True)
    endDepthUnit = Column('EndDepthUnit', String, index=False, unique=False, nullable=True)
    endDepthVerbatim = Column('EndDepthVerbatim', String, index=False, unique=False, nullable=True)
    gml = Column('GML', Text, index=False, unique=False, nullable=True)
    hucCode = Column('HucCode', String, index=False, unique=False, nullable=True)
    island = Column('Island', String, index=False, unique=False, nullable=True)
    islandGroup = Column('IslandGroup', String, index=False, unique=False, nullable=True)
    mgrsZone = Column('MgrsZone', String, index=False, unique=False, nullable=True)
    nationalParkName = Column('NationalParkName', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    paleoLat = Column('PaleoLat', String, index=False, unique=False, nullable=True)
    paleoLng = Column('PaleoLng', String, index=False, unique=False, nullable=True)
    rangeDesc = Column('RangeDesc', String, index=False, unique=False, nullable=True)
    rangeDirection = Column('RangeDirection', String, index=False, unique=False, nullable=True)
    section = Column('Section', String, index=False, unique=False, nullable=True)
    sectionPart = Column('SectionPart', String, index=False, unique=False, nullable=True)
    startDepth = Column('StartDepth', Numeric, index=False, unique=False, nullable=True)
    startDepthUnit = Column('StartDepthUnit', String, index=False, unique=False, nullable=True)
    startDepthVerbatim = Column('StartDepthVerbatim', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    township = Column('Township', String, index=False, unique=False, nullable=True)
    townshipDirection = Column('TownshipDirection', String, index=False, unique=False, nullable=True)
    utmDatum = Column('UtmDatum', String, index=False, unique=False, nullable=True)
    utmEasting = Column('UtmEasting', Numeric, index=False, unique=False, nullable=True)
    utmFalseEasting = Column('UtmFalseEasting', Integer, index=False, unique=False, nullable=True)
    utmFalseNorthing = Column('UtmFalseNorthing', Integer, index=False, unique=False, nullable=True)
    utmNorthing = Column('UtmNorthing', Numeric, index=False, unique=False, nullable=True)
    utmOrigLatitude = Column('UtmOrigLatitude', Numeric, index=False, unique=False, nullable=True)
    utmOrigLongitude = Column('UtmOrigLongitude', Numeric, index=False, unique=False, nullable=True)
    utmScale = Column('UtmScale', Numeric, index=False, unique=False, nullable=True)
    utmZone = Column('UtmZone', Integer, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    waterBody = Column('WaterBody', String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    LocalityID = Column('LocalityID', Integer, ForeignKey('locality.LocalityID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='LocalityDetail.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    locality = relationship('Locality', foreign_keys='LocalityDetail.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('localityDetails', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LocalityDetail.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class LocalityNameAlias(Base):
    tableid = 120
    _id = 'localityNameAliasId'
    __tablename__ = 'localitynamealias'

    localityNameAliasId = Column('Localitynamealiasid', Integer, primary_key=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    source = Column('Source', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    LocalityID = Column('LocalityID', Integer, ForeignKey('locality.LocalityID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='LocalityNameAlias.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='LocalityNameAlias.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    locality = relationship('Locality', foreign_keys='LocalityNameAlias.LocalityID', remote_side='Locality.LocalityID', backref=orm.backref('localityNameAliass', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='LocalityNameAlias.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class MaterialSample(Base):
    tableid = 151
    _id = 'materialSampleId'
    __tablename__ = 'materialsample'

    materialSampleId = Column('Materialsampleid', Integer, primary_key=True)
    GGBN_absorbanceRatio260_230 = Column('GGBNAbsorbanceRatio260_230', Numeric, index=False, unique=False, nullable=True)
    GGBN_absorbanceRatio260_280 = Column('GGBNAbsorbanceRatio260_280', Numeric, index=False, unique=False, nullable=True)
    GGBN_absorbanceRatioMethod = Column('GGBNRAbsorbanceRatioMethod', String, index=False, unique=False, nullable=True)
    GGBN_concentration = Column('GGBNConcentration', Numeric, index=False, unique=False, nullable=True)
    GGBN_concentrationUnit = Column('GGBNConcentrationUnit', String, index=False, unique=False, nullable=True)
    GGBN_materialSampleType = Column('GGBNMaterialSampleType', String, index=False, unique=False, nullable=True)
    GGBN_medium = Column('GGBNMedium', String, index=False, unique=False, nullable=True)
    GGBN_purificationMethod = Column('GGBNPurificationMethod', String, index=False, unique=False, nullable=True)
    GGBN_quality = Column('GGBNQuality', String, index=False, unique=False, nullable=True)
    GGBN_qualityCheckDate = Column('GGBNQualityCheckDate', Date, index=False, unique=False, nullable=True)
    GGBN_qualityRemarks = Column('GGBNQualityRemarks', Text, index=False, unique=False, nullable=True)
    GGBN_sampleDesignation = Column('GGBNSampleDesignation', String, index=True, unique=False, nullable=True)
    GGBN_sampleSize = Column('GGBNSampleSize', Numeric, index=False, unique=False, nullable=True)
    GGBN_volume = Column('GGBNVolume', Numeric, index=False, unique=False, nullable=True)
    GGBN_volumeUnit = Column('GGBNVolumeUnit', String, index=False, unique=False, nullable=True)
    GGBN_weight = Column('GGBNWeight', Numeric, index=False, unique=False, nullable=True)
    GGBN_weightMethod = Column('GGBNWeightMethod', String, index=False, unique=False, nullable=True)
    GGBN_weightUnit = Column('GGBNWeightUnit', String, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=False, unique=False, nullable=False)
    extractionDate = Column('ExtractionDate', Date, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', Integer, index=False, unique=False, nullable=True)
    reservedNumber3 = Column('ReservedNumber3', Numeric, index=False, unique=False, nullable=True)
    reservedNumber4 = Column('ReservedNumber4', Numeric, index=False, unique=False, nullable=True)
    reservedText3 = Column('ReservedText3', Text, index=False, unique=False, nullable=True)
    reservedText4 = Column('ReservedText4', Text, index=False, unique=False, nullable=True)
    sraBioProjectID = Column('SRABioProjectID', String, index=False, unique=False, nullable=True)
    sraBioSampleID = Column('SRABioSampleID', String, index=False, unique=False, nullable=True)
    sraProjectID = Column('SRAProjectID', String, index=False, unique=False, nullable=True)
    sraSampleID = Column('SRASampleID', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ExtractorID = Column('ExtractorID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='MaterialSample.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    extractor = relationship('Agent', foreign_keys='MaterialSample.ExtractorID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='MaterialSample.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='MaterialSample.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('materialSamples', uselist=True))

class MorphBankView(Base):
    tableid = 138
    _id = 'morphBankViewId'
    __tablename__ = 'morphbankview'

    morphBankViewId = Column('Morphbankviewid', Integer, primary_key=True)
    developmentState = Column('DevelopmentState', String, index=False, unique=False, nullable=True)
    form = Column('Form', String, index=False, unique=False, nullable=True)
    imagingPreparationTechnique = Column('ImagingPreparationTechnique', String, index=False, unique=False, nullable=True)
    imagingTechnique = Column('ImagingTechnique', String, index=False, unique=False, nullable=True)
    morphBankExternalViewId = Column('MorphBankExternalViewID', Integer, index=False, unique=False, nullable=True)
    sex = Column('Sex', String, index=False, unique=False, nullable=True)
    specimenPart = Column('SpecimenPart', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    viewAngle = Column('ViewAngle', String, index=False, unique=False, nullable=True)
    viewName = Column('ViewName', String, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='MorphBankView.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='MorphBankView.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class OtherIdentifier(Base):
    tableid = 61
    _id = 'otherIdentifierId'
    __tablename__ = 'otheridentifier'

    otherIdentifierId = Column('Otheridentifierid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', Integer, index=False, unique=False, nullable=True)
    identifier = Column('Identifier', String, index=False, unique=False, nullable=False)
    institution = Column('Institution', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    Agent1ID = Column('Agent1ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent2ID = Column('Agent2ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent1 = relationship('Agent', foreign_keys='OtherIdentifier.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent2 = relationship('Agent', foreign_keys='OtherIdentifier.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    collectionObject = relationship('CollectionObject', foreign_keys='OtherIdentifier.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('otherIdentifiers', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='OtherIdentifier.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='OtherIdentifier.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PaleoContext(Base):
    tableid = 32
    _id = 'paleoContextId'
    __tablename__ = 'paleocontext'

    paleoContextId = Column('Paleocontextid', Integer, primary_key=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    paleoContextName = Column('PaleoContextName', String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo5 = Column('YesNo5', mysql_bit_type, index=False, unique=False, nullable=True)

    BiostratID = Column('BioStratID', Integer, ForeignKey('geologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)
    ChronosstratID = Column('ChronosStratID', Integer, ForeignKey('geologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)
    ChronosstratendID = Column('ChronosStratEndID', Integer, ForeignKey('geologicTimePeriod.GeologicTimePeriodID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    LithostratID = Column('LithoStratID', Integer, ForeignKey('lithoStrat.LithoStratID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    bioStrat = relationship('GeologicTimePeriod', foreign_keys='PaleoContext.BioStratID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('bioStratsPaleoContext', uselist=True))
    chronosStrat = relationship('GeologicTimePeriod', foreign_keys='PaleoContext.ChronosStratID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('chronosStratsPaleoContext', uselist=True))
    chronosStratEnd = relationship('GeologicTimePeriod', foreign_keys='PaleoContext.ChronosStratEndID', remote_side='GeologicTimePeriod.GeologicTimePeriodID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='PaleoContext.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='PaleoContext.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    lithoStrat = relationship('LithoStrat', foreign_keys='PaleoContext.LithoStratID', remote_side='LithoStrat.LithoStratID', backref=orm.backref('paleoContexts', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PaleoContext.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PcrPerson(Base):
    tableid = 161
    _id = 'pcrPersonId'
    __tablename__ = 'pcrperson'

    pcrPersonId = Column('Pcrpersonid', Integer, primary_key=True)
    orderNumber = Column('OrderNumber', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AgentID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DnasequenceID = Column('DNASequenceID', Integer, ForeignKey('dNASequence.DnaSequenceID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent = relationship('Agent', foreign_keys='PcrPerson.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='PcrPerson.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    dNASequence = relationship('DNASequence', foreign_keys='PcrPerson.DNASequenceID', remote_side='DNASequence.DnaSequenceID', backref=orm.backref('pcrPersons', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PcrPerson.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Permit(Base):
    tableid = 6
    _id = 'permitId'
    __tablename__ = 'permit'

    permitId = Column('Permitid', Integer, primary_key=True)
    copyright = Column('Copyright', String, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', Date, index=False, unique=False, nullable=True)
    isAvailable = Column('IsAvailable', mysql_bit_type, index=False, unique=False, nullable=True)
    isRequired = Column('IsRequired', mysql_bit_type, index=False, unique=False, nullable=True)
    issuedDate = Column('IssuedDate', Date, index=True, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    permitNumber = Column('PermitNumber', String, index=True, unique=False, nullable=False)
    permitText = Column('PermitText', Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    renewalDate = Column('RenewalDate', Date, index=False, unique=False, nullable=True)
    reservedInteger1 = Column('ReservedInteger1', Integer, index=False, unique=False, nullable=True)
    reservedInteger2 = Column('ReservedInteger2', Integer, index=False, unique=False, nullable=True)
    reservedText3 = Column('ReservedText3', String, index=False, unique=False, nullable=True)
    reservedText4 = Column('ReservedText4', String, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', Date, index=False, unique=False, nullable=True)
    status = Column('Status', String, index=False, unique=False, nullable=True)
    statusQualifier = Column('StatusQualifier', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    InstitutionID = Column('InstitutionID', Integer, ForeignKey('institution.UserGroupScopeId'), nullable=False, unique=False)
    IssuedbyID = Column('IssuedByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    IssuedtoID = Column('IssuedToID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='Permit.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    institution = relationship('Institution', foreign_keys='Permit.InstitutionID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    issuedBy = relationship('Agent', foreign_keys='Permit.IssuedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    issuedTo = relationship('Agent', foreign_keys='Permit.IssuedToID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Permit.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PermitAttachment(Base):
    tableid = 116
    _id = 'permitAttachmentId'
    __tablename__ = 'permitattachment'

    permitAttachmentId = Column('Permitattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PermitID = Column('PermitID', Integer, ForeignKey('permit.PermitID'), nullable=False, unique=False)

    attachment = relationship('Attachment', foreign_keys='PermitAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('permitAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='PermitAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PermitAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    permit = relationship('Permit', foreign_keys='PermitAttachment.PermitID', remote_side='Permit.PermitID', backref=orm.backref('permitAttachments', uselist=True))

class PickList(Base):
    tableid = 500
    _id = 'pickListId'
    __tablename__ = 'picklist'

    pickListId = Column('Picklistid', Integer, primary_key=True)
    fieldName = Column('FieldName', String, index=False, unique=False, nullable=True)
    filterFieldName = Column('FilterFieldName', String, index=False, unique=False, nullable=True)
    filterValue = Column('FilterValue', String, index=False, unique=False, nullable=True)
    formatter = Column('Formatter', String, index=False, unique=False, nullable=True)
    isSystem = Column('IsSystem', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    readOnly = Column('ReadOnly', mysql_bit_type, index=False, unique=False, nullable=False)
    sizeLimit = Column('SizeLimit', Integer, index=False, unique=False, nullable=True)
    sortType = Column('SortType', Integer, index=False, unique=False, nullable=True)
    tableName = Column('TableName', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', Integer, index=False, unique=False, nullable=False)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collection = relationship('Collection', foreign_keys='PickList.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('pickLists', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='PickList.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PickList.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PickListItem(Base):
    tableid = 501
    _id = 'pickListItemId'
    __tablename__ = 'picklistitem'

    pickListItemId = Column('Picklistitemid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=False, unique=False, nullable=False)
    value = Column('Value', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PicklistID = Column('PickListID', Integer, ForeignKey('pickList.PickListID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='PickListItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PickListItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    pickList = relationship('PickList', foreign_keys='PickListItem.PickListID', remote_side='PickList.PickListID', backref=orm.backref('pickListItems', uselist=True))

class PrepType(Base):
    tableid = 65
    _id = 'prepTypeId'
    __tablename__ = 'preptype'

    prepTypeId = Column('Preptypeid', Integer, primary_key=True)
    isLoanable = Column('IsLoanable', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collection = relationship('Collection', foreign_keys='PrepType.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('prepTypes', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='PrepType.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PrepType.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Preparation(Base):
    tableid = 63
    _id = 'preparationId'
    __tablename__ = 'preparation'

    preparationId = Column('Preparationid', Integer, primary_key=True)
    barCode = Column('BarCode', String, index=True, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    countAmt = Column('CountAmt', Integer, index=False, unique=False, nullable=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    date2Precision = Column('Date2Precision', Integer, index=False, unique=False, nullable=True)
    date3 = Column('Date3', Date, index=False, unique=False, nullable=True)
    date3Precision = Column('Date3Precision', Integer, index=False, unique=False, nullable=True)
    date4 = Column('Date4', Date, index=False, unique=False, nullable=True)
    date4Precision = Column('Date4Precision', Integer, index=False, unique=False, nullable=True)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    preparedDate = Column('PreparedDate', Date, index=False, unique=False, nullable=True)
    preparedDatePrecision = Column('PreparedDatePrecision', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    reservedInteger3 = Column('ReservedInteger3', Integer, index=False, unique=False, nullable=True)
    reservedInteger4 = Column('ReservedInteger4', Integer, index=False, unique=False, nullable=True)
    sampleNumber = Column('SampleNumber', String, index=True, unique=False, nullable=True)
    status = Column('Status', String, index=False, unique=False, nullable=True)
    storageLocation = Column('StorageLocation', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', Text, index=False, unique=False, nullable=True)
    text11 = Column('Text11', Text, index=False, unique=False, nullable=True)
    text12 = Column('Text12', String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', Text, index=False, unique=False, nullable=True)
    text9 = Column('Text9', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    AlternatestorageID = Column('AlternateStorageID', Integer, ForeignKey('storage.StorageID'), nullable=True, unique=False)
    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreptypeID = Column('PrepTypeID', Integer, ForeignKey('prepType.PrepTypeID'), nullable=False, unique=False)
    PreparationattributeID = Column('PreparationAttributeID', Integer, ForeignKey('preparationAttribute.PreparationAttributeID'), nullable=True, unique=False)
    PreparedbyagentID = Column('PreparedByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    StorageID = Column('StorageID', Integer, ForeignKey('storage.StorageID'), nullable=True, unique=False)

    alternateStorage = relationship('Storage', foreign_keys='Preparation.AlternateStorageID', remote_side='Storage.StorageID', backref=orm.backref('None', uselist=True))
    collectionObject = relationship('CollectionObject', foreign_keys='Preparation.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('preparations', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Preparation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Preparation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    prepType = relationship('PrepType', foreign_keys='Preparation.PrepTypeID', remote_side='PrepType.PrepTypeID', backref=orm.backref('None', uselist=True))
    preparationAttribute = relationship('PreparationAttribute', foreign_keys='Preparation.PreparationAttributeID', remote_side='PreparationAttribute.PreparationAttributeID', backref=orm.backref('preparations', uselist=True))
    preparedBy = relationship('Agent', foreign_keys='Preparation.PreparedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    storage = relationship('Storage', foreign_keys='Preparation.StorageID', remote_side='Storage.StorageID', backref=orm.backref('preparations', uselist=True))

class PreparationAttachment(Base):
    tableid = 117
    _id = 'preparationAttachmentId'
    __tablename__ = 'preparationattachment'

    preparationAttachmentId = Column('Preparationattachmentid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=False, unique=False)

    attachment = relationship('Attachment', foreign_keys='PreparationAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('preparationAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='PreparationAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PreparationAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='PreparationAttachment.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('preparationAttachments', uselist=True))

class PreparationAttr(Base):
    tableid = 64
    _id = 'attrId'
    __tablename__ = 'preparationattr'

    attrId = Column('Attrid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    dblValue = Column('DoubleValue', Float, index=False, unique=False, nullable=True)
    strValue = Column('StrValue', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DefinitionID = Column('AttributeDefID', Integer, ForeignKey('attributeDef.AttributeDefID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationId', Integer, ForeignKey('preparation.PreparationID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='PreparationAttr.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    attributeDef = relationship('AttributeDef', foreign_keys='PreparationAttr.AttributeDefID', remote_side='AttributeDef.AttributeDefID', backref=orm.backref('preparationAttrs', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PreparationAttr.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='PreparationAttr.PreparationId', remote_side='Preparation.PreparationID', backref=orm.backref('preparationAttrs', uselist=True))

class PreparationAttribute(Base):
    tableid = 91
    _id = 'preparationAttributeId'
    __tablename__ = 'preparationattribute'

    preparationAttributeId = Column('Preparationattributeid', Integer, primary_key=True)
    attrDate = Column('AttrDate', Date, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Integer, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Integer, index=False, unique=False, nullable=True)
    number6 = Column('Number6', Integer, index=False, unique=False, nullable=True)
    number7 = Column('Number7', Integer, index=False, unique=False, nullable=True)
    number8 = Column('Number8', Integer, index=False, unique=False, nullable=True)
    number9 = Column('Number9', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text10 = Column('Text10', Text, index=False, unique=False, nullable=True)
    text11 = Column('Text11', String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text20 = Column('Text20', String, index=False, unique=False, nullable=True)
    text21 = Column('Text21', String, index=False, unique=False, nullable=True)
    text22 = Column('Text22', String, index=False, unique=False, nullable=True)
    text23 = Column('Text23', String, index=False, unique=False, nullable=True)
    text24 = Column('Text24', String, index=False, unique=False, nullable=True)
    text25 = Column('Text25', String, index=False, unique=False, nullable=True)
    text26 = Column('Text26', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo4 = Column('YesNo4', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='PreparationAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PreparationAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class PreparationProperty(Base):
    tableid = 154
    _id = 'preparationPropertyId'
    __tablename__ = 'preparationproperty'

    preparationPropertyId = Column('Preparationpropertyid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date10 = Column('Date10', Date, index=False, unique=False, nullable=True)
    date11 = Column('Date11', Date, index=False, unique=False, nullable=True)
    date12 = Column('Date12', Date, index=False, unique=False, nullable=True)
    date13 = Column('Date13', Date, index=False, unique=False, nullable=True)
    date14 = Column('Date14', Date, index=False, unique=False, nullable=True)
    date15 = Column('Date15', Date, index=False, unique=False, nullable=True)
    date16 = Column('Date16', Date, index=False, unique=False, nullable=True)
    date17 = Column('Date17', Date, index=False, unique=False, nullable=True)
    date18 = Column('Date18', Date, index=False, unique=False, nullable=True)
    date19 = Column('Date19', Date, index=False, unique=False, nullable=True)
    date2 = Column('Date2', Date, index=False, unique=False, nullable=True)
    date20 = Column('Date20', Date, index=False, unique=False, nullable=True)
    date3 = Column('Date3', Date, index=False, unique=False, nullable=True)
    date4 = Column('Date4', Date, index=False, unique=False, nullable=True)
    date5 = Column('Date5', Date, index=False, unique=False, nullable=True)
    date6 = Column('Date6', Date, index=False, unique=False, nullable=True)
    date7 = Column('Date7', Date, index=False, unique=False, nullable=True)
    date8 = Column('Date8', Date, index=False, unique=False, nullable=True)
    date9 = Column('Date9', Date, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer10 = Column('Integer10', Integer, index=False, unique=False, nullable=True)
    integer11 = Column('Integer11', Integer, index=False, unique=False, nullable=True)
    integer12 = Column('Integer12', Integer, index=False, unique=False, nullable=True)
    integer13 = Column('Integer13', Integer, index=False, unique=False, nullable=True)
    integer14 = Column('Integer14', Integer, index=False, unique=False, nullable=True)
    integer15 = Column('Integer15', Integer, index=False, unique=False, nullable=True)
    integer16 = Column('Integer16', Integer, index=False, unique=False, nullable=True)
    integer17 = Column('Integer17', Integer, index=False, unique=False, nullable=True)
    integer18 = Column('Integer18', Integer, index=False, unique=False, nullable=True)
    integer19 = Column('Integer19', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer20 = Column('Integer20', Integer, index=False, unique=False, nullable=True)
    integer21 = Column('Integer21', Integer, index=False, unique=False, nullable=True)
    integer22 = Column('Integer22', Integer, index=False, unique=False, nullable=True)
    integer23 = Column('Integer23', Integer, index=False, unique=False, nullable=True)
    integer24 = Column('Integer24', Integer, index=False, unique=False, nullable=True)
    integer25 = Column('Integer25', Integer, index=False, unique=False, nullable=True)
    integer26 = Column('Integer26', Integer, index=False, unique=False, nullable=True)
    integer27 = Column('Integer27', Integer, index=False, unique=False, nullable=True)
    integer28 = Column('Integer28', Integer, index=False, unique=False, nullable=True)
    integer29 = Column('Integer29', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer30 = Column('Integer30', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    integer6 = Column('Integer6', Integer, index=False, unique=False, nullable=True)
    integer7 = Column('Integer7', Integer, index=False, unique=False, nullable=True)
    integer8 = Column('Integer8', Integer, index=False, unique=False, nullable=True)
    integer9 = Column('Integer9', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', Numeric, index=False, unique=False, nullable=True)
    number14 = Column('Number14', Numeric, index=False, unique=False, nullable=True)
    number15 = Column('Number15', Numeric, index=False, unique=False, nullable=True)
    number16 = Column('Number16', Numeric, index=False, unique=False, nullable=True)
    number17 = Column('Number17', Numeric, index=False, unique=False, nullable=True)
    number18 = Column('Number18', Numeric, index=False, unique=False, nullable=True)
    number19 = Column('Number19', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number20 = Column('Number20', Numeric, index=False, unique=False, nullable=True)
    number21 = Column('Number21', Numeric, index=False, unique=False, nullable=True)
    number22 = Column('Number22', Numeric, index=False, unique=False, nullable=True)
    number23 = Column('Number23', Numeric, index=False, unique=False, nullable=True)
    number24 = Column('Number24', Numeric, index=False, unique=False, nullable=True)
    number25 = Column('Number25', Numeric, index=False, unique=False, nullable=True)
    number26 = Column('Number26', Numeric, index=False, unique=False, nullable=True)
    number27 = Column('Number27', Numeric, index=False, unique=False, nullable=True)
    number28 = Column('Number28', Numeric, index=False, unique=False, nullable=True)
    number29 = Column('Number29', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number30 = Column('Number30', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text10 = Column('Text10', String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text20 = Column('Text20', String, index=False, unique=False, nullable=True)
    text21 = Column('Text21', String, index=False, unique=False, nullable=True)
    text22 = Column('Text22', String, index=False, unique=False, nullable=True)
    text23 = Column('Text23', String, index=False, unique=False, nullable=True)
    text24 = Column('Text24', String, index=False, unique=False, nullable=True)
    text25 = Column('Text25', String, index=False, unique=False, nullable=True)
    text26 = Column('Text26', String, index=False, unique=False, nullable=True)
    text27 = Column('Text27', String, index=False, unique=False, nullable=True)
    text28 = Column('Text28', String, index=False, unique=False, nullable=True)
    text29 = Column('Text29', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    text30 = Column('Text30', String, index=False, unique=False, nullable=True)
    text31 = Column('Text31', Text, index=False, unique=False, nullable=True)
    text32 = Column('Text32', Text, index=False, unique=False, nullable=True)
    text33 = Column('Text33', Text, index=False, unique=False, nullable=True)
    text34 = Column('Text34', Text, index=False, unique=False, nullable=True)
    text35 = Column('Text35', Text, index=False, unique=False, nullable=True)
    text36 = Column('Text36', Text, index=False, unique=False, nullable=True)
    text37 = Column('Text37', Text, index=False, unique=False, nullable=True)
    text38 = Column('Text38', Text, index=False, unique=False, nullable=True)
    text39 = Column('Text39', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text40 = Column('Text40', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    text6 = Column('Text6', String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
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

    Agent1ID = Column('Agent1ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent10ID = Column('Agent10ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent11ID = Column('Agent11ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent12ID = Column('Agent12ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent13ID = Column('Agent13ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent14ID = Column('Agent14ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent15ID = Column('Agent15ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent16ID = Column('Agent16ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent17ID = Column('Agent17ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent18ID = Column('Agent18ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent19ID = Column('Agent19ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent2ID = Column('Agent2ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent20ID = Column('Agent20ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent3ID = Column('Agent3ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent4ID = Column('Agent4ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent5ID = Column('Agent5ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent6ID = Column('Agent6ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent7ID = Column('Agent7ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent8ID = Column('Agent8D', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    Agent9ID = Column('Agent9ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PreparationID = Column('PreparationID', Integer, ForeignKey('preparation.PreparationID'), nullable=False, unique=False)

    agent1 = relationship('Agent', foreign_keys='PreparationProperty.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent10 = relationship('Agent', foreign_keys='PreparationProperty.Agent10ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent11 = relationship('Agent', foreign_keys='PreparationProperty.Agent11ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent12 = relationship('Agent', foreign_keys='PreparationProperty.Agent12ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent13 = relationship('Agent', foreign_keys='PreparationProperty.Agent13ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent14 = relationship('Agent', foreign_keys='PreparationProperty.Agent14ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent15 = relationship('Agent', foreign_keys='PreparationProperty.Agent15ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent16 = relationship('Agent', foreign_keys='PreparationProperty.Agent16ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent17 = relationship('Agent', foreign_keys='PreparationProperty.Agent17ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent18 = relationship('Agent', foreign_keys='PreparationProperty.Agent18ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent19 = relationship('Agent', foreign_keys='PreparationProperty.Agent19ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent2 = relationship('Agent', foreign_keys='PreparationProperty.Agent2ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent20 = relationship('Agent', foreign_keys='PreparationProperty.Agent20ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent3 = relationship('Agent', foreign_keys='PreparationProperty.Agent3ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent4 = relationship('Agent', foreign_keys='PreparationProperty.Agent4ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent5 = relationship('Agent', foreign_keys='PreparationProperty.Agent5ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent6 = relationship('Agent', foreign_keys='PreparationProperty.Agent6ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent7 = relationship('Agent', foreign_keys='PreparationProperty.Agent7ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent = relationship('Agent', foreign_keys='PreparationProperty.Agent8D', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent9 = relationship('Agent', foreign_keys='PreparationProperty.Agent9ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='PreparationProperty.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='PreparationProperty.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    preparation = relationship('Preparation', foreign_keys='PreparationProperty.PreparationID', remote_side='Preparation.PreparationID', backref=orm.backref('preparationProperties', uselist=True))

class Project(Base):
    tableid = 66
    _id = 'projectId'
    __tablename__ = 'project'

    projectId = Column('Projectid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=False, unique=False, nullable=False)
    endDate = Column('EndDate', Date, index=False, unique=False, nullable=True)
    grantAgency = Column('GrantAgency', String, index=False, unique=False, nullable=True)
    grantNumber = Column('GrantNumber', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    projectDescription = Column('ProjectDescription', String, index=False, unique=False, nullable=True)
    projectName = Column('ProjectName', String, index=True, unique=False, nullable=False)
    projectNumber = Column('ProjectNumber', String, index=True, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    startDate = Column('StartDate', Date, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    url = Column('URL', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AgentID = Column('ProjectAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    projectAgent = relationship('Agent', foreign_keys='Project.ProjectAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Project.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Project.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class RecordSet(Base):
    tableid = 68
    _id = 'recordSetId'
    __tablename__ = 'recordset'

    recordSetId = Column('Recordsetid', Integer, primary_key=True)
    allPermissionLevel = Column('AllPermissionLevel', Integer, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=False, unique=False, nullable=False)
    dbTableId = Column('TableID', Integer, index=False, unique=False, nullable=False)
    groupPermissionLevel = Column('GroupPermissionLevel', Integer, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    ownerPermissionLevel = Column('OwnerPermissionLevel', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', Integer, index=False, unique=False, nullable=False)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    GroupID = Column('SpPrincipalID', Integer, ForeignKey('spPrincipal.SpPrincipalID'), nullable=True, unique=False)
    InforequestID = Column('InfoRequestID', Integer, ForeignKey('infoRequest.InfoRequestID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='RecordSet.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spPrincipal = relationship('SpPrincipal', foreign_keys='RecordSet.SpPrincipalID', remote_side='SpPrincipal.SpPrincipalID', backref=orm.backref('None', uselist=True))
    infoRequest = relationship('InfoRequest', foreign_keys='RecordSet.InfoRequestID', remote_side='InfoRequest.InfoRequestID', backref=orm.backref('recordSets', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='RecordSet.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='RecordSet.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class RecordSetItem(Base):
    tableid = 502
    _id = 'recordSetItemId'
    __tablename__ = 'recordsetitem'

    recordSetItemId = Column('Recordsetitemid', Integer, primary_key=True)
    order = Column('OrderNumber', Integer, index=False, unique=False, nullable=True)
    recordId = Column('RecordId', Integer, index=False, unique=False, nullable=False)

    RecordsetID = Column('RecordSetID', Integer, ForeignKey('recordSet.RecordSetID'), nullable=False, unique=False)

    recordSet = relationship('RecordSet', foreign_keys='RecordSetItem.RecordSetID', remote_side='RecordSet.RecordSetID', backref=orm.backref('recordSetItems', uselist=True))

class ReferenceWork(Base):
    tableid = 69
    _id = 'referenceWorkId'
    __tablename__ = 'referencework'

    referenceWorkId = Column('Referenceworkid', Integer, primary_key=True)
    doi = Column('Doi', Text, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    isPublished = Column('IsPublished', mysql_bit_type, index=False, unique=False, nullable=True)
    isbn = Column('ISBN', String, index=True, unique=False, nullable=True)
    libraryNumber = Column('LibraryNumber', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    pages = Column('Pages', String, index=False, unique=False, nullable=True)
    placeOfPublication = Column('PlaceOfPublication', String, index=False, unique=False, nullable=True)
    publisher = Column('Publisher', String, index=True, unique=False, nullable=True)
    referenceWorkType = Column('ReferenceWorkType', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=True, unique=False, nullable=False)
    uri = Column('Uri', Text, index=False, unique=False, nullable=True)
    url = Column('URL', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    volume = Column('Volume', String, index=False, unique=False, nullable=True)
    workDate = Column('WorkDate', String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    ContainedrfparentID = Column('ContainedRFParentID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    InstitutionID = Column('InstitutionID', Integer, ForeignKey('institution.UserGroupScopeId'), nullable=False, unique=False)
    JournalID = Column('JournalID', Integer, ForeignKey('journal.JournalID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    containedRFParent = relationship('ReferenceWork', foreign_keys='ReferenceWork.ContainedRFParentID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('containedReferenceWorks', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ReferenceWork.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    institution = relationship('Institution', foreign_keys='ReferenceWork.InstitutionID', remote_side='Institution.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    journal = relationship('Journal', foreign_keys='ReferenceWork.JournalID', remote_side='Journal.JournalID', backref=orm.backref('referenceWorks', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ReferenceWork.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class ReferenceWorkAttachment(Base):
    tableid = 143
    _id = 'referenceWorkAttachmentId'
    __tablename__ = 'referenceworkattachment'

    referenceWorkAttachmentId = Column('Referenceworkattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)

    attachment = relationship('Attachment', foreign_keys='ReferenceWorkAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('referenceWorkAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='ReferenceWorkAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='ReferenceWorkAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='ReferenceWorkAttachment.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('referenceWorkAttachments', uselist=True))

class RepositoryAgreement(Base):
    tableid = 70
    _id = 'repositoryAgreementId'
    __tablename__ = 'repositoryagreement'

    repositoryAgreementId = Column('Repositoryagreementid', Integer, primary_key=True)
    dateReceived = Column('DateReceived', Date, index=False, unique=False, nullable=True)
    endDate = Column('EndDate', Date, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    repositoryAgreementNumber = Column('RepositoryAgreementNumber', String, index=True, unique=False, nullable=False)
    startDate = Column('StartDate', Date, index=True, unique=False, nullable=True)
    status = Column('Status', String, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    AddressofrecordID = Column('AddressOfRecordID', Integer, ForeignKey('addressOfRecord.AddressOfRecordID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    OriginatorID = Column('AgentID', Integer, ForeignKey('agent.AgentID'), nullable=False, unique=False)

    addressOfRecord = relationship('AddressOfRecord', foreign_keys='RepositoryAgreement.AddressOfRecordID', remote_side='AddressOfRecord.AddressOfRecordID', backref=orm.backref('repositoryAgreements', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='RepositoryAgreement.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='RepositoryAgreement.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='RepositoryAgreement.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    agent = relationship('Agent', foreign_keys='RepositoryAgreement.AgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class RepositoryAgreementAttachment(Base):
    tableid = 118
    _id = 'repositoryAgreementAttachmentId'
    __tablename__ = 'repositoryagreementattachment'

    repositoryAgreementAttachmentId = Column('Repositoryagreementattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    RepositoryagreementID = Column('RepositoryAgreementID', Integer, ForeignKey('repositoryAgreement.RepositoryAgreementID'), nullable=False, unique=False)

    attachment = relationship('Attachment', foreign_keys='RepositoryAgreementAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('repositoryAgreementAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='RepositoryAgreementAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='RepositoryAgreementAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    repositoryAgreement = relationship('RepositoryAgreement', foreign_keys='RepositoryAgreementAttachment.RepositoryAgreementID', remote_side='RepositoryAgreement.RepositoryAgreementID', backref=orm.backref('repositoryAgreementAttachments', uselist=True))

class Shipment(Base):
    tableid = 71
    _id = 'shipmentId'
    __tablename__ = 'shipment'

    shipmentId = Column('Shipmentid', Integer, primary_key=True)
    insuredForAmount = Column('InsuredForAmount', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    numberOfPackages = Column('NumberOfPackages', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    shipmentDate = Column('ShipmentDate', Date, index=True, unique=False, nullable=True)
    shipmentMethod = Column('ShipmentMethod', String, index=True, unique=False, nullable=True)
    shipmentNumber = Column('ShipmentNumber', String, index=True, unique=False, nullable=False)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    weight = Column('Weight', String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    BorrowID = Column('BorrowID', Integer, ForeignKey('borrow.BorrowID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ExchangeoutID = Column('ExchangeOutID', Integer, ForeignKey('exchangeOut.ExchangeOutID'), nullable=True, unique=False)
    GiftID = Column('GiftID', Integer, ForeignKey('gift.GiftID'), nullable=True, unique=False)
    LoanID = Column('LoanID', Integer, ForeignKey('loan.LoanID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ShippedbyID = Column('ShippedByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ShippedtoID = Column('ShippedToID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ShipperID = Column('ShipperID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    borrow = relationship('Borrow', foreign_keys='Shipment.BorrowID', remote_side='Borrow.BorrowID', backref=orm.backref('shipments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Shipment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='Shipment.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    exchangeOut = relationship('ExchangeOut', foreign_keys='Shipment.ExchangeOutID', remote_side='ExchangeOut.ExchangeOutID', backref=orm.backref('shipments', uselist=True))
    gift = relationship('Gift', foreign_keys='Shipment.GiftID', remote_side='Gift.GiftID', backref=orm.backref('shipments', uselist=True))
    loan = relationship('Loan', foreign_keys='Shipment.LoanID', remote_side='Loan.LoanID', backref=orm.backref('shipments', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Shipment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    shippedBy = relationship('Agent', foreign_keys='Shipment.ShippedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    shippedTo = relationship('Agent', foreign_keys='Shipment.ShippedToID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    shipper = relationship('Agent', foreign_keys='Shipment.ShipperID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpAppResource(Base):
    tableid = 514
    _id = 'spAppResourceId'
    __tablename__ = 'spappresource'

    spAppResourceId = Column('Spappresourceid', Integer, primary_key=True)
    allPermissionLevel = Column('AllPermissionLevel', Integer, index=False, unique=False, nullable=True)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    groupPermissionLevel = Column('GroupPermissionLevel', Integer, index=False, unique=False, nullable=True)
    level = Column('Level', Integer, index=False, unique=False, nullable=False)
    metaData = Column('MetaData', String, index=False, unique=False, nullable=True)
    mimeType = Column('MimeType', String, index=True, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    ownerPermissionLevel = Column('OwnerPermissionLevel', Integer, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    GroupID = Column('SpPrincipalID', Integer, ForeignKey('spPrincipal.SpPrincipalID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpappresourcedirID = Column('SpAppResourceDirID', Integer, ForeignKey('spAppResourceDir.SpAppResourceDirID'), nullable=False, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpAppResource.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spPrincipal = relationship('SpPrincipal', foreign_keys='SpAppResource.SpPrincipalID', remote_side='SpPrincipal.SpPrincipalID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpAppResource.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spAppResourceDir = relationship('SpAppResourceDir', foreign_keys='SpAppResource.SpAppResourceDirID', remote_side='SpAppResourceDir.SpAppResourceDirID', backref=orm.backref('spPersistedAppResources', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='SpAppResource.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('spAppResources', uselist=True))

class SpAppResourceData(Base):
    tableid = 515
    _id = 'spAppResourceDataId'
    __tablename__ = 'spappresourcedata'

    spAppResourceDataId = Column('Spappresourcedataid', Integer, primary_key=True)
    data = Column('data', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpappresourceID = Column('SpAppResourceID', Integer, ForeignKey('spAppResource.SpAppResourceID'), nullable=True, unique=False)
    SpviewsetobjID = Column('SpViewSetObjID', Integer, ForeignKey('spViewSetObj.SpViewSetObjID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpAppResourceData.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpAppResourceData.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spAppResource = relationship('SpAppResource', foreign_keys='SpAppResourceData.SpAppResourceID', remote_side='SpAppResource.SpAppResourceID', backref=orm.backref('spAppResourceDatas', uselist=True))
    spViewSetObj = relationship('SpViewSetObj', foreign_keys='SpAppResourceData.SpViewSetObjID', remote_side='SpViewSetObj.SpViewSetObjID', backref=orm.backref('spAppResourceDatas', uselist=True))

class SpAppResourceDir(Base):
    tableid = 516
    _id = 'spAppResourceDirId'
    __tablename__ = 'spappresourcedir'

    spAppResourceDirId = Column('Spappresourcedirid', Integer, primary_key=True)
    disciplineType = Column('DisciplineType', String, index=True, unique=False, nullable=True)
    isPersonal = Column('IsPersonal', mysql_bit_type, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    userType = Column('UserType', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=True, unique=False)

    collection = relationship('Collection', foreign_keys='SpAppResourceDir.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='SpAppResourceDir.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='SpAppResourceDir.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpAppResourceDir.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='SpAppResourceDir.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('spAppResourceDirs', uselist=True))

class SpAuditLog(Base):
    tableid = 530
    _id = 'spAuditLogId'
    __tablename__ = 'spauditlog'

    spAuditLogId = Column('Spauditlogid', Integer, primary_key=True)
    action = Column('Action', Integer, index=False, unique=False, nullable=False)
    parentRecordId = Column('ParentRecordId', Integer, index=False, unique=False, nullable=True)
    parentTableNum = Column('ParentTableNum', Integer, index=False, unique=False, nullable=True)
    recordId = Column('RecordId', Integer, index=False, unique=False, nullable=True)
    recordVersion = Column('RecordVersion', Integer, index=False, unique=False, nullable=False)
    tableNum = Column('TableNum', Integer, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpAuditLog.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpAuditLog.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpAuditLogField(Base):
    tableid = 531
    _id = 'spAuditLogFieldId'
    __tablename__ = 'spauditlogfield'

    spAuditLogFieldId = Column('Spauditlogfieldid', Integer, primary_key=True)
    fieldName = Column('FieldName', String, index=False, unique=False, nullable=False)
    newValue = Column('NewValue', Text, index=False, unique=False, nullable=True)
    oldValue = Column('OldValue', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpauditlogID = Column('SpAuditLogID', Integer, ForeignKey('spAuditLog.SpAuditLogID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpAuditLogField.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpAuditLogField.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spAuditLog = relationship('SpAuditLog', foreign_keys='SpAuditLogField.SpAuditLogID', remote_side='SpAuditLog.SpAuditLogID', backref=orm.backref('fields', uselist=True))

class SpExportSchema(Base):
    tableid = 524
    _id = 'spExportSchemaId'
    __tablename__ = 'spexportschema'

    spExportSchemaId = Column('Spexportschemaid', Integer, primary_key=True)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    schemaName = Column('SchemaName', String, index=False, unique=False, nullable=True)
    schemaVersion = Column('SchemaVersion', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpExportSchema.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='SpExportSchema.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('spExportSchemas', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpExportSchema.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpExportSchemaItem(Base):
    tableid = 525
    _id = 'spExportSchemaItemId'
    __tablename__ = 'spexportschemaitem'

    spExportSchemaItemId = Column('Spexportschemaitemid', Integer, primary_key=True)
    dataType = Column('DataType', String, index=False, unique=False, nullable=True)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    fieldName = Column('FieldName', String, index=False, unique=False, nullable=True)
    formatter = Column('Formatter', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpexportschemaID = Column('SpExportSchemaID', Integer, ForeignKey('spExportSchema.SpExportSchemaID'), nullable=False, unique=False)
    SplocalecontaineritemID = Column('SpLocaleContainerItemID', Integer, ForeignKey('spLocaleContainerItem.SpLocaleContainerItemID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpExportSchemaItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpExportSchemaItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spExportSchema = relationship('SpExportSchema', foreign_keys='SpExportSchemaItem.SpExportSchemaID', remote_side='SpExportSchema.SpExportSchemaID', backref=orm.backref('spExportSchemaItems', uselist=True))
    spLocaleContainerItem = relationship('SpLocaleContainerItem', foreign_keys='SpExportSchemaItem.SpLocaleContainerItemID', remote_side='SpLocaleContainerItem.SpLocaleContainerItemID', backref=orm.backref('spExportSchemaItems', uselist=True))

class SpExportSchemaItemMapping(Base):
    tableid = 527
    _id = 'spExportSchemaItemMappingId'
    __tablename__ = 'spexportschemaitemmapping'

    spExportSchemaItemMappingId = Column('Spexportschemaitemmappingid', Integer, primary_key=True)
    exportedFieldName = Column('ExportedFieldName', String, index=False, unique=False, nullable=True)
    extensionItem = Column('ExtensionItem', mysql_bit_type, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', String, index=False, unique=False, nullable=True)
    rowType = Column('RowType', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ExportschemaitemID = Column('ExportSchemaItemID', Integer, ForeignKey('spExportSchemaItem.SpExportSchemaItemID'), nullable=True, unique=False)
    ExportschemamappingID = Column('SpExportSchemaMappingID', Integer, ForeignKey('spExportSchemaMapping.SpExportSchemaMappingID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    QueryfieldID = Column('SpQueryFieldID', Integer, ForeignKey('spQueryField.SpQueryFieldID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpExportSchemaItemMapping.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    exportSchemaItem = relationship('SpExportSchemaItem', foreign_keys='SpExportSchemaItemMapping.ExportSchemaItemID', remote_side='SpExportSchemaItem.SpExportSchemaItemID', backref=orm.backref('None', uselist=True))
    spExportSchemaMapping = relationship('SpExportSchemaMapping', foreign_keys='SpExportSchemaItemMapping.SpExportSchemaMappingID', remote_side='SpExportSchemaMapping.SpExportSchemaMappingID', backref=orm.backref('mappings', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpExportSchemaItemMapping.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spQueryField = relationship('SpQueryField', foreign_keys='SpExportSchemaItemMapping.SpQueryFieldID', remote_side='SpQueryField.SpQueryFieldID', backref=orm.backref('mappings', uselist=True))

class SpExportSchemaMapping(Base):
    tableid = 528
    _id = 'spExportSchemaMappingId'
    __tablename__ = 'spexportschemamapping'

    spExportSchemaMappingId = Column('Spexportschemamappingid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    mappingName = Column('MappingName', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampExported = Column('TimeStampExported', DateTime, index=False, unique=False, nullable=True)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpExportSchemaMapping.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpExportSchemaMapping.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpFieldValueDefault(Base):
    tableid = 520
    _id = 'spFieldValueDefaultId'
    __tablename__ = 'spfieldvaluedefault'

    spFieldValueDefaultId = Column('Spfieldvaluedefaultid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    fieldName = Column('FieldName', String, index=False, unique=False, nullable=True)
    idValue = Column('IdValue', Integer, index=False, unique=False, nullable=True)
    strValue = Column('StrValue', String, index=False, unique=False, nullable=True)
    tableName = Column('TableName', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpFieldValueDefault.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpFieldValueDefault.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpLocaleContainer(Base):
    tableid = 503
    _id = 'spLocaleContainerId'
    __tablename__ = 'splocalecontainer'

    spLocaleContainerId = Column('Splocalecontainerid', Integer, primary_key=True)
    aggregator = Column('Aggregator', String, index=False, unique=False, nullable=True)
    defaultUI = Column('DefaultUI', String, index=False, unique=False, nullable=True)
    format = Column('Format', String, index=False, unique=False, nullable=True)
    isHidden = Column('IsHidden', mysql_bit_type, index=False, unique=False, nullable=False)
    isSystem = Column('IsSystem', mysql_bit_type, index=False, unique=False, nullable=False)
    isUIFormatter = Column('IsUIFormatter', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    pickListName = Column('PickListName', String, index=False, unique=False, nullable=True)
    schemaType = Column('SchemaType', Integer, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpLocaleContainer.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='SpLocaleContainer.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('spLocaleContainers', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpLocaleContainer.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpLocaleContainerItem(Base):
    tableid = 504
    _id = 'spLocaleContainerItemId'
    __tablename__ = 'splocalecontaineritem'

    spLocaleContainerItemId = Column('Splocalecontaineritemid', Integer, primary_key=True)
    format = Column('Format', String, index=False, unique=False, nullable=True)
    isHidden = Column('IsHidden', mysql_bit_type, index=False, unique=False, nullable=False)
    isRequired = Column('IsRequired', mysql_bit_type, index=False, unique=False, nullable=True)
    isSystem = Column('IsSystem', mysql_bit_type, index=False, unique=False, nullable=False)
    isUIFormatter = Column('IsUIFormatter', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    pickListName = Column('PickListName', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    webLinkName = Column('WebLinkName', String, index=False, unique=False, nullable=True)

    ContainerID = Column('SpLocaleContainerID', Integer, ForeignKey('spLocaleContainer.SpLocaleContainerID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    spLocaleContainer = relationship('SpLocaleContainer', foreign_keys='SpLocaleContainerItem.SpLocaleContainerID', remote_side='SpLocaleContainer.SpLocaleContainerID', backref=orm.backref('items', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='SpLocaleContainerItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpLocaleContainerItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpLocaleItemStr(Base):
    tableid = 505
    _id = 'spLocaleItemStrId'
    __tablename__ = 'splocaleitemstr'

    spLocaleItemStrId = Column('Splocaleitemstrid', Integer, primary_key=True)
    country = Column('Country', String, index=True, unique=False, nullable=True)
    language = Column('Language', String, index=True, unique=False, nullable=False)
    text = Column('Text', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    variant = Column('Variant', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    ContainerdescID = Column('SpLocaleContainerDescID', Integer, ForeignKey('spLocaleContainer.SpLocaleContainerID'), nullable=True, unique=False)
    ContainernameID = Column('SpLocaleContainerNameID', Integer, ForeignKey('spLocaleContainer.SpLocaleContainerID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ItemdescID = Column('SpLocaleContainerItemDescID', Integer, ForeignKey('spLocaleContainerItem.SpLocaleContainerItemID'), nullable=True, unique=False)
    ItemnameID = Column('SpLocaleContainerItemNameID', Integer, ForeignKey('spLocaleContainerItem.SpLocaleContainerItemID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    spLocaleContainerDesc = relationship('SpLocaleContainer', foreign_keys='SpLocaleItemStr.SpLocaleContainerDescID', remote_side='SpLocaleContainer.SpLocaleContainerID', backref=orm.backref('descs', uselist=True))
    spLocaleContainerName = relationship('SpLocaleContainer', foreign_keys='SpLocaleItemStr.SpLocaleContainerNameID', remote_side='SpLocaleContainer.SpLocaleContainerID', backref=orm.backref('names', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='SpLocaleItemStr.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spLocaleContainerItemDesc = relationship('SpLocaleContainerItem', foreign_keys='SpLocaleItemStr.SpLocaleContainerItemDescID', remote_side='SpLocaleContainerItem.SpLocaleContainerItemID', backref=orm.backref('descs', uselist=True))
    spLocaleContainerItemName = relationship('SpLocaleContainerItem', foreign_keys='SpLocaleItemStr.SpLocaleContainerItemNameID', remote_side='SpLocaleContainerItem.SpLocaleContainerItemID', backref=orm.backref('names', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpLocaleItemStr.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpPermission(Base):
    tableid = 521
    _id = 'permissionId'
    __tablename__ = 'sppermission'

    permissionId = Column('Permissionid', Integer, primary_key=True)
    actions = Column('Actions', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=True)
    permissionClass = Column('PermissionClass', String, index=False, unique=False, nullable=False)
    targetId = Column('TargetId', Integer, index=False, unique=False, nullable=True)



class SpPrincipal(Base):
    tableid = 522
    _id = 'userGroupId'
    __tablename__ = 'spprincipal'

    userGroupId = Column('Usergroupid', Integer, primary_key=True)
    groupSubClass = Column('GroupSubClass', String, index=False, unique=False, nullable=False)
    groupType = Column('groupType', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    priority = Column('Priority', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpPrincipal.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpPrincipal.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpQuery(Base):
    tableid = 517
    _id = 'spQueryId'
    __tablename__ = 'spquery'

    spQueryId = Column('Spqueryid', Integer, primary_key=True)
    contextName = Column('ContextName', String, index=False, unique=False, nullable=False)
    contextTableId = Column('ContextTableId', Integer, index=False, unique=False, nullable=False)
    countOnly = Column('CountOnly', mysql_bit_type, index=False, unique=False, nullable=True)
    formatAuditRecIds = Column('FormatAuditRecIds', mysql_bit_type, index=False, unique=False, nullable=True)
    isFavorite = Column('IsFavorite', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    searchSynonymy = Column('SearchSynonymy', mysql_bit_type, index=False, unique=False, nullable=True)
    selectDistinct = Column('SelectDistinct', mysql_bit_type, index=False, unique=False, nullable=True)
    smushed = Column('Smushed', mysql_bit_type, index=False, unique=False, nullable=True)
    sqlStr = Column('SqlStr', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpQuery.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpQuery.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='SpQuery.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('spQuerys', uselist=True))

class SpQueryField(Base):
    tableid = 518
    _id = 'spQueryFieldId'
    __tablename__ = 'spqueryfield'

    spQueryFieldId = Column('Spqueryfieldid', Integer, primary_key=True)
    allowNulls = Column('AllowNulls', mysql_bit_type, index=False, unique=False, nullable=True)
    alwaysFilter = Column('AlwaysFilter', mysql_bit_type, index=False, unique=False, nullable=True)
    columnAlias = Column('ColumnAlias', String, index=False, unique=False, nullable=True)
    contextTableIdent = Column('ContextTableIdent', Integer, index=False, unique=False, nullable=True)
    endValue = Column('EndValue', Text, index=False, unique=False, nullable=True)
    fieldName = Column('FieldName', String, index=False, unique=False, nullable=False)
    formatName = Column('FormatName', String, index=False, unique=False, nullable=True)
    isDisplay = Column('IsDisplay', mysql_bit_type, index=False, unique=False, nullable=False)
    isNot = Column('IsNot', mysql_bit_type, index=False, unique=False, nullable=False)
    isPrompt = Column('IsPrompt', mysql_bit_type, index=False, unique=False, nullable=True)
    isRelFld = Column('IsRelFld', mysql_bit_type, index=False, unique=False, nullable=True)
    operEnd = Column('OperEnd', Integer, index=False, unique=False, nullable=True)
    operStart = Column('OperStart', Integer, index=False, unique=False, nullable=False)
    position = Column('Position', Integer, index=False, unique=False, nullable=False)
    sortType = Column('SortType', Integer, index=False, unique=False, nullable=False)
    startValue = Column('StartValue', Text, index=False, unique=False, nullable=False)
    stringId = Column('StringId', String, index=False, unique=False, nullable=False)
    tableList = Column('TableList', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    QueryID = Column('SpQueryID', Integer, ForeignKey('spQuery.SpQueryID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpQueryField.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpQueryField.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spQuery = relationship('SpQuery', foreign_keys='SpQueryField.SpQueryID', remote_side='SpQuery.SpQueryID', backref=orm.backref('fields', uselist=True))

class SpReport(Base):
    tableid = 519
    _id = 'spReportId'
    __tablename__ = 'spreport'

    spReportId = Column('Spreportid', Integer, primary_key=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    repeatCount = Column('RepeatCount', Integer, index=False, unique=False, nullable=True)
    repeatField = Column('RepeatField', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AppresourceID = Column('AppResourceID', Integer, ForeignKey('spAppResource.SpAppResourceID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    QueryID = Column('SpQueryID', Integer, ForeignKey('spQuery.SpQueryID'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)
    WorkbenchtemplateID = Column('WorkbenchTemplateID', Integer, ForeignKey('workbenchTemplate.WorkbenchTemplateID'), nullable=True, unique=False)

    appResource = relationship('SpAppResource', foreign_keys='SpReport.AppResourceID', remote_side='SpAppResource.SpAppResourceID', backref=orm.backref('spReports', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='SpReport.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpReport.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spQuery = relationship('SpQuery', foreign_keys='SpReport.SpQueryID', remote_side='SpQuery.SpQueryID', backref=orm.backref('reports', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='SpReport.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    workbenchTemplate = relationship('WorkbenchTemplate', foreign_keys='SpReport.WorkbenchTemplateID', remote_side='WorkbenchTemplate.WorkbenchTemplateID', backref=orm.backref('None', uselist=False))

class SpSymbiotaInstance(Base):
    tableid = 533
    _id = 'spSymbiotaInstanceId'
    __tablename__ = 'spsymbiotainstance'

    spSymbiotaInstanceId = Column('Spsymbiotainstanceid', Integer, primary_key=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    instanceName = Column('InstanceName', String, index=False, unique=False, nullable=True)
    lastCacheBuild = Column('LastCacheBuild', Date, index=False, unique=False, nullable=True)
    lastPull = Column('LastPull', Date, index=False, unique=False, nullable=True)
    lastPush = Column('LastPush', Date, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    symbiotaKey = Column('SymbiotaKey', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SchemamappingID = Column('SchemaMappingID', Integer, ForeignKey('spExportSchemaMapping.SpExportSchemaMappingID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpSymbiotaInstance.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpSymbiotaInstance.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    schemaMapping = relationship('SpExportSchemaMapping', foreign_keys='SpSymbiotaInstance.SchemaMappingID', remote_side='SpExportSchemaMapping.SpExportSchemaMappingID', backref=orm.backref('symbiotaInstances', uselist=True))

class SpTaskSemaphore(Base):
    tableid = 526
    _id = 'spTaskSemaphoreId'
    __tablename__ = 'sptasksemaphore'

    spTaskSemaphoreId = Column('Sptasksemaphoreid', Integer, primary_key=True)
    context = Column('Context', String, index=False, unique=False, nullable=True)
    isLocked = Column('IsLocked', mysql_bit_type, index=False, unique=False, nullable=True)
    lockedTime = Column('LockedTime', DateTime, index=False, unique=False, nullable=True)
    machineName = Column('MachineName', String, index=False, unique=False, nullable=True)
    scope = Column('Scope', Integer, index=False, unique=False, nullable=True)
    taskName = Column('TaskName', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    usageCount = Column('UsageCount', Integer, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    OwnerID = Column('OwnerID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=True, unique=False)

    collection = relationship('Collection', foreign_keys='SpTaskSemaphore.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='SpTaskSemaphore.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    discipline = relationship('Discipline', foreign_keys='SpTaskSemaphore.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpTaskSemaphore.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    owner = relationship('SpecifyUser', foreign_keys='SpTaskSemaphore.OwnerID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('taskSemaphores', uselist=True))

class SpVersion(Base):
    tableid = 529
    _id = 'spVersionId'
    __tablename__ = 'spversion'

    spVersionId = Column('Spversionid', Integer, primary_key=True)
    appName = Column('AppName', String, index=False, unique=False, nullable=True)
    appVersion = Column('AppVersion', String, index=False, unique=False, nullable=True)
    dbClosedBy = Column('DbClosedBy', String, index=False, unique=False, nullable=True)
    isDBClosed = Column('IsDBClosed', mysql_bit_type, index=False, unique=False, nullable=True)
    schemaVersion = Column('SchemaVersion', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    workbenchSchemaVersion = Column('WorkbenchSchemaVersion', String, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpVersion.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpVersion.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class SpViewSetObj(Base):
    tableid = 513
    _id = 'spViewSetObjId'
    __tablename__ = 'spviewsetobj'

    spViewSetObjId = Column('Spviewsetobjid', Integer, primary_key=True)
    description = Column('Description', String, index=False, unique=False, nullable=True)
    fileName = Column('FileName', String, index=False, unique=False, nullable=True)
    level = Column('Level', Integer, index=False, unique=False, nullable=False)
    metaData = Column('MetaData', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpappresourcedirID = Column('SpAppResourceDirID', Integer, ForeignKey('spAppResourceDir.SpAppResourceDirID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpViewSetObj.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpViewSetObj.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spAppResourceDir = relationship('SpAppResourceDir', foreign_keys='SpViewSetObj.SpAppResourceDirID', remote_side='SpAppResourceDir.SpAppResourceDirID', backref=orm.backref('spPersistedViewSets', uselist=True))

class SpVisualQuery(Base):
    tableid = 532
    _id = 'spVisualQueryId'
    __tablename__ = 'spvisualquery'

    spVisualQueryId = Column('Spvisualqueryid', Integer, primary_key=True)
    description = Column('Description', Text, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpVisualQuery.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpVisualQuery.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='SpVisualQuery.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class SpecifyUser(Base):
    tableid = 72
    _id = 'specifyUserId'
    __tablename__ = 'specifyuser'

    specifyUserId = Column('Specifyuserid', Integer, primary_key=True)
    accumMinLoggedIn = Column('AccumMinLoggedIn', Integer, index=False, unique=False, nullable=True)
    email = Column('EMail', String, index=False, unique=False, nullable=True)
    isLoggedIn = Column('IsLoggedIn', mysql_bit_type, index=False, unique=False, nullable=False)
    isLoggedInReport = Column('IsLoggedInReport', mysql_bit_type, index=False, unique=False, nullable=False)
    loginCollectionName = Column('LoginCollectionName', String, index=False, unique=False, nullable=True)
    loginDisciplineName = Column('LoginDisciplineName', String, index=False, unique=False, nullable=True)
    loginOutTime = Column('LoginOutTime', DateTime, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=True, nullable=False)
    password = Column('Password', String, index=False, unique=False, nullable=False)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    userType = Column('UserType', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='SpecifyUser.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='SpecifyUser.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Storage(Base):
    tableid = 58
    _id = 'storageId'
    __tablename__ = 'storage'

    storageId = Column('Storageid', Integer, primary_key=True)
    abbrev = Column('Abbrev', String, index=False, unique=False, nullable=True)
    fullName = Column('FullName', String, index=True, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    nodeNumber = Column('NodeNumber', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Integer, index=False, unique=False, nullable=True)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    timestampVersion = Column('TimestampVersion', Date, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AcceptedstorageID = Column('AcceptedID', Integer, ForeignKey('storage.StorageID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DefinitionID = Column('StorageTreeDefID', Integer, ForeignKey('storageTreeDef.StorageTreeDefID'), nullable=False, unique=False)
    DefinitionitemID = Column('StorageTreeDefItemID', Integer, ForeignKey('storageTreeDefItem.StorageTreeDefItemID'), nullable=False, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentID', Integer, ForeignKey('storage.StorageID'), nullable=True, unique=False)

    accepted = relationship('Storage', foreign_keys='Storage.AcceptedID', remote_side='Storage.StorageID', backref=orm.backref('acceptedChildren', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Storage.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    storageTreeDef = relationship('StorageTreeDef', foreign_keys='Storage.StorageTreeDefID', remote_side='StorageTreeDef.StorageTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    storageTreeDefItem = relationship('StorageTreeDefItem', foreign_keys='Storage.StorageTreeDefItemID', remote_side='StorageTreeDefItem.StorageTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Storage.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parent = relationship('Storage', foreign_keys='Storage.ParentID', remote_side='Storage.StorageID', backref=orm.backref('children', uselist=True))

class StorageAttachment(Base):
    tableid = 148
    _id = 'storageAttachmentId'
    __tablename__ = 'storageattachment'

    storageAttachmentId = Column('Storageattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    StorageID = Column('StorageID', Integer, ForeignKey('storage.StorageID'), nullable=False, unique=False)

    attachment = relationship('Attachment', foreign_keys='StorageAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('storageAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='StorageAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='StorageAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    storage = relationship('Storage', foreign_keys='StorageAttachment.StorageID', remote_side='Storage.StorageID', backref=orm.backref('storageAttachments', uselist=True))

class StorageTreeDef(Base):
    tableid = 59
    _id = 'storageTreeDefId'
    __tablename__ = 'storagetreedef'

    storageTreeDefId = Column('Storagetreedefid', Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', Integer, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='StorageTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='StorageTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class StorageTreeDefItem(Base):
    tableid = 60
    _id = 'storageTreeDefItemId'
    __tablename__ = 'storagetreedefitem'

    storageTreeDefItemId = Column('Storagetreedefitemid', Integer, primary_key=True)
    fullNameSeparator = Column('FullNameSeparator', String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentItemID', Integer, ForeignKey('storageTreeDefItem.StorageTreeDefItemID'), nullable=True, unique=False)
    TreedefID = Column('StorageTreeDefID', Integer, ForeignKey('storageTreeDef.StorageTreeDefID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='StorageTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='StorageTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parentItem = relationship('StorageTreeDefItem', foreign_keys='StorageTreeDefItem.ParentItemID', remote_side='StorageTreeDefItem.StorageTreeDefItemID', backref=orm.backref('children', uselist=True))
    storageTreeDef = relationship('StorageTreeDef', foreign_keys='StorageTreeDefItem.StorageTreeDefID', remote_side='StorageTreeDef.StorageTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class Taxon(Base):
    tableid = 4
    _id = 'taxonId'
    __tablename__ = 'taxon'

    taxonId = Column('Taxonid', Integer, primary_key=True)
    author = Column('Author', String, index=False, unique=False, nullable=True)
    citesStatus = Column('CitesStatus', String, index=False, unique=False, nullable=True)
    colStatus = Column('COLStatus', String, index=False, unique=False, nullable=True)
    commonName = Column('CommonName', String, index=True, unique=False, nullable=True)
    cultivarName = Column('CultivarName', String, index=False, unique=False, nullable=True)
    environmentalProtectionStatus = Column('EnvironmentalProtectionStatus', String, index=True, unique=False, nullable=True)
    esaStatus = Column('EsaStatus', String, index=False, unique=False, nullable=True)
    fullName = Column('FullName', String, index=True, unique=False, nullable=True)
    groupNumber = Column('GroupNumber', String, index=False, unique=False, nullable=True)
    guid = Column('GUID', String, index=True, unique=False, nullable=True)
    highestChildNodeNumber = Column('HighestChildNodeNumber', Integer, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    integer4 = Column('Integer4', Integer, index=False, unique=False, nullable=True)
    integer5 = Column('Integer5', Integer, index=False, unique=False, nullable=True)
    isAccepted = Column('IsAccepted', mysql_bit_type, index=False, unique=False, nullable=False)
    isHybrid = Column('IsHybrid', mysql_bit_type, index=False, unique=False, nullable=False)
    isisNumber = Column('IsisNumber', String, index=False, unique=False, nullable=True)
    labelFormat = Column('LabelFormat', String, index=False, unique=False, nullable=True)
    lsid = Column('LSID', Text, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=True, unique=False, nullable=False)
    ncbiTaxonNumber = Column('NcbiTaxonNumber', String, index=False, unique=False, nullable=True)
    nodeNumber = Column('NodeNumber', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Integer, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    source = Column('Source', String, index=False, unique=False, nullable=True)
    taxonomicSerialNumber = Column('TaxonomicSerialNumber', String, index=True, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text10 = Column('Text10', String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text20 = Column('Text20', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', Text, index=False, unique=False, nullable=True)
    text7 = Column('Text7', Text, index=False, unique=False, nullable=True)
    text8 = Column('Text8', Text, index=False, unique=False, nullable=True)
    text9 = Column('Text9', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    unitInd1 = Column('UnitInd1', String, index=False, unique=False, nullable=True)
    unitInd2 = Column('UnitInd2', String, index=False, unique=False, nullable=True)
    unitInd3 = Column('UnitInd3', String, index=False, unique=False, nullable=True)
    unitInd4 = Column('UnitInd4', String, index=False, unique=False, nullable=True)
    unitName1 = Column('UnitName1', String, index=False, unique=False, nullable=True)
    unitName2 = Column('UnitName2', String, index=False, unique=False, nullable=True)
    unitName3 = Column('UnitName3', String, index=False, unique=False, nullable=True)
    unitName4 = Column('UnitName4', String, index=False, unique=False, nullable=True)
    usfwsCode = Column('UsfwsCode', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    visibility = Column('Visibility', Integer, index=False, unique=False, nullable=True)
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

    AcceptedtaxonID = Column('AcceptedID', Integer, ForeignKey('taxon.TaxonID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DefinitionID = Column('TaxonTreeDefID', Integer, ForeignKey('taxonTreeDef.TaxonTreeDefID'), nullable=False, unique=False)
    DefinitionitemID = Column('TaxonTreeDefItemID', Integer, ForeignKey('taxonTreeDefItem.TaxonTreeDefItemID'), nullable=False, unique=False)
    Hybridparent1ID = Column('HybridParent1ID', Integer, ForeignKey('taxon.TaxonID'), nullable=True, unique=False)
    Hybridparent2ID = Column('HybridParent2ID', Integer, ForeignKey('taxon.TaxonID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentID', Integer, ForeignKey('taxon.TaxonID'), nullable=True, unique=False)
    TaxonattributeID = Column('TaxonAttributeID', Integer, ForeignKey('taxonAttribute.TaxonAttributeID'), nullable=True, unique=False)
    VisibilitysetbyID = Column('VisibilitySetByID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=True, unique=False)

    accepted = relationship('Taxon', foreign_keys='Taxon.AcceptedID', remote_side='Taxon.TaxonID', backref=orm.backref('acceptedChildren', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Taxon.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    taxonTreeDef = relationship('TaxonTreeDef', foreign_keys='Taxon.TaxonTreeDefID', remote_side='TaxonTreeDef.TaxonTreeDefID', backref=orm.backref('treeEntries', uselist=True))
    taxonTreeDefItem = relationship('TaxonTreeDefItem', foreign_keys='Taxon.TaxonTreeDefItemID', remote_side='TaxonTreeDefItem.TaxonTreeDefItemID', backref=orm.backref('treeEntries', uselist=True))
    hybridParent1 = relationship('Taxon', foreign_keys='Taxon.HybridParent1ID', remote_side='Taxon.TaxonID', backref=orm.backref('hybridChildren1', uselist=True))
    hybridParent2 = relationship('Taxon', foreign_keys='Taxon.HybridParent2ID', remote_side='Taxon.TaxonID', backref=orm.backref('hybridChildren2', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Taxon.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parent = relationship('Taxon', foreign_keys='Taxon.ParentID', remote_side='Taxon.TaxonID', backref=orm.backref('children', uselist=True))
    taxonAttribute = relationship('TaxonAttribute', foreign_keys='Taxon.TaxonAttributeID', remote_side='TaxonAttribute.TaxonAttributeID', backref=orm.backref('taxons', uselist=True))
    visibilitySetBy = relationship('SpecifyUser', foreign_keys='Taxon.VisibilitySetByID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class TaxonAttachment(Base):
    tableid = 119
    _id = 'taxonAttachmentId'
    __tablename__ = 'taxonattachment'

    taxonAttachmentId = Column('Taxonattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    TaxonID = Column('TaxonID', Integer, ForeignKey('taxon.TaxonID'), nullable=False, unique=False)

    attachment = relationship('Attachment', foreign_keys='TaxonAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('taxonAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='TaxonAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='TaxonAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    taxon = relationship('Taxon', foreign_keys='TaxonAttachment.TaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('taxonAttachments', uselist=True))

class TaxonAttribute(Base):
    tableid = 162
    _id = 'taxonAttributeId'
    __tablename__ = 'taxonattribute'

    taxonAttributeId = Column('Taxonattributeid', Integer, primary_key=True)
    date1 = Column('Date1', Date, index=False, unique=False, nullable=True)
    date1Precision = Column('Date1Precision', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number10 = Column('Number10', Numeric, index=False, unique=False, nullable=True)
    number11 = Column('Number11', Numeric, index=False, unique=False, nullable=True)
    number12 = Column('Number12', Numeric, index=False, unique=False, nullable=True)
    number13 = Column('Number13', Numeric, index=False, unique=False, nullable=True)
    number14 = Column('Number14', Numeric, index=False, unique=False, nullable=True)
    number15 = Column('Number15', Numeric, index=False, unique=False, nullable=True)
    number16 = Column('Number16', Numeric, index=False, unique=False, nullable=True)
    number17 = Column('Number17', Numeric, index=False, unique=False, nullable=True)
    number18 = Column('Number18', Numeric, index=False, unique=False, nullable=True)
    number19 = Column('Number19', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number20 = Column('Number20', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    number6 = Column('Number6', Numeric, index=False, unique=False, nullable=True)
    number7 = Column('Number7', Numeric, index=False, unique=False, nullable=True)
    number8 = Column('Number8', Numeric, index=False, unique=False, nullable=True)
    number9 = Column('Number9', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', String, index=False, unique=False, nullable=True)
    text10 = Column('Text10', String, index=False, unique=False, nullable=True)
    text11 = Column('Text11', String, index=False, unique=False, nullable=True)
    text12 = Column('Text12', String, index=False, unique=False, nullable=True)
    text13 = Column('Text13', String, index=False, unique=False, nullable=True)
    text14 = Column('Text14', String, index=False, unique=False, nullable=True)
    text15 = Column('Text15', String, index=False, unique=False, nullable=True)
    text16 = Column('Text16', String, index=False, unique=False, nullable=True)
    text17 = Column('Text17', String, index=False, unique=False, nullable=True)
    text18 = Column('Text18', String, index=False, unique=False, nullable=True)
    text19 = Column('Text19', String, index=False, unique=False, nullable=True)
    text2 = Column('Text2', String, index=False, unique=False, nullable=True)
    text20 = Column('Text20', String, index=False, unique=False, nullable=True)
    text21 = Column('Text21', String, index=False, unique=False, nullable=True)
    text22 = Column('Text22', String, index=False, unique=False, nullable=True)
    text23 = Column('Text23', String, index=False, unique=False, nullable=True)
    text24 = Column('Text24', String, index=False, unique=False, nullable=True)
    text25 = Column('Text25', String, index=False, unique=False, nullable=True)
    text26 = Column('Text26', String, index=False, unique=False, nullable=True)
    text27 = Column('Text27', String, index=False, unique=False, nullable=True)
    text28 = Column('Text28', String, index=False, unique=False, nullable=True)
    text29 = Column('Text29', String, index=False, unique=False, nullable=True)
    text3 = Column('Text3', String, index=False, unique=False, nullable=True)
    text30 = Column('Text30', String, index=False, unique=False, nullable=True)
    text31 = Column('Text31', String, index=False, unique=False, nullable=True)
    text32 = Column('Text32', String, index=False, unique=False, nullable=True)
    text33 = Column('Text33', String, index=False, unique=False, nullable=True)
    text34 = Column('Text34', String, index=False, unique=False, nullable=True)
    text35 = Column('Text35', String, index=False, unique=False, nullable=True)
    text36 = Column('Text36', String, index=False, unique=False, nullable=True)
    text37 = Column('Text37', String, index=False, unique=False, nullable=True)
    text38 = Column('Text38', String, index=False, unique=False, nullable=True)
    text39 = Column('Text39', String, index=False, unique=False, nullable=True)
    text4 = Column('Text4', String, index=False, unique=False, nullable=True)
    text40 = Column('Text40', String, index=False, unique=False, nullable=True)
    text41 = Column('Text41', String, index=False, unique=False, nullable=True)
    text42 = Column('Text42', String, index=False, unique=False, nullable=True)
    text43 = Column('Text43', String, index=False, unique=False, nullable=True)
    text44 = Column('Text44', String, index=False, unique=False, nullable=True)
    text45 = Column('Text45', String, index=False, unique=False, nullable=True)
    text46 = Column('Text46', String, index=False, unique=False, nullable=True)
    text47 = Column('Text47', String, index=False, unique=False, nullable=True)
    text48 = Column('Text48', String, index=False, unique=False, nullable=True)
    text49 = Column('Text49', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', String, index=False, unique=False, nullable=True)
    text50 = Column('Text50', Text, index=False, unique=False, nullable=True)
    text51 = Column('Text51', Text, index=False, unique=False, nullable=True)
    text52 = Column('Text52', Text, index=False, unique=False, nullable=True)
    text53 = Column('Text53', Text, index=False, unique=False, nullable=True)
    text54 = Column('Text54', Text, index=False, unique=False, nullable=True)
    text55 = Column('Text55', Text, index=False, unique=False, nullable=True)
    text56 = Column('Text56', Text, index=False, unique=False, nullable=True)
    text57 = Column('Text57', Text, index=False, unique=False, nullable=True)
    text58 = Column('Text58', Text, index=False, unique=False, nullable=True)
    text6 = Column('Text6', String, index=False, unique=False, nullable=True)
    text7 = Column('Text7', String, index=False, unique=False, nullable=True)
    text8 = Column('Text8', String, index=False, unique=False, nullable=True)
    text9 = Column('Text9', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
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

    Agent1ID = Column('Agent1ID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    agent1 = relationship('Agent', foreign_keys='TaxonAttribute.Agent1ID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='TaxonAttribute.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='TaxonAttribute.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class TaxonCitation(Base):
    tableid = 75
    _id = 'taxonCitationId'
    __tablename__ = 'taxoncitation'

    taxonCitationId = Column('Taxoncitationid', Integer, primary_key=True)
    figureNumber = Column('FigureNumber', String, index=False, unique=False, nullable=True)
    isFigured = Column('IsFigured', mysql_bit_type, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    pageNumber = Column('PageNumber', String, index=False, unique=False, nullable=True)
    plateNumber = Column('PlateNumber', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ReferenceworkID = Column('ReferenceWorkID', Integer, ForeignKey('referenceWork.ReferenceWorkID'), nullable=False, unique=False)
    TaxonID = Column('TaxonID', Integer, ForeignKey('taxon.TaxonID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='TaxonCitation.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='TaxonCitation.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    referenceWork = relationship('ReferenceWork', foreign_keys='TaxonCitation.ReferenceWorkID', remote_side='ReferenceWork.ReferenceWorkID', backref=orm.backref('taxonCitations', uselist=True))
    taxon = relationship('Taxon', foreign_keys='TaxonCitation.TaxonID', remote_side='Taxon.TaxonID', backref=orm.backref('taxonCitations', uselist=True))

class TaxonTreeDef(Base):
    tableid = 76
    _id = 'taxonTreeDefId'
    __tablename__ = 'taxontreedef'

    taxonTreeDefId = Column('Taxontreedefid', Integer, primary_key=True)
    fullNameDirection = Column('FullNameDirection', Integer, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DisciplineID = Column('None', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='TaxonTreeDef.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='TaxonTreeDef.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class TaxonTreeDefItem(Base):
    tableid = 77
    _id = 'taxonTreeDefItemId'
    __tablename__ = 'taxontreedefitem'

    taxonTreeDefItemId = Column('Taxontreedefitemid', Integer, primary_key=True)
    formatToken = Column('FormatToken', String, index=False, unique=False, nullable=True)
    fullNameSeparator = Column('FullNameSeparator', String, index=False, unique=False, nullable=True)
    isEnforced = Column('IsEnforced', mysql_bit_type, index=False, unique=False, nullable=True)
    isInFullName = Column('IsInFullName', mysql_bit_type, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    rankId = Column('RankID', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    textAfter = Column('TextAfter', String, index=False, unique=False, nullable=True)
    textBefore = Column('TextBefore', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    title = Column('Title', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ParentID = Column('ParentItemID', Integer, ForeignKey('taxonTreeDefItem.TaxonTreeDefItemID'), nullable=True, unique=False)
    TreedefID = Column('TaxonTreeDefID', Integer, ForeignKey('taxonTreeDef.TaxonTreeDefID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='TaxonTreeDefItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='TaxonTreeDefItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    parentItem = relationship('TaxonTreeDefItem', foreign_keys='TaxonTreeDefItem.ParentItemID', remote_side='TaxonTreeDefItem.TaxonTreeDefItemID', backref=orm.backref('children', uselist=True))
    taxonTreeDef = relationship('TaxonTreeDef', foreign_keys='TaxonTreeDefItem.TaxonTreeDefID', remote_side='TaxonTreeDef.TaxonTreeDefID', backref=orm.backref('treeDefItems', uselist=True))

class TreatmentEvent(Base):
    tableid = 122
    _id = 'treatmentEventId'
    __tablename__ = 'treatmentevent'

    treatmentEventId = Column('Treatmenteventid', Integer, primary_key=True)
    dateBoxed = Column('DateBoxed', Date, index=False, unique=False, nullable=True)
    dateCleaned = Column('DateCleaned', Date, index=False, unique=False, nullable=True)
    dateCompleted = Column('DateCompleted', Date, index=False, unique=False, nullable=True)
    dateReceived = Column('DateReceived', Date, index=True, unique=False, nullable=True)
    dateToIsolation = Column('DateToIsolation', Date, index=False, unique=False, nullable=True)
    dateTreatmentEnded = Column('DateTreatmentEnded', Date, index=False, unique=False, nullable=True)
    dateTreatmentStarted = Column('DateTreatmentStarted', Date, index=True, unique=False, nullable=True)
    fieldNumber = Column('FieldNumber', String, index=True, unique=False, nullable=True)
    location = Column('Storage', String, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Integer, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Integer, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    number4 = Column('Number4', Numeric, index=False, unique=False, nullable=True)
    number5 = Column('Number5', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    text4 = Column('Text4', Text, index=False, unique=False, nullable=True)
    text5 = Column('Text5', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    treatmentNumber = Column('TreatmentNumber', String, index=True, unique=False, nullable=True)
    type = Column('Type', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    AccessionID = Column('AccessionID', Integer, ForeignKey('accession.AccessionID'), nullable=True, unique=False)
    AuthorizedbyID = Column('AuthorizedByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=True, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    DivisionID = Column('DivisionID', Integer, ForeignKey('division.UserGroupScopeId'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    PerformedbyID = Column('PerformedByID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    accession = relationship('Accession', foreign_keys='TreatmentEvent.AccessionID', remote_side='Accession.AccessionID', backref=orm.backref('treatmentEvents', uselist=True))
    authorizedBy = relationship('Agent', foreign_keys='TreatmentEvent.AuthorizedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    collectionObject = relationship('CollectionObject', foreign_keys='TreatmentEvent.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('treatmentEvents', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='TreatmentEvent.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    division = relationship('Division', foreign_keys='TreatmentEvent.DivisionID', remote_side='Division.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='TreatmentEvent.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    performedBy = relationship('Agent', foreign_keys='TreatmentEvent.PerformedByID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class TreatmentEventAttachment(Base):
    tableid = 149
    _id = 'treatmentEventAttachmentId'
    __tablename__ = 'treatmenteventattachment'

    treatmentEventAttachmentId = Column('Treatmenteventattachmentid', Integer, primary_key=True)
    ordinal = Column('Ordinal', Integer, index=False, unique=False, nullable=False)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    AttachmentID = Column('AttachmentID', Integer, ForeignKey('attachment.AttachmentID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    TreatmenteventID = Column('TreatmentEventID', Integer, ForeignKey('treatmentEvent.TreatmentEventID'), nullable=False, unique=False)

    attachment = relationship('Attachment', foreign_keys='TreatmentEventAttachment.AttachmentID', remote_side='Attachment.AttachmentID', backref=orm.backref('treatmentEventAttachments', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='TreatmentEventAttachment.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='TreatmentEventAttachment.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    treatmentEvent = relationship('TreatmentEvent', foreign_keys='TreatmentEventAttachment.TreatmentEventID', remote_side='TreatmentEvent.TreatmentEventID', backref=orm.backref('treatmentEventAttachments', uselist=True))

class VoucherRelationship(Base):
    tableid = 155
    _id = 'voucherRelationshipId'
    __tablename__ = 'voucherrelationship'

    voucherRelationshipId = Column('Voucherrelationshipid', Integer, primary_key=True)
    collectionCode = Column('CollectionCode', String, index=False, unique=False, nullable=True)
    collectionMemberId = Column('CollectionMemberID', Integer, index=True, unique=False, nullable=False)
    institutionCode = Column('InstitutionCode', String, index=False, unique=False, nullable=True)
    integer1 = Column('Integer1', Integer, index=False, unique=False, nullable=True)
    integer2 = Column('Integer2', Integer, index=False, unique=False, nullable=True)
    integer3 = Column('Integer3', Integer, index=False, unique=False, nullable=True)
    number1 = Column('Number1', Numeric, index=False, unique=False, nullable=True)
    number2 = Column('Number2', Numeric, index=False, unique=False, nullable=True)
    number3 = Column('Number3', Numeric, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    text1 = Column('Text1', Text, index=False, unique=False, nullable=True)
    text2 = Column('Text2', Text, index=False, unique=False, nullable=True)
    text3 = Column('Text3', Text, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    urlLink = Column('UrlLink', String, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    voucherNumber = Column('VoucherNumber', String, index=False, unique=False, nullable=True)
    yesNo1 = Column('YesNo1', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo2 = Column('YesNo2', mysql_bit_type, index=False, unique=False, nullable=True)
    yesNo3 = Column('YesNo3', mysql_bit_type, index=False, unique=False, nullable=True)

    CollectionobjectID = Column('CollectionObjectID', Integer, ForeignKey('collectionObject.CollectionObjectID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collectionObject = relationship('CollectionObject', foreign_keys='VoucherRelationship.CollectionObjectID', remote_side='CollectionObject.CollectionObjectID', backref=orm.backref('voucherRelationships', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='VoucherRelationship.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='VoucherRelationship.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class Workbench(Base):
    tableid = 79
    _id = 'workbenchId'
    __tablename__ = 'workbench'

    workbenchId = Column('Workbenchid', Integer, primary_key=True)
    allPermissionLevel = Column('AllPermissionLevel', Integer, index=False, unique=False, nullable=True)
    dbTableId = Column('TableID', Integer, index=False, unique=False, nullable=True)
    exportInstitutionName = Column('ExportInstitutionName', String, index=False, unique=False, nullable=True)
    exportedFromTableName = Column('ExportedFromTableName', String, index=False, unique=False, nullable=True)
    formId = Column('FormId', Integer, index=False, unique=False, nullable=True)
    groupPermissionLevel = Column('GroupPermissionLevel', Integer, index=False, unique=False, nullable=True)
    lockedByUserName = Column('LockedByUserName', String, index=False, unique=False, nullable=True)
    name = Column('Name', String, index=False, unique=False, nullable=True)
    ownerPermissionLevel = Column('OwnerPermissionLevel', Integer, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    srcFilePath = Column('SrcFilePath', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    GroupID = Column('SpPrincipalID', Integer, ForeignKey('spPrincipal.SpPrincipalID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)
    WorkbenchtemplateID = Column('WorkbenchTemplateID', Integer, ForeignKey('workbenchTemplate.WorkbenchTemplateID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='Workbench.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    spPrincipal = relationship('SpPrincipal', foreign_keys='Workbench.SpPrincipalID', remote_side='SpPrincipal.SpPrincipalID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Workbench.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='Workbench.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('workbenches', uselist=True))
    workbenchTemplate = relationship('WorkbenchTemplate', foreign_keys='Workbench.WorkbenchTemplateID', remote_side='WorkbenchTemplate.WorkbenchTemplateID', backref=orm.backref('workbenches', uselist=True))

class WorkbenchDataItem(Base):
    tableid = 80
    _id = 'workbenchDataItemId'
    __tablename__ = 'workbenchdataitem'

    workbenchDataItemId = Column('Workbenchdataitemid', Integer, primary_key=True)
    cellData = Column('CellData', Text, index=False, unique=False, nullable=True)
    rowNumber = Column('RowNumber', Integer, index=False, unique=False, nullable=True)
    validationStatus = Column('ValidationStatus', Integer, index=False, unique=False, nullable=True)

    WorkbenchrowID = Column('WorkbenchRowID', Integer, ForeignKey('workbenchRow.WorkbenchRowID'), nullable=False, unique=False)
    WorkbenchtemplatemappingitemID = Column('WorkbenchTemplateMappingItemID', Integer, ForeignKey('workbenchTemplateMappingItem.WorkbenchTemplateMappingItemID'), nullable=False, unique=False)

    workbenchRow = relationship('WorkbenchRow', foreign_keys='WorkbenchDataItem.WorkbenchRowID', remote_side='WorkbenchRow.WorkbenchRowID', backref=orm.backref('workbenchDataItems', uselist=True))
    workbenchTemplateMappingItem = relationship('WorkbenchTemplateMappingItem', foreign_keys='WorkbenchDataItem.WorkbenchTemplateMappingItemID', remote_side='WorkbenchTemplateMappingItem.WorkbenchTemplateMappingItemID', backref=orm.backref('workbenchDataItems', uselist=True))

class WorkbenchRow(Base):
    tableid = 90
    _id = 'workbenchRowId'
    __tablename__ = 'workbenchrow'

    workbenchRowId = Column('Workbenchrowid', Integer, primary_key=True)
    bioGeomancerResults = Column('BioGeomancerResults', Text, index=False, unique=False, nullable=True)
    cardImageData = Column('CardImageData', Text, index=False, unique=False, nullable=True)
    cardImageFullPath = Column('CardImageFullPath', String, index=False, unique=False, nullable=True)
    errorEstimate = Column('ErrorEstimate', Numeric, index=False, unique=False, nullable=True)
    errorPolygon = Column('ErrorPolygon', Text, index=False, unique=False, nullable=True)
    lat1Text = Column('Lat1Text', String, index=False, unique=False, nullable=True)
    lat2Text = Column('Lat2Text', String, index=False, unique=False, nullable=True)
    long1Text = Column('Long1Text', String, index=False, unique=False, nullable=True)
    long2Text = Column('Long2Text', String, index=False, unique=False, nullable=True)
    recordId = Column('RecordID', Integer, index=False, unique=False, nullable=True)
    rowNumber = Column('RowNumber', Integer, index=True, unique=False, nullable=True)
    sgrStatus = Column('SGRStatus', Integer, index=False, unique=False, nullable=True)
    uploadStatus = Column('UploadStatus', Integer, index=False, unique=False, nullable=True)

    WorkbenchID = Column('WorkbenchID', Integer, ForeignKey('workbench.WorkbenchID'), nullable=False, unique=False)

    workbench = relationship('Workbench', foreign_keys='WorkbenchRow.WorkbenchID', remote_side='Workbench.WorkbenchID', backref=orm.backref('workbenchRows', uselist=True))

class WorkbenchRowExportedRelationship(Base):
    tableid = 126
    _id = 'workbenchRowExportedRelationshipId'
    __tablename__ = 'workbenchrowexportedrelationship'

    workbenchRowExportedRelationshipId = Column('Workbenchrowexportedrelationshipid', Integer, primary_key=True)
    recordId = Column('RecordID', Integer, index=False, unique=False, nullable=True)
    relationshipName = Column('RelationshipName', String, index=False, unique=False, nullable=True)
    sequence = Column('Sequence', Integer, index=False, unique=False, nullable=True)
    tableName = Column('TableName', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    WorkbenchrowID = Column('WorkbenchRowID', Integer, ForeignKey('workbenchRow.WorkbenchRowID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='WorkbenchRowExportedRelationship.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='WorkbenchRowExportedRelationship.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    workbenchRow = relationship('WorkbenchRow', foreign_keys='WorkbenchRowExportedRelationship.WorkbenchRowID', remote_side='WorkbenchRow.WorkbenchRowID', backref=orm.backref('workbenchRowExportedRelationships', uselist=True))

class WorkbenchRowImage(Base):
    tableid = 95
    _id = 'workbenchRowImageId'
    __tablename__ = 'workbenchrowimage'

    workbenchRowImageId = Column('Workbenchrowimageid', Integer, primary_key=True)
    attachToTableName = Column('AttachToTableName', String, index=False, unique=False, nullable=True)
    cardImageData = Column('CardImageData', Text, index=False, unique=False, nullable=True)
    cardImageFullPath = Column('CardImageFullPath', String, index=False, unique=False, nullable=True)
    imageOrder = Column('ImageOrder', Integer, index=False, unique=False, nullable=True)

    WorkbenchrowID = Column('WorkbenchRowID', Integer, ForeignKey('workbenchRow.WorkbenchRowID'), nullable=False, unique=False)

    workbenchRow = relationship('WorkbenchRow', foreign_keys='WorkbenchRowImage.WorkbenchRowID', remote_side='WorkbenchRow.WorkbenchRowID', backref=orm.backref('workbenchRowImages', uselist=True))

class WorkbenchTemplate(Base):
    tableid = 81
    _id = 'workbenchTemplateId'
    __tablename__ = 'workbenchtemplate'

    workbenchTemplateId = Column('Workbenchtemplateid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    srcFilePath = Column('SrcFilePath', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='WorkbenchTemplate.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='WorkbenchTemplate.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='WorkbenchTemplate.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('workbenchTemplates', uselist=True))

class WorkbenchTemplateMappingItem(Base):
    tableid = 82
    _id = 'workbenchTemplateMappingItemId'
    __tablename__ = 'workbenchtemplatemappingitem'

    workbenchTemplateMappingItemId = Column('Workbenchtemplatemappingitemid', Integer, primary_key=True)
    caption = Column('Caption', String, index=False, unique=False, nullable=True)
    carryForward = Column('CarryForward', mysql_bit_type, index=False, unique=False, nullable=True)
    dataFieldLength = Column('DataFieldLength', Integer, index=False, unique=False, nullable=True)
    fieldName = Column('FieldName', String, index=False, unique=False, nullable=True)
    fieldType = Column('FieldType', Integer, index=False, unique=False, nullable=True)
    importedColName = Column('ImportedColName', String, index=False, unique=False, nullable=True)
    isEditable = Column('IsEditable', mysql_bit_type, index=False, unique=False, nullable=True)
    isExportableToContent = Column('IsExportableToContent', mysql_bit_type, index=False, unique=False, nullable=True)
    isIncludedInTitle = Column('IsIncludedInTitle', mysql_bit_type, index=False, unique=False, nullable=True)
    isRequired = Column('IsRequired', mysql_bit_type, index=False, unique=False, nullable=True)
    metaData = Column('MetaData', String, index=False, unique=False, nullable=True)
    origImportColumnIndex = Column('DataColumnIndex', Integer, index=False, unique=False, nullable=True)
    srcTableId = Column('TableId', Integer, index=False, unique=False, nullable=True)
    tableName = Column('TableName', String, index=False, unique=False, nullable=True)
    timestampCreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampModified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)
    version = Column('Version', Integer, index=False, unique=False, nullable=True)
    viewOrder = Column('ViewOrder', Integer, index=False, unique=False, nullable=True)
    xCoord = Column('XCoord', Integer, index=False, unique=False, nullable=True)
    yCoord = Column('YCoord', Integer, index=False, unique=False, nullable=True)

    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    WorkbenchtemplateID = Column('WorkbenchTemplateID', Integer, ForeignKey('workbenchTemplate.WorkbenchTemplateID'), nullable=False, unique=False)

    createdByAgent = relationship('Agent', foreign_keys='WorkbenchTemplateMappingItem.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='WorkbenchTemplateMappingItem.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    workbenchTemplate = relationship('WorkbenchTemplate', foreign_keys='WorkbenchTemplateMappingItem.WorkbenchTemplateID', remote_side='WorkbenchTemplate.WorkbenchTemplateID', backref=orm.backref('workbenchTemplateMappingItems', uselist=True))

class Spuserexternalid(Base):
    tableid = 1000
    _id = 'spUserExternalIdId'
    __tablename__ = 'None'

    spUserExternalIdId = Column('Spuserexternalidid', Integer, primary_key=True)
    provider = Column('Provider', String, index=False, unique=False, nullable=False)
    providerid = Column('ProviderId', String, index=False, unique=False, nullable=False)
    enabled = Column('Enabled', mysql_bit_type, index=False, unique=False, nullable=False)
    idtoken = Column('IdToken', String, index=False, unique=False, nullable=True)

    SpecifyuserID = Column('SpUserId', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)

    spUser = relationship('SpecifyUser', foreign_keys='Spuserexternalid.SpUserId', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class Spattachmentdataset(Base):
    tableid = 1001
    _id = 'spAttachmentDataSetId'
    __tablename__ = 'spattachmentdataset'

    spAttachmentDataSetId = Column('Spattachmentdatasetid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    columns = Column('Columns', JSON, index=False, unique=False, nullable=False)
    data = Column('Data', JSON, index=False, unique=False, nullable=True)
    uploadplan = Column('UploadPlan', Text, index=False, unique=False, nullable=True)
    uploadresult = Column('UploadResult', JSON, index=False, unique=False, nullable=True)
    rowresults = Column('RowResults', String, index=False, unique=False, nullable=True)
    visualorder = Column('VisualOrder', JSON, index=False, unique=False, nullable=True)
    importedfilename = Column('ImportedFileName', Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampcreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampmodified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collection = relationship('Collection', foreign_keys='Spattachmentdataset.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='Spattachmentdataset.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Spattachmentdataset.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Spattachmentdataset.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class UniquenessRule(Base):
    tableid = 1002
    _id = 'uniquenessRuleId'
    __tablename__ = 'uniquenessrule'

    uniquenessRuleId = Column('Uniquenessruleid', Integer, primary_key=True)
    id = Column('UniquenessRuleID', Integer, index=True, unique=True, nullable=False)
    isdatabaseconstraint = Column('IsDatabaseConstraint', mysql_bit_type, index=False, unique=False, nullable=False)
    modelname = Column('ModelName', String, index=True, unique=False, nullable=False)

    DisciplineID = Column('DisciplineID', Integer, ForeignKey('discipline.UserGroupScopeId'), nullable=True, unique=False)

    discipline = relationship('Discipline', foreign_keys='UniquenessRule.DisciplineID', remote_side='Discipline.UserGroupScopeId', backref=orm.backref('None', uselist=True))

class UniquenessRuleField(Base):
    tableid = 1003
    _id = 'uniquenessRuleFieldId'
    __tablename__ = 'uniquenessrule_field'

    uniquenessRuleFieldId = Column('Uniquenessrulefieldid', Integer, primary_key=True)
    id = Column('UniquenessRule_FieldID', Integer, index=True, unique=True, nullable=False)
    fieldpath = Column('FieldPath', Text, index=True, unique=False, nullable=False)
    isscope = Column('IsScope', mysql_bit_type, index=False, unique=False, nullable=False)

    UniquenessruleID = Column('UniquenessRuleID', Integer, ForeignKey('uniquenessRule.UniquenessRuleID'), nullable=False, unique=False)

    uniquenessRule = relationship('UniquenessRule', foreign_keys='UniquenessRuleField.UniquenessRuleID', remote_side='UniquenessRule.UniquenessRuleID', backref=orm.backref('None', uselist=True))

class Message(Base):
    tableid = 1004
    _id = 'messageId'
    __tablename__ = 'notifications_message'

    messageId = Column('Messageid', Integer, primary_key=True)
    timestampcreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    content = Column('Content', Text, index=False, unique=False, nullable=True)
    read = Column('Read', mysql_bit_type, index=False, unique=False, nullable=False)

    UserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)

    specifyUser = relationship('SpecifyUser', foreign_keys='Message.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class Spmerging(Base):
    tableid = 1005
    _id = 'spMergingId'
    __tablename__ = 'spmerging'

    spMergingId = Column('Spmergingid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    taskid = Column('TaskID', String, index=False, unique=False, nullable=False)
    mergingstatus = Column('MergingStatus', String, index=False, unique=False, nullable=False)
    resonses = Column('Resonses', Text, index=False, unique=False, nullable=True)
    table = Column('Table', String, index=False, unique=False, nullable=False)
    newrecordid = Column('NewRecordID', Integer, index=False, unique=False, nullable=False)
    newrecordata = Column('NewRecordData', JSON, index=False, unique=False, nullable=True)
    oldrecordids = Column('OldRecordIDs', JSON, index=False, unique=False, nullable=True)
    timestampcreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampmodified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collection = relationship('Collection', foreign_keys='Spmerging.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='Spmerging.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Spmerging.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Spmerging.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

class UserPolicy(Base):
    tableid = 1006
    _id = 'userPolicyId'
    __tablename__ = 'spuserpolicy'

    userPolicyId = Column('Userpolicyid', Integer, primary_key=True)
    resource = Column('Resource', String, index=False, unique=False, nullable=False)
    action = Column('Action', String, index=False, unique=False, nullable=False)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)

    collection = relationship('Collection', foreign_keys='UserPolicy.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='UserPolicy.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))

class Role(Base):
    tableid = 1007
    _id = 'roleId'
    __tablename__ = 'sprole'

    roleId = Column('Roleid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    description = Column('Description', Text, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)

    collection = relationship('Collection', foreign_keys='Role.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))

class LibraryRole(Base):
    tableid = 1008
    _id = 'libraryRoleId'
    __tablename__ = 'splibraryrole'

    libraryRoleId = Column('Libraryroleid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    descr1iption = Column('Description', Text, index=False, unique=False, nullable=True)



class UserRole(Base):
    tableid = 1009
    _id = 'userRoleId'
    __tablename__ = 'spuserrole'

    userRoleId = Column('Userroleid', Integer, primary_key=True)

    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)
    RoleID = Column('RoleID', Integer, ForeignKey('role.RoleID'), nullable=False, unique=False)

    specifyUser = relationship('SpecifyUser', foreign_keys='UserRole.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    role = relationship('Role', foreign_keys='UserRole.RoleID', remote_side='Role.RoleID', backref=orm.backref('None', uselist=True))

class RolePolicy(Base):
    tableid = 1010
    _id = 'rolePolicyId'
    __tablename__ = 'sprolepolicy'

    rolePolicyId = Column('Rolepolicyid', Integer, primary_key=True)
    resource = Column('Resource', String, index=False, unique=False, nullable=False)
    action = Column('Action', String, index=False, unique=False, nullable=False)

    RoleID = Column('RoleID', Integer, ForeignKey('role.RoleID'), nullable=False, unique=False)

    role = relationship('Role', foreign_keys='RolePolicy.RoleID', remote_side='Role.RoleID', backref=orm.backref('None', uselist=True))

class LibraryRolePolicy(Base):
    tableid = 1011
    _id = 'libraryRolePolicyId'
    __tablename__ = 'splibraryrolepolicy'

    libraryRolePolicyId = Column('Libraryrolepolicyid', Integer, primary_key=True)
    resource = Column('Resource', String, index=False, unique=False, nullable=False)
    action = Column('Action', String, index=False, unique=False, nullable=False)

    LibraryroleID = Column('LibraryRoleID', Integer, ForeignKey('libraryRole.LibraryRoleID'), nullable=False, unique=False)

    libraryRole = relationship('LibraryRole', foreign_keys='LibraryRolePolicy.LibraryRoleID', remote_side='LibraryRole.LibraryRoleID', backref=orm.backref('None', uselist=True))

class Spdataset(Base):
    tableid = 1012
    _id = 'spDataSetId'
    __tablename__ = 'spdataset'

    spDataSetId = Column('Spdatasetid', Integer, primary_key=True)
    name = Column('Name', String, index=False, unique=False, nullable=False)
    columns = Column('Columns', JSON, index=False, unique=False, nullable=False)
    data = Column('Data', JSON, index=False, unique=False, nullable=True)
    uploadplan = Column('UploadPlan', Text, index=False, unique=False, nullable=True)
    uploadresult = Column('UploadResult', JSON, index=False, unique=False, nullable=True)
    rowresults = Column('RowResults', String, index=False, unique=False, nullable=True)
    visualorder = Column('VisualOrder', JSON, index=False, unique=False, nullable=True)
    importedfilename = Column('ImportedFileName', Text, index=False, unique=False, nullable=True)
    remarks = Column('Remarks', Text, index=False, unique=False, nullable=True)
    timestampcreated = Column('TimestampCreated', DateTime, index=False, unique=False, nullable=False)
    timestampmodified = Column('TimestampModified', DateTime, index=False, unique=False, nullable=True)

    CollectionID = Column('CollectionID', Integer, ForeignKey('collection.UserGroupScopeId'), nullable=True, unique=False)
    SpecifyuserID = Column('SpecifyUserID', Integer, ForeignKey('specifyUser.SpecifyUserID'), nullable=False, unique=False)
    CreatedbyagentID = Column('CreatedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)
    ModifiedbyagentID = Column('ModifiedByAgentID', Integer, ForeignKey('agent.AgentID'), nullable=True, unique=False)

    collection = relationship('Collection', foreign_keys='Spdataset.CollectionID', remote_side='Collection.UserGroupScopeId', backref=orm.backref('None', uselist=True))
    specifyUser = relationship('SpecifyUser', foreign_keys='Spdataset.SpecifyUserID', remote_side='SpecifyUser.SpecifyUserID', backref=orm.backref('None', uselist=True))
    createdByAgent = relationship('Agent', foreign_keys='Spdataset.CreatedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))
    modifiedByAgent = relationship('Agent', foreign_keys='Spdataset.ModifiedByAgentID', remote_side='Agent.AgentID', backref=orm.backref('None', uselist=True))

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
