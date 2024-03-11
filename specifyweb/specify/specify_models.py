from functools import partialmethod
from django.db import models
#from specifyweb.specify.test_load_datamodel import model_extras
from specifyweb.businessrules.exceptions import AbortSave
from . import model_extras
import logging

logger = logging.getLogger(__name__)

def protect_with_blockers(collector, field, sub_objs, using):
    if hasattr(collector, 'delete_blockers'):
        collector.delete_blockers.append((field, sub_objs))
    else:
        return models.PROTECT(collector, field, sub_objs, using)

def custom_save(self, *args, **kwargs):
    try:
        # Custom save logic here, if necessary
        super(self.__class__, self).save(*args, **kwargs)
    except AbortSave as e:
        # Handle AbortSave exception as needed
        logger.error("Save operation aborted: %s", e)
        return
class Accession(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='accessionid')

    # Fields
    accessioncondition = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='AccessionCondition', db_index='accessioncondition')
    accessionnumber = models.CharField(blank=False, max_length=60, null=False, unique=False, db_column='AccessionNumber', db_index='accessionnumber')
    dateaccessioned = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateAccessioned', db_index='dateaccessioned')
    dateacknowledged = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateAcknowledged', db_index='dateacknowledged')
    datereceived = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateReceived', db_index='datereceived')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    status = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Status', db_index='status')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    totalvalue = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='TotalValue', db_index='totalvalue')
    type = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Type', db_index='type')
    verbatimdate = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='VerbatimDate', db_index='verbatimdate')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    addressOfRecord = models.ForeignKey('AddressOfRecord', db_column='AddressOfRecordID', related_name='accessions', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    repositoryAgreement = models.ForeignKey('RepositoryAgreement', db_column='RepositoryAgreementID', related_name='accessions', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'accession'
        ordering = ()
        indexes = [
            models.Index(fields=['AccessionNumber'], name='AccessionNumberIDX'),
            models.Index(fields=['DateAccessioned'], name='AccessionDateIDX')
        ]

    save = partialmethod(custom_save)

class Accessionagent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='accessionagentid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    role = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='Role', db_index='role')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    accession = models.ForeignKey('Accession', db_column='AccessionID', related_name='accessionagents', null=True, on_delete=models.CASCADE)
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    repositoryAgreement = models.ForeignKey('RepositoryAgreement', db_column='RepositoryAgreementID', related_name='repositoryagreementagents', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'accessionagent'
        ordering = ()

    save = partialmethod(custom_save)

class Accessionattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='accessionattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    accession = models.ForeignKey('Accession', db_column='AccessionID', related_name='accessionattachments', null=False, on_delete=models.CASCADE)
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='accessionattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'accessionattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Accessionauthorization(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='accessionauthorizationid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    accession = models.ForeignKey('Accession', db_column='AccessionID', related_name='accessionauthorizations', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    permit = models.ForeignKey('Permit', db_column='PermitID', related_name='accessionauthorizations', null=False, on_delete=protect_with_blockers)
    repositoryAgreement = models.ForeignKey('RepositoryAgreement', db_column='RepositoryAgreementID', related_name='repositoryagreementauthorizations', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'accessionauthorization'
        ordering = ()

    save = partialmethod(custom_save)

class Accessioncitation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='accessioncitationid')

    # Fields
    figurenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FigureNumber', db_index='figurenumber')
    isfigured = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFigured', db_index='isfigured')
    pagenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PageNumber', db_index='pagenumber')
    platenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PlateNumber', db_index='platenumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    accession = models.ForeignKey('Accession', db_column='AccessionID', related_name='accessioncitations', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='+', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'accessioncitation'
        ordering = ()

    save = partialmethod(custom_save)

class Address(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='addressid')

    # Fields
    address = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Address', db_index='address')
    address2 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Address2', db_index='address2')
    address3 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Address3', db_index='address3')
    address4 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Address4', db_index='address4')
    address5 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Address5', db_index='address5')
    city = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='City', db_index='city')
    country = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Country', db_index='country')
    enddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EndDate', db_index='enddate')
    fax = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Fax', db_index='fax')
    iscurrent = models.BooleanField(blank=True, null=True, unique=False, db_column='IsCurrent', db_index='iscurrent')
    isprimary = models.BooleanField(blank=True, null=True, unique=False, db_column='IsPrimary', db_index='isprimary')
    isshipping = models.BooleanField(blank=True, null=True, unique=False, db_column='IsShipping', db_index='isshipping')
    ordinal = models.IntegerField(blank=True, null=True, unique=False, db_column='Ordinal', db_index='ordinal')
    phone1 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Phone1', db_index='phone1')
    phone2 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Phone2', db_index='phone2')
    positionheld = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PositionHeld', db_index='positionheld')
    postalcode = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PostalCode', db_index='postalcode')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    roomorbuilding = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='RoomOrBuilding', db_index='roomorbuilding')
    startdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='StartDate', db_index='startdate')
    state = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='State', db_index='state')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    typeofaddr = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='TypeOfAddr', db_index='typeofaddr')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='addresses', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'address'
        ordering = ()

    save = partialmethod(custom_save)

class Addressofrecord(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='addressofrecordid')

    # Fields
    address = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Address', db_index='address')
    address2 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Address2', db_index='address2')
    city = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='City', db_index='city')
    country = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Country', db_index='country')
    postalcode = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PostalCode', db_index='postalcode')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    state = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='State', db_index='state')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'addressofrecord'
        ordering = ()

    save = partialmethod(custom_save)

class Agent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='agentid')

    # Fields
    abbreviation = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Abbreviation', db_index='abbreviation')
    agenttype = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='AgentType', db_index='agenttype')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    date2precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date2Precision', db_index='date2precision')
    dateofbirth = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateOfBirth', db_index='dateofbirth')
    dateofbirthprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='DateOfBirthPrecision', db_index='dateofbirthprecision')
    dateofdeath = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateOfDeath', db_index='dateofdeath')
    dateofdeathprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='DateOfDeathPrecision', db_index='dateofdeathprecision')
    datetype = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='DateType', db_index='datetype')
    email = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Email', db_index='email')
    firstname = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FirstName', db_index='firstname')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    initials = models.CharField(blank=True, max_length=8, null=True, unique=False, db_column='Initials', db_index='initials')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    interests = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Interests', db_index='interests')
    jobtitle = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='JobTitle', db_index='jobtitle')
    lastname = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='LastName', db_index='lastname')
    middleinitial = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='MiddleInitial', db_index='middleinitial')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    suffix = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Suffix', db_index='suffix')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Title', db_index='title')
    url = models.CharField(blank=True, max_length=1024, null=True, unique=False, db_column='URL', db_index='url')
    verbatimdate1 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='VerbatimDate1', db_index='verbatimdate1')
    verbatimdate2 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='VerbatimDate2', db_index='verbatimdate2')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collContentContact = models.ForeignKey('Collection', db_column='CollectionCCID', related_name='contentcontacts', null=True, on_delete=protect_with_blockers)
    collTechContact = models.ForeignKey('Collection', db_column='CollectionTCID', related_name='technicalcontacts', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='members', null=True, on_delete=protect_with_blockers)
    instContentContact = models.ForeignKey('Institution', db_column='InstitutionCCID', related_name='contentcontacts', null=True, on_delete=protect_with_blockers)
    instTechContact = models.ForeignKey('Institution', db_column='InstitutionTCID', related_name='technicalcontacts', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    organization = models.ForeignKey('Agent', db_column='ParentOrganizationID', related_name='orgmembers', null=True, on_delete=protect_with_blockers)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='agents', null=True, on_delete=models.SET_NULL)

    class Meta:
        db_table = 'agent'
        ordering = ()
        indexes = [
            models.Index(fields=['LastName'], name='AgentLastNameIDX'),
            models.Index(fields=['FirstName'], name='AgentFirstNameIDX'),
            models.Index(fields=['GUID'], name='AgentGuidIDX'),
            models.Index(fields=['AgentType'], name='AgentTypeIDX'),
            models.Index(fields=['Abbreviation'], name='AbbreviationIDX')
        ]

    save = partialmethod(custom_save)

class Agentattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='agentattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='agentattachments', null=False, on_delete=models.CASCADE)
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='agentattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'agentattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Agentgeography(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='agentgeographyid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    role = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Role', db_index='role')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='agentgeographies', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    geography = models.ForeignKey('Geography', db_column='GeographyID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'agentgeography'
        ordering = ()

    save = partialmethod(custom_save)

class Agentidentifier(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='agentidentifierid')

    # Fields
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    date2precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date2Precision', db_index='date2precision')
    identifier = models.CharField(blank=False, max_length=2048, null=False, unique=False, db_column='Identifier', db_index='identifier')
    identifiertype = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='IdentifierType', db_index='identifiertype')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='identifiers', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'agentidentifier'
        ordering = ()

    save = partialmethod(custom_save)

class Agentspecialty(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='agentspecialtyid')

    # Fields
    ordernumber = models.IntegerField(blank=False, null=False, unique=False, db_column='OrderNumber', db_index='ordernumber')
    specialtyname = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='SpecialtyName', db_index='specialtyname')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='agentspecialties', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'agentspecialty'
        ordering = ()

    save = partialmethod(custom_save)

class Agentvariant(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='agentvariantid')

    # Fields
    country = models.CharField(blank=True, max_length=2, null=True, unique=False, db_column='Country', db_index='country')
    language = models.CharField(blank=True, max_length=2, null=True, unique=False, db_column='Language', db_index='language')
    name = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Name', db_index='name')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    vartype = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='VarType', db_index='vartype')
    variant = models.CharField(blank=True, max_length=2, null=True, unique=False, db_column='Variant', db_index='variant')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='variants', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'agentvariant'
        ordering = ()

    save = partialmethod(custom_save)

class Appraisal(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='appraisalid')

    # Fields
    appraisaldate = models.DateTimeField(blank=False, null=False, unique=False, db_column='AppraisalDate', db_index='appraisaldate')
    appraisalnumber = models.CharField(blank=False, max_length=64, null=False, unique=True, db_column='AppraisalNumber', db_index='appraisalnumber')
    appraisalvalue = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='AppraisalValue', db_index='appraisalvalue')
    monetaryunittype = models.CharField(blank=True, max_length=8, null=True, unique=False, db_column='MonetaryUnitType', db_index='monetaryunittype')
    notes = models.TextField(blank=True, null=True, unique=False, db_column='Notes', db_index='notes')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    accession = models.ForeignKey('Accession', db_column='AccessionID', related_name='appraisals', null=True, on_delete=protect_with_blockers)
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'appraisal'
        ordering = ()
        indexes = [
            models.Index(fields=['AppraisalNumber'], name='AppraisalNumberIDX'),
            models.Index(fields=['AppraisalDate'], name='AppraisalDateIDX')
        ]

    save = partialmethod(custom_save)

class Attachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='attachmentid')

    # Fields
    attachmentlocation = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='AttachmentLocation', db_index='attachmentlocation')
    attachmentstorageconfig = models.TextField(blank=True, null=True, unique=False, db_column='AttachmentStorageConfig', db_index='attachmentstorageconfig')
    capturedevice = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='CaptureDevice', db_index='capturedevice')
    copyrightdate = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='CopyrightDate', db_index='copyrightdate')
    copyrightholder = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='CopyrightHolder', db_index='copyrightholder')
    credit = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Credit', db_index='credit')
    dateimaged = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='DateImaged', db_index='dateimaged')
    filecreateddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='FileCreatedDate', db_index='filecreateddate')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    ispublic = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsPublic', db_index='ispublic')
    license = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='License', db_index='license')
    licenselogourl = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='LicenseLogoUrl', db_index='licenselogourl')
    metadatatext = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='MetadataText', db_index='metadatatext')
    mimetype = models.CharField(blank=True, max_length=1024, null=True, unique=False, db_column='MimeType', db_index='mimetype')
    origfilename = models.TextField(blank=False, null=False, unique=False, db_column='OrigFilename', db_index='origfilename')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    scopeid = models.IntegerField(blank=True, null=True, unique=False, db_column='ScopeID', db_index='scopeid')
    scopetype = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='ScopeType', db_index='scopetype')
    subjectorientation = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SubjectOrientation', db_index='subjectorientation')
    subtype = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Subtype', db_index='subtype')
    tableid = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='TableID', db_index='tableid')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Title', db_index='title')
    type = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    visibility = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Visibility', db_index='visibility')

    # Relationships: Many-to-One
    attachmentImageAttribute = models.ForeignKey('AttachmentImageAttribute', db_column='AttachmentImageAttributeID', related_name='attachments', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    creator = models.ForeignKey('Agent', db_column='CreatorID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    visibilitySetBy = models.ForeignKey('SpecifyUser', db_column='VisibilitySetByID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'attachment'
        ordering = ()
        indexes = [
            models.Index(fields=['Title'], name='TitleIDX'),
            models.Index(fields=['DateImaged'], name='DateImagedIDX'),
            models.Index(fields=['ScopeID'], name='AttchScopeIDIDX'),
            models.Index(fields=['ScopeType'], name='AttchScopeTypeIDX'),
            models.Index(fields=['GUID'], name='AttchmentGuidIDX')
        ]

    save = partialmethod(custom_save)

class Attachmentimageattribute(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='attachmentimageattributeid')

    # Fields
    creativecommons = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='CreativeCommons', db_index='creativecommons')
    height = models.IntegerField(blank=True, null=True, unique=False, db_column='Height', db_index='height')
    imagetype = models.CharField(blank=True, max_length=80, null=True, unique=False, db_column='ImageType', db_index='imagetype')
    magnification = models.FloatField(blank=True, null=True, unique=False, db_column='Magnification', db_index='magnification')
    mbimageid = models.IntegerField(blank=True, null=True, unique=False, db_column='MBImageID', db_index='mbimageid')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    resolution = models.FloatField(blank=True, null=True, unique=False, db_column='Resolution', db_index='resolution')
    text1 = models.CharField(blank=True, max_length=200, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=200, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestamplastsend = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampLastSend', db_index='timestamplastsend')
    timestamplastupdatecheck = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampLastUpdateCheck', db_index='timestamplastupdatecheck')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    viewdescription = models.CharField(blank=True, max_length=80, null=True, unique=False, db_column='ViewDescription', db_index='viewdescription')
    width = models.IntegerField(blank=True, null=True, unique=False, db_column='Width', db_index='width')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    morphBankView = models.ForeignKey('MorphBankView', db_column='MorphBankViewID', related_name='attachmentimageattributes', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'attachmentimageattribute'
        ordering = ()

    save = partialmethod(custom_save)

class Attachmentmetadata(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='attachmentmetadataid')

    # Fields
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    value = models.CharField(blank=False, max_length=128, null=False, unique=False, db_column='Value', db_index='value')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='metadata', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'attachmentmetadata'
        ordering = ()

    save = partialmethod(custom_save)

class Attachmenttag(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='attachmenttagid')

    # Fields
    tag = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Tag', db_index='tag')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='tags', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'attachmenttag'
        ordering = ()

    save = partialmethod(custom_save)

class Attributedef(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='attributedefid')

    # Fields
    datatype = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='DataType', db_index='datatype')
    fieldname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FieldName', db_index='fieldname')
    tabletype = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='TableType', db_index='tabletype')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='attributedefs', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    prepType = models.ForeignKey('PrepType', db_column='PrepTypeID', related_name='attributedefs', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'attributedef'
        ordering = ()

    save = partialmethod(custom_save)

class Author(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='authorid')

    # Fields
    ordernumber = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='OrderNumber', db_index='ordernumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='authors', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'author'
        ordering = ('ordernumber',)

    save = partialmethod(custom_save)

class Autonumberingscheme(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='autonumberingschemeid')

    # Fields
    formatname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='FormatName', db_index='formatname')
    isnumericonly = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsNumericOnly', db_index='isnumericonly')
    schemeclassname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SchemeClassName', db_index='schemeclassname')
    schemename = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SchemeName', db_index='schemename')
    tablenumber = models.IntegerField(blank=False, null=False, unique=False, db_column='TableNumber', db_index='tablenumber')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'autonumberingscheme'
        ordering = ()
        indexes = [
            models.Index(fields=['SchemeName'], name='SchemeNameIDX')
        ]

    save = partialmethod(custom_save)

class Borrow(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='borrowid')

    # Fields
    borrowdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='BorrowDate', db_index='borrowdate')
    borrowdateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='BorrowDatePrecision', db_index='borrowdateprecision')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    currentduedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='CurrentDueDate', db_index='currentduedate')
    dateclosed = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateClosed', db_index='dateclosed')
    invoicenumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='InvoiceNumber', db_index='invoicenumber')
    isclosed = models.BooleanField(blank=True, null=True, unique=False, db_column='IsClosed', db_index='isclosed')
    isfinancialresponsibility = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFinancialResponsibility', db_index='isfinancialresponsibility')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    numberofitemsborrowed = models.IntegerField(blank=True, null=True, unique=False, db_column='NumberOfItemsBorrowed', db_index='numberofitemsborrowed')
    originalduedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='OriginalDueDate', db_index='originalduedate')
    receiveddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ReceivedDate', db_index='receiveddate')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    status = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Status', db_index='status')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    addressOfRecord = models.ForeignKey('AddressOfRecord', db_column='AddressOfRecordID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'borrow'
        ordering = ()
        indexes = [
            models.Index(fields=['InvoiceNumber'], name='BorInvoiceNumberIDX'),
            models.Index(fields=['ReceivedDate'], name='BorReceivedDateIDX'),
            models.Index(fields=['CollectionMemberID'], name='BorColMemIDX')
        ]

    save = partialmethod(custom_save)

class Borrowagent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='borrowagentid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    role = models.CharField(blank=False, max_length=32, null=False, unique=False, db_column='Role', db_index='role')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    borrow = models.ForeignKey('Borrow', db_column='BorrowID', related_name='borrowagents', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'borrowagent'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='BorColMemIDX2')
        ]

    save = partialmethod(custom_save)

class Borrowattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='borrowattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='borrowattachments', null=False, on_delete=protect_with_blockers)
    borrow = models.ForeignKey('Borrow', db_column='BorrowID', related_name='borrowattachments', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'borrowattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Borrowmaterial(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='borrowmaterialid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    description = models.CharField(blank=True, max_length=250, null=True, unique=False, db_column='Description', db_index='description')
    incomments = models.TextField(blank=True, null=True, unique=False, db_column='InComments', db_index='incomments')
    materialnumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='MaterialNumber', db_index='materialnumber')
    outcomments = models.TextField(blank=True, null=True, unique=False, db_column='OutComments', db_index='outcomments')
    quantity = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Quantity', db_index='quantity')
    quantityresolved = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='QuantityResolved', db_index='quantityresolved')
    quantityreturned = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='QuantityReturned', db_index='quantityreturned')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    borrow = models.ForeignKey('Borrow', db_column='BorrowID', related_name='borrowmaterials', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'borrowmaterial'
        ordering = ()
        indexes = [
            models.Index(fields=['MaterialNumber'], name='BorMaterialNumberIDX'),
            models.Index(fields=['CollectionMemberID'], name='BorMaterialColMemIDX'),
            models.Index(fields=['Description'], name='DescriptionIDX')
        ]

    save = partialmethod(custom_save)

class Borrowreturnmaterial(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='borrowreturnmaterialid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    quantity = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Quantity', db_index='quantity')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    returneddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ReturnedDate', db_index='returneddate')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='ReturnedByID', related_name='+', null=True, on_delete=protect_with_blockers)
    borrowMaterial = models.ForeignKey('BorrowMaterial', db_column='BorrowMaterialID', related_name='borrowreturnmaterials', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'borrowreturnmaterial'
        ordering = ()
        indexes = [
            models.Index(fields=['ReturnedDate'], name='BorrowReturnedDateIDX'),
            models.Index(fields=['CollectionMemberID'], name='BorrowReturnedColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectingevent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectingeventid')

    # Fields
    enddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EndDate', db_index='enddate')
    enddateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='EndDatePrecision', db_index='enddateprecision')
    enddateverbatim = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='EndDateVerbatim', db_index='enddateverbatim')
    endtime = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='EndTime', db_index='endtime')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    method = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Method', db_index='method')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    reservedinteger3 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger3', db_index='reservedinteger3')
    reservedinteger4 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger4', db_index='reservedinteger4')
    reservedtext1 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ReservedText1', db_index='reservedtext1')
    reservedtext2 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ReservedText2', db_index='reservedtext2')
    sgrstatus = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='SGRStatus', db_index='sgrstatus')
    startdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='StartDate', db_index='startdate')
    startdateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='StartDatePrecision', db_index='startdateprecision')
    startdateverbatim = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='StartDateVerbatim', db_index='startdateverbatim')
    starttime = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='StartTime', db_index='starttime')
    stationfieldnumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='StationFieldNumber', db_index='stationfieldnumber')
    stationfieldnumbermodifier1 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='StationFieldNumberModifier1', db_index='stationfieldnumbermodifier1')
    stationfieldnumbermodifier2 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='StationFieldNumberModifier2', db_index='stationfieldnumbermodifier2')
    stationfieldnumbermodifier3 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='StationFieldNumberModifier3', db_index='stationfieldnumbermodifier3')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.TextField(blank=True, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.TextField(blank=True, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.TextField(blank=True, null=True, unique=False, db_column='Text8', db_index='text8')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    uniqueidentifier = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='UniqueIdentifier', db_index='uniqueidentifier')
    verbatimdate = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='VerbatimDate', db_index='verbatimdate')
    verbatimlocality = models.TextField(blank=True, null=True, unique=False, db_column='VerbatimLocality', db_index='verbatimlocality')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    visibility = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Visibility', db_index='visibility')

    # Relationships: Many-to-One
    collectingEventAttribute = models.ForeignKey('CollectingEventAttribute', db_column='CollectingEventAttributeID', related_name='collectingevents', null=True, on_delete=protect_with_blockers)
    collectingTrip = models.ForeignKey('CollectingTrip', db_column='CollectingTripID', related_name='collectingevents', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    locality = models.ForeignKey('Locality', db_column='LocalityID', related_name='collectingevents', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    paleoContext = models.ForeignKey('PaleoContext', db_column='PaleoContextID', related_name='collectingevents', null=True, on_delete=protect_with_blockers)
    visibilitySetBy = models.ForeignKey('SpecifyUser', db_column='VisibilitySetByID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingevent'
        ordering = ()
        indexes = [
            models.Index(fields=['StationFieldNumber'], name='CEStationFieldNumberIDX'),
            models.Index(fields=['StartDate'], name='CEStartDateIDX'),
            models.Index(fields=['EndDate'], name='CEEndDateIDX'),
            models.Index(fields=['UniqueIdentifier'], name='CEUniqueIdentifierIDX'),
            models.Index(fields=['GUID'], name='CEGuidIDX')
        ]

    save = partialmethod(custom_save)

class Collectingeventattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectingeventattachmentid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='collectingeventattachments', null=False, on_delete=protect_with_blockers)
    collectingEvent = models.ForeignKey('CollectingEvent', db_column='CollectingEventID', related_name='collectingeventattachments', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingeventattachment'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='CEAColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectingeventattr(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='attrid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    dblvalue = models.FloatField(blank=True, null=True, unique=False, db_column='DoubleValue', db_index='doublevalue')
    strvalue = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='StrValue', db_index='strvalue')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collectingEvent = models.ForeignKey('CollectingEvent', db_column='CollectingEventID', related_name='collectingeventattrs', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('AttributeDef', db_column='AttributeDefID', related_name='collectingeventattrs', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingeventattr'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='COLEVATColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectingeventattribute(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectingeventattributeid')

    # Fields
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer10 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer10', db_index='integer10')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    integer6 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer6', db_index='integer6')
    integer7 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer7', db_index='integer7')
    integer8 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer8', db_index='integer8')
    integer9 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer9', db_index='integer9')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number10 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number10', db_index='number10')
    number11 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number11', db_index='number11')
    number12 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number12', db_index='number12')
    number13 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number13', db_index='number13')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    number6 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number6', db_index='number6')
    number7 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number7', db_index='number7')
    number8 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number8', db_index='number8')
    number9 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number9', db_index='number9')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.TextField(blank=True, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.TextField(blank=True, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.TextField(blank=True, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.TextField(blank=True, null=True, unique=False, db_column='Text13', db_index='text13')
    text14 = models.TextField(blank=True, null=True, unique=False, db_column='Text14', db_index='text14')
    text15 = models.TextField(blank=True, null=True, unique=False, db_column='Text15', db_index='text15')
    text16 = models.TextField(blank=True, null=True, unique=False, db_column='Text16', db_index='text16')
    text17 = models.TextField(blank=True, null=True, unique=False, db_column='Text17', db_index='text17')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.TextField(blank=True, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.TextField(blank=True, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.TextField(blank=True, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.TextField(blank=True, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    hostTaxon = models.ForeignKey('Taxon', db_column='HostTaxonID', related_name='collectingeventattributes', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingeventattribute'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='COLEVATSDispIDX')
        ]

    save = partialmethod(custom_save)

class Collectingeventauthorization(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectingeventauthorizationid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collectingEvent = models.ForeignKey('CollectingEvent', db_column='CollectingEventID', related_name='collectingeventauthorizations', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    permit = models.ForeignKey('Permit', db_column='PermitID', related_name='collectingeventauthorizations', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingeventauthorization'
        ordering = ()

    save = partialmethod(custom_save)

class Collectingtrip(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectingtripid')

    # Fields
    collectingtripname = models.CharField(blank=True, max_length=400, null=True, unique=False, db_column='CollectingTripName', db_index='collectingtripname')
    cruise = models.CharField(blank=True, max_length=250, null=True, unique=False, db_column='Cruise', db_index='cruise')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    date2precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date2Precision', db_index='date2precision')
    enddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EndDate', db_index='enddate')
    enddateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='EndDatePrecision', db_index='enddateprecision')
    enddateverbatim = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='EndDateVerbatim', db_index='enddateverbatim')
    endtime = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='EndTime', db_index='endtime')
    expedition = models.CharField(blank=True, max_length=250, null=True, unique=False, db_column='Expedition', db_index='expedition')
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index='number2')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    sponsor = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Sponsor', db_index='sponsor')
    startdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='StartDate', db_index='startdate')
    startdateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='StartDatePrecision', db_index='startdateprecision')
    startdateverbatim = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='StartDateVerbatim', db_index='startdateverbatim')
    starttime = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='StartTime', db_index='starttime')
    text1 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.TextField(blank=True, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.TextField(blank=True, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.TextField(blank=True, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.TextField(blank=True, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    vessel = models.CharField(blank=True, max_length=250, null=True, unique=False, db_column='Vessel', db_index='vessel')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    agent1 = models.ForeignKey('Agent', db_column='Agent1ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent2 = models.ForeignKey('Agent', db_column='Agent2ID', related_name='+', null=True, on_delete=protect_with_blockers)
    collectingTripAttribute = models.ForeignKey('CollectingTripAttribute', db_column='CollectingTripAttributeID', related_name='collectingtrips', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingtrip'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectingTripName'], name='COLTRPNameIDX'),
            models.Index(fields=['StartDate'], name='COLTRPStartDateIDX')
        ]

    save = partialmethod(custom_save)

class Collectingtripattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectingtripattachmentid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='collectingtripattachments', null=False, on_delete=protect_with_blockers)
    collectingTrip = models.ForeignKey('CollectingTrip', db_column='CollectingTripID', related_name='collectingtripattachments', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingtripattachment'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='CTAColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectingtripattribute(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectingtripattributeid')

    # Fields
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer10 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer10', db_index='integer10')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    integer6 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer6', db_index='integer6')
    integer7 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer7', db_index='integer7')
    integer8 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer8', db_index='integer8')
    integer9 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer9', db_index='integer9')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number10 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number10', db_index='number10')
    number11 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number11', db_index='number11')
    number12 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number12', db_index='number12')
    number13 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number13', db_index='number13')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    number6 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number6', db_index='number6')
    number7 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number7', db_index='number7')
    number8 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number8', db_index='number8')
    number9 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number9', db_index='number9')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text13', db_index='text13')
    text14 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text14', db_index='text14')
    text15 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text15', db_index='text15')
    text16 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text16', db_index='text16')
    text17 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text17', db_index='text17')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingtripattribute'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='COLTRPSDispIDX')
        ]

    save = partialmethod(custom_save)

class Collectingtripauthorization(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectingtripauthorizationid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collectingTrip = models.ForeignKey('CollectingTrip', db_column='CollectingTripID', related_name='collectingtripauthorizations', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    permit = models.ForeignKey('Permit', db_column='PermitID', related_name='collectingtripauthorizations', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectingtripauthorization'
        ordering = ()

    save = partialmethod(custom_save)

class Collection(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='usergroupscopeid')

    # Fields
    catalognumformatname = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='CatalogFormatNumName', db_index='catalogformatnumname')
    code = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Code', db_index='code')
    collectionname = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='CollectionName', db_index='collectionname')
    collectiontype = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='CollectionType', db_index='collectiontype')
    dbcontentversion = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='DbContentVersion', db_index='dbcontentversion')
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    developmentstatus = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='DevelopmentStatus', db_index='developmentstatus')
    estimatedsize = models.IntegerField(blank=True, null=True, unique=False, db_column='EstimatedSize', db_index='estimatedsize')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    institutiontype = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='InstitutionType', db_index='institutiontype')
    isembeddedcollectingevent = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsEmbeddedCollectingEvent', db_index='isembeddedcollectingevent')
    isanumber = models.CharField(blank=True, max_length=24, null=True, unique=False, db_column='IsaNumber', db_index='isanumber')
    kingdomcoverage = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='KingdomCoverage', db_index='kingdomcoverage')
    preservationmethodtype = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PreservationMethodType', db_index='preservationmethodtype')
    primaryfocus = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PrimaryFocus', db_index='primaryfocus')
    primarypurpose = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PrimaryPurpose', db_index='primarypurpose')
    regnumber = models.CharField(blank=True, max_length=24, null=True, unique=False, db_column='RegNumber', db_index='regnumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    scope = models.TextField(blank=True, null=True, unique=False, db_column='Scope', db_index='scope')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    webportaluri = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='WebPortalURI', db_index='webportaluri')
    websiteuri = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='WebSiteURI', db_index='websiteuri')

    # Relationships: Many-to-One
    adminContact = models.ForeignKey('Agent', db_column='AdminContactID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='collections', null=False, on_delete=protect_with_blockers)
    institutionNetwork = models.ForeignKey('Institution', db_column='InstitutionNetworkID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collection'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionName'], name='CollectionNameIDX'),
            models.Index(fields=['GUID'], name='CollectionGuidIDX')
        ]

    save = partialmethod(custom_save)

class Collectionobject(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionobjectid')

    # Fields
    altcatalognumber = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='AltCatalogNumber', db_index='altcatalognumber')
    availability = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Availability', db_index='availability')
    catalognumber = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='CatalogNumber', db_index='catalognumber')
    catalogeddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='CatalogedDate', db_index='catalogeddate')
    catalogeddateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='CatalogedDatePrecision', db_index='catalogeddateprecision')
    catalogeddateverbatim = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='CatalogedDateVerbatim', db_index='catalogeddateverbatim')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    countamt = models.IntegerField(blank=True, null=True, unique=False, db_column='CountAmt', db_index='countamt')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    deaccessioned = models.BooleanField(blank=True, null=True, unique=False, db_column='Deaccessioned', db_index='deaccessioned')
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    embargoreason = models.TextField(blank=True, null=True, unique=False, db_column='EmbargoReason', db_index='embargoreason')
    embargoreleasedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EmbargoReleaseDate', db_index='embargoreleasedate')
    embargoreleasedateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='EmbargoReleaseDatePrecision', db_index='embargoreleasedateprecision')
    embargostartdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EmbargoStartDate', db_index='embargostartdate')
    embargostartdateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='EmbargoStartDatePrecision', db_index='embargostartdateprecision')
    fieldnumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FieldNumber', db_index='fieldnumber')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    inventorydate = models.DateTimeField(blank=True, null=True, unique=False, db_column='InventoryDate', db_index='inventorydate')
    inventorydateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='InventoryDatePrecision', db_index='inventorydateprecision')
    modifier = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Modifier', db_index='modifier')
    name = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Name', db_index='name')
    notifications = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Notifications', db_index='notifications')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    numberofduplicates = models.IntegerField(blank=True, null=True, unique=False, db_column='NumberOfDuplicates', db_index='numberofduplicates')
    objectcondition = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='ObjectCondition', db_index='objectcondition')
    ocr = models.TextField(blank=True, null=True, unique=False, db_column='OCR', db_index='ocr')
    projectnumber = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='ProjectNumber', db_index='projectnumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    reservedinteger3 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger3', db_index='reservedinteger3')
    reservedinteger4 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger4', db_index='reservedinteger4')
    reservedtext = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ReservedText', db_index='reservedtext')
    reservedtext2 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ReservedText2', db_index='reservedtext2')
    reservedtext3 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ReservedText3', db_index='reservedtext3')
    restrictions = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Restrictions', db_index='restrictions')
    sgrstatus = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='SGRStatus', db_index='sgrstatus')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.TextField(blank=True, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.TextField(blank=True, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.TextField(blank=True, null=True, unique=False, db_column='Text8', db_index='text8')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    totalvalue = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='TotalValue', db_index='totalvalue')
    uniqueidentifier = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='UniqueIdentifier', db_index='uniqueidentifier')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    visibility = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Visibility', db_index='visibility')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')
    yesno6 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo6', db_index='yesno6')

    # Relationships: Many-to-One
    accession = models.ForeignKey('Accession', db_column='AccessionID', related_name='collectionobjects', null=True, on_delete=protect_with_blockers)
    agent1 = models.ForeignKey('Agent', db_column='Agent1ID', related_name='+', null=True, on_delete=protect_with_blockers)
    appraisal = models.ForeignKey('Appraisal', db_column='AppraisalID', related_name='collectionobjects', null=True, on_delete=protect_with_blockers)
    cataloger = models.ForeignKey('Agent', db_column='CatalogerID', related_name='+', null=True, on_delete=protect_with_blockers)
    collectingEvent = models.ForeignKey('CollectingEvent', db_column='CollectingEventID', related_name='collectionobjects', null=True, on_delete=protect_with_blockers)
    collection = models.ForeignKey('Collection', db_column='CollectionID', related_name='+', null=False, on_delete=protect_with_blockers)
    collectionObjectAttribute = models.ForeignKey('CollectionObjectAttribute', db_column='CollectionObjectAttributeID', related_name='collectionobjects', null=True, on_delete=protect_with_blockers)
    container = models.ForeignKey('Container', db_column='ContainerID', related_name='collectionobjects', null=True, on_delete=protect_with_blockers)
    containerOwner = models.ForeignKey('Container', db_column='ContainerOwnerID', related_name='collectionobjectkids', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    embargoAuthority = models.ForeignKey('Agent', db_column='EmbargoAuthorityID', related_name='+', null=True, on_delete=protect_with_blockers)
    fieldNotebookPage = models.ForeignKey('FieldNotebookPage', db_column='FieldNotebookPageID', related_name='collectionobjects', null=True, on_delete=protect_with_blockers)
    inventorizedBy = models.ForeignKey('Agent', db_column='InventorizedByID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    paleoContext = models.ForeignKey('PaleoContext', db_column='PaleoContextID', related_name='collectionobjects', null=True, on_delete=protect_with_blockers)
    visibilitySetBy = models.ForeignKey('SpecifyUser', db_column='VisibilitySetByID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionobject'
        ordering = ()
        indexes = [
            models.Index(fields=['FieldNumber'], name='FieldNumberIDX'),
            models.Index(fields=['CatalogedDate'], name='CatalogedDateIDX'),
            models.Index(fields=['CatalogNumber'], name='CatalogNumberIDX'),
            models.Index(fields=['UniqueIdentifier'], name='COUniqueIdentifierIDX'),
            models.Index(fields=['AltCatalogNumber'], name='AltCatalogNumberIDX'),
            models.Index(fields=['GUID'], name='ColObjGuidIDX'),
            models.Index(fields=['CollectionmemberID'], name='COColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectionobjectattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionobjectattachmentid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='collectionobjectattachments', null=False, on_delete=protect_with_blockers)
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='collectionobjectattachments', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionobjectattachment'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='COLOBJATTColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectionobjectattr(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='attrid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    dblvalue = models.FloatField(blank=True, null=True, unique=False, db_column='DoubleValue', db_index='doublevalue')
    strvalue = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='StrValue', db_index='strvalue')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='collectionobjectattrs', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('AttributeDef', db_column='AttributeDefID', related_name='collectionobjectattrs', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionobjectattr'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='COLOBJATRSColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectionobjectattribute(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionobjectattributeid')

    # Fields
    bottomdistance = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='BottomDistance', db_index='bottomdistance')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    direction = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Direction', db_index='direction')
    distanceunits = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='DistanceUnits', db_index='distanceunits')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer10 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer10', db_index='integer10')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    integer6 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer6', db_index='integer6')
    integer7 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer7', db_index='integer7')
    integer8 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer8', db_index='integer8')
    integer9 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer9', db_index='integer9')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number10 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number10', db_index='number10')
    number11 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number11', db_index='number11')
    number12 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number12', db_index='number12')
    number13 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number13', db_index='number13')
    number14 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number14', db_index='number14')
    number15 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number15', db_index='number15')
    number16 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number16', db_index='number16')
    number17 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number17', db_index='number17')
    number18 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number18', db_index='number18')
    number19 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number19', db_index='number19')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number20 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number20', db_index='number20')
    number21 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number21', db_index='number21')
    number22 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number22', db_index='number22')
    number23 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number23', db_index='number23')
    number24 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number24', db_index='number24')
    number25 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number25', db_index='number25')
    number26 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number26', db_index='number26')
    number27 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number27', db_index='number27')
    number28 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number28', db_index='number28')
    number29 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number29', db_index='number29')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number30 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number30', db_index='number30')
    number31 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number31', db_index='number31')
    number32 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number32', db_index='number32')
    number33 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number33', db_index='number33')
    number34 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number34', db_index='number34')
    number35 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number35', db_index='number35')
    number36 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number36', db_index='number36')
    number37 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number37', db_index='number37')
    number38 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number38', db_index='number38')
    number39 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number39', db_index='number39')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number40 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number40', db_index='number40')
    number41 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number41', db_index='number41')
    number42 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number42', db_index='number42')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    number6 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number6', db_index='number6')
    number7 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number7', db_index='number7')
    number8 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number8', db_index='number8')
    number9 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number9', db_index='number9')
    positionstate = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PositionState', db_index='positionstate')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text13', db_index='text13')
    text14 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text14', db_index='text14')
    text15 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text15', db_index='text15')
    text16 = models.TextField(blank=True, null=True, unique=False, db_column='Text16', db_index='text16')
    text17 = models.TextField(blank=True, null=True, unique=False, db_column='Text17', db_index='text17')
    text18 = models.TextField(blank=True, null=True, unique=False, db_column='Text18', db_index='text18')
    text19 = models.TextField(blank=True, null=True, unique=False, db_column='Text19', db_index='text19')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text20 = models.TextField(blank=True, null=True, unique=False, db_column='Text20', db_index='text20')
    text21 = models.TextField(blank=True, null=True, unique=False, db_column='Text21', db_index='text21')
    text22 = models.TextField(blank=True, null=True, unique=False, db_column='Text22', db_index='text22')
    text23 = models.TextField(blank=True, null=True, unique=False, db_column='Text23', db_index='text23')
    text24 = models.TextField(blank=True, null=True, unique=False, db_column='Text24', db_index='text24')
    text25 = models.TextField(blank=True, null=True, unique=False, db_column='Text25', db_index='text25')
    text26 = models.TextField(blank=True, null=True, unique=False, db_column='Text26', db_index='text26')
    text27 = models.TextField(blank=True, null=True, unique=False, db_column='Text27', db_index='text27')
    text28 = models.TextField(blank=True, null=True, unique=False, db_column='Text28', db_index='text28')
    text29 = models.TextField(blank=True, null=True, unique=False, db_column='Text29', db_index='text29')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text30 = models.TextField(blank=True, null=True, unique=False, db_column='Text30', db_index='text30')
    text31 = models.TextField(blank=True, null=True, unique=False, db_column='Text31', db_index='text31')
    text32 = models.TextField(blank=True, null=True, unique=False, db_column='Text32', db_index='text32')
    text33 = models.TextField(blank=True, null=True, unique=False, db_column='Text33', db_index='text33')
    text34 = models.TextField(blank=True, null=True, unique=False, db_column='Text34', db_index='text34')
    text35 = models.TextField(blank=True, null=True, unique=False, db_column='Text35', db_index='text35')
    text36 = models.TextField(blank=True, null=True, unique=False, db_column='Text36', db_index='text36')
    text37 = models.TextField(blank=True, null=True, unique=False, db_column='Text37', db_index='text37')
    text38 = models.TextField(blank=True, null=True, unique=False, db_column='Text38', db_index='text38')
    text39 = models.TextField(blank=True, null=True, unique=False, db_column='Text39', db_index='text39')
    text4 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text4', db_index='text4')
    text40 = models.TextField(blank=True, null=True, unique=False, db_column='Text40', db_index='text40')
    text5 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    topdistance = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='TopDistance', db_index='topdistance')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno10 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo10', db_index='yesno10')
    yesno11 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo11', db_index='yesno11')
    yesno12 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo12', db_index='yesno12')
    yesno13 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo13', db_index='yesno13')
    yesno14 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo14', db_index='yesno14')
    yesno15 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo15', db_index='yesno15')
    yesno16 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo16', db_index='yesno16')
    yesno17 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo17', db_index='yesno17')
    yesno18 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo18', db_index='yesno18')
    yesno19 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo19', db_index='yesno19')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno20 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo20', db_index='yesno20')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')
    yesno6 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo6', db_index='yesno6')
    yesno7 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo7', db_index='yesno7')
    yesno8 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo8', db_index='yesno8')
    yesno9 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo9', db_index='yesno9')

    # Relationships: Many-to-One
    agent1 = models.ForeignKey('Agent', db_column='Agent1ID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionobjectattribute'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='COLOBJATTRSColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectionobjectcitation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionobjectcitationid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    figurenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FigureNumber', db_index='figurenumber')
    isfigured = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFigured', db_index='isfigured')
    pagenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PageNumber', db_index='pagenumber')
    platenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PlateNumber', db_index='platenumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='collectionobjectcitations', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='collectionobjectcitations', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionobjectcitation'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='COCITColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectionobjectproperty(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionobjectpropertyid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date10 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date10', db_index='date10')
    date11 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date11', db_index='date11')
    date12 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date12', db_index='date12')
    date13 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date13', db_index='date13')
    date14 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date14', db_index='date14')
    date15 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date15', db_index='date15')
    date16 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date16', db_index='date16')
    date17 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date17', db_index='date17')
    date18 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date18', db_index='date18')
    date19 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date19', db_index='date19')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    date20 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date20', db_index='date20')
    date3 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date3', db_index='date3')
    date4 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date4', db_index='date4')
    date5 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date5', db_index='date5')
    date6 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date6', db_index='date6')
    date7 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date7', db_index='date7')
    date8 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date8', db_index='date8')
    date9 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date9', db_index='date9')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    integer1 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer10 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer10', db_index='integer10')
    integer11 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer11', db_index='integer11')
    integer12 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer12', db_index='integer12')
    integer13 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer13', db_index='integer13')
    integer14 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer14', db_index='integer14')
    integer15 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer15', db_index='integer15')
    integer16 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer16', db_index='integer16')
    integer17 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer17', db_index='integer17')
    integer18 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer18', db_index='integer18')
    integer19 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer19', db_index='integer19')
    integer2 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer20 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer20', db_index='integer20')
    integer21 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer21', db_index='integer21')
    integer22 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer22', db_index='integer22')
    integer23 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer23', db_index='integer23')
    integer24 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer24', db_index='integer24')
    integer25 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer25', db_index='integer25')
    integer26 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer26', db_index='integer26')
    integer27 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer27', db_index='integer27')
    integer28 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer28', db_index='integer28')
    integer29 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer29', db_index='integer29')
    integer3 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer30 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer30', db_index='integer30')
    integer4 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    integer6 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer6', db_index='integer6')
    integer7 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer7', db_index='integer7')
    integer8 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer8', db_index='integer8')
    integer9 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer9', db_index='integer9')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number10 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number10', db_index='number10')
    number11 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number11', db_index='number11')
    number12 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number12', db_index='number12')
    number13 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number13', db_index='number13')
    number14 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number14', db_index='number14')
    number15 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number15', db_index='number15')
    number16 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number16', db_index='number16')
    number17 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number17', db_index='number17')
    number18 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number18', db_index='number18')
    number19 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number19', db_index='number19')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number20 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number20', db_index='number20')
    number21 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number21', db_index='number21')
    number22 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number22', db_index='number22')
    number23 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number23', db_index='number23')
    number24 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number24', db_index='number24')
    number25 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number25', db_index='number25')
    number26 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number26', db_index='number26')
    number27 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number27', db_index='number27')
    number28 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number28', db_index='number28')
    number29 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number29', db_index='number29')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number30 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number30', db_index='number30')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    number6 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number6', db_index='number6')
    number7 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number7', db_index='number7')
    number8 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number8', db_index='number8')
    number9 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number9', db_index='number9')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text13', db_index='text13')
    text14 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text14', db_index='text14')
    text15 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text15', db_index='text15')
    text16 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text16', db_index='text16')
    text17 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text17', db_index='text17')
    text18 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text18', db_index='text18')
    text19 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text19', db_index='text19')
    text2 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text2', db_index='text2')
    text20 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text20', db_index='text20')
    text21 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text21', db_index='text21')
    text22 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text22', db_index='text22')
    text23 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text23', db_index='text23')
    text24 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text24', db_index='text24')
    text25 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text25', db_index='text25')
    text26 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text26', db_index='text26')
    text27 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text27', db_index='text27')
    text28 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text28', db_index='text28')
    text29 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text29', db_index='text29')
    text3 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text3', db_index='text3')
    text30 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text30', db_index='text30')
    text31 = models.TextField(blank=True, null=True, unique=False, db_column='Text31', db_index='text31')
    text32 = models.TextField(blank=True, null=True, unique=False, db_column='Text32', db_index='text32')
    text33 = models.TextField(blank=True, null=True, unique=False, db_column='Text33', db_index='text33')
    text34 = models.TextField(blank=True, null=True, unique=False, db_column='Text34', db_index='text34')
    text35 = models.TextField(blank=True, null=True, unique=False, db_column='Text35', db_index='text35')
    text36 = models.TextField(blank=True, null=True, unique=False, db_column='Text36', db_index='text36')
    text37 = models.TextField(blank=True, null=True, unique=False, db_column='Text37', db_index='text37')
    text38 = models.TextField(blank=True, null=True, unique=False, db_column='Text38', db_index='text38')
    text39 = models.TextField(blank=True, null=True, unique=False, db_column='Text39', db_index='text39')
    text4 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text4', db_index='text4')
    text40 = models.TextField(blank=True, null=True, unique=False, db_column='Text40', db_index='text40')
    text5 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno10 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo10', db_index='yesno10')
    yesno11 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo11', db_index='yesno11')
    yesno12 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo12', db_index='yesno12')
    yesno13 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo13', db_index='yesno13')
    yesno14 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo14', db_index='yesno14')
    yesno15 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo15', db_index='yesno15')
    yesno16 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo16', db_index='yesno16')
    yesno17 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo17', db_index='yesno17')
    yesno18 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo18', db_index='yesno18')
    yesno19 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo19', db_index='yesno19')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno20 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo20', db_index='yesno20')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')
    yesno6 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo6', db_index='yesno6')
    yesno7 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo7', db_index='yesno7')
    yesno8 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo8', db_index='yesno8')
    yesno9 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo9', db_index='yesno9')

    # Relationships: Many-to-One
    agent1 = models.ForeignKey('Agent', db_column='Agent1ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent10 = models.ForeignKey('Agent', db_column='Agent10ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent11 = models.ForeignKey('Agent', db_column='Agent11ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent12 = models.ForeignKey('Agent', db_column='Agent12ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent13 = models.ForeignKey('Agent', db_column='Agent13ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent14 = models.ForeignKey('Agent', db_column='Agent14ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent15 = models.ForeignKey('Agent', db_column='Agent15ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent16 = models.ForeignKey('Agent', db_column='Agent16ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent17 = models.ForeignKey('Agent', db_column='Agent17ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent18 = models.ForeignKey('Agent', db_column='Agent18ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent19 = models.ForeignKey('Agent', db_column='Agent19ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent2 = models.ForeignKey('Agent', db_column='Agent2ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent20 = models.ForeignKey('Agent', db_column='Agent20ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent3 = models.ForeignKey('Agent', db_column='Agent3ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent4 = models.ForeignKey('Agent', db_column='Agent4ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent5 = models.ForeignKey('Agent', db_column='Agent5ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent6 = models.ForeignKey('Agent', db_column='Agent6ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent7 = models.ForeignKey('Agent', db_column='Agent7ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent8 = models.ForeignKey('Agent', db_column='Agent8D', related_name='+', null=True, on_delete=protect_with_blockers)
    agent9 = models.ForeignKey('Agent', db_column='Agent9ID', related_name='+', null=True, on_delete=protect_with_blockers)
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='collectionobjectproperties', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionobjectproperty'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='COLOBJPROPColMemIDX')
        ]

    save = partialmethod(custom_save)

class Collectionreltype(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionreltypeid')

    # Fields
    name = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Name', db_index='name')
    remarks = models.CharField(blank=True, max_length=4096, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    leftSideCollection = models.ForeignKey('Collection', db_column='LeftSideCollectionID', related_name='leftsidereltypes', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    rightSideCollection = models.ForeignKey('Collection', db_column='RightSideCollectionID', related_name='rightsidereltypes', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionreltype'
        ordering = ()

    save = partialmethod(custom_save)

class Collectionrelationship(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionrelationshipid')

    # Fields
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collectionRelType = models.ForeignKey('CollectionRelType', db_column='CollectionRelTypeID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    leftSide = models.ForeignKey('CollectionObject', db_column='LeftSideCollectionID', related_name='leftsiderels', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    rightSide = models.ForeignKey('CollectionObject', db_column='RightSideCollectionID', related_name='rightsiderels', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'collectionrelationship'
        ordering = ()

    save = partialmethod(custom_save)

class Collector(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectorid')

    # Fields
    isprimary = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsPrimary', db_index='isprimary')
    ordernumber = models.IntegerField(blank=False, null=False, unique=False, db_column='OrderNumber', db_index='ordernumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='collectors', null=False, on_delete=protect_with_blockers)
    collectingEvent = models.ForeignKey('CollectingEvent', db_column='CollectingEventID', related_name='collectors', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collector'
        ordering = ('ordernumber',)
        indexes = [
            models.Index(fields=['DivisionID'], name='COLTRDivIDX')
        ]

    save = partialmethod(custom_save)

class Commonnametx(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='commonnametxid')

    # Fields
    author = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Author', db_index='author')
    country = models.CharField(blank=True, max_length=2, null=True, unique=False, db_column='Country', db_index='country')
    language = models.CharField(blank=True, max_length=2, null=True, unique=False, db_column='Language', db_index='language')
    name = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Name', db_index='name')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    variant = models.CharField(blank=True, max_length=2, null=True, unique=False, db_column='Variant', db_index='variant')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    taxon = models.ForeignKey('Taxon', db_column='TaxonID', related_name='commonnames', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'commonnametx'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='CommonNameTxNameIDX'),
            models.Index(fields=['Country'], name='CommonNameTxCountryIDX')
        ]

    save = partialmethod(custom_save)

class Commonnametxcitation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='commonnametxcitationid')

    # Fields
    figurenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FigureNumber', db_index='figurenumber')
    isfigured = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFigured', db_index='isfigured')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    pagenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PageNumber', db_index='pagenumber')
    platenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PlateNumber', db_index='platenumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    commonNameTx = models.ForeignKey('CommonNameTx', db_column='CommonNameTxID', related_name='citations', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='+', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'commonnametxcitation'
        ordering = ()

    save = partialmethod(custom_save)

class Conservdescription(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='conservdescriptionid')

    # Fields
    backgroundinfo = models.TextField(blank=True, null=True, unique=False, db_column='BackgroundInfo', db_index='backgroundinfo')
    composition = models.TextField(blank=True, null=True, unique=False, db_column='Composition', db_index='composition')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    date2precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date2Precision', db_index='date2precision')
    date3 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date3', db_index='date3')
    date3precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date3Precision', db_index='date3precision')
    date4 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date4', db_index='date4')
    date4precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date4Precision', db_index='date4precision')
    date5 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date5', db_index='date5')
    date5precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date5Precision', db_index='date5precision')
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    determineddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='CatalogedDate', db_index='catalogeddate')
    displayrecommendations = models.TextField(blank=True, null=True, unique=False, db_column='DisplayRecommendations', db_index='displayrecommendations')
    height = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Height', db_index='height')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    lightrecommendations = models.TextField(blank=True, null=True, unique=False, db_column='LightRecommendations', db_index='lightrecommendations')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    objlength = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='ObjLength', db_index='objlength')
    otherrecommendations = models.TextField(blank=True, null=True, unique=False, db_column='OtherRecommendations', db_index='otherrecommendations')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    shortdesc = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ShortDesc', db_index='shortdesc')
    source = models.TextField(blank=True, null=True, unique=False, db_column='Source', db_index='source')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    units = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Units', db_index='units')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    width = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Width', db_index='width')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='conservdescriptions', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='conservdescriptions', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'conservdescription'
        ordering = ()
        indexes = [
            models.Index(fields=['ShortDesc'], name='ConservDescShortDescIDX')
        ]

    save = partialmethod(custom_save)

class Conservdescriptionattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='conservdescriptionattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='conservdescriptionattachments', null=False, on_delete=protect_with_blockers)
    conservDescription = models.ForeignKey('ConservDescription', db_column='ConservDescriptionID', related_name='conservdescriptionattachments', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'conservdescriptionattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Conservevent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='conserveventid')

    # Fields
    advtestingexam = models.TextField(blank=True, null=True, unique=False, db_column='AdvTestingExam', db_index='advtestingexam')
    advtestingexamresults = models.TextField(blank=True, null=True, unique=False, db_column='AdvTestingExamResults', db_index='advtestingexamresults')
    completedcomments = models.TextField(blank=True, null=True, unique=False, db_column='CompletedComments', db_index='completedcomments')
    completeddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='CompletedDate', db_index='completeddate')
    completeddateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='CompletedDatePrecision', db_index='completeddateprecision')
    conditionreport = models.TextField(blank=True, null=True, unique=False, db_column='ConditionReport', db_index='conditionreport')
    curatorapprovaldate = models.DateTimeField(blank=True, null=True, unique=False, db_column='CuratorApprovalDate', db_index='curatorapprovaldate')
    curatorapprovaldateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='CuratorApprovalDatePrecision', db_index='curatorapprovaldateprecision')
    examdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ExamDate', db_index='examdate')
    examdateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='ExamDatePrecision', db_index='examdateprecision')
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index='number2')
    photodocs = models.TextField(blank=True, null=True, unique=False, db_column='PhotoDocs', db_index='photodocs')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    treatmentcompdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='TreatmentCompDate', db_index='treatmentcompdate')
    treatmentcompdateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='TreatmentCompDatePrecision', db_index='treatmentcompdateprecision')
    treatmentreport = models.TextField(blank=True, null=True, unique=False, db_column='TreatmentReport', db_index='treatmentreport')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    conservDescription = models.ForeignKey('ConservDescription', db_column='ConservDescriptionID', related_name='events', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    curator = models.ForeignKey('Agent', db_column='CuratorID', related_name='+', null=True, on_delete=protect_with_blockers)
    examinedByAgent = models.ForeignKey('Agent', db_column='ExaminedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    treatedByAgent = models.ForeignKey('Agent', db_column='TreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'conservevent'
        ordering = ()
        indexes = [
            models.Index(fields=['ExamDate'], name='ConservExamDateIDX'),
            models.Index(fields=['completedDate'], name='ConservCompletedDateIDX')
        ]

    save = partialmethod(custom_save)

class Conserveventattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='conserveventattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='conserveventattachments', null=False, on_delete=protect_with_blockers)
    conservEvent = models.ForeignKey('ConservEvent', db_column='ConservEventID', related_name='conserveventattachments', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'conserveventattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Container(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='containerid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    name = models.CharField(blank=True, max_length=1024, null=True, unique=False, db_column='Name', db_index='name')
    number = models.IntegerField(blank=True, null=True, unique=False, db_column='Number', db_index='number')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('Container', db_column='ParentID', related_name='children', null=True, on_delete=protect_with_blockers)
    storage = models.ForeignKey('Storage', db_column='StorageID', related_name='containers', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'container'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='ContainerNameIDX'),
            models.Index(fields=['CollectionMemberID'], name='ContainerMemIDX')
        ]

    save = partialmethod(custom_save)

class Dnaprimer(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='dnaprimerid')

    # Fields
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    primerdesignator = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='PrimerDesignator', db_index='primerdesignator')
    primernameforward = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='PrimerNameForward', db_index='primernameforward')
    primernamereverse = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='PrimerNameReverse', db_index='primernamereverse')
    primerreferencecitationforward = models.CharField(blank=True, max_length=300, null=True, unique=False, db_column='PrimerReferenceCitationForward', db_index='primerreferencecitationforward')
    primerreferencecitationreverse = models.CharField(blank=True, max_length=300, null=True, unique=False, db_column='PrimerReferenceCitationReverse', db_index='primerreferencecitationreverse')
    primerreferencelinkforward = models.CharField(blank=True, max_length=300, null=True, unique=False, db_column='PrimerReferenceLinkForward', db_index='primerreferencelinkforward')
    primerreferencelinkreverse = models.CharField(blank=True, max_length=300, null=True, unique=False, db_column='PrimerReferenceLinkReverse', db_index='primerreferencelinkreverse')
    primersequenceforward = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='PrimerSequenceForward', db_index='primersequenceforward')
    primersequencereverse = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='PrimerSequenceReverse', db_index='primersequencereverse')
    purificationmethod = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='purificationMethod', db_index='purificationmethod')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    reservedinteger3 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger3', db_index='reservedinteger3')
    reservedinteger4 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger4', db_index='reservedinteger4')
    reservednumber3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='ReservedNumber3', db_index='reservednumber3')
    reservednumber4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='ReservedNumber4', db_index='reservednumber4')
    reservedtext3 = models.TextField(blank=True, null=True, unique=False, db_column='ReservedText3', db_index='reservedtext3')
    reservedtext4 = models.TextField(blank=True, null=True, unique=False, db_column='ReservedText4', db_index='reservedtext4')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'dnaprimer'
        ordering = ()
        indexes = [
            models.Index(fields=['PrimerDesignator'], name='DesignatorIDX')
        ]

    save = partialmethod(custom_save)

class Dnasequence(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='dnasequenceid')

    # Fields
    ambiguousresidues = models.IntegerField(blank=True, null=True, unique=False, db_column='AmbiguousResidues', db_index='ambiguousresidues')
    boldbarcodeid = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='BOLDBarcodeID', db_index='boldbarcodeid')
    boldlastupdatedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='BOLDLastUpdateDate', db_index='boldlastupdatedate')
    boldsampleid = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='BOLDSampleID', db_index='boldsampleid')
    boldtranslationmatrix = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='BOLDTranslationMatrix', db_index='boldtranslationmatrix')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    compa = models.IntegerField(blank=True, null=True, unique=False, db_column='CompA', db_index='compa')
    compc = models.IntegerField(blank=True, null=True, unique=False, db_column='CompC', db_index='compc')
    compg = models.IntegerField(blank=True, null=True, unique=False, db_column='CompG', db_index='compg')
    compt = models.IntegerField(blank=True, null=True, unique=False, db_column='compT', db_index='compt')
    extractiondate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ExtractionDate', db_index='extractiondate')
    extractiondateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='ExtractionDatePrecision', db_index='extractiondateprecision')
    genbankaccessionnumber = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='GenBankAccessionNumber', db_index='genbankaccessionnumber')
    genesequence = models.TextField(blank=True, null=True, unique=False, db_column='GeneSequence', db_index='genesequence')
    moleculetype = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='MoleculeType', db_index='moleculetype')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    sequencedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='SequenceDate', db_index='sequencedate')
    sequencedateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='SequenceDatePrecision', db_index='sequencedateprecision')
    targetmarker = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='TargetMarker', db_index='targetmarker')
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text3', db_index='text3')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    totalresidues = models.IntegerField(blank=True, null=True, unique=False, db_column='TotalResidues', db_index='totalresidues')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')

    # Relationships: Many-to-One
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='dnasequences', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    extractor = models.ForeignKey('Agent', db_column='ExtractorID', related_name='+', null=True, on_delete=protect_with_blockers)
    materialSample = models.ForeignKey('MaterialSample', db_column='MaterialSampleID', related_name='dnasequences', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    sequencer = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'dnasequence'
        ordering = ()
        indexes = [
            models.Index(fields=['GenBankAccessionNumber'], name='GenBankAccIDX'),
            models.Index(fields=['BOLDBarcodeID'], name='BOLDBarcodeIDX'),
            models.Index(fields=['BOLDSampleID'], name='BOLDSampleIDX')
        ]

    save = partialmethod(custom_save)

class Dnasequenceattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='dnasequenceattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='dnasequenceattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    dnaSequence = models.ForeignKey('DNASequence', db_column='DnaSequenceID', related_name='attachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'dnasequenceattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Dnasequencingrun(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='dnasequencingrunid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    dryaddoi = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='DryadDOI', db_index='dryaddoi')
    genesequence = models.TextField(blank=True, null=True, unique=False, db_column='GeneSequence', db_index='genesequence')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    ordinal = models.IntegerField(blank=True, null=True, unique=False, db_column='Ordinal', db_index='ordinal')
    pcrcocktailprimer = models.BooleanField(blank=True, null=True, unique=False, db_column='PCRCocktailPrimer', db_index='pcrcocktailprimer')
    pcrforwardprimercode = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PCRForwardPrimerCode', db_index='pcrforwardprimercode')
    pcrprimername = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PCRPrimerName', db_index='pcrprimername')
    pcrprimersequence5_3 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='PCRPrimerSequence5_3', db_index='pcrprimersequence5_3')
    pcrreverseprimercode = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PCRReversePrimerCode', db_index='pcrreverseprimercode')
    readdirection = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='ReadDirection', db_index='readdirection')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    rundate = models.DateTimeField(blank=True, null=True, unique=False, db_column='RunDate', db_index='rundate')
    scorefilename = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='ScoreFileName', db_index='scorefilename')
    sequencecocktailprimer = models.BooleanField(blank=True, null=True, unique=False, db_column='SequenceCocktailPrimer', db_index='sequencecocktailprimer')
    sequenceprimercode = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='SequencePrimerCode', db_index='sequenceprimercode')
    sequenceprimername = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='SequencePrimerName', db_index='sequenceprimername')
    sequenceprimersequence5_3 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SequencePrimerSequence5_3', db_index='sequenceprimersequence5_3')
    sraexperimentid = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SRAExperimentID', db_index='sraexperimentid')
    srarunid = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SRARunID', db_index='srarunid')
    srasubmissionid = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SRASubmissionID', db_index='srasubmissionid')
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text3', db_index='text3')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    tracefilename = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='TraceFileName', db_index='tracefilename')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    dnaPrimer = models.ForeignKey('DNAPrimer', db_column='DNAPrimerID', related_name='dnasequencingruns', null=True, on_delete=protect_with_blockers)
    dnaSequence = models.ForeignKey('DNASequence', db_column='DNASequenceID', related_name='dnasequencingruns', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparedByAgent = models.ForeignKey('Agent', db_column='PreparedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    runByAgent = models.ForeignKey('Agent', db_column='RunByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'dnasequencingrun'
        ordering = ()

    save = partialmethod(custom_save)

class Dnasequencingrunattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='dnasequencingrunattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='dnasequencingrunattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    dnaSequencingRun = models.ForeignKey('DNASequencingRun', db_column='DnaSequencingRunID', related_name='attachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'dnasequencerunattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Dnasequencingruncitation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='dnasequencingruncitationid')

    # Fields
    figurenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FigureNumber', db_index='figurenumber')
    isfigured = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFigured', db_index='isfigured')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    pagenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PageNumber', db_index='pagenumber')
    platenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PlateNumber', db_index='platenumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='+', null=False, on_delete=protect_with_blockers)
    sequencingRun = models.ForeignKey('DNASequencingRun', db_column='DNASequencingRunID', related_name='citations', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'dnasequencingruncitation'
        ordering = ()

    save = partialmethod(custom_save)

class Datatype(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='datatypeid')

    # Fields
    name = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Name', db_index='name')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'datatype'
        ordering = ()

    save = partialmethod(custom_save)

class Deaccession(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='deaccessionid')

    # Fields
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    deaccessiondate = models.DateTimeField(blank=True, null=True, unique=False, db_column='DeaccessionDate', db_index='deaccessiondate')
    deaccessionnumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='DeaccessionNumber', db_index='deaccessionnumber')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    status = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Status', db_index='status')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    agent1 = models.ForeignKey('Agent', db_column='Agent1ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent2 = models.ForeignKey('Agent', db_column='Agent2ID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'deaccession'
        ordering = ()
        indexes = [
            models.Index(fields=['DeaccessionNumber'], name='DeaccessionNumberIDX'),
            models.Index(fields=['DeaccessionDate'], name='DeaccessionDateIDX')
        ]

    save = partialmethod(custom_save)

class Deaccessionagent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='deaccessionagentid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    role = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='Role', db_index='role')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    deaccession = models.ForeignKey('Deaccession', db_column='DeaccessionID', related_name='deaccessionagents', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'deaccessionagent'
        ordering = ()

    save = partialmethod(custom_save)

class Deaccessionattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='deaccessionattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='deaccessionattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    deaccession = models.ForeignKey('Deaccession', db_column='DeaccessionID', related_name='deaccessionattachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'deaccessionattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Determination(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='determinationid')

    # Fields
    addendum = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Addendum', db_index='addendum')
    alternatename = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='AlternateName', db_index='alternatename')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    confidence = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Confidence', db_index='confidence')
    determineddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='DeterminedDate', db_index='determineddate')
    determineddateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='DeterminedDatePrecision', db_index='determineddateprecision')
    featureorbasis = models.CharField(blank=True, max_length=250, null=True, unique=False, db_column='FeatureOrBasis', db_index='featureorbasis')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    iscurrent = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsCurrent', db_index='iscurrent')
    method = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Method', db_index='method')
    nameusage = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='NameUsage', db_index='nameusage')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    qualifier = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Qualifier', db_index='qualifier')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    subspqualifier = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='SubSpQualifier', db_index='subspqualifier')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text8', db_index='text8')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    typestatusname = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='TypeStatusName', db_index='typestatusname')
    varqualifier = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='VarQualifier', db_index='varqualifier')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='determinations', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    determiner = models.ForeignKey('Agent', db_column='DeterminerID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preferredTaxon = models.ForeignKey('Taxon', db_column='PreferredTaxonID', related_name='+', null=True, on_delete=protect_with_blockers)
    taxon = models.ForeignKey('Taxon', db_column='TaxonID', related_name='determinations', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'determination'
        ordering = ('-iscurrent',)
        indexes = [
            models.Index(fields=['DeterminedDate'], name='DeterminedDateIDX'),
            models.Index(fields=['CollectionMemberID'], name='DetMemIDX'),
            models.Index(fields=['AlternateName'], name='AlterNameIDX'),
            models.Index(fields=['GUID'], name='DeterminationGuidIDX'),
            models.Index(fields=['TypeStatusName'], name='TypeStatusNameIDX')
        ]

    save = partialmethod(custom_save)

class Determinationcitation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='determinationcitationid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    figurenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FigureNumber', db_index='figurenumber')
    isfigured = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFigured', db_index='isfigured')
    pagenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PageNumber', db_index='pagenumber')
    platenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PlateNumber', db_index='platenumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    determination = models.ForeignKey('Determination', db_column='DeterminationID', related_name='determinationcitations', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='determinationcitations', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'determinationcitation'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='DetCitColMemIDX')
        ]

    save = partialmethod(custom_save)

class Determiner(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='determinerid')

    # Fields
    isprimary = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsPrimary', db_index='isprimary')
    ordernumber = models.IntegerField(blank=False, null=False, unique=False, db_column='OrderNumber', db_index='ordernumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    determination = models.ForeignKey('Determination', db_column='DeterminationID', related_name='determiners', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'determiner'
        ordering = ('ordernumber',)

    save = partialmethod(custom_save)

class Discipline(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='usergroupscopeid')

    # Fields
    ispaleocontextembedded = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsPaleoContextEmbedded', db_index='ispaleocontextembedded')
    name = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Name', db_index='name')
    paleocontextchildtable = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PaleoContextChildTable', db_index='paleocontextchildtable')
    regnumber = models.CharField(blank=True, max_length=24, null=True, unique=False, db_column='RegNumber', db_index='regnumber')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: One-to-One
    taxonTreeDef = models.OneToOneField('TaxonTreeDef', db_column='TaxonTreeDefID', related_name='discipline', null=True, on_delete=protect_with_blockers)

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    dataType = models.ForeignKey('DataType', db_column='DataTypeID', related_name='+', null=False, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='disciplines', null=False, on_delete=protect_with_blockers)
    geographyTreeDef = models.ForeignKey('GeographyTreeDef', db_column='GeographyTreeDefID', related_name='disciplines', null=False, on_delete=protect_with_blockers)
    geologicTimePeriodTreeDef = models.ForeignKey('GeologicTimePeriodTreeDef', db_column='GeologicTimePeriodTreeDefID', related_name='disciplines', null=False, on_delete=protect_with_blockers)
    lithoStratTreeDef = models.ForeignKey('LithoStratTreeDef', db_column='LithoStratTreeDefID', related_name='disciplines', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'discipline'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='DisciplineNameIDX')
        ]

    save = partialmethod(custom_save)

class Disposal(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='disposalid')

    # Fields
    disposaldate = models.DateTimeField(blank=True, null=True, unique=False, db_column='DisposalDate', db_index='disposaldate')
    disposalnumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='DisposalNumber', db_index='disposalnumber')
    donotexport = models.BooleanField(blank=True, null=True, unique=False, db_column='doNotExport', db_index='donotexport')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    deaccession = models.ForeignKey('Deaccession', db_column='DeaccessionID', related_name='disposals', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'disposal'
        ordering = ()
        indexes = [
            models.Index(fields=['DisposalNumber'], name='DisposalNumberIDX'),
            models.Index(fields=['DisposalDate'], name='DisposalDateIDX')
        ]

    save = partialmethod(custom_save)

class Disposalagent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='disposalagentid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    role = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='Role', db_index='role')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    disposal = models.ForeignKey('Disposal', db_column='DisposalID', related_name='disposalagents', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'disposalagent'
        ordering = ()

    save = partialmethod(custom_save)

class Disposalattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='disposalattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='disposalattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    disposal = models.ForeignKey('Disposal', db_column='DisposalID', related_name='disposalattachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'disposalattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Disposalpreparation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='disposalpreparationid')

    # Fields
    quantity = models.IntegerField(blank=True, null=True, unique=False, db_column='Quantity', db_index='quantity')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    disposal = models.ForeignKey('Disposal', db_column='DisposalID', related_name='disposalpreparations', null=False, on_delete=models.CASCADE)
    loanReturnPreparation = models.ForeignKey('LoanReturnPreparation', db_column='LoanReturnPreparationID', related_name='disposalpreparations', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='disposalpreparations', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'disposalpreparation'
        ordering = ()

    save = partialmethod(custom_save)

class Division(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='usergroupscopeid')

    # Fields
    abbrev = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Abbrev', db_index='abbrev')
    altname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='AltName', db_index='altname')
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    discipline = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='DisciplineType', db_index='disciplinetype')
    iconuri = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='IconURI', db_index='iconuri')
    name = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Name', db_index='name')
    regnumber = models.CharField(blank=True, max_length=24, null=True, unique=False, db_column='RegNumber', db_index='regnumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    uri = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Uri', db_index='uri')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    address = models.ForeignKey('Address', db_column='AddressID', related_name='divisions', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    institution = models.ForeignKey('Institution', db_column='InstitutionID', related_name='divisions', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'division'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='DivisionNameIDX')
        ]

    save = partialmethod(custom_save)

class Exchangein(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='exchangeinid')

    # Fields
    contents = models.TextField(blank=True, null=True, unique=False, db_column='Contents', db_index='contents')
    descriptionofmaterial = models.CharField(blank=True, max_length=120, null=True, unique=False, db_column='DescriptionOfMaterial', db_index='descriptionofmaterial')
    exchangedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ExchangeDate', db_index='exchangedate')
    exchangeinnumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='ExchangeInNumber', db_index='exchangeinnumber')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    quantityexchanged = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='QuantityExchanged', db_index='quantityexchanged')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    srcgeography = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='SrcGeography', db_index='srcgeography')
    srctaxonomy = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='SrcTaxonomy', db_index='srctaxonomy')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    addressOfRecord = models.ForeignKey('AddressOfRecord', db_column='AddressOfRecordID', related_name='exchangeins', null=True, on_delete=protect_with_blockers)
    agentCatalogedBy = models.ForeignKey('Agent', db_column='CatalogedByID', related_name='+', null=False, on_delete=protect_with_blockers)
    agentReceivedFrom = models.ForeignKey('Agent', db_column='ReceivedFromOrganizationID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'exchangein'
        ordering = ()
        indexes = [
            models.Index(fields=['ExchangeDate'], name='ExchangeDateIDX'),
            models.Index(fields=['DescriptionOfMaterial'], name='DescriptionOfMaterialIDX')
        ]

    save = partialmethod(custom_save)

class Exchangeinattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='exchangeinattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='exchangeinattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    exchangeIn = models.ForeignKey('ExchangeIn', db_column='ExchangeInID', related_name='exchangeinattachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'exchangeinattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Exchangeinprep(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='exchangeinprepid')

    # Fields
    comments = models.TextField(blank=True, null=True, unique=False, db_column='Comments', db_index='comments')
    descriptionofmaterial = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='DescriptionOfMaterial', db_index='descriptionofmaterial')
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index='number1')
    quantity = models.IntegerField(blank=True, null=True, unique=False, db_column='Quantity', db_index='quantity')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    exchangeIn = models.ForeignKey('ExchangeIn', db_column='ExchangeInID', related_name='exchangeinpreps', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='exchangeinpreps', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'exchangeinprep'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='ExchgInPrepDspMemIDX')
        ]

    save = partialmethod(custom_save)

class Exchangeout(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='exchangeoutid')

    # Fields
    contents = models.TextField(blank=True, null=True, unique=False, db_column='Contents', db_index='contents')
    descriptionofmaterial = models.CharField(blank=True, max_length=120, null=True, unique=False, db_column='DescriptionOfMaterial', db_index='descriptionofmaterial')
    exchangedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ExchangeDate', db_index='exchangedate')
    exchangeoutnumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='ExchangeOutNumber', db_index='exchangeoutnumber')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    quantityexchanged = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='QuantityExchanged', db_index='quantityexchanged')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    srcgeography = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='SrcGeography', db_index='srcgeography')
    srctaxonomy = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='SrcTaxonomy', db_index='srctaxonomy')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    addressOfRecord = models.ForeignKey('AddressOfRecord', db_column='AddressOfRecordID', related_name='exchangeouts', null=True, on_delete=protect_with_blockers)
    agentCatalogedBy = models.ForeignKey('Agent', db_column='CatalogedByID', related_name='+', null=False, on_delete=protect_with_blockers)
    agentSentTo = models.ForeignKey('Agent', db_column='SentToOrganizationID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    deaccession = models.ForeignKey('Deaccession', db_column='DeaccessionID', related_name='exchangeouts', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'exchangeout'
        ordering = ()
        indexes = [
            models.Index(fields=['ExchangeDate'], name='ExchangeOutdateIDX'),
            models.Index(fields=['DescriptionOfMaterial'], name='DescriptionOfMaterialIDX2'),
            models.Index(fields=['ExchangeOutNumber'], name='ExchangeOutNumberIDX')
        ]

    save = partialmethod(custom_save)

class Exchangeoutattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='exchangeoutattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='exchangeoutattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    exchangeOut = models.ForeignKey('ExchangeOut', db_column='ExchangeOutID', related_name='exchangeoutattachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'exchangeoutattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Exchangeoutprep(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='exchangeoutprepid')

    # Fields
    comments = models.TextField(blank=True, null=True, unique=False, db_column='Comments', db_index='comments')
    descriptionofmaterial = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='DescriptionOfMaterial', db_index='descriptionofmaterial')
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index='number1')
    quantity = models.IntegerField(blank=True, null=True, unique=False, db_column='Quantity', db_index='quantity')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    exchangeOut = models.ForeignKey('ExchangeOut', db_column='ExchangeOutID', related_name='exchangeoutpreps', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='exchangeoutpreps', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'exchangeoutprep'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='ExchgOutPrepDspMemIDX')
        ]

    save = partialmethod(custom_save)

class Exsiccata(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='exsiccataid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    schedae = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Schedae', db_index='schedae')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=False, max_length=255, null=False, unique=False, db_column='Title', db_index='title')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='exsiccatae', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'exsiccata'
        ordering = ()

    save = partialmethod(custom_save)

class Exsiccataitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='exsiccataitemid')

    # Fields
    fascicle = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Fascicle', db_index='fascicle')
    number = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Number', db_index='number')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='exsiccataitems', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    exsiccata = models.ForeignKey('Exsiccata', db_column='ExsiccataID', related_name='exsiccataitems', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'exsiccataitem'
        ordering = ()

    save = partialmethod(custom_save)

class Extractor(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='extractorid')

    # Fields
    ordernumber = models.IntegerField(blank=False, null=False, unique=False, db_column='OrderNumber', db_index='ordernumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    dnaSequence = models.ForeignKey('DNASequence', db_column='DNASequenceID', related_name='extractors', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'extractor'
        ordering = ('ordernumber',)

    save = partialmethod(custom_save)

class Fieldnotebook(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='fieldnotebookid')

    # Fields
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    enddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EndDate', db_index='enddate')
    location = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Storage', db_index='storage')
    name = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Name', db_index='name')
    startdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='StartDate', db_index='startdate')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collection = models.ForeignKey('Collection', db_column='CollectionID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    ownerAgent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'fieldnotebook'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='FNBNameIDX'),
            models.Index(fields=['StartDate'], name='FNBStartDateIDX'),
            models.Index(fields=['EndDate'], name='FNBEndDateIDX')
        ]

    save = partialmethod(custom_save)

class Fieldnotebookattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='fieldnotebookattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='fieldnotebookattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    fieldNotebook = models.ForeignKey('FieldNotebook', db_column='FieldNotebookID', related_name='attachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'fieldnotebookattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Fieldnotebookpage(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='fieldnotebookpageid')

    # Fields
    description = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Description', db_index='description')
    pagenumber = models.CharField(blank=False, max_length=32, null=False, unique=False, db_column='PageNumber', db_index='pagenumber')
    scandate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ScanDate', db_index='scandate')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    pageSet = models.ForeignKey('FieldNotebookPageSet', db_column='FieldNotebookPageSetID', related_name='pages', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'fieldnotebookpage'
        ordering = ()
        indexes = [
            models.Index(fields=['PageNumber'], name='FNBPPageNumberIDX'),
            models.Index(fields=['ScanDate'], name='FNBPScanDateIDX')
        ]

    save = partialmethod(custom_save)

class Fieldnotebookpageattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='fieldnotebookpageattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='fieldnotebookpageattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    fieldNotebookPage = models.ForeignKey('FieldNotebookPage', db_column='FieldNotebookPageID', related_name='attachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'fieldnotebookpageattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Fieldnotebookpageset(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='fieldnotebookpagesetid')

    # Fields
    description = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Description', db_index='description')
    enddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EndDate', db_index='enddate')
    method = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Method', db_index='method')
    ordernumber = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='OrderNumber', db_index='ordernumber')
    startdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='StartDate', db_index='startdate')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    fieldNotebook = models.ForeignKey('FieldNotebook', db_column='FieldNotebookID', related_name='pagesets', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    sourceAgent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'fieldnotebookpageset'
        ordering = ()
        indexes = [
            models.Index(fields=['StartDate'], name='FNBPSStartDateIDX'),
            models.Index(fields=['EndDate'], name='FNBPSEndDateIDX')
        ]

    save = partialmethod(custom_save)

class Fieldnotebookpagesetattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='fieldnotebookpagesetattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='fieldnotebookpagesetattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    fieldNotebookPageSet = models.ForeignKey('FieldNotebookPageSet', db_column='FieldNotebookPageSetID', related_name='attachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'fieldnotebookpagesetattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Fundingagent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='fundingagentid')

    # Fields
    isprimary = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsPrimary', db_index='isprimary')
    ordernumber = models.IntegerField(blank=False, null=False, unique=False, db_column='OrderNumber', db_index='ordernumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    collectingTrip = models.ForeignKey('CollectingTrip', db_column='CollectingTripID', related_name='fundingagents', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'fundingagent'
        ordering = ()
        indexes = [
            models.Index(fields=['DivisionID'], name='COLTRIPDivIDX')
        ]

    save = partialmethod(custom_save)

class Geocoorddetail(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='geocoorddetailid')

    # Fields
    errorpolygon = models.TextField(blank=True, null=True, unique=False, db_column='ErrorPolygon', db_index='errorpolygon')
    georefaccuracy = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='GeoRefAccuracy', db_index='georefaccuracy')
    georefaccuracyunits = models.CharField(blank=True, max_length=20, null=True, unique=False, db_column='GeoRefAccuracyUnits', db_index='georefaccuracyunits')
    georefcompileddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='GeoRefCompiledDate', db_index='georefcompileddate')
    georefdetdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='GeoRefDetDate', db_index='georefdetdate')
    georefdetref = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='GeoRefDetRef', db_index='georefdetref')
    georefremarks = models.TextField(blank=True, null=True, unique=False, db_column='GeoRefRemarks', db_index='georefremarks')
    georefverificationstatus = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='GeoRefVerificationStatus', db_index='georefverificationstatus')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    maxuncertaintyest = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='MaxUncertaintyEst', db_index='maxuncertaintyest')
    maxuncertaintyestunit = models.CharField(blank=True, max_length=8, null=True, unique=False, db_column='MaxUncertaintyEstUnit', db_index='maxuncertaintyestunit')
    namedplaceextent = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='NamedPlaceExtent', db_index='namedplaceextent')
    nogeorefbecause = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='NoGeoRefBecause', db_index='nogeorefbecause')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    originalcoordsystem = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='OriginalCoordSystem', db_index='originalcoordsystem')
    protocol = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Protocol', db_index='protocol')
    source = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Source', db_index='source')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    uncertaintypolygon = models.TextField(blank=True, null=True, unique=False, db_column='UncertaintyPolygon', db_index='uncertaintypolygon')
    validation = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Validation', db_index='validation')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    geoRefCompiledBy = models.ForeignKey('Agent', db_column='CompiledByID', related_name='+', null=True, on_delete=protect_with_blockers)
    geoRefDetBy = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    locality = models.ForeignKey('Locality', db_column='LocalityID', related_name='geocoorddetails', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geocoorddetail'
        ordering = ()

    save = partialmethod(custom_save)

class Geography(model_extras.Geography):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='geographyid')

    # Fields
    abbrev = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Abbrev', db_index='abbrev')
    centroidlat = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='CentroidLat', db_index='centroidlat')
    centroidlon = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='CentroidLon', db_index='centroidlon')
    commonname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='CommonName', db_index='commonname')
    fullname = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='FullName', db_index='fullname')
    geographycode = models.CharField(blank=True, max_length=24, null=True, unique=False, db_column='GeographyCode', db_index='geographycode')
    gml = models.TextField(blank=True, null=True, unique=False, db_column='GML', db_index='gml')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index='highestchildnodenumber')
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index='isaccepted')
    iscurrent = models.BooleanField(blank=True, null=True, unique=False, db_column='IsCurrent', db_index='iscurrent')
    name = models.CharField(blank=False, max_length=128, null=False, unique=False, db_column='Name', db_index='name')
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index='nodenumber')
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index='number2')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    timestampversion = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampVersion', db_index='timestampversion')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    acceptedGeography = models.ForeignKey('Geography', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('GeographyTreeDef', db_column='GeographyTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionItem = models.ForeignKey('GeographyTreeDefItem', db_column='GeographyTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('Geography', db_column='ParentID', related_name='children', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geography'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='GeoNameIDX'),
            models.Index(fields=['FullName'], name='GeoFullNameIDX')
        ]

    save = partialmethod(custom_save)

class Geographytreedef(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='geographytreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index='fullnamedirection')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geographytreedef'
        ordering = ()

    save = partialmethod(custom_save)

class Geographytreedefitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='geographytreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index='fullnameseparator')
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index='isenforced')
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index='isinfullname')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index='textafter')
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index='textbefore')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index='title')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('GeographyTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=protect_with_blockers)
    treeDef = models.ForeignKey('GeographyTreeDef', db_column='GeographyTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geographytreedefitem'
        ordering = ()

    save = partialmethod(custom_save)

class Geologictimeperiod(model_extras.Geologictimeperiod):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='geologictimeperiodid')

    # Fields
    endperiod = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='EndPeriod', db_index='endperiod')
    enduncertainty = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='EndUncertainty', db_index='enduncertainty')
    fullname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FullName', db_index='fullname')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index='highestchildnodenumber')
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index='isaccepted')
    isbiostrat = models.BooleanField(blank=True, null=True, unique=False, db_column='IsBioStrat', db_index='isbiostrat')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index='nodenumber')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    standard = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Standard', db_index='standard')
    startperiod = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='StartPeriod', db_index='startperiod')
    startuncertainty = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='StartUncertainty', db_index='startuncertainty')
    text1 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    acceptedGeologicTimePeriod = models.ForeignKey('GeologicTimePeriod', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('GeologicTimePeriodTreeDef', db_column='GeologicTimePeriodTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionItem = models.ForeignKey('GeologicTimePeriodTreeDefItem', db_column='GeologicTimePeriodTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('GeologicTimePeriod', db_column='ParentID', related_name='children', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geologictimeperiod'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='GTPNameIDX'),
            models.Index(fields=['FullName'], name='GTPFullNameIDX'),
            models.Index(fields=['GUID'], name='GTPGuidIDX')
        ]

    save = partialmethod(custom_save)

class Geologictimeperiodtreedef(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='geologictimeperiodtreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index='fullnamedirection')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geologictimeperiodtreedef'
        ordering = ()

    save = partialmethod(custom_save)

class Geologictimeperiodtreedefitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='geologictimeperiodtreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index='fullnameseparator')
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index='isenforced')
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index='isinfullname')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index='textafter')
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index='textbefore')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index='title')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('GeologicTimePeriodTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=protect_with_blockers)
    treeDef = models.ForeignKey('GeologicTimePeriodTreeDef', db_column='GeologicTimePeriodTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geologictimeperiodtreedefitem'
        ordering = ()

    save = partialmethod(custom_save)

class Gift(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='giftid')

    # Fields
    contents = models.TextField(blank=True, null=True, unique=False, db_column='Contents', db_index='contents')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    datereceived = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateReceived', db_index='datereceived')
    giftdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='GiftDate', db_index='giftdate')
    giftnumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='GiftNumber', db_index='giftnumber')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    isfinancialresponsibility = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFinancialResponsibility', db_index='isfinancialresponsibility')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    purposeofgift = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='PurposeOfGift', db_index='purposeofgift')
    receivedcomments = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='ReceivedComments', db_index='receivedcomments')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    specialconditions = models.TextField(blank=True, null=True, unique=False, db_column='SpecialConditions', db_index='specialconditions')
    srcgeography = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='SrcGeography', db_index='srcgeography')
    srctaxonomy = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='SrcTaxonomy', db_index='srctaxonomy')
    status = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Status', db_index='status')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    addressOfRecord = models.ForeignKey('AddressOfRecord', db_column='AddressOfRecordID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    deaccession = models.ForeignKey('Deaccession', db_column='DeaccessionID', related_name='gifts', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'gift'
        ordering = ()
        indexes = [
            models.Index(fields=['GiftNumber'], name='GiftNumberIDX'),
            models.Index(fields=['GiftDate'], name='GiftDateIDX')
        ]

    save = partialmethod(custom_save)

class Giftagent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='giftagentid')

    # Fields
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    role = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='Role', db_index='role')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    gift = models.ForeignKey('Gift', db_column='GiftID', related_name='giftagents', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'giftagent'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='GiftAgDspMemIDX')
        ]

    save = partialmethod(custom_save)

class Giftattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='giftattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='giftattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    gift = models.ForeignKey('Gift', db_column='GiftID', related_name='giftattachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'giftattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Giftpreparation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='giftpreparationid')

    # Fields
    descriptionofmaterial = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='DescriptionOfMaterial', db_index='descriptionofmaterial')
    incomments = models.TextField(blank=True, null=True, unique=False, db_column='InComments', db_index='incomments')
    outcomments = models.TextField(blank=True, null=True, unique=False, db_column='OutComments', db_index='outcomments')
    quantity = models.IntegerField(blank=True, null=True, unique=False, db_column='Quantity', db_index='quantity')
    receivedcomments = models.TextField(blank=True, null=True, unique=False, db_column='ReceivedComments', db_index='receivedcomments')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    gift = models.ForeignKey('Gift', db_column='GiftID', related_name='giftpreparations', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='giftpreparations', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'giftpreparation'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='GiftPrepDspMemIDX')
        ]

    save = partialmethod(custom_save)

class Groupperson(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='grouppersonid')

    # Fields
    ordernumber = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='OrderNumber', db_index='ordernumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=False, on_delete=protect_with_blockers)
    group = models.ForeignKey('Agent', db_column='GroupID', related_name='groups', null=False, on_delete=models.CASCADE)
    member = models.ForeignKey('Agent', db_column='MemberID', related_name='members', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'groupperson'
        ordering = ()

    save = partialmethod(custom_save)

class Inforequest(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='inforequestid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    email = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Email', db_index='email')
    firstname = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Firstname', db_index='firstname')
    inforeqnumber = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='InfoReqNumber', db_index='inforeqnumber')
    institution = models.CharField(blank=True, max_length=127, null=True, unique=False, db_column='Institution', db_index='institution')
    lastname = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Lastname', db_index='lastname')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    replydate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ReplyDate', db_index='replydate')
    requestdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='RequestDate', db_index='requestdate')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'inforequest'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='IRColMemIDX')
        ]

    save = partialmethod(custom_save)

class Institution(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='usergroupscopeid')

    # Fields
    altname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='AltName', db_index='altname')
    code = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Code', db_index='code')
    copyright = models.TextField(blank=True, null=True, unique=False, db_column='Copyright', db_index='copyright')
    currentmanagedrelversion = models.CharField(blank=True, max_length=8, null=True, unique=False, db_column='CurrentManagedRelVersion', db_index='currentmanagedrelversion')
    currentmanagedschemaversion = models.CharField(blank=True, max_length=8, null=True, unique=False, db_column='CurrentManagedSchemaVersion', db_index='currentmanagedschemaversion')
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    disclaimer = models.TextField(blank=True, null=True, unique=False, db_column='Disclaimer', db_index='disclaimer')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    hasbeenasked = models.BooleanField(blank=True, null=True, unique=False, db_column='HasBeenAsked', db_index='hasbeenasked')
    iconuri = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='IconURI', db_index='iconuri')
    ipr = models.TextField(blank=True, null=True, unique=False, db_column='Ipr', db_index='ipr')
    isaccessionsglobal = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccessionsGlobal', db_index='isaccessionsglobal')
    isanonymous = models.BooleanField(blank=True, null=True, unique=False, db_column='IsAnonymous', db_index='isanonymous')
    isreleasemanagedglobally = models.BooleanField(blank=True, null=True, unique=False, db_column='IsReleaseManagedGlobally', db_index='isreleasemanagedglobally')
    issecurityon = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsSecurityOn', db_index='issecurityon')
    isserverbased = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsServerBased', db_index='isserverbased')
    issharinglocalities = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsSharingLocalities', db_index='issharinglocalities')
    issinglegeographytree = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsSingleGeographyTree', db_index='issinglegeographytree')
    license = models.TextField(blank=True, null=True, unique=False, db_column='License', db_index='license')
    lsidauthority = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='LsidAuthority', db_index='lsidauthority')
    minimumpwdlength = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='MinimumPwdLength', db_index='minimumpwdlength')
    name = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Name', db_index='name')
    regnumber = models.CharField(blank=True, max_length=24, null=True, unique=False, db_column='RegNumber', db_index='regnumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    termsofuse = models.TextField(blank=True, null=True, unique=False, db_column='TermsOfUse', db_index='termsofuse')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    uri = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Uri', db_index='uri')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    address = models.ForeignKey('Address', db_column='AddressID', related_name='insitutions', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    storageTreeDef = models.ForeignKey('StorageTreeDef', db_column='StorageTreeDefID', related_name='institutions', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'institution'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='InstNameIDX'),
            models.Index(fields=['GUID'], name='InstGuidIDX')
        ]

    save = partialmethod(custom_save)

class Institutionnetwork(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='institutionnetworkid')

    # Fields
    altname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='AltName', db_index='altname')
    code = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Code', db_index='code')
    copyright = models.TextField(blank=True, null=True, unique=False, db_column='Copyright', db_index='copyright')
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    disclaimer = models.TextField(blank=True, null=True, unique=False, db_column='Disclaimer', db_index='disclaimer')
    iconuri = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='IconURI', db_index='iconuri')
    ipr = models.TextField(blank=True, null=True, unique=False, db_column='Ipr', db_index='ipr')
    license = models.TextField(blank=True, null=True, unique=False, db_column='License', db_index='license')
    name = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Name', db_index='name')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    termsofuse = models.TextField(blank=True, null=True, unique=False, db_column='TermsOfUse', db_index='termsofuse')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    uri = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Uri', db_index='uri')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    address = models.ForeignKey('Address', db_column='AddressID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'institutionnetwork'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='InstNetworkNameIDX')
        ]

    save = partialmethod(custom_save)

class Journal(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='journalid')

    # Fields
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    issn = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='ISSN', db_index='issn')
    journalabbreviation = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='JournalAbbreviation', db_index='journalabbreviation')
    journalname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='JournalName', db_index='journalname')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index='text1')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    institution = models.ForeignKey('Institution', db_column='InstitutionID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'journal'
        ordering = ()
        indexes = [
            models.Index(fields=['JournalName'], name='JournalNameIDX'),
            models.Index(fields=['GUID'], name='JournalGUIDIDX')
        ]

    save = partialmethod(custom_save)

class Latlonpolygon(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='latlonpolygonid')

    # Fields
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    ispolyline = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsPolyline', db_index='ispolyline')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    locality = models.ForeignKey('Locality', db_column='LocalityID', related_name='latlonpolygons', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    visualQuery = models.ForeignKey('SpVisualQuery', db_column='SpVisualQueryID', related_name='polygons', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'latlonpolygon'
        ordering = ()

    save = partialmethod(custom_save)

class Latlonpolygonpnt(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='latlonpolygonpntid')

    # Fields
    elevation = models.IntegerField(blank=True, null=True, unique=False, db_column='Elevation', db_index='elevation')
    latitude = models.DecimalField(blank=False, max_digits=22, decimal_places=10, null=False, unique=False, db_column='Latitude', db_index='latitude')
    longitude = models.DecimalField(blank=False, max_digits=22, decimal_places=10, null=False, unique=False, db_column='Longitude', db_index='longitude')
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')

    # Relationships: Many-to-One
    latLonPolygon = models.ForeignKey('LatLonPolygon', db_column='LatLonPolygonID', related_name='points', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'latlonpolygonpnt'
        ordering = ()

    save = partialmethod(custom_save)

class Lithostrat(model_extras.Lithostrat):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='lithostratid')

    # Fields
    fullname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FullName', db_index='fullname')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index='highestchildnodenumber')
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index='isaccepted')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index='nodenumber')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    acceptedLithoStrat = models.ForeignKey('LithoStrat', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('LithoStratTreeDef', db_column='LithoStratTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionItem = models.ForeignKey('LithoStratTreeDefItem', db_column='LithoStratTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('LithoStrat', db_column='ParentID', related_name='children', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'lithostrat'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='LithoNameIDX'),
            models.Index(fields=['FullName'], name='LithoFullNameIDX'),
            models.Index(fields=['GUID'], name='LithoGuidIDX')
        ]

    save = partialmethod(custom_save)

class Lithostrattreedef(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='lithostrattreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index='fullnamedirection')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'lithostrattreedef'
        ordering = ()

    save = partialmethod(custom_save)

class Lithostrattreedefitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='lithostrattreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index='fullnameseparator')
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index='isenforced')
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index='isinfullname')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index='textafter')
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index='textbefore')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index='title')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('LithoStratTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=protect_with_blockers)
    treeDef = models.ForeignKey('LithoStratTreeDef', db_column='LithoStratTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'lithostrattreedefitem'
        ordering = ()

    save = partialmethod(custom_save)

class Loan(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='loanid')

    # Fields
    contents = models.TextField(blank=True, null=True, unique=False, db_column='Contents', db_index='contents')
    currentduedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='CurrentDueDate', db_index='currentduedate')
    dateclosed = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateClosed', db_index='dateclosed')
    datereceived = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateReceived', db_index='datereceived')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    isclosed = models.BooleanField(blank=True, null=True, unique=False, db_column='IsClosed', db_index='isclosed')
    isfinancialresponsibility = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFinancialResponsibility', db_index='isfinancialresponsibility')
    loandate = models.DateTimeField(blank=True, null=True, unique=False, db_column='LoanDate', db_index='loandate')
    loannumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='LoanNumber', db_index='loannumber')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    originalduedate = models.DateTimeField(blank=True, null=True, unique=False, db_column='OriginalDueDate', db_index='originalduedate')
    overduenotisentdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='OverdueNotiSetDate', db_index='overduenotisetdate')
    purposeofloan = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='PurposeOfLoan', db_index='purposeofloan')
    receivedcomments = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='ReceivedComments', db_index='receivedcomments')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    specialconditions = models.TextField(blank=True, null=True, unique=False, db_column='SpecialConditions', db_index='specialconditions')
    srcgeography = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='SrcGeography', db_index='srcgeography')
    srctaxonomy = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='SrcTaxonomy', db_index='srctaxonomy')
    status = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Status', db_index='status')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    addressOfRecord = models.ForeignKey('AddressOfRecord', db_column='AddressOfRecordID', related_name='loans', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'loan'
        ordering = ()
        indexes = [
            models.Index(fields=['LoanNumber'], name='LoanNumberIDX'),
            models.Index(fields=['LoanDate'], name='LoanDateIDX'),
            models.Index(fields=['CurrentDueDate'], name='CurrentDueDateIDX')
        ]

    save = partialmethod(custom_save)

class Loanagent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='loanagentid')

    # Fields
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    role = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='Role', db_index='role')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    loan = models.ForeignKey('Loan', db_column='LoanID', related_name='loanagents', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'loanagent'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='LoanAgDspMemIDX')
        ]

    save = partialmethod(custom_save)

class Loanattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='loanattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='loanattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    loan = models.ForeignKey('Loan', db_column='LoanID', related_name='loanattachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'loanattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Loanpreparation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='loanpreparationid')

    # Fields
    descriptionofmaterial = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='DescriptionOfMaterial', db_index='descriptionofmaterial')
    incomments = models.TextField(blank=True, null=True, unique=False, db_column='InComments', db_index='incomments')
    isresolved = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsResolved', db_index='isresolved')
    outcomments = models.TextField(blank=True, null=True, unique=False, db_column='OutComments', db_index='outcomments')
    quantity = models.IntegerField(blank=True, null=True, unique=False, db_column='Quantity', db_index='quantity')
    quantityresolved = models.IntegerField(blank=True, null=True, unique=False, db_column='QuantityResolved', db_index='quantityresolved')
    quantityreturned = models.IntegerField(blank=True, null=True, unique=False, db_column='QuantityReturned', db_index='quantityreturned')
    receivedcomments = models.TextField(blank=True, null=True, unique=False, db_column='ReceivedComments', db_index='receivedcomments')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    loan = models.ForeignKey('Loan', db_column='LoanID', related_name='loanpreparations', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='loanpreparations', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'loanpreparation'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='LoanPrepDspMemIDX')
        ]

    save = partialmethod(custom_save)

class Loanreturnpreparation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='loanreturnpreparationid')

    # Fields
    quantityresolved = models.IntegerField(blank=True, null=True, unique=False, db_column='QuantityResolved', db_index='quantityresolved')
    quantityreturned = models.IntegerField(blank=True, null=True, unique=False, db_column='QuantityReturned', db_index='quantityreturned')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    returneddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ReturnedDate', db_index='returneddate')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    loanPreparation = models.ForeignKey('LoanPreparation', db_column='LoanPreparationID', related_name='loanreturnpreparations', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    receivedBy = models.ForeignKey('Agent', db_column='ReceivedByID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'loanreturnpreparation'
        ordering = ()
        indexes = [
            models.Index(fields=['ReturnedDate'], name='LoanReturnedDateIDX'),
            models.Index(fields=['DisciplineID'], name='LoanRetPrepDspMemIDX')
        ]

    save = partialmethod(custom_save)

class Locality(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='localityid')

    # Fields
    datum = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Datum', db_index='datum')
    elevationaccuracy = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='ElevationAccuracy', db_index='elevationaccuracy')
    elevationmethod = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='ElevationMethod', db_index='elevationmethod')
    gml = models.TextField(blank=True, null=True, unique=False, db_column='GML', db_index='gml')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    lat1text = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Lat1Text', db_index='lat1text')
    lat2text = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Lat2Text', db_index='lat2text')
    latlongaccuracy = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='LatLongAccuracy', db_index='latlongaccuracy')
    latlongmethod = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='LatLongMethod', db_index='latlongmethod')
    latlongtype = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='LatLongType', db_index='latlongtype')
    latitude1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Latitude1', db_index='latitude1')
    latitude2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Latitude2', db_index='latitude2')
    localityname = models.CharField(blank=False, max_length=1024, null=False, unique=False, db_column='LocalityName', db_index='localityname')
    long1text = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Long1Text', db_index='long1text')
    long2text = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Long2Text', db_index='long2text')
    longitude1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Longitude1', db_index='longitude1')
    longitude2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Longitude2', db_index='longitude2')
    maxelevation = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='MaxElevation', db_index='maxelevation')
    minelevation = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='MinElevation', db_index='minelevation')
    namedplace = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='NamedPlace', db_index='namedplace')
    originalelevationunit = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='OriginalElevationUnit', db_index='originalelevationunit')
    originallatlongunit = models.IntegerField(blank=True, null=True, unique=False, db_column='OriginalLatLongUnit', db_index='originallatlongunit')
    relationtonamedplace = models.CharField(blank=True, max_length=120, null=True, unique=False, db_column='RelationToNamedPlace', db_index='relationtonamedplace')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    sgrstatus = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='SGRStatus', db_index='sgrstatus')
    shortname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='ShortName', db_index='shortname')
    srclatlongunit = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='SrcLatLongUnit', db_index='srclatlongunit')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    uniqueidentifier = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='UniqueIdentifier', db_index='uniqueidentifier')
    verbatimelevation = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='VerbatimElevation', db_index='verbatimelevation')
    verbatimlatitude = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='VerbatimLatitude', db_index='verbatimlatitude')
    verbatimlongitude = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='VerbatimLongitude', db_index='verbatimlongitude')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    visibility = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Visibility', db_index='visibility')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    geography = models.ForeignKey('Geography', db_column='GeographyID', related_name='localities', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    paleoContext = models.ForeignKey('PaleoContext', db_column='PaleoContextID', related_name='localities', null=True, on_delete=protect_with_blockers)
    visibilitySetBy = models.ForeignKey('SpecifyUser', db_column='VisibilitySetByID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'locality'
        ordering = ()
        indexes = [
            models.Index(fields=['LocalityName'], name='localityNameIDX'),
            models.Index(fields=['DisciplineID'], name='LocalityDisciplineIDX'),
            models.Index(fields=['NamedPlace'], name='NamedPlaceIDX'),
            models.Index(fields=['UniqueIdentifier'], name='LocalityUniqueIdentifierIDX'),
            models.Index(fields=['RelationToNamedPlace'], name='RelationToNamedPlaceIDX')
        ]

    save = partialmethod(custom_save)

class Localityattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='localityattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='localityattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    locality = models.ForeignKey('Locality', db_column='LocalityID', related_name='localityattachments', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'localityattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Localitycitation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='localitycitationid')

    # Fields
    figurenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FigureNumber', db_index='figurenumber')
    isfigured = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFigured', db_index='isfigured')
    pagenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PageNumber', db_index='pagenumber')
    platenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PlateNumber', db_index='platenumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    locality = models.ForeignKey('Locality', db_column='LocalityID', related_name='localitycitations', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='localitycitations', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'localitycitation'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineID'], name='LocCitDspMemIDX')
        ]

    save = partialmethod(custom_save)

class Localitydetail(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='localitydetailid')

    # Fields
    basemeridian = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='BaseMeridian', db_index='basemeridian')
    drainage = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Drainage', db_index='drainage')
    enddepth = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='EndDepth', db_index='enddepth')
    enddepthunit = models.CharField(blank=True, max_length=23, null=True, unique=False, db_column='EndDepthUnit', db_index='enddepthunit')
    enddepthverbatim = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='EndDepthVerbatim', db_index='enddepthverbatim')
    gml = models.TextField(blank=True, null=True, unique=False, db_column='GML', db_index='gml')
    huccode = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='HucCode', db_index='huccode')
    island = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Island', db_index='island')
    islandgroup = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='IslandGroup', db_index='islandgroup')
    mgrszone = models.CharField(blank=True, max_length=4, null=True, unique=False, db_column='MgrsZone', db_index='mgrszone')
    nationalparkname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='NationalParkName', db_index='nationalparkname')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    paleolat = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PaleoLat', db_index='paleolat')
    paleolng = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='PaleoLng', db_index='paleolng')
    rangedesc = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='RangeDesc', db_index='rangedesc')
    rangedirection = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='RangeDirection', db_index='rangedirection')
    section = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Section', db_index='section')
    sectionpart = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='SectionPart', db_index='sectionpart')
    startdepth = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='StartDepth', db_index='startdepth')
    startdepthunit = models.CharField(blank=True, max_length=23, null=True, unique=False, db_column='StartDepthUnit', db_index='startdepthunit')
    startdepthverbatim = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='StartDepthVerbatim', db_index='startdepthverbatim')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    township = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Township', db_index='township')
    townshipdirection = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='TownshipDirection', db_index='townshipdirection')
    utmdatum = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='UtmDatum', db_index='utmdatum')
    utmeasting = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='UtmEasting', db_index='utmeasting')
    utmfalseeasting = models.IntegerField(blank=True, null=True, unique=False, db_column='UtmFalseEasting', db_index='utmfalseeasting')
    utmfalsenorthing = models.IntegerField(blank=True, null=True, unique=False, db_column='UtmFalseNorthing', db_index='utmfalsenorthing')
    utmnorthing = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='UtmNorthing', db_index='utmnorthing')
    utmoriglatitude = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='UtmOrigLatitude', db_index='utmoriglatitude')
    utmoriglongitude = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='UtmOrigLongitude', db_index='utmoriglongitude')
    utmscale = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='UtmScale', db_index='utmscale')
    utmzone = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='UtmZone', db_index='utmzone')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    waterbody = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='WaterBody', db_index='waterbody')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    locality = models.ForeignKey('Locality', db_column='LocalityID', related_name='localitydetails', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'localitydetail'
        ordering = ()

    save = partialmethod(custom_save)

class Localitynamealias(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='localitynamealiasid')

    # Fields
    name = models.CharField(blank=False, max_length=255, null=False, unique=False, db_column='Name', db_index='name')
    source = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Source', db_index='source')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    locality = models.ForeignKey('Locality', db_column='LocalityID', related_name='localitynamealiass', null=False, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'localitynamealias'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='LocalityNameAliasIDX')
        ]

    save = partialmethod(custom_save)

class Materialsample(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='materialsampleid')

    # Fields
    ggbn_absorbanceratio260_230 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='GGBNAbsorbanceRatio260_230', db_index='ggbnabsorbanceratio260_230')
    ggbn_absorbanceratio260_280 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='GGBNAbsorbanceRatio260_280', db_index='ggbnabsorbanceratio260_280')
    ggbn_absorbanceratiomethod = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNRAbsorbanceRatioMethod', db_index='ggbnrabsorbanceratiomethod')
    ggbn_concentration = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='GGBNConcentration', db_index='ggbnconcentration')
    ggbn_concentrationunit = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNConcentrationUnit', db_index='ggbnconcentrationunit')
    ggbn_materialsampletype = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNMaterialSampleType', db_index='ggbnmaterialsampletype')
    ggbn_medium = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNMedium', db_index='ggbnmedium')
    ggbn_purificationmethod = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNPurificationMethod', db_index='ggbnpurificationmethod')
    ggbn_quality = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNQuality', db_index='ggbnquality')
    ggbn_qualitycheckdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='GGBNQualityCheckDate', db_index='ggbnqualitycheckdate')
    ggbn_qualityremarks = models.TextField(blank=True, null=True, unique=False, db_column='GGBNQualityRemarks', db_index='ggbnqualityremarks')
    ggbn_sampledesignation = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GGBNSampleDesignation', db_index='ggbnsampledesignation')
    ggbn_samplesize = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='GGBNSampleSize', db_index='ggbnsamplesize')
    ggbn_volume = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='GGBNVolume', db_index='ggbnvolume')
    ggbn_volumeunit = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNVolumeUnit', db_index='ggbnvolumeunit')
    ggbn_weight = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='GGBNWeight', db_index='ggbnweight')
    ggbn_weightmethod = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNWeightMethod', db_index='ggbnweightmethod')
    ggbn_weightunit = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GGBNWeightUnit', db_index='ggbnweightunit')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    extractiondate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ExtractionDate', db_index='extractiondate')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    reservedinteger3 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger3', db_index='reservedinteger3')
    reservedinteger4 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger4', db_index='reservedinteger4')
    reservednumber3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='ReservedNumber3', db_index='reservednumber3')
    reservednumber4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='ReservedNumber4', db_index='reservednumber4')
    reservedtext3 = models.TextField(blank=True, null=True, unique=False, db_column='ReservedText3', db_index='reservedtext3')
    reservedtext4 = models.TextField(blank=True, null=True, unique=False, db_column='ReservedText4', db_index='reservedtext4')
    srabioprojectid = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SRABioProjectID', db_index='srabioprojectid')
    srabiosampleid = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SRABioSampleID', db_index='srabiosampleid')
    sraprojectid = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SRAProjectID', db_index='sraprojectid')
    srasampleid = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='SRASampleID', db_index='srasampleid')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    extractor = models.ForeignKey('Agent', db_column='ExtractorID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='materialsamples', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'materialsample'
        ordering = ()
        indexes = [
            models.Index(fields=['GGBNSampleDesignation'], name='DesignationIDX')
        ]

    save = partialmethod(custom_save)

class Morphbankview(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='morphbankviewid')

    # Fields
    developmentstate = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='DevelopmentState', db_index='developmentstate')
    form = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Form', db_index='form')
    imagingpreparationtechnique = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ImagingPreparationTechnique', db_index='imagingpreparationtechnique')
    imagingtechnique = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ImagingTechnique', db_index='imagingtechnique')
    morphbankexternalviewid = models.IntegerField(blank=True, null=True, unique=False, db_column='MorphBankExternalViewID', db_index='morphbankexternalviewid')
    sex = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Sex', db_index='sex')
    specimenpart = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='SpecimenPart', db_index='specimenpart')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    viewangle = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ViewAngle', db_index='viewangle')
    viewname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ViewName', db_index='viewname')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'morphbankview'
        ordering = ()

    save = partialmethod(custom_save)

class Otheridentifier(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='otheridentifierid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    date2precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date2Precision', db_index='date2precision')
    identifier = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Identifier', db_index='identifier')
    institution = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Institution', db_index='institution')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    agent1 = models.ForeignKey('Agent', db_column='Agent1ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent2 = models.ForeignKey('Agent', db_column='Agent2ID', related_name='+', null=True, on_delete=protect_with_blockers)
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='otheridentifiers', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'otheridentifier'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='OthIdColMemIDX')
        ]

    save = partialmethod(custom_save)

class Paleocontext(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='paleocontextid')

    # Fields
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    paleocontextname = models.CharField(blank=True, max_length=80, null=True, unique=False, db_column='PaleoContextName', db_index='paleocontextname')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')

    # Relationships: Many-to-One
    bioStrat = models.ForeignKey('GeologicTimePeriod', db_column='BioStratID', related_name='biostratspaleocontext', null=True, on_delete=protect_with_blockers)
    chronosStrat = models.ForeignKey('GeologicTimePeriod', db_column='ChronosStratID', related_name='chronosstratspaleocontext', null=True, on_delete=protect_with_blockers)
    chronosStratEnd = models.ForeignKey('GeologicTimePeriod', db_column='ChronosStratEndID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    lithoStrat = models.ForeignKey('LithoStrat', db_column='LithoStratID', related_name='paleocontexts', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'paleocontext'
        ordering = ()
        indexes = [
            models.Index(fields=['PaleoContextName'], name='PaleoCxtNameIDX'),
            models.Index(fields=['DisciplineID'], name='PaleoCxtDisciplineIDX')
        ]

    save = partialmethod(custom_save)

class Pcrperson(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='pcrpersonid')

    # Fields
    ordernumber = models.IntegerField(blank=False, null=False, unique=False, db_column='OrderNumber', db_index='ordernumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    dnaSequence = models.ForeignKey('DNASequence', db_column='DNASequenceID', related_name='pcrpersons', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'pcrperson'
        ordering = ()

    save = partialmethod(custom_save)

class Permit(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='permitid')

    # Fields
    copyright = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Copyright', db_index='copyright')
    enddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EndDate', db_index='enddate')
    isavailable = models.BooleanField(blank=True, null=True, unique=False, db_column='IsAvailable', db_index='isavailable')
    isrequired = models.BooleanField(blank=True, null=True, unique=False, db_column='IsRequired', db_index='isrequired')
    issueddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='IssuedDate', db_index='issueddate')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    permitnumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='PermitNumber', db_index='permitnumber')
    permittext = models.TextField(blank=True, null=True, unique=False, db_column='PermitText', db_index='permittext')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    renewaldate = models.DateTimeField(blank=True, null=True, unique=False, db_column='RenewalDate', db_index='renewaldate')
    reservedinteger1 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger1', db_index='reservedinteger1')
    reservedinteger2 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger2', db_index='reservedinteger2')
    reservedtext3 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ReservedText3', db_index='reservedtext3')
    reservedtext4 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ReservedText4', db_index='reservedtext4')
    startdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='StartDate', db_index='startdate')
    status = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Status', db_index='status')
    statusqualifier = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='StatusQualifier', db_index='statusqualifier')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    institution = models.ForeignKey('Institution', db_column='InstitutionID', related_name='+', null=False, on_delete=protect_with_blockers)
    issuedBy = models.ForeignKey('Agent', db_column='IssuedByID', related_name='+', null=True, on_delete=protect_with_blockers)
    issuedTo = models.ForeignKey('Agent', db_column='IssuedToID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'permit'
        ordering = ()
        indexes = [
            models.Index(fields=['PermitNumber'], name='PermitNumberIDX'),
            models.Index(fields=['IssuedDate'], name='IssuedDateIDX')
        ]

    save = partialmethod(custom_save)

class Permitattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='permitattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='permitattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    permit = models.ForeignKey('Permit', db_column='PermitID', related_name='permitattachments', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'permitattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Picklist(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='picklistid')

    # Fields
    fieldname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='FieldName', db_index='fieldname')
    filterfieldname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FilterFieldName', db_index='filterfieldname')
    filtervalue = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FilterValue', db_index='filtervalue')
    formatter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Formatter', db_index='formatter')
    issystem = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsSystem', db_index='issystem')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    readonly = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='ReadOnly', db_index='readonly')
    sizelimit = models.IntegerField(blank=True, null=True, unique=False, db_column='SizeLimit', db_index='sizelimit')
    sorttype = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='SortType', db_index='sorttype')
    tablename = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TableName', db_index='tablename')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collection = models.ForeignKey('Collection', db_column='CollectionID', related_name='picklists', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'picklist'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='PickListNameIDX')
        ]

    save = partialmethod(custom_save)

class Picklistitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='picklistitemid')

    # Fields
    ordinal = models.IntegerField(blank=True, null=True, unique=False, db_column='Ordinal', db_index='ordinal')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=False, max_length=1024, null=False, unique=False, db_column='Title', db_index='title')
    value = models.CharField(blank=True, max_length=1024, null=True, unique=False, db_column='Value', db_index='value')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    pickList = models.ForeignKey('PickList', db_column='PickListID', related_name='picklistitems', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'picklistitem'
        ordering = ('ordinal',)

    save = partialmethod(custom_save)

class Preptype(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='preptypeid')

    # Fields
    isloanable = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsLoanable', db_index='isloanable')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collection = models.ForeignKey('Collection', db_column='CollectionID', related_name='preptypes', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'preptype'
        ordering = ()

    save = partialmethod(custom_save)

class Preparation(model_extras.Preparation):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='preparationid')

    # Fields
    barcode = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='BarCode', db_index='barcode')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    countamt = models.IntegerField(blank=True, null=True, unique=False, db_column='CountAmt', db_index='countamt')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    date2precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date2Precision', db_index='date2precision')
    date3 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date3', db_index='date3')
    date3precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date3Precision', db_index='date3precision')
    date4 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date4', db_index='date4')
    date4precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date4Precision', db_index='date4precision')
    description = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Description', db_index='description')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    prepareddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='PreparedDate', db_index='prepareddate')
    prepareddateprecision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='PreparedDatePrecision', db_index='prepareddateprecision')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    reservedinteger3 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger3', db_index='reservedinteger3')
    reservedinteger4 = models.IntegerField(blank=True, null=True, unique=False, db_column='ReservedInteger4', db_index='reservedinteger4')
    samplenumber = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='SampleNumber', db_index='samplenumber')
    status = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Status', db_index='status')
    storagelocation = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='StorageLocation', db_index='storagelocation')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.TextField(blank=True, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.TextField(blank=True, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text13', db_index='text13')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.TextField(blank=True, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.TextField(blank=True, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.TextField(blank=True, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.TextField(blank=True, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')

    # Relationships: Many-to-One
    alternateStorage = models.ForeignKey('Storage', db_column='AlternateStorageID', related_name='+', null=True, on_delete=protect_with_blockers)
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='preparations', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    prepType = models.ForeignKey('PrepType', db_column='PrepTypeID', related_name='+', null=False, on_delete=protect_with_blockers)
    preparationAttribute = models.ForeignKey('PreparationAttribute', db_column='PreparationAttributeID', related_name='preparations', null=True, on_delete=protect_with_blockers)
    preparedByAgent = models.ForeignKey('Agent', db_column='PreparedByID', related_name='+', null=True, on_delete=protect_with_blockers)
    storage = models.ForeignKey('Storage', db_column='StorageID', related_name='preparations', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'preparation'
        ordering = ()
        indexes = [
            models.Index(fields=['preparedDate'], name='PreparedDateIDX'),
            models.Index(fields=['CollectionMemberID'], name='PrepColMemIDX'),
            models.Index(fields=['GUID'], name='PrepGuidIDX'),
            models.Index(fields=['SampleNumber'], name='PrepSampleNumIDX'),
            models.Index(fields=['BarCode'], name='PrepBarCodeIDX')
        ]

    save = partialmethod(custom_save)

class Preparationattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='preparationattachmentid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='preparationattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='preparationattachments', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'preparationattachment'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='PrepAttColMemIDX')
        ]

    save = partialmethod(custom_save)

class Preparationattr(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='attrid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    dblvalue = models.FloatField(blank=True, null=True, unique=False, db_column='DoubleValue', db_index='doublevalue')
    strvalue = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='StrValue', db_index='strvalue')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('AttributeDef', db_column='AttributeDefID', related_name='preparationattrs', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationId', related_name='preparationattrs', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'preparationattr'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='PrepAttrColMemIDX')
        ]

    save = partialmethod(custom_save)

class Preparationattribute(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='preparationattributeid')

    # Fields
    attrdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='AttrDate', db_index='attrdate')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number5', db_index='number5')
    number6 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number6', db_index='number6')
    number7 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number7', db_index='number7')
    number8 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number8', db_index='number8')
    number9 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Number9', db_index='number9')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.TextField(blank=True, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text13', db_index='text13')
    text14 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text14', db_index='text14')
    text15 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text15', db_index='text15')
    text16 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text16', db_index='text16')
    text17 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text17', db_index='text17')
    text18 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text18', db_index='text18')
    text19 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text19', db_index='text19')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text20 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text20', db_index='text20')
    text21 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text21', db_index='text21')
    text22 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text22', db_index='text22')
    text23 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text23', db_index='text23')
    text24 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text24', db_index='text24')
    text25 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text25', db_index='text25')
    text26 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text26', db_index='text26')
    text3 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'preparationattribute'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='PrepAttrsColMemIDX')
        ]

    save = partialmethod(custom_save)

class Preparationproperty(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='preparationpropertyid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date10 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date10', db_index='date10')
    date11 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date11', db_index='date11')
    date12 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date12', db_index='date12')
    date13 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date13', db_index='date13')
    date14 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date14', db_index='date14')
    date15 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date15', db_index='date15')
    date16 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date16', db_index='date16')
    date17 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date17', db_index='date17')
    date18 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date18', db_index='date18')
    date19 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date19', db_index='date19')
    date2 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date2', db_index='date2')
    date20 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date20', db_index='date20')
    date3 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date3', db_index='date3')
    date4 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date4', db_index='date4')
    date5 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date5', db_index='date5')
    date6 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date6', db_index='date6')
    date7 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date7', db_index='date7')
    date8 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date8', db_index='date8')
    date9 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date9', db_index='date9')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    integer1 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer10 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer10', db_index='integer10')
    integer11 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer11', db_index='integer11')
    integer12 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer12', db_index='integer12')
    integer13 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer13', db_index='integer13')
    integer14 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer14', db_index='integer14')
    integer15 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer15', db_index='integer15')
    integer16 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer16', db_index='integer16')
    integer17 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer17', db_index='integer17')
    integer18 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer18', db_index='integer18')
    integer19 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer19', db_index='integer19')
    integer2 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer20 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer20', db_index='integer20')
    integer21 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer21', db_index='integer21')
    integer22 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer22', db_index='integer22')
    integer23 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer23', db_index='integer23')
    integer24 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer24', db_index='integer24')
    integer25 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer25', db_index='integer25')
    integer26 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer26', db_index='integer26')
    integer27 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer27', db_index='integer27')
    integer28 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer28', db_index='integer28')
    integer29 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer29', db_index='integer29')
    integer3 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer30 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer30', db_index='integer30')
    integer4 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    integer6 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer6', db_index='integer6')
    integer7 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer7', db_index='integer7')
    integer8 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer8', db_index='integer8')
    integer9 = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Integer9', db_index='integer9')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number10 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number10', db_index='number10')
    number11 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number11', db_index='number11')
    number12 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number12', db_index='number12')
    number13 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number13', db_index='number13')
    number14 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number14', db_index='number14')
    number15 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number15', db_index='number15')
    number16 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number16', db_index='number16')
    number17 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number17', db_index='number17')
    number18 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number18', db_index='number18')
    number19 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number19', db_index='number19')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number20 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number20', db_index='number20')
    number21 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number21', db_index='number21')
    number22 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number22', db_index='number22')
    number23 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number23', db_index='number23')
    number24 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number24', db_index='number24')
    number25 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number25', db_index='number25')
    number26 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number26', db_index='number26')
    number27 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number27', db_index='number27')
    number28 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number28', db_index='number28')
    number29 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number29', db_index='number29')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number30 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number30', db_index='number30')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    number6 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number6', db_index='number6')
    number7 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number7', db_index='number7')
    number8 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number8', db_index='number8')
    number9 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number9', db_index='number9')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text13', db_index='text13')
    text14 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text14', db_index='text14')
    text15 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text15', db_index='text15')
    text16 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text16', db_index='text16')
    text17 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text17', db_index='text17')
    text18 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text18', db_index='text18')
    text19 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text19', db_index='text19')
    text2 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text2', db_index='text2')
    text20 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text20', db_index='text20')
    text21 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text21', db_index='text21')
    text22 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text22', db_index='text22')
    text23 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text23', db_index='text23')
    text24 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text24', db_index='text24')
    text25 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text25', db_index='text25')
    text26 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text26', db_index='text26')
    text27 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text27', db_index='text27')
    text28 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text28', db_index='text28')
    text29 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text29', db_index='text29')
    text3 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text3', db_index='text3')
    text30 = models.CharField(blank=True, max_length=100, null=True, unique=False, db_column='Text30', db_index='text30')
    text31 = models.TextField(blank=True, null=True, unique=False, db_column='Text31', db_index='text31')
    text32 = models.TextField(blank=True, null=True, unique=False, db_column='Text32', db_index='text32')
    text33 = models.TextField(blank=True, null=True, unique=False, db_column='Text33', db_index='text33')
    text34 = models.TextField(blank=True, null=True, unique=False, db_column='Text34', db_index='text34')
    text35 = models.TextField(blank=True, null=True, unique=False, db_column='Text35', db_index='text35')
    text36 = models.TextField(blank=True, null=True, unique=False, db_column='Text36', db_index='text36')
    text37 = models.TextField(blank=True, null=True, unique=False, db_column='Text37', db_index='text37')
    text38 = models.TextField(blank=True, null=True, unique=False, db_column='Text38', db_index='text38')
    text39 = models.TextField(blank=True, null=True, unique=False, db_column='Text39', db_index='text39')
    text4 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text4', db_index='text4')
    text40 = models.TextField(blank=True, null=True, unique=False, db_column='Text40', db_index='text40')
    text5 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno10 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo10', db_index='yesno10')
    yesno11 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo11', db_index='yesno11')
    yesno12 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo12', db_index='yesno12')
    yesno13 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo13', db_index='yesno13')
    yesno14 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo14', db_index='yesno14')
    yesno15 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo15', db_index='yesno15')
    yesno16 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo16', db_index='yesno16')
    yesno17 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo17', db_index='yesno17')
    yesno18 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo18', db_index='yesno18')
    yesno19 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo19', db_index='yesno19')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno20 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo20', db_index='yesno20')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')
    yesno6 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo6', db_index='yesno6')
    yesno7 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo7', db_index='yesno7')
    yesno8 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo8', db_index='yesno8')
    yesno9 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo9', db_index='yesno9')

    # Relationships: Many-to-One
    agent1 = models.ForeignKey('Agent', db_column='Agent1ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent10 = models.ForeignKey('Agent', db_column='Agent10ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent11 = models.ForeignKey('Agent', db_column='Agent11ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent12 = models.ForeignKey('Agent', db_column='Agent12ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent13 = models.ForeignKey('Agent', db_column='Agent13ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent14 = models.ForeignKey('Agent', db_column='Agent14ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent15 = models.ForeignKey('Agent', db_column='Agent15ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent16 = models.ForeignKey('Agent', db_column='Agent16ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent17 = models.ForeignKey('Agent', db_column='Agent17ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent18 = models.ForeignKey('Agent', db_column='Agent18ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent19 = models.ForeignKey('Agent', db_column='Agent19ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent2 = models.ForeignKey('Agent', db_column='Agent2ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent20 = models.ForeignKey('Agent', db_column='Agent20ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent3 = models.ForeignKey('Agent', db_column='Agent3ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent4 = models.ForeignKey('Agent', db_column='Agent4ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent5 = models.ForeignKey('Agent', db_column='Agent5ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent6 = models.ForeignKey('Agent', db_column='Agent6ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent7 = models.ForeignKey('Agent', db_column='Agent7ID', related_name='+', null=True, on_delete=protect_with_blockers)
    agent8 = models.ForeignKey('Agent', db_column='Agent8D', related_name='+', null=True, on_delete=protect_with_blockers)
    agent9 = models.ForeignKey('Agent', db_column='Agent9ID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    preparation = models.ForeignKey('Preparation', db_column='PreparationID', related_name='preparationproperties', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'preparationproperty'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='PREPPROPColMemIDX')
        ]

    save = partialmethod(custom_save)

class Project(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='projectid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    enddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EndDate', db_index='enddate')
    grantagency = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GrantAgency', db_index='grantagency')
    grantnumber = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='GrantNumber', db_index='grantnumber')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    projectdescription = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='ProjectDescription', db_index='projectdescription')
    projectname = models.CharField(blank=False, max_length=128, null=False, unique=False, db_column='ProjectName', db_index='projectname')
    projectnumber = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='ProjectNumber', db_index='projectnumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    startdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='StartDate', db_index='startdate')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    url = models.CharField(blank=True, max_length=1024, null=True, unique=False, db_column='URL', db_index='url')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    agent = models.ForeignKey('Agent', db_column='ProjectAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'project'
        ordering = ()
        indexes = [
            models.Index(fields=['ProjectName'], name='ProjectNameIDX'),
            models.Index(fields=['ProjectNumber'], name='ProjectNumberIDX')
        ]

    save = partialmethod(custom_save)

class Recordset(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='recordsetid')

    # Fields
    allpermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='AllPermissionLevel', db_index='allpermissionlevel')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    dbtableid = models.IntegerField(blank=False, null=False, unique=False, db_column='TableID', db_index='tableid')
    grouppermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='GroupPermissionLevel', db_index='grouppermissionlevel')
    name = models.CharField(blank=False, max_length=280, null=False, unique=False, db_column='Name', db_index='name')
    ownerpermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='OwnerPermissionLevel', db_index='ownerpermissionlevel')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    group = models.ForeignKey('SpPrincipal', db_column='SpPrincipalID', related_name='+', null=True, on_delete=protect_with_blockers)
    infoRequest = models.ForeignKey('InfoRequest', db_column='InfoRequestID', related_name='recordsets', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='+', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'recordset'
        ordering = ()
        indexes = [
            models.Index(fields=['name'], name='RecordSetNameIDX')
        ]

    save = partialmethod(custom_save)

class Recordsetitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='recordsetitemid')

    # Fields
    order = models.IntegerField(blank=True, null=True, unique=False, db_column='OrderNumber', db_index='ordernumber')
    recordid = models.IntegerField(blank=False, null=False, unique=False, db_column='RecordId', db_index='recordid')

    # Relationships: Many-to-One
    recordSet = models.ForeignKey('RecordSet', db_column='RecordSetID', related_name='recordsetitems', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'recordsetitem'
        ordering = ('recordid',)

    save = partialmethod(custom_save)

class Referencework(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='referenceworkid')

    # Fields
    doi = models.TextField(blank=True, null=True, unique=False, db_column='Doi', db_index='doi')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    ispublished = models.BooleanField(blank=True, null=True, unique=False, db_column='IsPublished', db_index='ispublished')
    isbn = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='ISBN', db_index='isbn')
    librarynumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='LibraryNumber', db_index='librarynumber')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    pages = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Pages', db_index='pages')
    placeofpublication = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PlaceOfPublication', db_index='placeofpublication')
    publisher = models.CharField(blank=True, max_length=250, null=True, unique=False, db_column='Publisher', db_index='publisher')
    referenceworktype = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='ReferenceWorkType', db_index='referenceworktype')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=False, max_length=500, null=False, unique=False, db_column='Title', db_index='title')
    uri = models.TextField(blank=True, null=True, unique=False, db_column='Uri', db_index='uri')
    url = models.CharField(blank=True, max_length=1024, null=True, unique=False, db_column='URL', db_index='url')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    volume = models.CharField(blank=True, max_length=25, null=True, unique=False, db_column='Volume', db_index='volume')
    workdate = models.CharField(blank=True, max_length=25, null=True, unique=False, db_column='WorkDate', db_index='workdate')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    containedRFParent = models.ForeignKey('ReferenceWork', db_column='ContainedRFParentID', related_name='containedreferenceworks', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    institution = models.ForeignKey('Institution', db_column='InstitutionID', related_name='+', null=False, on_delete=protect_with_blockers)
    journal = models.ForeignKey('Journal', db_column='JournalID', related_name='referenceworks', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'referencework'
        ordering = ()
        indexes = [
            models.Index(fields=['Title'], name='RefWrkTitleIDX'),
            models.Index(fields=['Publisher'], name='RefWrkPublisherIDX'),
            models.Index(fields=['GUID'], name='RefWrkGuidIDX'),
            models.Index(fields=['ISBN'], name='ISBNIDX')
        ]

    save = partialmethod(custom_save)

class Referenceworkattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='referenceworkattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='referenceworkattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='referenceworkattachments', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'referenceworkattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Repositoryagreement(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='repositoryagreementid')

    # Fields
    datereceived = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateReceived', db_index='datereceived')
    enddate = models.DateTimeField(blank=True, null=True, unique=False, db_column='EndDate', db_index='enddate')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    repositoryagreementnumber = models.CharField(blank=False, max_length=60, null=False, unique=False, db_column='RepositoryAgreementNumber', db_index='repositoryagreementnumber')
    startdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='StartDate', db_index='startdate')
    status = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Status', db_index='status')
    text1 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Text3', db_index='text3')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    addressOfRecord = models.ForeignKey('AddressOfRecord', db_column='AddressOfRecordID', related_name='repositoryagreements', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    originator = models.ForeignKey('Agent', db_column='AgentID', related_name='+', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'repositoryagreement'
        ordering = ()
        indexes = [
            models.Index(fields=['RepositoryAgreementNumber'], name='RefWrkNumberIDX'),
            models.Index(fields=['StartDate'], name='RefWrkStartDate')
        ]

    save = partialmethod(custom_save)

class Repositoryagreementattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='repositoryagreementattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=True, null=True, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='repositoryagreementattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    repositoryAgreement = models.ForeignKey('RepositoryAgreement', db_column='RepositoryAgreementID', related_name='repositoryagreementattachments', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'repositoryagreementattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Shipment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='shipmentid')

    # Fields
    insuredforamount = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='InsuredForAmount', db_index='insuredforamount')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    numberofpackages = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='NumberOfPackages', db_index='numberofpackages')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    shipmentdate = models.DateTimeField(blank=True, null=True, unique=False, db_column='ShipmentDate', db_index='shipmentdate')
    shipmentmethod = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='ShipmentMethod', db_index='shipmentmethod')
    shipmentnumber = models.CharField(blank=False, max_length=50, null=False, unique=False, db_column='ShipmentNumber', db_index='shipmentnumber')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    weight = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Weight', db_index='weight')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    borrow = models.ForeignKey('Borrow', db_column='BorrowID', related_name='shipments', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=False, on_delete=protect_with_blockers)
    exchangeOut = models.ForeignKey('ExchangeOut', db_column='ExchangeOutID', related_name='shipments', null=True, on_delete=protect_with_blockers)
    gift = models.ForeignKey('Gift', db_column='GiftID', related_name='shipments', null=True, on_delete=models.CASCADE)
    loan = models.ForeignKey('Loan', db_column='LoanID', related_name='shipments', null=True, on_delete=models.CASCADE)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    shippedBy = models.ForeignKey('Agent', db_column='ShippedByID', related_name='+', null=True, on_delete=protect_with_blockers)
    shippedTo = models.ForeignKey('Agent', db_column='ShippedToID', related_name='+', null=True, on_delete=protect_with_blockers)
    shipper = models.ForeignKey('Agent', db_column='ShipperID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'shipment'
        ordering = ()
        indexes = [
            models.Index(fields=['ShipmentNumber'], name='ShipmentNumberIDX'),
            models.Index(fields=['ShipmentDate'], name='ShipmentDateIDX'),
            models.Index(fields=['DisciplineID'], name='ShipmentDspMemIDX'),
            models.Index(fields=['ShipmentMethod'], name='ShipmentMethodIDX')
        ]

    save = partialmethod(custom_save)

class Spappresource(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spappresourceid')

    # Fields
    allpermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='AllPermissionLevel', db_index='allpermissionlevel')
    description = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Description', db_index='description')
    grouppermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='GroupPermissionLevel', db_index='grouppermissionlevel')
    level = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='Level', db_index='level')
    metadata = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='MetaData', db_index='metadata')
    mimetype = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='MimeType', db_index='mimetype')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    ownerpermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='OwnerPermissionLevel', db_index='ownerpermissionlevel')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    group = models.ForeignKey('SpPrincipal', db_column='SpPrincipalID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    spAppResourceDir = models.ForeignKey('SpAppResourceDir', db_column='SpAppResourceDirID', related_name='sppersistedappresources', null=False, on_delete=models.CASCADE)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='spappresources', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'spappresource'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='SpAppResNameIDX'),
            models.Index(fields=['MimeType'], name='SpAppResMimeTypeIDX')
        ]

    save = partialmethod(custom_save)

class Spappresourcedata(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spappresourcedataid')

    # Fields
    data = models.TextField(blank=True, null=True, unique=False, db_column='data', db_index='data')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    spAppResource = models.ForeignKey('SpAppResource', db_column='SpAppResourceID', related_name='spappresourcedatas', null=True, on_delete=models.CASCADE)
    spViewSetObj = models.ForeignKey('SpViewSetObj', db_column='SpViewSetObjID', related_name='spappresourcedatas', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'spappresourcedata'
        ordering = ()

    save = partialmethod(custom_save)

class Spappresourcedir(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spappresourcedirid')

    # Fields
    disciplinetype = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='DisciplineType', db_index='disciplinetype')
    ispersonal = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsPersonal', db_index='ispersonal')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    usertype = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='UserType', db_index='usertype')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collection = models.ForeignKey('Collection', db_column='CollectionID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='spappresourcedirs', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'spappresourcedir'
        ordering = ()
        indexes = [
            models.Index(fields=['DisciplineType'], name='SpAppResourceDirDispTypeIDX')
        ]

    save = partialmethod(custom_save)

class Spauditlog(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spauditlogid')

    # Fields
    action = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='Action', db_index='action')
    parentrecordid = models.IntegerField(blank=True, null=True, unique=False, db_column='ParentRecordId', db_index='parentrecordid')
    parenttablenum = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='ParentTableNum', db_index='parenttablenum')
    recordid = models.IntegerField(blank=True, null=True, unique=False, db_column='RecordId', db_index='recordid')
    recordversion = models.IntegerField(blank=False, null=False, unique=False, db_column='RecordVersion', db_index='recordversion')
    tablenum = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='TableNum', db_index='tablenum')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spauditlog'
        ordering = ()

    save = partialmethod(custom_save)

class Spauditlogfield(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spauditlogfieldid')

    # Fields
    fieldname = models.CharField(blank=False, max_length=128, null=False, unique=False, db_column='FieldName', db_index='fieldname')
    newvalue = models.TextField(blank=True, null=True, unique=False, db_column='NewValue', db_index='newvalue')
    oldvalue = models.TextField(blank=True, null=True, unique=False, db_column='OldValue', db_index='oldvalue')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    spAuditLog = models.ForeignKey('SpAuditLog', db_column='SpAuditLogID', related_name='fields', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spauditlogfield'
        ordering = ()

    save = partialmethod(custom_save)

class Spexportschema(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spexportschemaid')

    # Fields
    description = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Description', db_index='description')
    schemaname = models.CharField(blank=True, max_length=80, null=True, unique=False, db_column='SchemaName', db_index='schemaname')
    schemaversion = models.CharField(blank=True, max_length=80, null=True, unique=False, db_column='SchemaVersion', db_index='schemaversion')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='spexportschemas', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spexportschema'
        ordering = ()

    save = partialmethod(custom_save)

class Spexportschemaitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spexportschemaitemid')

    # Fields
    datatype = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='DataType', db_index='datatype')
    description = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Description', db_index='description')
    fieldname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='FieldName', db_index='fieldname')
    formatter = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Formatter', db_index='formatter')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    spExportSchema = models.ForeignKey('SpExportSchema', db_column='SpExportSchemaID', related_name='spexportschemaitems', null=False, on_delete=protect_with_blockers)
    spLocaleContainerItem = models.ForeignKey('SpLocaleContainerItem', db_column='SpLocaleContainerItemID', related_name='spexportschemaitems', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spexportschemaitem'
        ordering = ()

    save = partialmethod(custom_save)

class Spexportschemaitemmapping(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spexportschemaitemmappingid')

    # Fields
    exportedfieldname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='ExportedFieldName', db_index='exportedfieldname')
    extensionitem = models.BooleanField(blank=True, null=True, unique=False, db_column='ExtensionItem', db_index='extensionitem')
    remarks = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Remarks', db_index='remarks')
    rowtype = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='RowType', db_index='rowtype')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    exportSchemaItem = models.ForeignKey('SpExportSchemaItem', db_column='ExportSchemaItemID', related_name='+', null=True, on_delete=protect_with_blockers)
    exportSchemaMapping = models.ForeignKey('SpExportSchemaMapping', db_column='SpExportSchemaMappingID', related_name='mappings', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    queryField = models.ForeignKey('SpQueryField', db_column='SpQueryFieldID', related_name='mappings', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spexportschemaitemmapping'
        ordering = ()

    save = partialmethod(custom_save)

class Spexportschemamapping(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spexportschemamappingid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    description = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Description', db_index='description')
    mappingname = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='MappingName', db_index='mappingname')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampexported = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimeStampExported', db_index='timestampexported')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spexportschemamapping'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='SPEXPSCHMMAPColMemIDX')
        ]

    save = partialmethod(custom_save)

class Spfieldvaluedefault(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spfieldvaluedefaultid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    fieldname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FieldName', db_index='fieldname')
    idvalue = models.IntegerField(blank=True, null=True, unique=False, db_column='IdValue', db_index='idvalue')
    strvalue = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='StrValue', db_index='strvalue')
    tablename = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='TableName', db_index='tablename')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spfieldvaluedefault'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='SpFieldValueDefaultColMemIDX')
        ]

    save = partialmethod(custom_save)

class Splocalecontainer(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='splocalecontainerid')

    # Fields
    aggregator = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Aggregator', db_index='aggregator')
    defaultui = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='DefaultUI', db_index='defaultui')
    format = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Format', db_index='format')
    ishidden = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsHidden', db_index='ishidden')
    issystem = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsSystem', db_index='issystem')
    isuiformatter = models.BooleanField(blank=True, null=True, unique=False, db_column='IsUIFormatter', db_index='isuiformatter')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    picklistname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='PickListName', db_index='picklistname')
    schematype = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='SchemaType', db_index='schematype')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='splocalecontainers', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'splocalecontainer'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='SpLocaleContainerNameIDX')
        ]

    save = partialmethod(custom_save)

class Splocalecontaineritem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='splocalecontaineritemid')

    # Fields
    format = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Format', db_index='format')
    ishidden = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsHidden', db_index='ishidden')
    isrequired = models.BooleanField(blank=True, null=True, unique=False, db_column='IsRequired', db_index='isrequired')
    issystem = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsSystem', db_index='issystem')
    isuiformatter = models.BooleanField(blank=True, null=True, unique=False, db_column='IsUIFormatter', db_index='isuiformatter')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    picklistname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='PickListName', db_index='picklistname')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    type = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    weblinkname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='WebLinkName', db_index='weblinkname')

    # Relationships: Many-to-One
    container = models.ForeignKey('SpLocaleContainer', db_column='SpLocaleContainerID', related_name='items', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'splocalecontaineritem'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='SpLocaleContainerItemNameIDX')
        ]

    save = partialmethod(custom_save)

class Splocaleitemstr(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='splocaleitemstrid')

    # Fields
    country = models.CharField(blank=True, max_length=2, null=True, unique=False, db_column='Country', db_index='country')
    language = models.CharField(blank=False, max_length=2, null=False, unique=False, db_column='Language', db_index='language')
    text = models.CharField(blank=False, max_length=2048, null=False, unique=False, db_column='Text', db_index='text')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    variant = models.CharField(blank=True, max_length=2, null=True, unique=False, db_column='Variant', db_index='variant')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    containerDesc = models.ForeignKey('SpLocaleContainer', db_column='SpLocaleContainerDescID', related_name='descs', null=True, on_delete=protect_with_blockers)
    containerName = models.ForeignKey('SpLocaleContainer', db_column='SpLocaleContainerNameID', related_name='names', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    itemDesc = models.ForeignKey('SpLocaleContainerItem', db_column='SpLocaleContainerItemDescID', related_name='descs', null=True, on_delete=protect_with_blockers)
    itemName = models.ForeignKey('SpLocaleContainerItem', db_column='SpLocaleContainerItemNameID', related_name='names', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'splocaleitemstr'
        ordering = ()
        indexes = [
            models.Index(fields=['Language'], name='SpLocaleLanguageIDX'),
            models.Index(fields=['Country'], name='SpLocaleCountyIDX')
        ]

    save = partialmethod(custom_save)

class Sppermission(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='sppermissionid')

    # Fields
    actions = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Actions', db_index='actions')
    name = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Name', db_index='name')
    permissionclass = models.CharField(blank=False, max_length=256, null=False, unique=False, db_column='PermissionClass', db_index='permissionclass')
    targetid = models.IntegerField(blank=True, null=True, unique=False, db_column='TargetId', db_index='targetid')

    class Meta:
        db_table = 'sppermission'
        ordering = ()

    save = partialmethod(custom_save)

class Spprincipal(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spprincipalid')

    # Fields
    groupsubclass = models.CharField(blank=False, max_length=255, null=False, unique=False, db_column='GroupSubClass', db_index='groupsubclass')
    grouptype = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='groupType', db_index='grouptype')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    priority = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='Priority', db_index='priority')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    userGroupScopeID = models.IntegerField(blank=True, null=True, db_column='userGroupScopeID')

    class Meta:
        db_table = 'spprincipal'
        ordering = ()

    save = partialmethod(custom_save)

class Spquery(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spqueryid')

    # Fields
    contextname = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='ContextName', db_index='contextname')
    contexttableid = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='ContextTableId', db_index='contexttableid')
    countonly = models.BooleanField(blank=True, null=True, unique=False, db_column='CountOnly', db_index='countonly')
    formatauditrecids = models.BooleanField(blank=True, null=True, unique=False, db_column='FormatAuditRecIds', db_index='formatauditrecids')
    isfavorite = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFavorite', db_index='isfavorite')
    name = models.CharField(blank=False, max_length=256, null=False, unique=False, db_column='Name', db_index='name')
    ordinal = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    searchsynonymy = models.BooleanField(blank=True, null=True, unique=False, db_column='SearchSynonymy', db_index='searchsynonymy')
    selectdistinct = models.BooleanField(blank=True, null=True, unique=False, db_column='SelectDistinct', db_index='selectdistinct')
    smushed = models.BooleanField(blank=True, null=True, unique=False, db_column='Smushed', db_index='smushed')
    sqlstr = models.TextField(blank=True, null=True, unique=False, db_column='SqlStr', db_index='sqlstr')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='spquerys', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spquery'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='SpQueryNameIDX')
        ]

    save = partialmethod(custom_save)

class Spqueryfield(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spqueryfieldid')

    # Fields
    allownulls = models.BooleanField(blank=True, null=True, unique=False, db_column='AllowNulls', db_index='allownulls')
    alwaysfilter = models.BooleanField(blank=True, null=True, unique=False, db_column='AlwaysFilter', db_index='alwaysfilter')
    columnalias = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='ColumnAlias', db_index='columnalias')
    contexttableident = models.IntegerField(blank=True, null=True, unique=False, db_column='ContextTableIdent', db_index='contexttableident')
    endvalue = models.TextField(blank=True, null=True, unique=False, db_column='EndValue', db_index='endvalue')
    fieldname = models.CharField(blank=False, max_length=32, null=False, unique=False, db_column='FieldName', db_index='fieldname')
    formatname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='FormatName', db_index='formatname')
    isdisplay = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsDisplay', db_index='isdisplay')
    isnot = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsNot', db_index='isnot')
    isprompt = models.BooleanField(blank=True, null=True, unique=False, db_column='IsPrompt', db_index='isprompt')
    isrelfld = models.BooleanField(blank=True, null=True, unique=False, db_column='IsRelFld', db_index='isrelfld')
    operend = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='OperEnd', db_index='operend')
    operstart = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='OperStart', db_index='operstart')
    position = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='Position', db_index='position')
    sorttype = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='SortType', db_index='sorttype')
    startvalue = models.TextField(blank=False, null=False, unique=False, db_column='StartValue', db_index='startvalue')
    stringid = models.CharField(blank=False, max_length=500, null=False, unique=False, db_column='StringId', db_index='stringid')
    tablelist = models.CharField(blank=False, max_length=500, null=False, unique=False, db_column='TableList', db_index='tablelist')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    query = models.ForeignKey('SpQuery', db_column='SpQueryID', related_name='fields', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'spqueryfield'
        ordering = ('position',)

    save = partialmethod(custom_save)

class Spreport(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spreportid')

    # Fields
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    repeatcount = models.IntegerField(blank=True, null=True, unique=False, db_column='RepeatCount', db_index='repeatcount')
    repeatfield = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='RepeatField', db_index='repeatfield')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: One-to-One
    workbenchTemplate = models.OneToOneField('WorkbenchTemplate', db_column='WorkbenchTemplateID', related_name='+', null=True, on_delete=protect_with_blockers)

    # Relationships: Many-to-One
    appResource = models.ForeignKey('SpAppResource', db_column='AppResourceID', related_name='spreports', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    query = models.ForeignKey('SpQuery', db_column='SpQueryID', related_name='reports', null=True, on_delete=protect_with_blockers)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='+', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spreport'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='SpReportNameIDX')
        ]

    save = partialmethod(custom_save)

class Spsymbiotainstance(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spsymbiotainstanceid')

    # Fields
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    description = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Description', db_index='description')
    instancename = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='InstanceName', db_index='instancename')
    lastcachebuild = models.DateTimeField(blank=True, null=True, unique=False, db_column='LastCacheBuild', db_index='lastcachebuild')
    lastpull = models.DateTimeField(blank=True, null=True, unique=False, db_column='LastPull', db_index='lastpull')
    lastpush = models.DateTimeField(blank=True, null=True, unique=False, db_column='LastPush', db_index='lastpush')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    symbiotakey = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='SymbiotaKey', db_index='symbiotakey')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    schemaMapping = models.ForeignKey('SpExportSchemaMapping', db_column='SchemaMappingID', related_name='symbiotainstances', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spsymbiotainstance'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='SPSYMINSTColMemIDX')
        ]

    save = partialmethod(custom_save)

class Sptasksemaphore(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='tasksemaphoreid')

    # Fields
    context = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Context', db_index='context')
    islocked = models.BooleanField(blank=True, null=True, unique=False, db_column='IsLocked', db_index='islocked')
    lockedtime = models.DateTimeField(blank=True, null=True, unique=False, db_column='LockedTime', db_index='lockedtime')
    machinename = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='MachineName', db_index='machinename')
    scope = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Scope', db_index='scope')
    taskname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='TaskName', db_index='taskname')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    usagecount = models.IntegerField(blank=True, null=True, unique=False, db_column='UsageCount', db_index='usagecount')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    collection = models.ForeignKey('Collection', db_column='CollectionID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    discipline = models.ForeignKey('Discipline', db_column='DisciplineID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    owner = models.ForeignKey('SpecifyUser', db_column='OwnerID', related_name='tasksemaphores', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'sptasksemaphore'
        ordering = ()

    save = partialmethod(custom_save)

class Spversion(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spversionid')

    # Fields
    appname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='AppName', db_index='appname')
    appversion = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='AppVersion', db_index='appversion')
    dbclosedby = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='DbClosedBy', db_index='dbclosedby')
    isdbclosed = models.BooleanField(blank=True, null=True, unique=False, db_column='IsDBClosed', db_index='isdbclosed')
    schemaversion = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='SchemaVersion', db_index='schemaversion')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    workbenchschemaversion = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='WorkbenchSchemaVersion', db_index='workbenchschemaversion')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spversion'
        ordering = ()

    save = partialmethod(custom_save)

class Spviewsetobj(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spviewsetobjid')

    # Fields
    description = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Description', db_index='description')
    filename = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FileName', db_index='filename')
    level = models.SmallIntegerField(blank=False, null=False, unique=False, db_column='Level', db_index='level')
    metadata = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='MetaData', db_index='metadata')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    spAppResourceDir = models.ForeignKey('SpAppResourceDir', db_column='SpAppResourceDirID', related_name='sppersistedviewsets', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spviewsetobj'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='SpViewObjNameIDX')
        ]

    save = partialmethod(custom_save)

class Spvisualquery(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='spvisualqueryid')

    # Fields
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index='description')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='+', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'spvisualquery'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='SpVisualQueryNameIDX')
        ]

    save = partialmethod(custom_save)

class Specifyuser(model_extras.Specifyuser):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='specifyuserid')

    # Fields
    accumminloggedin = models.BigIntegerField(blank=True, null=True, unique=False, db_column='AccumMinLoggedIn', db_index='accumminloggedin')
    email = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='EMail', db_index='email')
    isloggedin = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsLoggedIn', db_index='isloggedin')
    isloggedinreport = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsLoggedInReport', db_index='isloggedinreport')
    logincollectionname = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='LoginCollectionName', db_index='logincollectionname')
    logindisciplinename = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='LoginDisciplineName', db_index='logindisciplinename')
    loginouttime = models.DateTimeField(blank=True, null=True, unique=False, db_column='LoginOutTime', db_index='loginouttime')
    name = models.CharField(blank=False, max_length=64, null=False, unique=True, db_column='Name', db_index='name')
    password = models.CharField(blank=False, max_length=255, null=False, unique=False, db_column='Password', db_index='password')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    usertype = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='UserType', db_index='usertype')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'specifyuser'
        ordering = ()

    save = partialmethod(custom_save)

class Storage(model_extras.Storage):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='storageid')

    # Fields
    abbrev = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Abbrev', db_index='abbrev')
    fullname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FullName', db_index='fullname')
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index='highestchildnodenumber')
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index='isaccepted')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index='nodenumber')
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index='number2')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    timestampversion = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampVersion', db_index='timestampversion')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    acceptedStorage = models.ForeignKey('Storage', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('StorageTreeDef', db_column='StorageTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionItem = models.ForeignKey('StorageTreeDefItem', db_column='StorageTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('Storage', db_column='ParentID', related_name='children', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'storage'
        ordering = ()
        indexes = [
            models.Index(fields=['Name'], name='StorNameIDX'),
            models.Index(fields=['FullName'], name='StorFullNameIDX')
        ]

    save = partialmethod(custom_save)

class Storageattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='storageattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='storageattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    storage = models.ForeignKey('Storage', db_column='StorageID', related_name='storageattachments', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'storageattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Storagetreedef(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='storagetreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index='fullnamedirection')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'storagetreedef'
        ordering = ()

    save = partialmethod(custom_save)

class Storagetreedefitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='storagetreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index='fullnameseparator')
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index='isenforced')
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index='isinfullname')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index='textafter')
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index='textbefore')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index='title')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('StorageTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=protect_with_blockers)
    treeDef = models.ForeignKey('StorageTreeDef', db_column='StorageTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'storagetreedefitem'
        ordering = ()

    save = partialmethod(custom_save)

class Taxon(model_extras.Taxon):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxonid')

    # Fields
    author = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Author', db_index='author')
    citesstatus = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='CitesStatus', db_index='citesstatus')
    colstatus = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='COLStatus', db_index='colstatus')
    commonname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='CommonName', db_index='commonname')
    cultivarname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='CultivarName', db_index='cultivarname')
    environmentalprotectionstatus = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='EnvironmentalProtectionStatus', db_index='environmentalprotectionstatus')
    esastatus = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='EsaStatus', db_index='esastatus')
    fullname = models.CharField(blank=True, max_length=512, null=True, unique=False, db_column='FullName', db_index='fullname')
    groupnumber = models.CharField(blank=True, max_length=20, null=True, unique=False, db_column='GroupNumber', db_index='groupnumber')
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index='guid')
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index='highestchildnodenumber')
    integer1 = models.BigIntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.BigIntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.BigIntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index='integer4')
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index='integer5')
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index='isaccepted')
    ishybrid = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsHybrid', db_index='ishybrid')
    isisnumber = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='IsisNumber', db_index='isisnumber')
    labelformat = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='LabelFormat', db_index='labelformat')
    lsid = models.TextField(blank=True, null=True, unique=False, db_column='LSID', db_index='lsid')
    name = models.CharField(blank=False, max_length=256, null=False, unique=False, db_column='Name', db_index='name')
    ncbitaxonnumber = models.CharField(blank=True, max_length=8, null=True, unique=False, db_column='NcbiTaxonNumber', db_index='ncbitaxonnumber')
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index='nodenumber')
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    source = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Source', db_index='source')
    taxonomicserialnumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='TaxonomicSerialNumber', db_index='taxonomicserialnumber')
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text13', db_index='text13')
    text14 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text14', db_index='text14')
    text15 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text15', db_index='text15')
    text16 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text16', db_index='text16')
    text17 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text17', db_index='text17')
    text18 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text18', db_index='text18')
    text19 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text19', db_index='text19')
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index='text2')
    text20 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text20', db_index='text20')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    text6 = models.TextField(blank=True, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.TextField(blank=True, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.TextField(blank=True, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.TextField(blank=True, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    unitind1 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitInd1', db_index='unitind1')
    unitind2 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitInd2', db_index='unitind2')
    unitind3 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitInd3', db_index='unitind3')
    unitind4 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitInd4', db_index='unitind4')
    unitname1 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitName1', db_index='unitname1')
    unitname2 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitName2', db_index='unitname2')
    unitname3 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitName3', db_index='unitname3')
    unitname4 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitName4', db_index='unitname4')
    usfwscode = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='UsfwsCode', db_index='usfwscode')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    visibility = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Visibility', db_index='visibility')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno10 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo10', db_index='yesno10')
    yesno11 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo11', db_index='yesno11')
    yesno12 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo12', db_index='yesno12')
    yesno13 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo13', db_index='yesno13')
    yesno14 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo14', db_index='yesno14')
    yesno15 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo15', db_index='yesno15')
    yesno16 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo16', db_index='yesno16')
    yesno17 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo17', db_index='yesno17')
    yesno18 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo18', db_index='yesno18')
    yesno19 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo19', db_index='yesno19')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')
    yesno6 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo6', db_index='yesno6')
    yesno7 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo7', db_index='yesno7')
    yesno8 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo8', db_index='yesno8')
    yesno9 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo9', db_index='yesno9')

    # Relationships: Many-to-One
    acceptedTaxon = models.ForeignKey('Taxon', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('TaxonTreeDef', db_column='TaxonTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionItem = models.ForeignKey('TaxonTreeDefItem', db_column='TaxonTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    hybridParent1 = models.ForeignKey('Taxon', db_column='HybridParent1ID', related_name='hybridchildren1', null=True, on_delete=protect_with_blockers)
    hybridParent2 = models.ForeignKey('Taxon', db_column='HybridParent2ID', related_name='hybridchildren2', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('Taxon', db_column='ParentID', related_name='children', null=True, on_delete=protect_with_blockers)
    taxonAttribute = models.ForeignKey('TaxonAttribute', db_column='TaxonAttributeID', related_name='taxons', null=True, on_delete=protect_with_blockers)
    visibilitySetBy = models.ForeignKey('SpecifyUser', db_column='VisibilitySetByID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'taxon'
        ordering = ()
        indexes = [
            models.Index(fields=['GUID'], name='TaxonGuidIDX'),
            models.Index(fields=['TaxonomicSerialNumber'], name='TaxonomicSerialNumberIDX'),
            models.Index(fields=['CommonName'], name='TaxonCommonNameIDX'),
            models.Index(fields=['Name'], name='TaxonNameIDX'),
            models.Index(fields=['FullName'], name='TaxonFullNameIDX'),
            models.Index(fields=['EnvironmentalProtectionStatus'], name='EnvironmentalProtectionStatusIDX')
        ]

    save = partialmethod(custom_save)

class Taxonattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxonattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='taxonattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    taxon = models.ForeignKey('Taxon', db_column='TaxonID', related_name='taxonattachments', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'taxonattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Taxonattribute(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxonattributeid')

    # Fields
    date1 = models.DateTimeField(blank=True, null=True, unique=False, db_column='Date1', db_index='date1')
    date1precision = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Date1Precision', db_index='date1precision')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number10 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number10', db_index='number10')
    number11 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number11', db_index='number11')
    number12 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number12', db_index='number12')
    number13 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number13', db_index='number13')
    number14 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number14', db_index='number14')
    number15 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number15', db_index='number15')
    number16 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number16', db_index='number16')
    number17 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number17', db_index='number17')
    number18 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number18', db_index='number18')
    number19 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number19', db_index='number19')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number20 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number20', db_index='number20')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    number6 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number6', db_index='number6')
    number7 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number7', db_index='number7')
    number8 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number8', db_index='number8')
    number9 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number9', db_index='number9')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text1', db_index='text1')
    text10 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text10', db_index='text10')
    text11 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text11', db_index='text11')
    text12 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text12', db_index='text12')
    text13 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text13', db_index='text13')
    text14 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text14', db_index='text14')
    text15 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text15', db_index='text15')
    text16 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text16', db_index='text16')
    text17 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text17', db_index='text17')
    text18 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text18', db_index='text18')
    text19 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text19', db_index='text19')
    text2 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text2', db_index='text2')
    text20 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text20', db_index='text20')
    text21 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text21', db_index='text21')
    text22 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text22', db_index='text22')
    text23 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text23', db_index='text23')
    text24 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text24', db_index='text24')
    text25 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text25', db_index='text25')
    text26 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text26', db_index='text26')
    text27 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text27', db_index='text27')
    text28 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text28', db_index='text28')
    text29 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text29', db_index='text29')
    text3 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text3', db_index='text3')
    text30 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text30', db_index='text30')
    text31 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text31', db_index='text31')
    text32 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text32', db_index='text32')
    text33 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text33', db_index='text33')
    text34 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text34', db_index='text34')
    text35 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text35', db_index='text35')
    text36 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text36', db_index='text36')
    text37 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text37', db_index='text37')
    text38 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text38', db_index='text38')
    text39 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text39', db_index='text39')
    text4 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text4', db_index='text4')
    text40 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text40', db_index='text40')
    text41 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text41', db_index='text41')
    text42 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text42', db_index='text42')
    text43 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text43', db_index='text43')
    text44 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text44', db_index='text44')
    text45 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text45', db_index='text45')
    text46 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text46', db_index='text46')
    text47 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text47', db_index='text47')
    text48 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text48', db_index='text48')
    text49 = models.TextField(blank=True, null=True, unique=False, db_column='Text49', db_index='text49')
    text5 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text5', db_index='text5')
    text50 = models.TextField(blank=True, null=True, unique=False, db_column='Text50', db_index='text50')
    text51 = models.TextField(blank=True, null=True, unique=False, db_column='Text51', db_index='text51')
    text52 = models.TextField(blank=True, null=True, unique=False, db_column='Text52', db_index='text52')
    text53 = models.TextField(blank=True, null=True, unique=False, db_column='Text53', db_index='text53')
    text54 = models.TextField(blank=True, null=True, unique=False, db_column='Text54', db_index='text54')
    text55 = models.TextField(blank=True, null=True, unique=False, db_column='Text55', db_index='text55')
    text56 = models.TextField(blank=True, null=True, unique=False, db_column='Text56', db_index='text56')
    text57 = models.TextField(blank=True, null=True, unique=False, db_column='Text57', db_index='text57')
    text58 = models.TextField(blank=True, null=True, unique=False, db_column='Text58', db_index='text58')
    text6 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text6', db_index='text6')
    text7 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text7', db_index='text7')
    text8 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text8', db_index='text8')
    text9 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text9', db_index='text9')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno10 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo10', db_index='yesno10')
    yesno11 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo11', db_index='yesno11')
    yesno12 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo12', db_index='yesno12')
    yesno13 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo13', db_index='yesno13')
    yesno14 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo14', db_index='yesno14')
    yesno15 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo15', db_index='yesno15')
    yesno16 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo16', db_index='yesno16')
    yesno17 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo17', db_index='yesno17')
    yesno18 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo18', db_index='yesno18')
    yesno19 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo19', db_index='yesno19')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno20 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo20', db_index='yesno20')
    yesno21 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo21', db_index='yesno21')
    yesno22 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo22', db_index='yesno22')
    yesno23 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo23', db_index='yesno23')
    yesno24 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo24', db_index='yesno24')
    yesno25 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo25', db_index='yesno25')
    yesno26 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo26', db_index='yesno26')
    yesno27 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo27', db_index='yesno27')
    yesno28 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo28', db_index='yesno28')
    yesno29 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo29', db_index='yesno29')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')
    yesno30 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo30', db_index='yesno30')
    yesno31 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo31', db_index='yesno31')
    yesno32 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo32', db_index='yesno32')
    yesno33 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo33', db_index='yesno33')
    yesno34 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo34', db_index='yesno34')
    yesno35 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo35', db_index='yesno35')
    yesno36 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo36', db_index='yesno36')
    yesno37 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo37', db_index='yesno37')
    yesno38 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo38', db_index='yesno38')
    yesno39 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo39', db_index='yesno39')
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index='yesno4')
    yesno40 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo40', db_index='yesno40')
    yesno41 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo41', db_index='yesno41')
    yesno42 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo42', db_index='yesno42')
    yesno43 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo43', db_index='yesno43')
    yesno44 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo44', db_index='yesno44')
    yesno45 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo45', db_index='yesno45')
    yesno46 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo46', db_index='yesno46')
    yesno47 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo47', db_index='yesno47')
    yesno48 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo48', db_index='yesno48')
    yesno49 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo49', db_index='yesno49')
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index='yesno5')
    yesno50 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo50', db_index='yesno50')
    yesno51 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo51', db_index='yesno51')
    yesno52 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo52', db_index='yesno52')
    yesno53 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo53', db_index='yesno53')
    yesno54 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo54', db_index='yesno54')
    yesno55 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo55', db_index='yesno55')
    yesno56 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo56', db_index='yesno56')
    yesno57 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo57', db_index='yesno57')
    yesno58 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo58', db_index='yesno58')
    yesno59 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo59', db_index='yesno59')
    yesno6 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo6', db_index='yesno6')
    yesno60 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo60', db_index='yesno60')
    yesno61 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo61', db_index='yesno61')
    yesno62 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo62', db_index='yesno62')
    yesno63 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo63', db_index='yesno63')
    yesno64 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo64', db_index='yesno64')
    yesno65 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo65', db_index='yesno65')
    yesno66 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo66', db_index='yesno66')
    yesno67 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo67', db_index='yesno67')
    yesno68 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo68', db_index='yesno68')
    yesno69 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo69', db_index='yesno69')
    yesno7 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo7', db_index='yesno7')
    yesno70 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo70', db_index='yesno70')
    yesno71 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo71', db_index='yesno71')
    yesno72 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo72', db_index='yesno72')
    yesno73 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo73', db_index='yesno73')
    yesno74 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo74', db_index='yesno74')
    yesno75 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo75', db_index='yesno75')
    yesno76 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo76', db_index='yesno76')
    yesno77 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo77', db_index='yesno77')
    yesno78 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo78', db_index='yesno78')
    yesno79 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo79', db_index='yesno79')
    yesno8 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo8', db_index='yesno8')
    yesno80 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo80', db_index='yesno80')
    yesno81 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo81', db_index='yesno81')
    yesno82 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo82', db_index='yesno82')
    yesno9 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo9', db_index='yesno9')

    # Relationships: Many-to-One
    agent1 = models.ForeignKey('Agent', db_column='Agent1ID', related_name='+', null=True, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'taxonattribute'
        ordering = ()

    save = partialmethod(custom_save)

class Taxoncitation(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxoncitationid')

    # Fields
    figurenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FigureNumber', db_index='figurenumber')
    isfigured = models.BooleanField(blank=True, null=True, unique=False, db_column='IsFigured', db_index='isfigured')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    pagenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PageNumber', db_index='pagenumber')
    platenumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='PlateNumber', db_index='platenumber')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    referenceWork = models.ForeignKey('ReferenceWork', db_column='ReferenceWorkID', related_name='taxoncitations', null=False, on_delete=protect_with_blockers)
    taxon = models.ForeignKey('Taxon', db_column='TaxonID', related_name='taxoncitations', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'taxoncitation'
        ordering = ()

    save = partialmethod(custom_save)

class Taxontreedef(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxontreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index='fullnamedirection')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    remarks = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: One-to-One

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'taxontreedef'
        ordering = ()

    save = partialmethod(custom_save)

class Taxontreedefitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxontreedefitemid')

    # Fields
    formattoken = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FormatToken', db_index='formattoken')
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index='fullnameseparator')
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index='isenforced')
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index='isinfullname')
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index='name')
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index='rankid')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index='textafter')
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index='textbefore')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index='title')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('TaxonTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=protect_with_blockers)
    treeDef = models.ForeignKey('TaxonTreeDef', db_column='TaxonTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'taxontreedefitem'
        ordering = ()

    save = partialmethod(custom_save)

class Treatmentevent(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='treatmenteventid')

    # Fields
    dateboxed = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateBoxed', db_index='dateboxed')
    datecleaned = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateCleaned', db_index='datecleaned')
    datecompleted = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateCompleted', db_index='datecompleted')
    datereceived = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateReceived', db_index='datereceived')
    datetoisolation = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateToIsolation', db_index='datetoisolation')
    datetreatmentended = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateTreatmentEnded', db_index='datetreatmentended')
    datetreatmentstarted = models.DateTimeField(blank=True, null=True, unique=False, db_column='DateTreatmentStarted', db_index='datetreatmentstarted')
    fieldnumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='FieldNumber', db_index='fieldnumber')
    location = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Storage', db_index='storage')
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index='number4')
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index='number5')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index='text4')
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index='text5')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    treatmentnumber = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='TreatmentNumber', db_index='treatmentnumber')
    type = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Type', db_index='type')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')

    # Relationships: Many-to-One
    accession = models.ForeignKey('Accession', db_column='AccessionID', related_name='treatmentevents', null=True, on_delete=protect_with_blockers)
    authorizedBy = models.ForeignKey('Agent', db_column='AuthorizedByID', related_name='+', null=True, on_delete=protect_with_blockers)
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='treatmentevents', null=True, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    performedBy = models.ForeignKey('Agent', db_column='PerformedByID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'treatmentevent'
        ordering = ()
        indexes = [
            models.Index(fields=['DateReceived'], name='TEDateReceivedIDX'),
            models.Index(fields=['DateTreatmentStarted'], name='TEDateTreatmentStartedIDX'),
            models.Index(fields=['FieldNumber'], name='TEFieldNumberIDX'),
            models.Index(fields=['TreatmentNumber'], name='TETreatmentNumberIDX')
        ]

    save = partialmethod(custom_save)

class Treatmenteventattachment(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='treatmenteventattachmentid')

    # Fields
    ordinal = models.IntegerField(blank=False, null=False, unique=False, db_column='Ordinal', db_index='ordinal')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    attachment = models.ForeignKey('Attachment', db_column='AttachmentID', related_name='treatmenteventattachments', null=False, on_delete=protect_with_blockers)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    treatmentEvent = models.ForeignKey('TreatmentEvent', db_column='TreatmentEventID', related_name='treatmenteventattachments', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'treatmenteventattachment'
        ordering = ()

    save = partialmethod(custom_save)

class Voucherrelationship(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='voucherrelationshipid')

    # Fields
    collectioncode = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='CollectionCode', db_index='collectioncode')
    collectionmemberid = models.IntegerField(blank=False, null=False, unique=False, db_column='CollectionMemberID', db_index='collectionmemberid')
    institutioncode = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='InstitutionCode', db_index='institutioncode')
    integer1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index='integer1')
    integer2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index='integer2')
    integer3 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index='integer3')
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index='number1')
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index='number2')
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index='number3')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index='text1')
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index='text2')
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index='text3')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    urllink = models.CharField(blank=True, max_length=1024, null=True, unique=False, db_column='UrlLink', db_index='urllink')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    vouchernumber = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='VoucherNumber', db_index='vouchernumber')
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index='yesno1')
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index='yesno2')
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index='yesno3')

    # Relationships: Many-to-One
    collectionObject = models.ForeignKey('CollectionObject', db_column='CollectionObjectID', related_name='voucherrelationships', null=False, on_delete=models.CASCADE)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'voucherrelationship'
        ordering = ()
        indexes = [
            models.Index(fields=['CollectionMemberID'], name='VRXDATColMemIDX')
        ]

    save = partialmethod(custom_save)

class Workbench(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='workbenchid')

    # Fields
    allpermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='AllPermissionLevel', db_index='allpermissionlevel')
    dbtableid = models.IntegerField(blank=True, null=True, unique=False, db_column='TableID', db_index='tableid')
    exportinstitutionname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ExportInstitutionName', db_index='exportinstitutionname')
    exportedfromtablename = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='ExportedFromTableName', db_index='exportedfromtablename')
    formid = models.IntegerField(blank=True, null=True, unique=False, db_column='FormId', db_index='formid')
    grouppermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='GroupPermissionLevel', db_index='grouppermissionlevel')
    lockedbyusername = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='LockedByUserName', db_index='lockedbyusername')
    name = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Name', db_index='name')
    ownerpermissionlevel = models.IntegerField(blank=True, null=True, unique=False, db_column='OwnerPermissionLevel', db_index='ownerpermissionlevel')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    srcfilepath = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='SrcFilePath', db_index='srcfilepath')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    group = models.ForeignKey('SpPrincipal', db_column='SpPrincipalID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='workbenches', null=False, on_delete=protect_with_blockers)
    workbenchTemplate = models.ForeignKey('WorkbenchTemplate', db_column='WorkbenchTemplateID', related_name='workbenches', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'workbench'
        ordering = ()
        indexes = [
            models.Index(fields=['name'], name='WorkbenchNameIDX')
        ]

    save = partialmethod(custom_save)

class Workbenchdataitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='workbenchdataitemid')

    # Fields
    celldata = models.TextField(blank=True, null=True, unique=False, db_column='CellData', db_index='celldata')
    rownumber = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='RowNumber', db_index='rownumber')
    validationstatus = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='ValidationStatus', db_index='validationstatus')

    # Relationships: Many-to-One
    workbenchRow = models.ForeignKey('WorkbenchRow', db_column='WorkbenchRowID', related_name='workbenchdataitems', null=False, on_delete=models.DO_NOTHING)
    workbenchTemplateMappingItem = models.ForeignKey('WorkbenchTemplateMappingItem', db_column='WorkbenchTemplateMappingItemID', related_name='workbenchdataitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'workbenchdataitem'
        ordering = ()
        indexes = [
            models.Index(fields=['rowNumber'], name='DataItemRowNumberIDX')
        ]

    save = partialmethod(custom_save)

class Workbenchrow(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='workbenchrowid')

    # Fields
    biogeomancerresults = models.TextField(blank=True, null=True, unique=False, db_column='BioGeomancerResults', db_index='biogeomancerresults')
    cardimagedata = models.TextField(blank=True, null=True, unique=False, db_column='CardImageData', db_index='cardimagedata')
    cardimagefullpath = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='CardImageFullPath', db_index='cardimagefullpath')
    errorestimate = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='ErrorEstimate', db_index='errorestimate')
    errorpolygon = models.TextField(blank=True, null=True, unique=False, db_column='ErrorPolygon', db_index='errorpolygon')
    lat1text = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Lat1Text', db_index='lat1text')
    lat2text = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Lat2Text', db_index='lat2text')
    long1text = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Long1Text', db_index='long1text')
    long2text = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='Long2Text', db_index='long2text')
    recordid = models.IntegerField(blank=True, null=True, unique=False, db_column='RecordID', db_index='recordid')
    rownumber = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='RowNumber', db_index='rownumber')
    sgrstatus = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='SGRStatus', db_index='sgrstatus')
    uploadstatus = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='UploadStatus', db_index='uploadstatus')

    # Relationships: Many-to-One
    workbench = models.ForeignKey('Workbench', db_column='WorkbenchID', related_name='workbenchrows', null=False, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = 'workbenchrow'
        ordering = ()
        indexes = [
            models.Index(fields=['RowNumber'], name='RowNumberIDX')
        ]

    save = partialmethod(custom_save)

class Workbenchrowexportedrelationship(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='workbenchrowexportedrelationshipid')

    # Fields
    recordid = models.IntegerField(blank=True, null=True, unique=False, db_column='RecordID', db_index='recordid')
    relationshipname = models.CharField(blank=True, max_length=120, null=True, unique=False, db_column='RelationshipName', db_index='relationshipname')
    sequence = models.IntegerField(blank=True, null=True, unique=False, db_column='Sequence', db_index='sequence')
    tablename = models.CharField(blank=True, max_length=120, null=True, unique=False, db_column='TableName', db_index='tablename')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    workbenchRow = models.ForeignKey('WorkbenchRow', db_column='WorkbenchRowID', related_name='workbenchrowexportedrelationships', null=False, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = 'workbenchrowexportedrelationship'
        ordering = ()

    save = partialmethod(custom_save)

class Workbenchrowimage(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='workbenchrowimageid')

    # Fields
    attachtotablename = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='AttachToTableName', db_index='attachtotablename')
    cardimagedata = models.TextField(blank=True, null=True, unique=False, db_column='CardImageData', db_index='cardimagedata')
    cardimagefullpath = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='CardImageFullPath', db_index='cardimagefullpath')
    imageorder = models.IntegerField(blank=True, null=True, unique=False, db_column='ImageOrder', db_index='imageorder')

    # Relationships: Many-to-One
    workbenchRow = models.ForeignKey('WorkbenchRow', db_column='WorkbenchRowID', related_name='workbenchrowimages', null=False, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = 'workbenchrowimage'
        ordering = ()

    save = partialmethod(custom_save)

class Workbenchtemplate(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='workbenchtemplateid')

    # Fields
    name = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Name', db_index='name')
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index='remarks')
    srcfilepath = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='SrcFilePath', db_index='srcfilepath')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    specifyUser = models.ForeignKey('SpecifyUser', db_column='SpecifyUserID', related_name='workbenchtemplates', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'workbenchtemplate'
        ordering = ()

    save = partialmethod(custom_save)

class Workbenchtemplatemappingitem(model_extras.models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='workbenchtemplatemappingitemid')

    # Fields
    caption = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Caption', db_index='caption')
    carryforward = models.BooleanField(blank=True, null=True, unique=False, db_column='CarryForward', db_index='carryforward')
    datafieldlength = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='DataFieldLength', db_index='datafieldlength')
    fieldname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FieldName', db_index='fieldname')
    fieldtype = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='FieldType', db_index='fieldtype')
    importedcolname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='ImportedColName', db_index='importedcolname')
    iseditable = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEditable', db_index='iseditable')
    isexportabletocontent = models.BooleanField(blank=True, null=True, unique=False, db_column='IsExportableToContent', db_index='isexportabletocontent')
    isincludedintitle = models.BooleanField(blank=True, null=True, unique=False, db_column='IsIncludedInTitle', db_index='isincludedintitle')
    isrequired = models.BooleanField(blank=True, null=True, unique=False, db_column='IsRequired', db_index='isrequired')
    metadata = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='MetaData', db_index='metadata')
    origimportcolumnindex = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='DataColumnIndex', db_index='datacolumnindex')
    srctableid = models.IntegerField(blank=True, null=True, unique=False, db_column='TableId', db_index='tableid')
    tablename = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TableName', db_index='tablename')
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index='timestampcreated')
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index='timestampmodified')
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index='version')
    vieworder = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='ViewOrder', db_index='vieworder')
    xcoord = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='XCoord', db_index='xcoord')
    ycoord = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='YCoord', db_index='ycoord')

    # Relationships: Many-to-One
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    workbenchTemplate = models.ForeignKey('WorkbenchTemplate', db_column='WorkbenchTemplateID', related_name='workbenchtemplatemappingitems', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'workbenchtemplatemappingitem'
        ordering = ()

    save = partialmethod(custom_save)

