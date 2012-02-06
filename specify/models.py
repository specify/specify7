# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#     * Rearrange models' order
#     * Make sure each model has one field with primary_key=True
# Feel free to rename the models, but don't rename db_table values or field names.
#
# Also note: You'll have to insert the output of 'django-admin.py sqlcustom [appname]'
# into your database.

from django.db import models

class Accession(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AccessionID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    accessioncondition = models.CharField(max_length=765, db_column='AccessionCondition', blank=True)
    accessionnumber = models.CharField(max_length=180, db_column='AccessionNumber')
    dateaccessioned = models.DateField(null=True, db_column='DateAccessioned', blank=True)
    dateacknowledged = models.DateField(null=True, db_column='DateAcknowledged', blank=True)
    datereceived = models.DateField(null=True, db_column='DateReceived', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    status = models.CharField(max_length=96, db_column='Status', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    text3 = models.TextField(db_column='Text3', blank=True)
    totalvalue = models.DecimalField(decimal_places=2, null=True, max_digits=14, db_column='TotalValue', blank=True)
    type = models.CharField(max_length=96, db_column='Type', blank=True)
    verbatimdate = models.CharField(max_length=150, db_column='VerbatimDate', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    division = models.ForeignKey('specify.Division', db_column='DivisionID', related_name='+')
    repositoryagreement = models.ForeignKey('specify.Repositoryagreement', null=True, db_column='RepositoryAgreementID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    addressofrecord = models.ForeignKey('specify.Addressofrecord', null=True, db_column='AddressOfRecordID', blank=True, related_name='+')
    class Meta:
        db_table = u'accession'

class Accessionagent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AccessionAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=150, db_column='Role')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    accession = models.ForeignKey('specify.Accession', null=True, db_column='AccessionID', blank=True, related_name='+')
    repositoryagreement = models.ForeignKey('specify.Repositoryagreement', null=True, db_column='RepositoryAgreementID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    class Meta:
        db_table = u'accessionagent'

class Accessionattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AccessionAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    accession = models.ForeignKey('specify.Accession', db_column='AccessionID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'accessionattachment'

class Accessionauthorization(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AccessionAuthorizationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    permit = models.ForeignKey('specify.Permit', db_column='PermitID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    repositoryagreement = models.ForeignKey('specify.Repositoryagreement', null=True, db_column='RepositoryAgreementID', blank=True, related_name='+')
    accession = models.ForeignKey('specify.Accession', null=True, db_column='AccessionID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'accessionauthorization'

class Address(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AddressID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    address = models.CharField(max_length=765, db_column='Address', blank=True)
    address2 = models.CharField(max_length=765, db_column='Address2', blank=True)
    address3 = models.CharField(max_length=192, db_column='Address3', blank=True)
    address4 = models.CharField(max_length=192, db_column='Address4', blank=True)
    address5 = models.CharField(max_length=192, db_column='Address5', blank=True)
    city = models.CharField(max_length=192, db_column='City', blank=True)
    country = models.CharField(max_length=192, db_column='Country', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    fax = models.CharField(max_length=150, db_column='Fax', blank=True)
    iscurrent = models.NullBooleanField(null=True, db_column='IsCurrent', blank=True)
    isprimary = models.NullBooleanField(null=True, db_column='IsPrimary', blank=True)
    isshipping = models.NullBooleanField(null=True, db_column='IsShipping', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    phone1 = models.CharField(max_length=150, db_column='Phone1', blank=True)
    phone2 = models.CharField(max_length=150, db_column='Phone2', blank=True)
    positionheld = models.CharField(max_length=96, db_column='PositionHeld', blank=True)
    postalcode = models.CharField(max_length=96, db_column='PostalCode', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    roomorbuilding = models.CharField(max_length=150, db_column='RoomOrBuilding', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    state = models.CharField(max_length=192, db_column='State', blank=True)
    typeofaddr = models.CharField(max_length=96, db_column='TypeOfAddr', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', null=True, db_column='AgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'address'

class Addressofrecord(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AddressOfRecordID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    address = models.CharField(max_length=765, db_column='Address', blank=True)
    address2 = models.CharField(max_length=765, db_column='Address2', blank=True)
    city = models.CharField(max_length=192, db_column='City', blank=True)
    country = models.CharField(max_length=192, db_column='Country', blank=True)
    postalcode = models.CharField(max_length=96, db_column='PostalCode', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    state = models.CharField(max_length=192, db_column='State', blank=True)
    agent = models.ForeignKey('specify.Agent', null=True, db_column='AgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'addressofrecord'

class Agent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    abbreviation = models.CharField(max_length=150, db_column='Abbreviation', blank=True)
    agenttype = models.IntegerField(db_column='AgentType')
    dateofbirth = models.DateField(null=True, db_column='DateOfBirth', blank=True)
    dateofbirthprecision = models.IntegerField(null=True, db_column='DateOfBirthPrecision', blank=True)
    dateofdeath = models.DateField(null=True, db_column='DateOfDeath', blank=True)
    dateofdeathprecision = models.IntegerField(null=True, db_column='DateOfDeathPrecision', blank=True)
    datetype = models.IntegerField(null=True, db_column='DateType', blank=True)
    email = models.CharField(max_length=150, db_column='Email', blank=True)
    firstname = models.CharField(max_length=150, db_column='FirstName', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    initials = models.CharField(max_length=24, db_column='Initials', blank=True)
    interests = models.CharField(max_length=765, db_column='Interests', blank=True)
    jobtitle = models.CharField(max_length=150, db_column='JobTitle', blank=True)
    lastname = models.CharField(max_length=384, db_column='LastName', blank=True)
    middleinitial = models.CharField(max_length=150, db_column='MiddleInitial', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    title = models.CharField(max_length=150, db_column='Title', blank=True)
    url = models.TextField(db_column='URL', blank=True)
    parentorganization = models.ForeignKey('self', null=True, db_column='ParentOrganizationID', blank=True, related_name='+')
    institutioncc = models.ForeignKey('specify.Institution', null=True, db_column='InstitutionCCID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('self', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    institutiontc = models.ForeignKey('specify.Institution', null=True, db_column='InstitutionTCID', blank=True, related_name='+')
    specifyuser = models.ForeignKey('specify.Specifyuser', null=True, db_column='SpecifyUserID', blank=True, related_name='+')
    division = models.ForeignKey('specify.Division', null=True, db_column='DivisionID', blank=True, related_name='+')
    collectioncc = models.ForeignKey('specify.Collection', null=True, db_column='CollectionCCID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('self', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    collectiontc = models.ForeignKey('specify.Collection', null=True, db_column='CollectionTCID', blank=True, related_name='+')
    class Meta:
        db_table = u'agent'

class Agentattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AgentAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'agentattachment'

class Agentgeography(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AgentGeographyID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(max_length=192, db_column='Role', blank=True)
    geography = models.ForeignKey('specify.Geography', db_column='GeographyID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'agentgeography'

class Agentspecialty(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AgentSpecialtyID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordernumber = models.IntegerField(unique=True, db_column='OrderNumber')
    specialtyname = models.CharField(max_length=192, db_column='SpecialtyName')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'agentspecialty'

class Agentvariant(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AgentVariantID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    country = models.CharField(max_length=6, db_column='Country', blank=True)
    language = models.CharField(max_length=6, db_column='Language', blank=True)
    name = models.CharField(max_length=765, db_column='Name', blank=True)
    vartype = models.IntegerField(db_column='VarType')
    variant = models.CharField(max_length=6, db_column='Variant', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    class Meta:
        db_table = u'agentvariant'

class Appraisal(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AppraisalID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    appraisaldate = models.DateField(db_column='AppraisalDate')
    appraisalnumber = models.CharField(max_length=192, db_column='AppraisalNumber')
    appraisalvalue = models.DecimalField(decimal_places=2, null=True, max_digits=14, db_column='AppraisalValue', blank=True)
    monetaryunittype = models.CharField(max_length=24, db_column='MonetaryUnitType', blank=True)
    notes = models.TextField(db_column='Notes', blank=True)
    accession = models.ForeignKey('specify.Accession', null=True, db_column='AccessionID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'appraisal'

class Attachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    attachmentlocation = models.CharField(max_length=384, db_column='AttachmentLocation', blank=True)
    copyrightdate = models.CharField(max_length=192, db_column='CopyrightDate', blank=True)
    copyrightholder = models.CharField(max_length=192, db_column='CopyrightHolder', blank=True)
    credit = models.CharField(max_length=192, db_column='Credit', blank=True)
    dateimaged = models.CharField(max_length=192, db_column='DateImaged', blank=True)
    filecreateddate = models.DateField(null=True, db_column='FileCreatedDate', blank=True)
    license = models.CharField(max_length=192, db_column='License', blank=True)
    mimetype = models.CharField(max_length=192, db_column='MimeType', blank=True)
    origfilename = models.CharField(max_length=384, db_column='OrigFilename')
    remarks = models.TextField(db_column='Remarks', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    attachmentimageattribute = models.ForeignKey('specify.Attachmentimageattribute', null=True, db_column='AttachmentImageAttributeID', blank=True, related_name='+')
    visibilitysetby = models.ForeignKey('specify.Specifyuser', null=True, db_column='VisibilitySetByID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'attachment'

class Attachmentimageattribute(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AttachmentImageAttributeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    creativecommons = models.CharField(max_length=1500, db_column='CreativeCommons', blank=True)
    height = models.IntegerField(null=True, db_column='Height', blank=True)
    magnification = models.FloatField(null=True, db_column='Magnification', blank=True)
    mbimageid = models.IntegerField(null=True, db_column='MBImageID', blank=True)
    resolution = models.FloatField(null=True, db_column='Resolution', blank=True)
    timestamplastsend = models.DateTimeField(null=True, db_column='TimestampLastSend', blank=True)
    timestamplastupdatecheck = models.DateTimeField(null=True, db_column='TimestampLastUpdateCheck', blank=True)
    width = models.IntegerField(null=True, db_column='Width', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    morphbankview = models.ForeignKey('specify.Morphbankview', null=True, db_column='MorphBankViewID', blank=True, related_name='+')
    imagetype = models.CharField(max_length=240, db_column='ImageType', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=600, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=600, db_column='Text2', blank=True)
    viewdescription = models.CharField(max_length=240, db_column='ViewDescription', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    class Meta:
        db_table = u'attachmentimageattribute'

class Attachmentmetadata(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AttachmentMetadataID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    value = models.CharField(max_length=384, db_column='Value')
    attachment = models.ForeignKey('specify.Attachment', null=True, db_column='AttachmentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'attachmentmetadata'

class Attachmenttag(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AttachmentTagID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    tag = models.CharField(max_length=192, db_column='Tag')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'attachmenttag'

class Attributedef(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AttributeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    datatype = models.IntegerField(null=True, db_column='DataType', blank=True)
    fieldname = models.CharField(max_length=96, db_column='FieldName', blank=True)
    tabletype = models.IntegerField(null=True, db_column='TableType', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    preptype = models.ForeignKey('specify.Preptype', null=True, db_column='PrepTypeID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'attributedef'

class Author(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AuthorID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordernumber = models.IntegerField(unique=True, db_column='OrderNumber')
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    referencework = models.ForeignKey('specify.Referencework', db_column='ReferenceWorkID', related_name='+')
    class Meta:
        db_table = u'author'

class Autonumberingscheme(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AutoNumberingSchemeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    formatname = models.CharField(max_length=192, db_column='FormatName', blank=True)
    isnumericonly = models.BooleanField(db_column='IsNumericOnly')
    schemeclassname = models.CharField(max_length=192, db_column='SchemeClassName', blank=True)
    schemename = models.CharField(max_length=192, db_column='SchemeName', blank=True)
    tablenumber = models.IntegerField(db_column='TableNumber')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'autonumberingscheme'

class AutonumschColl(models.Model):
    collection = models.ForeignKey('specify.Collection', db_column='CollectionID', related_name='+')
    autonumberingscheme = models.ForeignKey('specify.Autonumberingscheme', db_column='AutoNumberingSchemeID', related_name='+')
    class Meta:
        db_table = u'autonumsch_coll'

class AutonumschDiv(models.Model):
    division = models.ForeignKey('specify.Division', db_column='DivisionID', related_name='+')
    autonumberingscheme = models.ForeignKey('specify.Autonumberingscheme', db_column='AutoNumberingSchemeID', related_name='+')
    class Meta:
        db_table = u'autonumsch_div'

class AutonumschDsp(models.Model):
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    autonumberingscheme = models.ForeignKey('specify.Autonumberingscheme', db_column='AutoNumberingSchemeID', related_name='+')
    class Meta:
        db_table = u'autonumsch_dsp'

class Borrow(models.Model):
    id = models.IntegerField(primary_key=True, db_column='BorrowID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    currentduedate = models.DateField(null=True, db_column='CurrentDueDate', blank=True)
    dateclosed = models.DateField(null=True, db_column='DateClosed', blank=True)
    invoicenumber = models.CharField(max_length=150, db_column='InvoiceNumber')
    isclosed = models.NullBooleanField(null=True, db_column='IsClosed', blank=True)
    isfinancialresponsibility = models.NullBooleanField(null=True, db_column='IsFinancialResponsibility', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    originalduedate = models.DateField(null=True, db_column='OriginalDueDate', blank=True)
    receiveddate = models.DateField(null=True, db_column='ReceivedDate', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    addressofrecord = models.ForeignKey('specify.Addressofrecord', null=True, db_column='AddressOfRecordID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'borrow'

class Borrowagent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='BorrowAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=96, db_column='Role')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    borrow = models.ForeignKey('specify.Borrow', db_column='BorrowID', related_name='+')
    class Meta:
        db_table = u'borrowagent'

class Borrowmaterial(models.Model):
    id = models.IntegerField(primary_key=True, db_column='BorrowMaterialID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    description = models.CharField(max_length=150, db_column='Description', blank=True)
    incomments = models.TextField(db_column='InComments', blank=True)
    materialnumber = models.CharField(max_length=150, db_column='MaterialNumber')
    outcomments = models.TextField(db_column='OutComments', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    quantityresolved = models.IntegerField(null=True, db_column='QuantityResolved', blank=True)
    quantityreturned = models.IntegerField(null=True, db_column='QuantityReturned', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    borrow = models.ForeignKey('specify.Borrow', db_column='BorrowID', related_name='+')
    class Meta:
        db_table = u'borrowmaterial'

class Borrowreturnmaterial(models.Model):
    id = models.IntegerField(primary_key=True, db_column='BorrowReturnMaterialID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    returneddate = models.DateField(null=True, db_column='ReturnedDate', blank=True)
    borrowmaterial = models.ForeignKey('specify.Borrowmaterial', db_column='BorrowMaterialID', related_name='+')
    returnedby = models.ForeignKey('specify.Agent', null=True, db_column='ReturnedByID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'borrowreturnmaterial'

class Collectingevent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectingEventID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    enddateprecision = models.IntegerField(null=True, db_column='EndDatePrecision', blank=True)
    enddateverbatim = models.CharField(max_length=150, db_column='EndDateVerbatim', blank=True)
    endtime = models.IntegerField(null=True, db_column='EndTime', blank=True)
    method = models.CharField(max_length=150, db_column='Method', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    startdateprecision = models.IntegerField(null=True, db_column='StartDatePrecision', blank=True)
    startdateverbatim = models.CharField(max_length=150, db_column='StartDateVerbatim', blank=True)
    starttime = models.IntegerField(null=True, db_column='StartTime', blank=True)
    stationfieldnumber = models.CharField(max_length=150, db_column='StationFieldNumber', blank=True)
    verbatimdate = models.CharField(max_length=150, db_column='VerbatimDate', blank=True)
    verbatimlocality = models.TextField(db_column='VerbatimLocality', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    collectingtrip = models.ForeignKey('specify.Collectingtrip', null=True, db_column='CollectingTripID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    locality = models.ForeignKey('specify.Locality', null=True, db_column='LocalityID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    collectingeventattribute = models.ForeignKey('specify.Collectingeventattribute', null=True, db_column='CollectingEventAttributeID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    visibilitysetby = models.ForeignKey('specify.Specifyuser', null=True, db_column='VisibilitySetByID', blank=True, related_name='+')
    sgrstatus = models.IntegerField(null=True, db_column='SGRStatus', blank=True)
    class Meta:
        db_table = u'collectingevent'

class Collectingeventattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectingEventAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    ordinal = models.IntegerField(db_column='Ordinal')
    remarks = models.TextField(db_column='Remarks', blank=True)
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    collectingevent = models.ForeignKey('specify.Collectingevent', db_column='CollectingEventID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectingeventattachment'

class Collectingeventattr(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AttrID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    doublevalue = models.FloatField(null=True, db_column='DoubleValue', blank=True)
    strvalue = models.CharField(max_length=765, db_column='StrValue', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    collectingevent = models.ForeignKey('specify.Collectingevent', db_column='CollectingEventID', related_name='+')
    attributedef = models.ForeignKey('specify.Attributedef', db_column='AttributeDefID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectingeventattr'

class Collectingeventattribute(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectingEventAttributeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number10 = models.FloatField(null=True, db_column='Number10', blank=True)
    number11 = models.FloatField(null=True, db_column='Number11', blank=True)
    number12 = models.FloatField(null=True, db_column='Number12', blank=True)
    number13 = models.FloatField(null=True, db_column='Number13', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    number3 = models.FloatField(null=True, db_column='Number3', blank=True)
    number4 = models.FloatField(null=True, db_column='Number4', blank=True)
    number5 = models.FloatField(null=True, db_column='Number5', blank=True)
    number6 = models.FloatField(null=True, db_column='Number6', blank=True)
    number7 = models.FloatField(null=True, db_column='Number7', blank=True)
    number8 = models.FloatField(null=True, db_column='Number8', blank=True)
    number9 = models.FloatField(null=True, db_column='Number9', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text10 = models.CharField(max_length=150, db_column='Text10', blank=True)
    text11 = models.CharField(max_length=150, db_column='Text11', blank=True)
    text12 = models.CharField(max_length=150, db_column='Text12', blank=True)
    text13 = models.CharField(max_length=150, db_column='Text13', blank=True)
    text14 = models.CharField(max_length=150, db_column='Text14', blank=True)
    text15 = models.CharField(max_length=150, db_column='Text15', blank=True)
    text16 = models.CharField(max_length=150, db_column='Text16', blank=True)
    text17 = models.CharField(max_length=150, db_column='Text17', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    text3 = models.TextField(db_column='Text3', blank=True)
    text4 = models.CharField(max_length=300, db_column='Text4', blank=True)
    text5 = models.CharField(max_length=300, db_column='Text5', blank=True)
    text6 = models.CharField(max_length=150, db_column='Text6', blank=True)
    text7 = models.CharField(max_length=150, db_column='Text7', blank=True)
    text8 = models.CharField(max_length=150, db_column='Text8', blank=True)
    text9 = models.CharField(max_length=150, db_column='Text9', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.NullBooleanField(null=True, db_column='YesNo3', blank=True)
    yesno4 = models.NullBooleanField(null=True, db_column='YesNo4', blank=True)
    yesno5 = models.NullBooleanField(null=True, db_column='YesNo5', blank=True)
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    hosttaxon = models.ForeignKey('specify.Taxon', null=True, db_column='HostTaxonID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectingeventattribute'

class Collectingtrip(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectingTripID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectingtripname = models.CharField(max_length=192, db_column='CollectingTripName', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    enddateverbatim = models.CharField(max_length=150, db_column='EndDateVerbatim', blank=True)
    endtime = models.IntegerField(null=True, db_column='EndTime', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    sponsor = models.CharField(max_length=192, db_column='Sponsor', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    startdateverbatim = models.CharField(max_length=150, db_column='StartDateVerbatim', blank=True)
    starttime = models.IntegerField(null=True, db_column='StartTime', blank=True)
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectingtrip'

class Collection(models.Model):
    usergroupscopeid = models.IntegerField(unique=True, db_column='UserGroupScopeId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    catalogformatnumname = models.CharField(max_length=192, db_column='CatalogFormatNumName')
    code = models.CharField(max_length=150, db_column='Code', blank=True)
    collectionid = models.IntegerField(null=True, db_column='collectionId', blank=True)
    collectionname = models.CharField(max_length=150, db_column='CollectionName', blank=True)
    collectiontype = models.CharField(max_length=96, db_column='CollectionType', blank=True)
    dbcontentversion = models.CharField(max_length=96, db_column='DbContentVersion', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    developmentstatus = models.CharField(max_length=96, db_column='DevelopmentStatus', blank=True)
    estimatedsize = models.IntegerField(null=True, db_column='EstimatedSize', blank=True)
    institutiontype = models.CharField(max_length=96, db_column='InstitutionType', blank=True)
    isembeddedcollectingevent = models.BooleanField(db_column='IsEmbeddedCollectingEvent')
    isanumber = models.CharField(max_length=72, db_column='IsaNumber', blank=True)
    kingdomcoverage = models.CharField(max_length=96, db_column='KingdomCoverage', blank=True)
    preservationmethodtype = models.CharField(max_length=96, db_column='PreservationMethodType', blank=True)
    primaryfocus = models.CharField(max_length=96, db_column='PrimaryFocus', blank=True)
    primarypurpose = models.CharField(max_length=96, db_column='PrimaryPurpose', blank=True)
    regnumber = models.CharField(max_length=72, db_column='RegNumber', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    scope = models.TextField(db_column='Scope', blank=True)
    webportaluri = models.CharField(max_length=765, db_column='WebPortalURI', blank=True)
    websiteuri = models.CharField(max_length=765, db_column='WebSiteURI', blank=True)
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    institutionnetwork = models.ForeignKey('specify.Institution', null=True, db_column='InstitutionNetworkID', blank=True, related_name='+')
    class Meta:
        db_table = u'collection'

class Collectionobject(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectionObjectID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    altcatalognumber = models.CharField(max_length=96, db_column='AltCatalogNumber', blank=True)
    availability = models.CharField(max_length=96, db_column='Availability', blank=True)
    catalognumber = models.CharField(max_length=96, db_column='CatalogNumber', blank=True)
    catalogeddate = models.DateField(null=True, db_column='CatalogedDate', blank=True)
    catalogeddateprecision = models.IntegerField(null=True, db_column='CatalogedDatePrecision', blank=True)
    catalogeddateverbatim = models.CharField(max_length=96, db_column='CatalogedDateVerbatim', blank=True)
    countamt = models.IntegerField(null=True, db_column='CountAmt', blank=True)
    deaccessioned = models.NullBooleanField(null=True, db_column='Deaccessioned', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    fieldnumber = models.CharField(max_length=150, db_column='FieldNumber', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    inventorydate = models.DateField(null=True, db_column='InventoryDate', blank=True)
    modifier = models.CharField(max_length=150, db_column='Modifier', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    notifications = models.CharField(max_length=96, db_column='Notifications', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    objectcondition = models.CharField(max_length=192, db_column='ObjectCondition', blank=True)
    projectnumber = models.CharField(max_length=192, db_column='ProjectNumber', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    restrictions = models.CharField(max_length=96, db_column='Restrictions', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    totalvalue = models.DecimalField(decimal_places=2, null=True, max_digits=14, db_column='TotalValue', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.NullBooleanField(null=True, db_column='YesNo3', blank=True)
    yesno4 = models.NullBooleanField(null=True, db_column='YesNo4', blank=True)
    yesno5 = models.NullBooleanField(null=True, db_column='YesNo5', blank=True)
    yesno6 = models.NullBooleanField(null=True, db_column='YesNo6', blank=True)
    containerowner = models.ForeignKey('specify.Container', null=True, db_column='ContainerOwnerID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    paleocontext = models.ForeignKey('specify.Paleocontext', null=True, db_column='PaleoContextID', blank=True, related_name='+')
    cataloger = models.ForeignKey('specify.Agent', null=True, db_column='CatalogerID', blank=True, related_name='+')
    accession = models.ForeignKey('specify.Accession', null=True, db_column='AccessionID', blank=True, related_name='+')
    fieldnotebookpage = models.ForeignKey('specify.Fieldnotebookpage', null=True, db_column='FieldNotebookPageID', blank=True, related_name='+')
    visibilitysetby = models.ForeignKey('specify.Specifyuser', null=True, db_column='VisibilitySetByID', blank=True, related_name='+')
    appraisal = models.ForeignKey('specify.Appraisal', null=True, db_column='AppraisalID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    collection = models.ForeignKey('specify.Collection', db_column='CollectionID', related_name='+')
    collectingevent = models.ForeignKey('specify.Collectingevent', null=True, db_column='CollectingEventID', blank=True, related_name='+')
    collectionobjectattribute = models.ForeignKey('specify.Collectionobjectattribute', null=True, db_column='CollectionObjectAttributeID', blank=True, related_name='+')
    container = models.ForeignKey('specify.Container', null=True, db_column='ContainerID', blank=True, related_name='+')
    sgrstatus = models.IntegerField(null=True, db_column='SGRStatus', blank=True)
    class Meta:
        db_table = u'collectionobject'

class Collectionobjectattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectionObjectAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    collectionobject = models.ForeignKey('specify.Collectionobject', db_column='CollectionObjectID', related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectionobjectattachment'

class Collectionobjectattr(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AttrID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    doublevalue = models.FloatField(null=True, db_column='DoubleValue', blank=True)
    strvalue = models.CharField(max_length=765, db_column='StrValue', blank=True)
    attributedef = models.ForeignKey('specify.Attributedef', db_column='AttributeDefID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', db_column='CollectionObjectID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectionobjectattr'

class Collectionobjectattribute(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectionObjectAttributeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number10 = models.FloatField(null=True, db_column='Number10', blank=True)
    number11 = models.FloatField(null=True, db_column='Number11', blank=True)
    number12 = models.FloatField(null=True, db_column='Number12', blank=True)
    number13 = models.FloatField(null=True, db_column='Number13', blank=True)
    number14 = models.FloatField(null=True, db_column='Number14', blank=True)
    number15 = models.FloatField(null=True, db_column='Number15', blank=True)
    number16 = models.FloatField(null=True, db_column='Number16', blank=True)
    number17 = models.FloatField(null=True, db_column='Number17', blank=True)
    number18 = models.FloatField(null=True, db_column='Number18', blank=True)
    number19 = models.FloatField(null=True, db_column='Number19', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    number20 = models.FloatField(null=True, db_column='Number20', blank=True)
    number21 = models.FloatField(null=True, db_column='Number21', blank=True)
    number22 = models.FloatField(null=True, db_column='Number22', blank=True)
    number23 = models.FloatField(null=True, db_column='Number23', blank=True)
    number24 = models.FloatField(null=True, db_column='Number24', blank=True)
    number25 = models.FloatField(null=True, db_column='Number25', blank=True)
    number26 = models.FloatField(null=True, db_column='Number26', blank=True)
    number27 = models.FloatField(null=True, db_column='Number27', blank=True)
    number28 = models.FloatField(null=True, db_column='Number28', blank=True)
    number29 = models.FloatField(null=True, db_column='Number29', blank=True)
    number3 = models.FloatField(null=True, db_column='Number3', blank=True)
    number30 = models.IntegerField(null=True, db_column='Number30', blank=True)
    number31 = models.FloatField(null=True, db_column='Number31', blank=True)
    number32 = models.FloatField(null=True, db_column='Number32', blank=True)
    number33 = models.FloatField(null=True, db_column='Number33', blank=True)
    number34 = models.FloatField(null=True, db_column='Number34', blank=True)
    number35 = models.FloatField(null=True, db_column='Number35', blank=True)
    number36 = models.FloatField(null=True, db_column='Number36', blank=True)
    number37 = models.FloatField(null=True, db_column='Number37', blank=True)
    number38 = models.FloatField(null=True, db_column='Number38', blank=True)
    number39 = models.FloatField(null=True, db_column='Number39', blank=True)
    number4 = models.FloatField(null=True, db_column='Number4', blank=True)
    number40 = models.FloatField(null=True, db_column='Number40', blank=True)
    number41 = models.FloatField(null=True, db_column='Number41', blank=True)
    number42 = models.FloatField(null=True, db_column='Number42', blank=True)
    number5 = models.FloatField(null=True, db_column='Number5', blank=True)
    number6 = models.FloatField(null=True, db_column='Number6', blank=True)
    number7 = models.FloatField(null=True, db_column='Number7', blank=True)
    number8 = models.IntegerField(null=True, db_column='Number8', blank=True)
    number9 = models.FloatField(null=True, db_column='Number9', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text10 = models.CharField(max_length=150, db_column='Text10', blank=True)
    text11 = models.CharField(max_length=150, db_column='Text11', blank=True)
    text12 = models.CharField(max_length=150, db_column='Text12', blank=True)
    text13 = models.CharField(max_length=150, db_column='Text13', blank=True)
    text14 = models.CharField(max_length=150, db_column='Text14', blank=True)
    text15 = models.CharField(max_length=192, db_column='Text15', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    text3 = models.TextField(db_column='Text3', blank=True)
    text4 = models.CharField(max_length=150, db_column='Text4', blank=True)
    text5 = models.CharField(max_length=150, db_column='Text5', blank=True)
    text6 = models.CharField(max_length=300, db_column='Text6', blank=True)
    text7 = models.CharField(max_length=300, db_column='Text7', blank=True)
    text8 = models.CharField(max_length=150, db_column='Text8', blank=True)
    text9 = models.CharField(max_length=150, db_column='Text9', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.NullBooleanField(null=True, db_column='YesNo3', blank=True)
    yesno4 = models.NullBooleanField(null=True, db_column='YesNo4', blank=True)
    yesno5 = models.NullBooleanField(null=True, db_column='YesNo5', blank=True)
    yesno6 = models.NullBooleanField(null=True, db_column='YesNo6', blank=True)
    yesno7 = models.NullBooleanField(null=True, db_column='YesNo7', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectionobjectattribute'

class Collectionobjectcitation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectionObjectCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    isfigured = models.NullBooleanField(null=True, db_column='IsFigured', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', db_column='CollectionObjectID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    referencework = models.ForeignKey('specify.Referencework', db_column='ReferenceWorkID', related_name='+')
    class Meta:
        db_table = u'collectionobjectcitation'

class CollectionobjecttypeCollectionobjecttypeid(models.Model):
    id = models.IntegerField(primary_key=True, db_column='OldID')
    newid = models.IntegerField(db_column='NewID')
    class Meta:
        db_table = u'collectionobjecttype_CollectionObjectTypeID'

class Collectionrelationship(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectionRelationshipID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    rightsidecollection = models.ForeignKey('specify.Collectionobject', db_column='RightSideCollectionID', related_name='+')
    collectionreltype = models.ForeignKey('specify.Collectionreltype', null=True, db_column='CollectionRelTypeID', blank=True, related_name='+')
    leftsidecollection = models.ForeignKey('specify.Collectionobject', db_column='LeftSideCollectionID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectionrelationship'

class Collectionreltype(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectionRelTypeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=96, db_column='Name', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    rightsidecollection = models.ForeignKey('specify.Collection', null=True, db_column='RightSideCollectionID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    leftsidecollection = models.ForeignKey('specify.Collection', null=True, db_column='LeftSideCollectionID', blank=True, related_name='+')
    class Meta:
        db_table = u'collectionreltype'

class Collector(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CollectorID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    isprimary = models.BooleanField(db_column='IsPrimary')
    ordernumber = models.IntegerField(db_column='OrderNumber')
    remarks = models.TextField(db_column='Remarks', blank=True)
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    division = models.ForeignKey('specify.Division', null=True, db_column='DivisionID', blank=True, related_name='+')
    collectingevent = models.ForeignKey('specify.Collectingevent', db_column='CollectingEventID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'collector'

class Commonnametx(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CommonNameTxID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    author = models.CharField(max_length=384, db_column='Author', blank=True)
    country = models.CharField(max_length=6, db_column='Country', blank=True)
    language = models.CharField(max_length=6, db_column='Language', blank=True)
    name = models.CharField(max_length=765, db_column='Name', blank=True)
    variant = models.CharField(max_length=6, db_column='Variant', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    taxon = models.ForeignKey('specify.Taxon', db_column='TaxonID', related_name='+')
    class Meta:
        db_table = u'commonnametx'

class Commonnametxcitation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='CommonNameTxCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    commonnametx = models.ForeignKey('specify.Commonnametx', db_column='CommonNameTxID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    referencework = models.ForeignKey('specify.Referencework', db_column='ReferenceWorkID', related_name='+')
    class Meta:
        db_table = u'commonnametxcitation'

class Conservdescription(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ConservDescriptionID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    backgroundinfo = models.TextField(db_column='BackgroundInfo', blank=True)
    composition = models.TextField(db_column='Composition', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    displayrecommendations = models.TextField(db_column='DisplayRecommendations', blank=True)
    height = models.FloatField(null=True, db_column='Height', blank=True)
    lightrecommendations = models.TextField(db_column='LightRecommendations', blank=True)
    objlength = models.FloatField(null=True, db_column='ObjLength', blank=True)
    otherrecommendations = models.TextField(db_column='OtherRecommendations', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    shortdesc = models.CharField(max_length=384, db_column='ShortDesc', blank=True)
    source = models.TextField(db_column='Source', blank=True)
    units = models.CharField(max_length=48, db_column='Units', blank=True)
    width = models.FloatField(null=True, db_column='Width', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    division = models.ForeignKey('specify.Division', null=True, db_column='DivisionID', blank=True, related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', null=True, db_column='CollectionObjectID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'conservdescription'

class Conservdescriptionattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ConservDescriptionAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    conservdescription = models.ForeignKey('specify.Conservdescription', db_column='ConservDescriptionID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    class Meta:
        db_table = u'conservdescriptionattachment'

class Conservevent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ConservEventID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    advtestingexam = models.TextField(db_column='AdvTestingExam', blank=True)
    advtestingexamresults = models.TextField(db_column='AdvTestingExamResults', blank=True)
    completedcomments = models.TextField(db_column='CompletedComments', blank=True)
    completeddate = models.DateField(null=True, db_column='CompletedDate', blank=True)
    conditionreport = models.TextField(db_column='ConditionReport', blank=True)
    curatorapprovaldate = models.DateField(null=True, db_column='CuratorApprovalDate', blank=True)
    examdate = models.DateField(null=True, db_column='ExamDate', blank=True)
    photodocs = models.TextField(db_column='PhotoDocs', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=192, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=192, db_column='Text2', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    number2 = models.IntegerField(null=True, db_column='Number2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    treatmentcompdate = models.DateField(null=True, db_column='TreatmentCompDate', blank=True)
    treatmentreport = models.TextField(db_column='TreatmentReport', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    curator = models.ForeignKey('specify.Agent', null=True, db_column='CuratorID', blank=True, related_name='+')
    treatedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='TreatedByAgentID', blank=True, related_name='+')
    conservdescription = models.ForeignKey('specify.Conservdescription', db_column='ConservDescriptionID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    examinedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ExaminedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'conservevent'

class Conserveventattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ConservEventAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    conservevent = models.ForeignKey('specify.Conservevent', db_column='ConservEventID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    class Meta:
        db_table = u'conserveventattachment'

class Container(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ContainerID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    number = models.IntegerField(null=True, db_column='Number', blank=True)
    type = models.IntegerField(null=True, db_column='Type', blank=True)
    storage = models.ForeignKey('specify.Storage', null=True, db_column='StorageID', blank=True, related_name='+')
    parent = models.ForeignKey('self', null=True, db_column='ParentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'container'

class Datatype(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DataTypeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=150, db_column='Name', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'datatype'

class Deaccession(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DeaccessionID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    deaccessiondate = models.DateField(null=True, db_column='DeaccessionDate', blank=True)
    deaccessionnumber = models.CharField(max_length=150, db_column='DeaccessionNumber', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    type = models.CharField(max_length=192, db_column='Type', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    accession = models.ForeignKey('specify.Accession', null=True, db_column='AccessionID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'deaccession'

class Deaccessionagent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DeaccessionAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=150, db_column='Role')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    deaccession = models.ForeignKey('specify.Deaccession', db_column='DeaccessionID', related_name='+')
    class Meta:
        db_table = u'deaccessionagent'

class Deaccessionpreparation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DeaccessionPreparationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    preparation = models.ForeignKey('specify.Preparation', null=True, db_column='PreparationID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    deaccession = models.ForeignKey('specify.Deaccession', db_column='DeaccessionID', related_name='+')
    class Meta:
        db_table = u'deaccessionpreparation'

class Determination(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DeterminationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    addendum = models.CharField(max_length=48, db_column='Addendum', blank=True)
    alternatename = models.CharField(max_length=384, db_column='AlternateName', blank=True)
    confidence = models.CharField(max_length=150, db_column='Confidence', blank=True)
    determineddate = models.DateField(null=True, db_column='DeterminedDate', blank=True)
    determineddateprecision = models.IntegerField(null=True, db_column='DeterminedDatePrecision', blank=True)
    featureorbasis = models.CharField(max_length=150, db_column='FeatureOrBasis', blank=True)
    iscurrent = models.BooleanField(db_column='IsCurrent')
    method = models.CharField(max_length=150, db_column='Method', blank=True)
    nameusage = models.CharField(max_length=192, db_column='NameUsage', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    qualifier = models.CharField(max_length=48, db_column='Qualifier', blank=True)
    varqualifer = models.CharField(max_length=48, db_column='VarQualifer', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    subspqualifier = models.CharField(max_length=48, db_column='SubSpQualifier', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    typestatusname = models.CharField(max_length=150, db_column='TypeStatusName', blank=True)
    varqualifier = models.CharField(max_length=48, db_column='VarQualifier', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    taxon = models.ForeignKey('specify.Taxon', null=True, db_column='TaxonID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    preferredtaxon = models.ForeignKey('specify.Taxon', null=True, db_column='PreferredTaxonID', blank=True, related_name='+')
    determiner = models.ForeignKey('specify.Agent', null=True, db_column='DeterminerID', blank=True, related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', db_column='CollectionObjectID', related_name='+')
    class Meta:
        db_table = u'determination'

class Determinationcitation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DeterminationCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    referencework = models.ForeignKey('specify.Referencework', db_column='ReferenceWorkID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    determination = models.ForeignKey('specify.Determination', db_column='DeterminationID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'determinationcitation'

class Discipline(models.Model):
    usergroupscopeid = models.IntegerField(unique=True, db_column='UserGroupScopeId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    disciplineid = models.IntegerField(null=True, db_column='disciplineId', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    regnumber = models.CharField(max_length=72, db_column='RegNumber', blank=True)
    type = models.CharField(max_length=192, db_column='Type', blank=True)
    datatype = models.ForeignKey('specify.Datatype', db_column='DataTypeID', related_name='+')
    geographytreedef = models.ForeignKey('specify.Geographytreedef', db_column='GeographyTreeDefID', related_name='+')
    division = models.ForeignKey('specify.Division', db_column='DivisionID', related_name='+')
    lithostrattreedef = models.ForeignKey('specify.Lithostrattreedef', null=True, db_column='LithoStratTreeDefID', blank=True, related_name='+')
    taxontreedef = models.ForeignKey('specify.Taxontreedef', null=True, db_column='TaxonTreeDefID', blank=True, related_name='+')
    geologictimeperiodtreedef = models.ForeignKey('specify.Geologictimeperiodtreedef', db_column='GeologicTimePeriodTreeDefID', related_name='+')
    class Meta:
        db_table = u'discipline'

class Division(models.Model):
    usergroupscopeid = models.IntegerField(unique=True, db_column='UserGroupScopeId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    abbrev = models.CharField(max_length=192, db_column='Abbrev', blank=True)
    altname = models.CharField(max_length=384, db_column='AltName', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    disciplinetype = models.CharField(max_length=192, db_column='DisciplineType', blank=True)
    divisionid = models.IntegerField(null=True, db_column='divisionId', blank=True)
    iconuri = models.CharField(max_length=765, db_column='IconURI', blank=True)
    name = models.CharField(max_length=765, db_column='Name', blank=True)
    regnumber = models.CharField(max_length=72, db_column='RegNumber', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    uri = models.CharField(max_length=765, db_column='Uri', blank=True)
    address = models.ForeignKey('specify.Address', null=True, db_column='AddressID', blank=True, related_name='+')
    institution = models.ForeignKey('specify.Institution', db_column='InstitutionID', related_name='+')
    class Meta:
        db_table = u'division'

class Dnasequence(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DnaSequenceID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    ambiguousresidues = models.IntegerField(null=True, db_column='AmbiguousResidues', blank=True)
    boldbarcodeid = models.CharField(max_length=96, db_column='BOLDBarcodeID', blank=True)
    boldlastupdatedate = models.DateField(null=True, db_column='BOLDLastUpdateDate', blank=True)
    boldsampleid = models.CharField(max_length=96, db_column='BOLDSampleID', blank=True)
    boldtranslationmatrix = models.CharField(max_length=192, db_column='BOLDTranslationMatrix', blank=True)
    compa = models.IntegerField(null=True, db_column='CompA', blank=True)
    compc = models.IntegerField(null=True, db_column='CompC', blank=True)
    compg = models.IntegerField(null=True, db_column='CompG', blank=True)
    compt = models.IntegerField(null=True, db_column='compT', blank=True)
    genbankaccessionnumber = models.CharField(max_length=96, db_column='GenBankAccessionNumber', blank=True)
    genesequence = models.TextField(db_column='GeneSequence', blank=True)
    moleculetype = models.CharField(max_length=96, db_column='MoleculeType', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    number3 = models.FloatField(null=True, db_column='Number3', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    targetmarker = models.CharField(max_length=96, db_column='TargetMarker', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    text3 = models.CharField(max_length=192, db_column='Text3', blank=True)
    totalresidues = models.IntegerField(null=True, db_column='TotalResidues', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.NullBooleanField(null=True, db_column='YesNo3', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', null=True, db_column='CollectionObjectID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', null=True, db_column='AgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'dnasequence'

class Dnasequenceattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DnaSequencingRunAttachmentId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    dnasequencingrun = models.ForeignKey('specify.Dnasequencingrun', db_column='DnaSequencingRunID', related_name='+')
    class Meta:
        db_table = u'dnasequenceattachment'

class Dnasequencingrun(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DNASequencingRunID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    number3 = models.FloatField(null=True, db_column='Number3', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    pcrcocktailprimer = models.NullBooleanField(null=True, db_column='PCRCocktailPrimer', blank=True)
    pcrforwardprimercode = models.CharField(max_length=96, db_column='PCRForwardPrimerCode', blank=True)
    pcrprimername = models.CharField(max_length=96, db_column='PCRPrimerName', blank=True)
    pcrprimersequence5_3 = models.CharField(max_length=192, db_column='PCRPrimerSequence5_3', blank=True)
    pcrreverseprimercode = models.CharField(max_length=96, db_column='PCRReversePrimerCode', blank=True)
    readdirection = models.CharField(max_length=48, db_column='ReadDirection', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    rundate = models.DateField(null=True, db_column='RunDate', blank=True)
    scorefilename = models.CharField(max_length=96, db_column='ScoreFileName', blank=True)
    sequencecocktailprimer = models.NullBooleanField(null=True, db_column='SequenceCocktailPrimer', blank=True)
    sequenceprimercode = models.CharField(max_length=96, db_column='SequencePrimerCode', blank=True)
    sequenceprimername = models.CharField(max_length=96, db_column='SequencePrimerName', blank=True)
    sequenceprimersequence5_3 = models.CharField(max_length=192, db_column='SequencePrimerSequence5_3', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    text3 = models.CharField(max_length=192, db_column='Text3', blank=True)
    tracefilename = models.CharField(max_length=96, db_column='TraceFileName', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.NullBooleanField(null=True, db_column='YesNo3', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    dnasequence = models.ForeignKey('specify.Dnasequence', db_column='DNASequenceID', related_name='+')
    runbyagent = models.ForeignKey('specify.Agent', null=True, db_column='RunByAgentID', blank=True, related_name='+')
    preparedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='PreparedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'dnasequencingrun'

class Dnasequencingruncitation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='DNASequencingRunCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    referencework = models.ForeignKey('specify.Referencework', db_column='ReferenceWorkID', related_name='+')
    dnasequencingrun = models.ForeignKey('specify.Dnasequencingrun', db_column='DNASequencingRunID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'dnasequencingruncitation'

class Exchangein(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ExchangeInID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    descriptionofmaterial = models.CharField(max_length=360, db_column='DescriptionOfMaterial', blank=True)
    exchangedate = models.DateField(null=True, db_column='ExchangeDate', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    quantityexchanged = models.IntegerField(null=True, db_column='QuantityExchanged', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    srcgeography = models.CharField(max_length=96, db_column='SrcGeography', blank=True)
    srctaxonomy = models.CharField(max_length=96, db_column='SrcTaxonomy', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    receivedfromorganization = models.ForeignKey('specify.Agent', db_column='ReceivedFromOrganizationID', related_name='+')
    addressofrecord = models.ForeignKey('specify.Addressofrecord', null=True, db_column='AddressOfRecordID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    catalogedby = models.ForeignKey('specify.Agent', db_column='CatalogedByID', related_name='+')
    division = models.ForeignKey('specify.Division', db_column='DivisionID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'exchangein'

class Exchangeinprep(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ExchangeInPrepID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    comments = models.TextField(db_column='Comments', blank=True)
    descriptionofmaterial = models.CharField(max_length=765, db_column='DescriptionOfMaterial', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    preparation = models.ForeignKey('specify.Preparation', null=True, db_column='PreparationID', blank=True, related_name='+')
    exchangein = models.ForeignKey('specify.Exchangein', null=True, db_column='ExchangeInID', blank=True, related_name='+')
    class Meta:
        db_table = u'exchangeinprep'

class Exchangeout(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ExchangeOutID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    descriptionofmaterial = models.CharField(max_length=360, db_column='DescriptionOfMaterial', blank=True)
    exchangedate = models.DateField(null=True, db_column='ExchangeDate', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    quantityexchanged = models.IntegerField(null=True, db_column='QuantityExchanged', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    srcgeography = models.CharField(max_length=96, db_column='SrcGeography', blank=True)
    srctaxonomy = models.CharField(max_length=96, db_column='SrcTaxonomy', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    division = models.ForeignKey('specify.Division', db_column='DivisionID', related_name='+')
    addressofrecord = models.ForeignKey('specify.Addressofrecord', null=True, db_column='AddressOfRecordID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    catalogedby = models.ForeignKey('specify.Agent', db_column='CatalogedByID', related_name='+')
    senttoorganization = models.ForeignKey('specify.Agent', db_column='SentToOrganizationID', related_name='+')
    class Meta:
        db_table = u'exchangeout'

class Exchangeoutprep(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ExchangeOutPrepID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    comments = models.TextField(db_column='Comments', blank=True)
    descriptionofmaterial = models.CharField(max_length=765, db_column='DescriptionOfMaterial', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    exchangeout = models.ForeignKey('specify.Exchangeout', null=True, db_column='ExchangeOutID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    preparation = models.ForeignKey('specify.Preparation', null=True, db_column='PreparationID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'exchangeoutprep'

class Exsiccata(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ExsiccataID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    title = models.CharField(max_length=765, db_column='Title')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    referencework = models.ForeignKey('specify.Referencework', db_column='ReferenceWorkID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'exsiccata'

class Exsiccataitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ExsiccataItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fascicle = models.CharField(max_length=48, db_column='Fascicle', blank=True)
    number = models.CharField(max_length=48, db_column='Number', blank=True)
    exsiccata = models.ForeignKey('specify.Exsiccata', db_column='ExsiccataID', related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', db_column='CollectionObjectID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'exsiccataitem'

class Fieldnotebook(models.Model):
    id = models.IntegerField(primary_key=True, db_column='FieldNotebookID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    storage = models.CharField(max_length=192, db_column='Storage', blank=True)
    name = models.CharField(max_length=96, db_column='Name', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    collection = models.ForeignKey('specify.Collection', db_column='CollectionID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    class Meta:
        db_table = u'fieldnotebook'

class Fieldnotebookattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='FieldNotebookAttachmentId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    fieldnotebook = models.ForeignKey('specify.Fieldnotebook', db_column='FieldNotebookID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'fieldnotebookattachment'

class Fieldnotebookpage(models.Model):
    id = models.IntegerField(primary_key=True, db_column='FieldNotebookPageID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=384, db_column='Description', blank=True)
    pagenumber = models.CharField(max_length=96, db_column='PageNumber')
    scandate = models.DateField(null=True, db_column='ScanDate', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    fieldnotebookpageset = models.ForeignKey('specify.Fieldnotebookpageset', null=True, db_column='FieldNotebookPageSetID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    class Meta:
        db_table = u'fieldnotebookpage'

class Fieldnotebookpageattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='FieldNotebookPageAttachmentId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    fieldnotebookpage = models.ForeignKey('specify.Fieldnotebookpage', db_column='FieldNotebookPageID', related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    class Meta:
        db_table = u'fieldnotebookpageattachment'

class Fieldnotebookpageset(models.Model):
    id = models.IntegerField(primary_key=True, db_column='FieldNotebookPageSetID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=384, db_column='Description', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    method = models.CharField(max_length=192, db_column='Method', blank=True)
    ordernumber = models.IntegerField(null=True, db_column='OrderNumber', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    agent = models.ForeignKey('specify.Agent', null=True, db_column='AgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    fieldnotebook = models.ForeignKey('specify.Fieldnotebook', null=True, db_column='FieldNotebookID', blank=True, related_name='+')
    class Meta:
        db_table = u'fieldnotebookpageset'

class Fieldnotebookpagesetattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='FieldNotebookPageSetAttachmentId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    fieldnotebookpageset = models.ForeignKey('specify.Fieldnotebookpageset', db_column='FieldNotebookPageSetID', related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'fieldnotebookpagesetattachment'

class Geocoorddetail(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GeoCoordDetailID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    georefaccuracyunits = models.CharField(max_length=60, db_column='GeoRefAccuracyUnits', blank=True)
    georefdetdate = models.DateTimeField(null=True, db_column='GeoRefDetDate', blank=True)
    georefdetref = models.CharField(max_length=300, db_column='GeoRefDetRef', blank=True)
    georefremarks = models.TextField(db_column='GeoRefRemarks', blank=True)
    georefverificationstatus = models.CharField(max_length=150, db_column='GeoRefVerificationStatus', blank=True)
    maxuncertaintyest = models.DecimalField(decimal_places=10, null=True, max_digits=22, db_column='MaxUncertaintyEst', blank=True)
    maxuncertaintyestunit = models.CharField(max_length=24, db_column='MaxUncertaintyEstUnit', blank=True)
    uncertaintypolygon = models.TextField(db_column='UncertaintyPolygon', blank=True)
    errorpolygon = models.TextField(db_column='ErrorPolygon', blank=True)
    namedplaceextent = models.DecimalField(decimal_places=10, null=True, max_digits=22, db_column='NamedPlaceExtent', blank=True)
    nogeorefbecause = models.CharField(max_length=300, db_column='NoGeoRefBecause', blank=True)
    originalcoordsystem = models.CharField(max_length=96, db_column='OriginalCoordSystem', blank=True)
    protocol = models.CharField(max_length=192, db_column='Protocol', blank=True)
    source = models.CharField(max_length=192, db_column='Source', blank=True)
    validation = models.CharField(max_length=192, db_column='Validation', blank=True)
    locality = models.ForeignKey('specify.Locality', null=True, db_column='LocalityID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', null=True, db_column='AgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'geocoorddetail'

class Geography(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GeographyID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    abbrev = models.CharField(max_length=48, db_column='Abbrev', blank=True)
    centroidlat = models.DecimalField(decimal_places=2, null=True, max_digits=21, db_column='CentroidLat', blank=True)
    centroidlon = models.DecimalField(decimal_places=2, null=True, max_digits=21, db_column='CentroidLon', blank=True)
    commonname = models.CharField(max_length=384, db_column='CommonName', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    geographycode = models.CharField(max_length=24, db_column='GeographyCode', blank=True)
    gml = models.TextField(db_column='GML', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isaccepted = models.NullBooleanField(null=True, db_column='IsAccepted', blank=True)
    iscurrent = models.NullBooleanField(null=True, db_column='IsCurrent', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    number2 = models.IntegerField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    timestampversion = models.DateTimeField(null=True, db_column='TimestampVersion', blank=True)
    geographytreedefitem = models.ForeignKey('specify.Geographytreedefitem', db_column='GeographyTreeDefItemID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    parent = models.ForeignKey('self', null=True, db_column='ParentID', blank=True, related_name='+')
    accepted = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    geographytreedef = models.ForeignKey('specify.Geographytreedef', db_column='GeographyTreeDefID', related_name='+')
    class Meta:
        db_table = u'geography'

class Geographytreedef(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GeographyTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'geographytreedef'

class Geographytreedefitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GeographyTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.NullBooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.NullBooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    geographytreedef = models.ForeignKey('specify.Geographytreedef', db_column='GeographyTreeDefID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    parentitem = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True, related_name='+')
    class Meta:
        db_table = u'geographytreedefitem'

class Geologictimeperiod(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GeologicTimePeriodID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    endperiod = models.FloatField(null=True, db_column='EndPeriod', blank=True)
    enduncertainty = models.FloatField(null=True, db_column='EndUncertainty', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isaccepted = models.NullBooleanField(null=True, db_column='IsAccepted', blank=True)
    isbiostrat = models.NullBooleanField(null=True, db_column='IsBioStrat', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    standard = models.CharField(max_length=192, db_column='Standard', blank=True)
    startperiod = models.FloatField(null=True, db_column='StartPeriod', blank=True)
    startuncertainty = models.FloatField(null=True, db_column='StartUncertainty', blank=True)
    text1 = models.CharField(max_length=384, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=384, db_column='Text2', blank=True)
    parent = models.ForeignKey('self', null=True, db_column='ParentID', blank=True, related_name='+')
    geologictimeperiodtreedef = models.ForeignKey('specify.Geologictimeperiodtreedef', db_column='GeologicTimePeriodTreeDefID', related_name='+')
    accepted = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    geologictimeperiodtreedefitem = models.ForeignKey('specify.Geologictimeperiodtreedefitem', db_column='GeologicTimePeriodTreeDefItemID', related_name='+')
    class Meta:
        db_table = u'geologictimeperiod'

class Geologictimeperiodtreedef(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GeologicTimePeriodTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'geologictimeperiodtreedef'

class Geologictimeperiodtreedefitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GeologicTimePeriodTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.NullBooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.NullBooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    parentitem = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    geologictimeperiodtreedef = models.ForeignKey('specify.Geologictimeperiodtreedef', db_column='GeologicTimePeriodTreeDefID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'geologictimeperiodtreedefitem'

class Gift(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GiftID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    datereceived = models.DateField(null=True, db_column='DateReceived', blank=True)
    giftdate = models.DateField(null=True, db_column='GiftDate', blank=True)
    giftnumber = models.CharField(max_length=150, db_column='GiftNumber')
    isfinancialresponsibility = models.NullBooleanField(null=True, db_column='IsFinancialResponsibility', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    purposeofgift = models.CharField(max_length=192, db_column='PurposeOfGift', blank=True)
    receivedcomments = models.CharField(max_length=765, db_column='ReceivedComments', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    specialconditions = models.TextField(db_column='SpecialConditions', blank=True)
    srcgeography = models.CharField(max_length=96, db_column='SrcGeography', blank=True)
    srctaxonomy = models.CharField(max_length=96, db_column='SrcTaxonomy', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    division = models.ForeignKey('specify.Division', null=True, db_column='DivisionID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    addressofrecord = models.ForeignKey('specify.Addressofrecord', null=True, db_column='AddressOfRecordID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    class Meta:
        db_table = u'gift'

class Giftagent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GiftAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=150, db_column='Role')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    gift = models.ForeignKey('specify.Gift', db_column='GiftID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'giftagent'

class Giftpreparation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GiftPreparationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    descriptionofmaterial = models.CharField(max_length=765, db_column='DescriptionOfMaterial', blank=True)
    incomments = models.TextField(db_column='InComments', blank=True)
    outcomments = models.TextField(db_column='OutComments', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    receivedcomments = models.TextField(db_column='ReceivedComments', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    gift = models.ForeignKey('specify.Gift', null=True, db_column='GiftID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    preparation = models.ForeignKey('specify.Preparation', null=True, db_column='PreparationID', blank=True, related_name='+')
    class Meta:
        db_table = u'giftpreparation'

class Groupperson(models.Model):
    id = models.IntegerField(primary_key=True, db_column='GroupPersonID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordernumber = models.IntegerField(unique=True, db_column='OrderNumber')
    remarks = models.TextField(db_column='Remarks', blank=True)
    division = models.ForeignKey('specify.Division', db_column='DivisionID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    member = models.ForeignKey('specify.Agent', db_column='MemberID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    group = models.ForeignKey('specify.Agent', db_column='GroupID', related_name='+')
    class Meta:
        db_table = u'groupperson'

class HibernateUniqueKey(models.Model):
    next_hi = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'hibernate_unique_key'

class Inforequest(models.Model):
    id = models.IntegerField(primary_key=True, db_column='InfoRequestID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    email = models.CharField(max_length=150, db_column='Email', blank=True)
    firstname = models.CharField(max_length=150, db_column='Firstname', blank=True)
    inforeqnumber = models.CharField(max_length=96, db_column='InfoReqNumber', blank=True)
    institution = models.CharField(max_length=381, db_column='Institution', blank=True)
    lastname = models.CharField(max_length=150, db_column='Lastname', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    replydate = models.DateField(null=True, db_column='ReplyDate', blank=True)
    requestdate = models.DateField(null=True, db_column='RequestDate', blank=True)
    agent = models.ForeignKey('specify.Agent', null=True, db_column='AgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'inforequest'

class Institution(models.Model):
    usergroupscopeid = models.IntegerField(unique=True, db_column='UserGroupScopeId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    altname = models.CharField(max_length=384, db_column='AltName', blank=True)
    code = models.CharField(max_length=192, db_column='Code', blank=True)
    copyright = models.TextField(db_column='Copyright', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    disclaimer = models.TextField(db_column='Disclaimer', blank=True)
    hasbeenasked = models.NullBooleanField(null=True, db_column='HasBeenAsked', blank=True)
    iconuri = models.CharField(max_length=765, db_column='IconURI', blank=True)
    institutionid = models.IntegerField(null=True, db_column='institutionId', blank=True)
    ipr = models.TextField(db_column='Ipr', blank=True)
    isaccessionsglobal = models.BooleanField(db_column='IsAccessionsGlobal')
    isanonymous = models.NullBooleanField(null=True, db_column='IsAnonymous', blank=True)
    issecurityon = models.BooleanField(db_column='IsSecurityOn')
    isserverbased = models.BooleanField(db_column='IsServerBased')
    issharinglocalities = models.BooleanField(db_column='IsSharingLocalities')
    issinglegeographytree = models.BooleanField(db_column='IsSingleGeographyTree')
    license = models.TextField(db_column='License', blank=True)
    lsidauthority = models.CharField(max_length=192, db_column='LsidAuthority', blank=True)
    name = models.CharField(max_length=765, db_column='Name', blank=True)
    regnumber = models.CharField(max_length=72, db_column='RegNumber', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    termsofuse = models.TextField(db_column='TermsOfUse', blank=True)
    uri = models.CharField(max_length=765, db_column='Uri', blank=True)
    storagetreedef = models.ForeignKey('specify.Storagetreedef', null=True, db_column='StorageTreeDefID', blank=True, related_name='+')
    address = models.ForeignKey('specify.Address', null=True, db_column='AddressID', blank=True, related_name='+')
    currentmanagedrelversion = models.CharField(max_length=24, db_column='CurrentManagedRelVersion', blank=True)
    currentmanagedschemaversion = models.CharField(max_length=24, db_column='CurrentManagedSchemaVersion', blank=True)
    isreleasemanagedglobally = models.NullBooleanField(null=True, db_column='IsReleaseManagedGlobally', blank=True)
    minimumpwdlength = models.IntegerField(null=True, db_column='MinimumPwdLength', blank=True)
    class Meta:
        db_table = u'institution'

class Institutionnetwork(models.Model):
    id = models.IntegerField(primary_key=True, db_column='InstitutionNetworkID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    altname = models.CharField(max_length=384, db_column='AltName', blank=True)
    code = models.CharField(max_length=192, db_column='Code', blank=True)
    copyright = models.TextField(db_column='Copyright', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    disclaimer = models.TextField(db_column='Disclaimer', blank=True)
    iconuri = models.CharField(max_length=765, db_column='IconURI', blank=True)
    ipr = models.TextField(db_column='Ipr', blank=True)
    license = models.TextField(db_column='License', blank=True)
    name = models.CharField(max_length=765, db_column='Name', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    termsofuse = models.TextField(db_column='TermsOfUse', blank=True)
    uri = models.CharField(max_length=765, db_column='Uri', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    address = models.ForeignKey('specify.Address', null=True, db_column='AddressID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'institutionnetwork'

class Journal(models.Model):
    id = models.IntegerField(primary_key=True, db_column='JournalID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    issn = models.CharField(max_length=48, db_column='ISSN', blank=True)
    journalabbreviation = models.CharField(max_length=150, db_column='JournalAbbreviation', blank=True)
    journalname = models.CharField(max_length=765, db_column='JournalName', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'journal'

class Latlonpolygon(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LatLonPolygonID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    ispolyline = models.BooleanField(db_column='IsPolyline')
    name = models.CharField(max_length=192, db_column='Name')
    locality = models.ForeignKey('specify.Locality', null=True, db_column='LocalityID', blank=True, related_name='+')
    spvisualquery = models.ForeignKey('specify.Spvisualquery', null=True, db_column='SpVisualQueryID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'latlonpolygon'

class Latlonpolygonpnt(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LatLonPolygonPntID')
    elevation = models.IntegerField(null=True, db_column='Elevation', blank=True)
    latitude = models.DecimalField(decimal_places=10, max_digits=14, db_column='Latitude')
    longitude = models.DecimalField(decimal_places=10, max_digits=14, db_column='Longitude')
    ordinal = models.IntegerField(db_column='Ordinal')
    latlonpolygon = models.ForeignKey('specify.Latlonpolygon', db_column='LatLonPolygonID', related_name='+')
    class Meta:
        db_table = u'latlonpolygonpnt'

class Lithostrat(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LithoStratID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isaccepted = models.NullBooleanField(null=True, db_column='IsAccepted', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    accepted = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True, related_name='+')
    lithostrattreedefitem = models.ForeignKey('specify.Lithostrattreedefitem', db_column='LithoStratTreeDefItemID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    lithostrattreedef = models.ForeignKey('specify.Lithostrattreedef', db_column='LithoStratTreeDefID', related_name='+')
    parent = models.ForeignKey('self', null=True, db_column='ParentID', blank=True, related_name='+')
    class Meta:
        db_table = u'lithostrat'

class Lithostrattreedef(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LithoStratTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'lithostrattreedef'

class Lithostrattreedefitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LithoStratTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.NullBooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.NullBooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    parentitem = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    lithostrattreedef = models.ForeignKey('specify.Lithostrattreedef', db_column='LithoStratTreeDefID', related_name='+')
    class Meta:
        db_table = u'lithostrattreedefitem'

class Loan(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LoanID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    currentduedate = models.DateField(null=True, db_column='CurrentDueDate', blank=True)
    dateclosed = models.DateField(null=True, db_column='DateClosed', blank=True)
    datereceived = models.DateField(null=True, db_column='DateReceived', blank=True)
    isclosed = models.NullBooleanField(null=True, db_column='IsClosed', blank=True)
    isfinancialresponsibility = models.NullBooleanField(null=True, db_column='IsFinancialResponsibility', blank=True)
    loandate = models.DateField(null=True, db_column='LoanDate', blank=True)
    loannumber = models.CharField(max_length=150, db_column='LoanNumber')
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    originalduedate = models.DateField(null=True, db_column='OriginalDueDate', blank=True)
    overduenotisetdate = models.DateField(null=True, db_column='OverdueNotiSetDate', blank=True)
    purposeofloan = models.CharField(max_length=192, db_column='PurposeOfLoan', blank=True)
    receivedcomments = models.CharField(max_length=765, db_column='ReceivedComments', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    specialconditions = models.TextField(db_column='SpecialConditions', blank=True)
    srcgeography = models.CharField(max_length=96, db_column='SrcGeography', blank=True)
    srctaxonomy = models.CharField(max_length=96, db_column='SrcTaxonomy', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    addressofrecord = models.ForeignKey('specify.Addressofrecord', null=True, db_column='AddressOfRecordID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    division = models.ForeignKey('specify.Division', null=True, db_column='DivisionID', blank=True, related_name='+')
    class Meta:
        db_table = u'loan'

class Loanagent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LoanAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=150, db_column='Role')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    loan = models.ForeignKey('specify.Loan', db_column='LoanID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'loanagent'

class Loanattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LoanAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    loan = models.ForeignKey('specify.Loan', db_column='LoanID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'loanattachment'

class Loanpreparation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LoanPreparationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    descriptionofmaterial = models.TextField(db_column='DescriptionOfMaterial', blank=True)
    incomments = models.TextField(db_column='InComments', blank=True)
    isresolved = models.BooleanField(db_column='IsResolved')
    outcomments = models.TextField(db_column='OutComments', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    quantityresolved = models.IntegerField(null=True, db_column='QuantityResolved', blank=True)
    quantityreturned = models.IntegerField(null=True, db_column='QuantityReturned', blank=True)
    receivedcomments = models.TextField(db_column='ReceivedComments', blank=True)
    loan = models.ForeignKey('specify.Loan', db_column='LoanID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    preparation = models.ForeignKey('specify.Preparation', null=True, db_column='PreparationID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    class Meta:
        db_table = u'loanpreparation'

class Loanreturnpreparation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LoanReturnPreparationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    quantityresolved = models.IntegerField(null=True, db_column='QuantityResolved', blank=True)
    quantityreturned = models.IntegerField(null=True, db_column='QuantityReturned', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    returneddate = models.DateField(null=True, db_column='ReturnedDate', blank=True)
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    deaccessionpreparation = models.ForeignKey('specify.Deaccessionpreparation', null=True, db_column='DeaccessionPreparationID', blank=True, related_name='+')
    receivedby = models.ForeignKey('specify.Agent', null=True, db_column='ReceivedByID', blank=True, related_name='+')
    loanpreparation = models.ForeignKey('specify.Loanpreparation', db_column='LoanPreparationID', related_name='+')
    class Meta:
        db_table = u'loanreturnpreparation'

class Locality(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LocalityID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    datum = models.CharField(max_length=150, db_column='Datum', blank=True)
    elevationaccuracy = models.FloatField(null=True, db_column='ElevationAccuracy', blank=True)
    elevationmethod = models.CharField(max_length=150, db_column='ElevationMethod', blank=True)
    gml = models.TextField(db_column='GML', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    lat1text = models.CharField(max_length=150, db_column='Lat1Text', blank=True)
    lat2text = models.CharField(max_length=150, db_column='Lat2Text', blank=True)
    latlongaccuracy = models.FloatField(null=True, db_column='LatLongAccuracy', blank=True)
    latlongmethod = models.CharField(max_length=150, db_column='LatLongMethod', blank=True)
    latlongtype = models.CharField(max_length=150, db_column='LatLongType', blank=True)
    latitude1 = models.DecimalField(decimal_places=10, null=True, max_digits=14, db_column='Latitude1', blank=True)
    latitude2 = models.DecimalField(decimal_places=10, null=True, max_digits=14, db_column='Latitude2', blank=True)
    localityname = models.CharField(max_length=765, db_column='LocalityName')
    long1text = models.CharField(max_length=150, db_column='Long1Text', blank=True)
    long2text = models.CharField(max_length=150, db_column='Long2Text', blank=True)
    longitude1 = models.DecimalField(decimal_places=10, null=True, max_digits=15, db_column='Longitude1', blank=True)
    longitude2 = models.DecimalField(decimal_places=10, null=True, max_digits=15, db_column='Longitude2', blank=True)
    maxelevation = models.FloatField(null=True, db_column='MaxElevation', blank=True)
    minelevation = models.FloatField(null=True, db_column='MinElevation', blank=True)
    namedplace = models.CharField(max_length=765, db_column='NamedPlace', blank=True)
    originalelevationunit = models.CharField(max_length=150, db_column='OriginalElevationUnit', blank=True)
    originallatlongunit = models.IntegerField(null=True, db_column='OriginalLatLongUnit', blank=True)
    relationtonamedplace = models.CharField(max_length=360, db_column='RelationToNamedPlace', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    shortname = models.CharField(max_length=96, db_column='ShortName', blank=True)
    srclatlongunit = models.IntegerField(db_column='SrcLatLongUnit')
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    verbatimelevation = models.CharField(max_length=150, db_column='VerbatimElevation', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    geography = models.ForeignKey('specify.Geography', null=True, db_column='GeographyID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    visibilitysetby = models.ForeignKey('specify.Specifyuser', null=True, db_column='VisibilitySetByID', blank=True, related_name='+')
    sgrstatus = models.IntegerField(null=True, db_column='SGRStatus', blank=True)
    class Meta:
        db_table = u'locality'

class Localityattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LocalityAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    locality = models.ForeignKey('specify.Locality', db_column='LocalityID', related_name='+')
    class Meta:
        db_table = u'localityattachment'

class Localitycitation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LocalityCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    locality = models.ForeignKey('specify.Locality', db_column='LocalityID', related_name='+')
    referencework = models.ForeignKey('specify.Referencework', db_column='ReferenceWorkID', related_name='+')
    class Meta:
        db_table = u'localitycitation'

class Localitydetail(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LocalityDetailID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    basemeridian = models.CharField(max_length=150, db_column='BaseMeridian', blank=True)
    drainage = models.CharField(max_length=192, db_column='Drainage', blank=True)
    enddepth = models.FloatField(null=True, db_column='EndDepth', blank=True)
    enddepthunit = models.IntegerField(null=True, db_column='EndDepthUnit', blank=True)
    enddepthverbatim = models.CharField(max_length=96, db_column='EndDepthVerbatim', blank=True)
    gml = models.TextField(db_column='GML', blank=True)
    huccode = models.CharField(max_length=48, db_column='HucCode', blank=True)
    island = models.CharField(max_length=192, db_column='Island', blank=True)
    islandgroup = models.CharField(max_length=192, db_column='IslandGroup', blank=True)
    mgrszone = models.CharField(max_length=12, db_column='MgrsZone', blank=True)
    nationalparkname = models.CharField(max_length=192, db_column='NationalParkName', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    rangedesc = models.CharField(max_length=150, db_column='RangeDesc', blank=True)
    rangedirection = models.CharField(max_length=150, db_column='RangeDirection', blank=True)
    section = models.CharField(max_length=150, db_column='Section', blank=True)
    sectionpart = models.CharField(max_length=150, db_column='SectionPart', blank=True)
    startdepth = models.FloatField(null=True, db_column='StartDepth', blank=True)
    startdepthunit = models.IntegerField(null=True, db_column='StartDepthUnit', blank=True)
    startdepthverbatim = models.CharField(max_length=96, db_column='StartDepthVerbatim', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    township = models.CharField(max_length=150, db_column='Township', blank=True)
    townshipdirection = models.CharField(max_length=150, db_column='TownshipDirection', blank=True)
    utmdatum = models.CharField(max_length=765, db_column='UtmDatum', blank=True)
    utmeasting = models.DecimalField(decimal_places=10, null=True, max_digits=22, db_column='UtmEasting', blank=True)
    utmfalseeasting = models.IntegerField(null=True, db_column='UtmFalseEasting', blank=True)
    utmfalsenorthing = models.IntegerField(null=True, db_column='UtmFalseNorthing', blank=True)
    utmnorthing = models.DecimalField(decimal_places=10, null=True, max_digits=22, db_column='UtmNorthing', blank=True)
    utmoriglatitude = models.DecimalField(decimal_places=2, null=True, max_digits=21, db_column='UtmOrigLatitude', blank=True)
    utmoriglongitude = models.DecimalField(decimal_places=2, null=True, max_digits=21, db_column='UtmOrigLongitude', blank=True)
    utmscale = models.DecimalField(decimal_places=10, null=True, max_digits=22, db_column='UtmScale', blank=True)
    utmzone = models.IntegerField(null=True, db_column='UtmZone', blank=True)
    waterbody = models.CharField(max_length=192, db_column='WaterBody', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    locality = models.ForeignKey('specify.Locality', null=True, db_column='LocalityID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'localitydetail'

class Localitynamealias(models.Model):
    id = models.IntegerField(primary_key=True, db_column='LocalityNameAliasID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=765, db_column='Name')
    source = models.CharField(max_length=192, db_column='Source')
    locality = models.ForeignKey('specify.Locality', db_column='LocalityID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'localitynamealias'

class Morphbankview(models.Model):
    id = models.IntegerField(primary_key=True, db_column='MorphBankViewID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    developmentstate = models.CharField(max_length=384, db_column='DevelopmentState', blank=True)
    form = models.CharField(max_length=384, db_column='Form', blank=True)
    imagingpreparationtechnique = models.CharField(max_length=384, db_column='ImagingPreparationTechnique', blank=True)
    imagingtechnique = models.CharField(max_length=384, db_column='ImagingTechnique', blank=True)
    morphbankexternalviewid = models.IntegerField(null=True, db_column='MorphBankExternalViewID', blank=True)
    sex = models.CharField(max_length=96, db_column='Sex', blank=True)
    specimenpart = models.CharField(max_length=384, db_column='SpecimenPart', blank=True)
    viewangle = models.CharField(max_length=384, db_column='ViewAngle', blank=True)
    viewname = models.CharField(max_length=384, db_column='ViewName', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'morphbankview'

class Otheridentifier(models.Model):
    id = models.IntegerField(primary_key=True, db_column='OtherIdentifierID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    identifier = models.CharField(max_length=192, db_column='Identifier')
    institution = models.CharField(max_length=192, db_column='Institution', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', db_column='CollectionObjectID', related_name='+')
    class Meta:
        db_table = u'otheridentifier'

class Paleocontext(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PaleoContextID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    bottomdistance = models.FloatField(null=True, db_column='BottomDistance', blank=True)
    direction = models.CharField(max_length=96, db_column='Direction', blank=True)
    distanceunits = models.CharField(max_length=48, db_column='DistanceUnits', blank=True)
    positionstate = models.CharField(max_length=96, db_column='PositionState', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=192, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=192, db_column='Text2', blank=True)
    topdistance = models.FloatField(null=True, db_column='TopDistance', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    lithostrat = models.ForeignKey('specify.Lithostrat', null=True, db_column='LithoStratID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    chronosstrat = models.ForeignKey('specify.Geologictimeperiod', null=True, db_column='ChronosStratID', blank=True, related_name='+')
    biostrat = models.ForeignKey('specify.Geologictimeperiod', null=True, db_column='BioStratID', blank=True, related_name='+')
    chronosstratend = models.ForeignKey('specify.Geologictimeperiod', null=True, db_column='ChronosStratEndID', blank=True, related_name='+')
    class Meta:
        db_table = u'paleocontext'

class Permit(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PermitID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    issueddate = models.DateField(null=True, db_column='IssuedDate', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    permitnumber = models.CharField(max_length=150, db_column='PermitNumber')
    remarks = models.TextField(db_column='Remarks', blank=True)
    renewaldate = models.DateField(null=True, db_column='RenewalDate', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    type = models.CharField(max_length=150, db_column='Type', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    issuedto = models.ForeignKey('specify.Agent', null=True, db_column='IssuedToID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    issuedby = models.ForeignKey('specify.Agent', null=True, db_column='IssuedByID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'permit'

class Permitattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PermitAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    permit = models.ForeignKey('specify.Permit', db_column='PermitID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'permitattachment'

class Picklist(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PickListID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fieldname = models.CharField(max_length=192, db_column='FieldName', blank=True)
    filterfieldname = models.CharField(max_length=96, db_column='FilterFieldName', blank=True)
    filtervalue = models.CharField(max_length=96, db_column='FilterValue', blank=True)
    formatter = models.CharField(max_length=192, db_column='Formatter', blank=True)
    issystem = models.BooleanField(db_column='IsSystem')
    name = models.CharField(max_length=192, db_column='Name')
    readonly = models.BooleanField(db_column='ReadOnly')
    sizelimit = models.IntegerField(null=True, db_column='SizeLimit', blank=True)
    sorttype = models.IntegerField(null=True, db_column='SortType', blank=True)
    tablename = models.CharField(max_length=192, db_column='TableName', blank=True)
    type = models.IntegerField(db_column='Type')
    collection = models.ForeignKey('specify.Collection', db_column='CollectionID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'picklist'

class Picklistitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PickListItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    title = models.CharField(max_length=192, db_column='Title')
    value = models.CharField(max_length=192, db_column='Value', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    picklist = models.ForeignKey('specify.Picklist', db_column='PickListID', related_name='+')
    class Meta:
        db_table = u'picklistitem'

class Preparation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PreparationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    countamt = models.IntegerField(null=True, db_column='CountAmt', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    prepareddate = models.DateField(null=True, db_column='PreparedDate', blank=True)
    prepareddateprecision = models.IntegerField(null=True, db_column='PreparedDatePrecision', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    samplenumber = models.CharField(max_length=96, db_column='SampleNumber', blank=True)
    status = models.CharField(max_length=96, db_column='Status', blank=True)
    storagelocation = models.CharField(max_length=150, db_column='StorageLocation', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.NullBooleanField(null=True, db_column='YesNo3', blank=True)
    storage = models.ForeignKey('specify.Storage', null=True, db_column='StorageID', blank=True, related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', db_column='CollectionObjectID', related_name='+')
    preparationattribute = models.ForeignKey('specify.Preparationattribute', null=True, db_column='PreparationAttributeID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    preparedby = models.ForeignKey('specify.Agent', null=True, db_column='PreparedByID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    preptype = models.ForeignKey('specify.Preptype', db_column='PrepTypeID', related_name='+')
    class Meta:
        db_table = u'preparation'

class Preparationattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PreparationAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    preparation = models.ForeignKey('specify.Preparation', db_column='PreparationID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    class Meta:
        db_table = u'preparationattachment'

class Preparationattr(models.Model):
    id = models.IntegerField(primary_key=True, db_column='AttrID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    doublevalue = models.FloatField(null=True, db_column='DoubleValue', blank=True)
    strvalue = models.CharField(max_length=765, db_column='StrValue', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    attributedef = models.ForeignKey('specify.Attributedef', db_column='AttributeDefID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    preparation = models.ForeignKey('specify.Preparation', db_column='PreparationId', related_name='+')
    class Meta:
        db_table = u'preparationattr'

class Preparationattribute(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PreparationAttributeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    attrdate = models.DateTimeField(null=True, db_column='AttrDate', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    number3 = models.FloatField(null=True, db_column='Number3', blank=True)
    number4 = models.IntegerField(null=True, db_column='Number4', blank=True)
    number5 = models.IntegerField(null=True, db_column='Number5', blank=True)
    number6 = models.IntegerField(null=True, db_column='Number6', blank=True)
    number7 = models.IntegerField(null=True, db_column='Number7', blank=True)
    number8 = models.IntegerField(null=True, db_column='Number8', blank=True)
    number9 = models.IntegerField(null=True, db_column='Number9', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text10 = models.TextField(db_column='Text10', blank=True)
    text11 = models.CharField(max_length=150, db_column='Text11', blank=True)
    text12 = models.CharField(max_length=150, db_column='Text12', blank=True)
    text13 = models.CharField(max_length=150, db_column='Text13', blank=True)
    text14 = models.CharField(max_length=150, db_column='Text14', blank=True)
    text15 = models.CharField(max_length=150, db_column='Text15', blank=True)
    text16 = models.CharField(max_length=150, db_column='Text16', blank=True)
    text17 = models.CharField(max_length=150, db_column='Text17', blank=True)
    text18 = models.CharField(max_length=150, db_column='Text18', blank=True)
    text19 = models.CharField(max_length=150, db_column='Text19', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    text20 = models.CharField(max_length=150, db_column='Text20', blank=True)
    text21 = models.CharField(max_length=150, db_column='Text21', blank=True)
    text22 = models.CharField(max_length=150, db_column='Text22', blank=True)
    text23 = models.CharField(max_length=150, db_column='Text23', blank=True)
    text24 = models.CharField(max_length=150, db_column='Text24', blank=True)
    text25 = models.CharField(max_length=150, db_column='Text25', blank=True)
    text26 = models.CharField(max_length=150, db_column='Text26', blank=True)
    text3 = models.CharField(max_length=150, db_column='Text3', blank=True)
    text4 = models.CharField(max_length=150, db_column='Text4', blank=True)
    text5 = models.CharField(max_length=150, db_column='Text5', blank=True)
    text6 = models.CharField(max_length=150, db_column='Text6', blank=True)
    text7 = models.CharField(max_length=150, db_column='Text7', blank=True)
    text8 = models.CharField(max_length=150, db_column='Text8', blank=True)
    text9 = models.CharField(max_length=150, db_column='Text9', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.NullBooleanField(null=True, db_column='YesNo3', blank=True)
    yesno4 = models.NullBooleanField(null=True, db_column='YesNo4', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'preparationattribute'

class Preptype(models.Model):
    id = models.IntegerField(primary_key=True, db_column='PrepTypeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    isloanable = models.BooleanField(db_column='IsLoanable')
    name = models.CharField(max_length=192, db_column='Name')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    collection = models.ForeignKey('specify.Collection', db_column='CollectionID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'preptype'

class Project(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ProjectID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    grantagency = models.CharField(max_length=192, db_column='GrantAgency', blank=True)
    grantnumber = models.CharField(max_length=192, db_column='GrantNumber', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    projectdescription = models.CharField(max_length=765, db_column='ProjectDescription', blank=True)
    projectname = models.CharField(max_length=384, db_column='ProjectName')
    projectnumber = models.CharField(max_length=192, db_column='ProjectNumber', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    url = models.TextField(db_column='URL', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    projectagent = models.ForeignKey('specify.Agent', null=True, db_column='ProjectAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'project'

class ProjectColobj(models.Model):
    project = models.ForeignKey('specify.Project', db_column='ProjectID', related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', db_column='CollectionObjectID', related_name='+')
    class Meta:
        db_table = u'project_colobj'

class Recordset(models.Model):
    id = models.IntegerField(primary_key=True, db_column='RecordSetID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    allpermissionlevel = models.IntegerField(null=True, db_column='AllPermissionLevel', blank=True)
    tableid = models.IntegerField(db_column='TableID')
    grouppermissionlevel = models.IntegerField(null=True, db_column='GroupPermissionLevel', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    ownerpermissionlevel = models.IntegerField(null=True, db_column='OwnerPermissionLevel', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    type = models.IntegerField(db_column='Type')
    inforequest = models.ForeignKey('specify.Inforequest', null=True, db_column='InfoRequestID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    specifyuser = models.ForeignKey('specify.Specifyuser', db_column='SpecifyUserID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    spprincipal = models.ForeignKey('specify.Spprincipal', null=True, db_column='SpPrincipalID', blank=True, related_name='+')
    class Meta:
        db_table = u'recordset'

class Recordsetitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='RecordSetItemID')
    recordid = models.IntegerField(db_column='RecordId')
    recordset = models.ForeignKey('specify.Recordset', db_column='RecordSetID', related_name='+')
    class Meta:
        db_table = u'recordsetitem'

class Referencework(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ReferenceWorkID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    ispublished = models.NullBooleanField(null=True, db_column='IsPublished', blank=True)
    isbn = models.CharField(max_length=48, db_column='ISBN', blank=True)
    librarynumber = models.CharField(max_length=150, db_column='LibraryNumber', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    pages = models.CharField(max_length=150, db_column='Pages', blank=True)
    placeofpublication = models.CharField(max_length=150, db_column='PlaceOfPublication', blank=True)
    publisher = models.CharField(max_length=150, db_column='Publisher', blank=True)
    referenceworktype = models.IntegerField(db_column='ReferenceWorkType')
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    title = models.CharField(max_length=765, db_column='Title', blank=True)
    url = models.TextField(db_column='URL', blank=True)
    volume = models.CharField(max_length=75, db_column='Volume', blank=True)
    workdate = models.CharField(max_length=75, db_column='WorkDate', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    containedrfparent = models.ForeignKey('self', null=True, db_column='ContainedRFParentID', blank=True, related_name='+')
    journal = models.ForeignKey('specify.Journal', null=True, db_column='JournalID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'referencework'

class Repositoryagreement(models.Model):
    id = models.IntegerField(primary_key=True, db_column='RepositoryAgreementID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    datereceived = models.DateField(null=True, db_column='DateReceived', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    repositoryagreementnumber = models.CharField(max_length=180, db_column='RepositoryAgreementNumber')
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    status = models.CharField(max_length=96, db_column='Status', blank=True)
    text1 = models.CharField(max_length=765, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=765, db_column='Text2', blank=True)
    text3 = models.CharField(max_length=765, db_column='Text3', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    addressofrecord = models.ForeignKey('specify.Addressofrecord', null=True, db_column='AddressOfRecordID', blank=True, related_name='+')
    agent = models.ForeignKey('specify.Agent', db_column='AgentID', related_name='+')
    division = models.ForeignKey('specify.Division', db_column='DivisionID', related_name='+')
    class Meta:
        db_table = u'repositoryagreement'

class Repositoryagreementattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='RepositoryAgreementAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    repositoryagreement = models.ForeignKey('specify.Repositoryagreement', db_column='RepositoryAgreementID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'repositoryagreementattachment'

class Shipment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='ShipmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    insuredforamount = models.CharField(max_length=150, db_column='InsuredForAmount', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    numberofpackages = models.IntegerField(null=True, db_column='NumberOfPackages', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    shipmentdate = models.DateField(null=True, db_column='ShipmentDate', blank=True)
    shipmentmethod = models.CharField(max_length=150, db_column='ShipmentMethod', blank=True)
    shipmentnumber = models.CharField(max_length=150, db_column='ShipmentNumber')
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    weight = models.CharField(max_length=150, db_column='Weight', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    exchangeout = models.ForeignKey('specify.Exchangeout', null=True, db_column='ExchangeOutID', blank=True, related_name='+')
    loan = models.ForeignKey('specify.Loan', null=True, db_column='LoanID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    shipper = models.ForeignKey('specify.Agent', null=True, db_column='ShipperID', blank=True, related_name='+')
    shippedby = models.ForeignKey('specify.Agent', null=True, db_column='ShippedByID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    shippedto = models.ForeignKey('specify.Agent', null=True, db_column='ShippedToID', blank=True, related_name='+')
    gift = models.ForeignKey('specify.Gift', null=True, db_column='GiftID', blank=True, related_name='+')
    borrow = models.ForeignKey('specify.Borrow', null=True, db_column='BorrowID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'shipment'

class SpSchemaMapping(models.Model):
    spexportschemamapping = models.ForeignKey('specify.Spexportschemamapping', db_column='SpExportSchemaMappingID', related_name='+')
    spexportschema = models.ForeignKey('specify.Spexportschema', db_column='SpExportSchemaID', related_name='+')
    class Meta:
        db_table = u'sp_schema_mapping'

class Spappresource(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpAppResourceID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    allpermissionlevel = models.IntegerField(null=True, db_column='AllPermissionLevel', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    grouppermissionlevel = models.IntegerField(null=True, db_column='GroupPermissionLevel', blank=True)
    level = models.IntegerField(db_column='Level')
    metadata = models.CharField(max_length=765, db_column='MetaData', blank=True)
    mimetype = models.CharField(max_length=765, db_column='MimeType', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    ownerpermissionlevel = models.IntegerField(null=True, db_column='OwnerPermissionLevel', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    spprincipal = models.ForeignKey('specify.Spprincipal', null=True, db_column='SpPrincipalID', blank=True, related_name='+')
    spappresourcedir = models.ForeignKey('specify.Spappresourcedir', db_column='SpAppResourceDirID', related_name='+')
    specifyuser = models.ForeignKey('specify.Specifyuser', db_column='SpecifyUserID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spappresource'

class Spappresourcedata(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpAppResourceDataID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    data = models.TextField(blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    spviewsetobj = models.ForeignKey('specify.Spviewsetobj', null=True, db_column='SpViewSetObjID', blank=True, related_name='+')
    spappresource = models.ForeignKey('specify.Spappresource', null=True, db_column='SpAppResourceID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spappresourcedata'

class Spappresourcedir(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpAppResourceDirID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    disciplinetype = models.CharField(max_length=192, db_column='DisciplineType', blank=True)
    ispersonal = models.BooleanField(db_column='IsPersonal')
    usertype = models.CharField(max_length=192, db_column='UserType', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', null=True, db_column='DisciplineID', blank=True, related_name='+')
    specifyuser = models.ForeignKey('specify.Specifyuser', null=True, db_column='SpecifyUserID', blank=True, related_name='+')
    collection = models.ForeignKey('specify.Collection', null=True, db_column='CollectionID', blank=True, related_name='+')
    class Meta:
        db_table = u'spappresourcedir'

class Spauditlog(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpAuditLogID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    action = models.IntegerField(db_column='Action')
    parentrecordid = models.IntegerField(null=True, db_column='ParentRecordId', blank=True)
    parenttablenum = models.IntegerField(null=True, db_column='ParentTableNum', blank=True)
    recordid = models.IntegerField(null=True, db_column='RecordId', blank=True)
    recordversion = models.IntegerField(db_column='RecordVersion')
    tablenum = models.IntegerField(db_column='TableNum')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spauditlog'

class Spauditlogfield(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpAuditLogFieldID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fieldname = models.CharField(max_length=96, db_column='FieldName')
    newvalue = models.CharField(max_length=192, db_column='NewValue')
    oldvalue = models.CharField(max_length=192, db_column='OldValue')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    spauditlog = models.ForeignKey('specify.Spauditlog', null=True, db_column='SpAuditLogID', blank=True, related_name='+')
    class Meta:
        db_table = u'spauditlogfield'

class Specifyuser(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpecifyUserID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    accumminloggedin = models.BigIntegerField(null=True, db_column='AccumMinLoggedIn', blank=True)
    email = models.CharField(max_length=192, db_column='EMail', blank=True)
    isloggedin = models.BooleanField(db_column='IsLoggedIn')
    isloggedinreport = models.BooleanField(db_column='IsLoggedInReport')
    logincollectionname = models.CharField(max_length=192, db_column='LoginCollectionName', blank=True)
    logindisciplinename = models.CharField(max_length=192, db_column='LoginDisciplineName', blank=True)
    loginouttime = models.DateTimeField(null=True, db_column='LoginOutTime', blank=True)
    name = models.CharField(unique=True, max_length=192, db_column='Name')
    password = models.CharField(max_length=765, db_column='Password')
    usertype = models.CharField(max_length=96, db_column='UserType', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'specifyuser'

class SpecifyuserSpprincipal(models.Model):
    specifyuser = models.ForeignKey('specify.Specifyuser', db_column='SpecifyUserID', related_name='+')
    spprincipal = models.ForeignKey('specify.Spprincipal', db_column='SpPrincipalID', related_name='+')
    class Meta:
        db_table = u'specifyuser_spprincipal'

class Spexportschema(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpExportSchemaID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    schemaname = models.CharField(max_length=240, db_column='SchemaName', blank=True)
    schemaversion = models.CharField(max_length=240, db_column='SchemaVersion', blank=True)
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spexportschema'

class Spexportschemaitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpExportSchemaItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    datatype = models.CharField(max_length=96, db_column='DataType', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    fieldname = models.CharField(max_length=192, db_column='FieldName', blank=True)
    formatter = models.CharField(max_length=96, db_column='Formatter', blank=True)
    splocalecontaineritem = models.ForeignKey('specify.Splocalecontaineritem', null=True, db_column='SpLocaleContainerItemID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    spexportschema = models.ForeignKey('specify.Spexportschema', db_column='SpExportSchemaID', related_name='+')
    class Meta:
        db_table = u'spexportschemaitem'

class Spexportschemaitemmapping(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpExportSchemaItemMappingID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.CharField(max_length=765, db_column='Remarks', blank=True)
    spqueryfield = models.ForeignKey('specify.Spqueryfield', null=True, db_column='SpQueryFieldID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    spexportschemamapping = models.ForeignKey('specify.Spexportschemamapping', null=True, db_column='SpExportSchemaMappingID', blank=True, related_name='+')
    exportschemaitem = models.ForeignKey('specify.Spexportschemaitem', null=True, db_column='ExportSchemaItemID', blank=True, related_name='+')
    class Meta:
        db_table = u'spexportschemaitemmapping'

class Spexportschemamapping(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpExportSchemaMappingID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    mappingname = models.CharField(max_length=150, db_column='MappingName', blank=True)
    timestampexported = models.DateTimeField(null=True, db_column='TimeStampExported', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    collectionmemberid = models.IntegerField(null=True, db_column='CollectionMemberID', blank=True)
    class Meta:
        db_table = u'spexportschemamapping'

class Spfieldvaluedefault(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpFieldValueDefaultID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    fieldname = models.CharField(max_length=96, db_column='FieldName', blank=True)
    idvalue = models.IntegerField(null=True, db_column='IdValue', blank=True)
    strvalue = models.CharField(max_length=192, db_column='StrValue', blank=True)
    tablename = models.CharField(max_length=96, db_column='TableName', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spfieldvaluedefault'

class Splocalecontainer(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpLocaleContainerID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    format = models.CharField(max_length=192, db_column='Format', blank=True)
    ishidden = models.BooleanField(db_column='IsHidden')
    issystem = models.BooleanField(db_column='IsSystem')
    isuiformatter = models.NullBooleanField(null=True, db_column='IsUIFormatter', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    picklistname = models.CharField(max_length=192, db_column='PickListName', blank=True)
    type = models.CharField(max_length=96, db_column='Type', blank=True)
    aggregator = models.CharField(max_length=192, db_column='Aggregator', blank=True)
    defaultui = models.CharField(max_length=192, db_column='DefaultUI', blank=True)
    schematype = models.IntegerField(db_column='SchemaType')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='+')
    class Meta:
        db_table = u'splocalecontainer'

class Splocalecontaineritem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpLocaleContainerItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    format = models.CharField(max_length=192, db_column='Format', blank=True)
    ishidden = models.BooleanField(db_column='IsHidden')
    issystem = models.BooleanField(db_column='IsSystem')
    isuiformatter = models.NullBooleanField(null=True, db_column='IsUIFormatter', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    picklistname = models.CharField(max_length=192, db_column='PickListName', blank=True)
    type = models.CharField(max_length=96, db_column='Type', blank=True)
    isrequired = models.NullBooleanField(null=True, db_column='IsRequired', blank=True)
    weblinkname = models.CharField(max_length=96, db_column='WebLinkName', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    splocalecontainer = models.ForeignKey('specify.Splocalecontainer', db_column='SpLocaleContainerID', related_name='+')
    class Meta:
        db_table = u'splocalecontaineritem'

class Splocaleitemstr(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpLocaleItemStrID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    country = models.CharField(max_length=6, db_column='Country', blank=True)
    language = models.CharField(max_length=6, db_column='Language')
    text = models.CharField(max_length=765, db_column='Text')
    variant = models.CharField(max_length=6, db_column='Variant', blank=True)
    splocalecontaineritemdesc = models.ForeignKey('specify.Splocalecontaineritem', null=True, db_column='SpLocaleContainerItemDescID', blank=True, related_name='+')
    splocalecontainerdesc = models.ForeignKey('specify.Splocalecontainer', null=True, db_column='SpLocaleContainerDescID', blank=True, related_name='+')
    splocalecontainername = models.ForeignKey('specify.Splocalecontainer', null=True, db_column='SpLocaleContainerNameID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    splocalecontaineritemname = models.ForeignKey('specify.Splocalecontaineritem', null=True, db_column='SpLocaleContainerItemNameID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'splocaleitemstr'

class Sppermission(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpPermissionID')
    actions = models.TextField(db_column='Actions', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    permissionclass = models.TextField(db_column='PermissionClass')
    targetid = models.IntegerField(null=True, db_column='TargetId', blank=True)
    class Meta:
        db_table = u'sppermission'

class Spprincipal(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpPrincipalID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    groupsubclass = models.CharField(max_length=765, db_column='GroupSubClass')
    grouptype = models.CharField(max_length=96, db_column='groupType', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    priority = models.IntegerField(db_column='Priority')
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    usergroupscopeid = models.IntegerField(null=True, db_column='userGroupScopeID', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spprincipal'

class SpprincipalSppermission(models.Model):
    sppermission = models.ForeignKey('specify.Sppermission', db_column='SpPermissionID', related_name='+')
    spprincipal = models.ForeignKey('specify.Spprincipal', db_column='SpPrincipalID', related_name='+')
    class Meta:
        db_table = u'spprincipal_sppermission'

class Spquery(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpQueryID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    contextname = models.CharField(max_length=192, db_column='ContextName')
    contexttableid = models.IntegerField(db_column='ContextTableId')
    countonly = models.NullBooleanField(null=True, db_column='CountOnly', blank=True)
    isfavorite = models.NullBooleanField(null=True, db_column='IsFavorite', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    searchsynonymy = models.NullBooleanField(null=True, db_column='SearchSynonymy', blank=True)
    selectdistinct = models.NullBooleanField(null=True, db_column='SelectDistinct', blank=True)
    sqlstr = models.CharField(max_length=192, db_column='SqlStr', blank=True)
    specifyuser = models.ForeignKey('specify.Specifyuser', db_column='SpecifyUserID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spquery'

class Spqueryfield(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpQueryFieldID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    alwaysfilter = models.NullBooleanField(null=True, db_column='AlwaysFilter', blank=True)
    columnalias = models.CharField(max_length=192, db_column='ColumnAlias', blank=True)
    contexttableident = models.IntegerField(null=True, db_column='ContextTableIdent', blank=True)
    endvalue = models.CharField(max_length=192, db_column='EndValue', blank=True)
    fieldname = models.CharField(max_length=96, db_column='FieldName')
    formatname = models.CharField(max_length=192, db_column='FormatName', blank=True)
    isdisplay = models.BooleanField(db_column='IsDisplay')
    isnot = models.BooleanField(db_column='IsNot')
    isprompt = models.NullBooleanField(null=True, db_column='IsPrompt', blank=True)
    isrelfld = models.NullBooleanField(null=True, db_column='IsRelFld', blank=True)
    operend = models.IntegerField(null=True, db_column='OperEnd', blank=True)
    operstart = models.IntegerField(db_column='OperStart')
    position = models.IntegerField(db_column='Position')
    sorttype = models.IntegerField(db_column='SortType')
    startvalue = models.CharField(max_length=192, db_column='StartValue')
    stringid = models.TextField(db_column='StringId')
    tablelist = models.TextField(db_column='TableList')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    spquery = models.ForeignKey('specify.Spquery', null=True, db_column='SpQueryID', blank=True, related_name='+')
    allownulls = models.NullBooleanField(null=True, db_column='AllowNulls', blank=True)
    class Meta:
        db_table = u'spqueryfield'

class Spreport(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpReportId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    repeatcount = models.IntegerField(null=True, db_column='RepeatCount', blank=True)
    repeatfield = models.CharField(max_length=765, db_column='RepeatField', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    appresource = models.ForeignKey('specify.Spappresource', db_column='AppResourceID', related_name='+')
    specifyuser = models.ForeignKey('specify.Specifyuser', db_column='SpecifyUserID', related_name='+')
    workbenchtemplate = models.ForeignKey('specify.Workbenchtemplate', null=True, db_column='WorkbenchTemplateID', blank=True, related_name='+')
    spquery = models.ForeignKey('specify.Spquery', null=True, db_column='SpQueryID', blank=True, related_name='+')
    class Meta:
        db_table = u'spreport'

class Sptasksemaphore(models.Model):
    id = models.IntegerField(primary_key=True, db_column='TaskSemaphoreID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    context = models.CharField(max_length=96, db_column='Context', blank=True)
    islocked = models.NullBooleanField(null=True, db_column='IsLocked', blank=True)
    lockedtime = models.DateTimeField(null=True, db_column='LockedTime', blank=True)
    machinename = models.CharField(max_length=192, db_column='MachineName', blank=True)
    scope = models.IntegerField(null=True, db_column='Scope', blank=True)
    taskname = models.CharField(max_length=96, db_column='TaskName', blank=True)
    usagecount = models.IntegerField(null=True, db_column='UsageCount', blank=True)
    owner = models.ForeignKey('specify.Specifyuser', null=True, db_column='OwnerID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    collection = models.ForeignKey('specify.Collection', null=True, db_column='CollectionID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    discipline = models.ForeignKey('specify.Discipline', null=True, db_column='DisciplineID', blank=True, related_name='+')
    class Meta:
        db_table = u'sptasksemaphore'

class Spversion(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpVersionID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    appname = models.CharField(max_length=96, db_column='AppName', blank=True)
    appversion = models.CharField(max_length=48, db_column='AppVersion', blank=True)
    schemaversion = models.CharField(max_length=48, db_column='SchemaVersion', blank=True)
    isdbclosed = models.NullBooleanField(null=True, db_column='IsDBClosed', blank=True)
    dbclosedby = models.CharField(max_length=96, db_column='DbClosedBy', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spversion'

class Spviewsetobj(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpViewSetObjID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    filename = models.CharField(max_length=765, db_column='FileName', blank=True)
    level = models.IntegerField(db_column='Level')
    metadata = models.CharField(max_length=765, db_column='MetaData', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    spappresourcedir = models.ForeignKey('specify.Spappresourcedir', db_column='SpAppResourceDirID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spviewsetobj'

class Spvisualquery(models.Model):
    id = models.IntegerField(primary_key=True, db_column='SpVisualQueryID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    specifyuser = models.ForeignKey('specify.Specifyuser', db_column='SpecifyUserID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'spvisualquery'

class Storage(models.Model):
    id = models.IntegerField(primary_key=True, db_column='StorageID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    abbrev = models.CharField(max_length=48, db_column='Abbrev', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isaccepted = models.NullBooleanField(null=True, db_column='IsAccepted', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    number2 = models.IntegerField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    timestampversion = models.DateTimeField(null=True, db_column='TimestampVersion', blank=True)
    storagetreedefitem = models.ForeignKey('specify.Storagetreedefitem', db_column='StorageTreeDefItemID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    parent = models.ForeignKey('self', null=True, db_column='ParentID', blank=True, related_name='+')
    accepted = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True, related_name='+')
    storagetreedef = models.ForeignKey('specify.Storagetreedef', db_column='StorageTreeDefID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'storage'

class Storagetreedef(models.Model):
    id = models.IntegerField(primary_key=True, db_column='StorageTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'storagetreedef'

class Storagetreedefitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='StorageTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.NullBooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.NullBooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    storagetreedef = models.ForeignKey('specify.Storagetreedef', db_column='StorageTreeDefID', related_name='+')
    parentitem = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'storagetreedefitem'

class Taxon(models.Model):
    id = models.IntegerField(primary_key=True, db_column='TaxonID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    author = models.CharField(max_length=384, db_column='Author', blank=True)
    citesstatus = models.CharField(max_length=96, db_column='CitesStatus', blank=True)
    colstatus = models.CharField(max_length=96, db_column='COLStatus', blank=True)
    commonname = models.CharField(max_length=384, db_column='CommonName', blank=True)
    cultivarname = models.CharField(max_length=96, db_column='CultivarName', blank=True)
    environmentalprotectionstatus = models.CharField(max_length=192, db_column='EnvironmentalProtectionStatus', blank=True)
    esastatus = models.CharField(max_length=192, db_column='EsaStatus', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    groupnumber = models.CharField(max_length=60, db_column='GroupNumber', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isaccepted = models.NullBooleanField(null=True, db_column='IsAccepted', blank=True)
    ishybrid = models.NullBooleanField(null=True, db_column='IsHybrid', blank=True)
    isisnumber = models.CharField(max_length=48, db_column='IsisNumber', blank=True)
    labelformat = models.CharField(max_length=192, db_column='LabelFormat', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    ncbitaxonnumber = models.CharField(max_length=24, db_column='NcbiTaxonNumber', blank=True)
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    number2 = models.IntegerField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    source = models.CharField(max_length=192, db_column='Source', blank=True)
    taxonomicserialnumber = models.CharField(max_length=150, db_column='TaxonomicSerialNumber', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    unitind1 = models.CharField(max_length=150, db_column='UnitInd1', blank=True)
    unitind2 = models.CharField(max_length=150, db_column='UnitInd2', blank=True)
    unitind3 = models.CharField(max_length=150, db_column='UnitInd3', blank=True)
    unitind4 = models.CharField(max_length=150, db_column='UnitInd4', blank=True)
    unitname1 = models.CharField(max_length=150, db_column='UnitName1', blank=True)
    unitname2 = models.CharField(max_length=150, db_column='UnitName2', blank=True)
    unitname3 = models.CharField(max_length=150, db_column='UnitName3', blank=True)
    unitname4 = models.CharField(max_length=150, db_column='UnitName4', blank=True)
    usfwscode = models.CharField(max_length=48, db_column='UsfwsCode', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    taxontreedef = models.ForeignKey('specify.Taxontreedef', db_column='TaxonTreeDefID', related_name='+')
    accepted = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    visibilitysetby = models.ForeignKey('specify.Specifyuser', null=True, db_column='VisibilitySetByID', blank=True, related_name='+')
    parent = models.ForeignKey('self', null=True, db_column='ParentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    hybridparent2 = models.ForeignKey('self', null=True, db_column='HybridParent2ID', blank=True, related_name='+')
    hybridparent1 = models.ForeignKey('self', null=True, db_column='HybridParent1ID', blank=True, related_name='+')
    taxontreedefitem = models.ForeignKey('specify.Taxontreedefitem', db_column='TaxonTreeDefItemID', related_name='+')
    class Meta:
        db_table = u'taxon'

class Taxonattachment(models.Model):
    id = models.IntegerField(primary_key=True, db_column='TaxonAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    attachment = models.ForeignKey('specify.Attachment', db_column='AttachmentID', related_name='+')
    taxon = models.ForeignKey('specify.Taxon', db_column='TaxonID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'taxonattachment'

class Taxoncitation(models.Model):
    id = models.IntegerField(primary_key=True, db_column='TaxonCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.NullBooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.NullBooleanField(null=True, db_column='YesNo2', blank=True)
    referencework = models.ForeignKey('specify.Referencework', db_column='ReferenceWorkID', related_name='+')
    taxon = models.ForeignKey('specify.Taxon', db_column='TaxonID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'taxoncitation'

class Taxontreedef(models.Model):
    id = models.IntegerField(primary_key=True, db_column='TaxonTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.CharField(max_length=765, db_column='Remarks', blank=True)
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'taxontreedef'

class Taxontreedefitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='TaxonTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    formattoken = models.CharField(max_length=96, db_column='FormatToken', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.NullBooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.NullBooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    parentitem = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    taxontreedef = models.ForeignKey('specify.Taxontreedef', db_column='TaxonTreeDefID', related_name='+')
    class Meta:
        db_table = u'taxontreedefitem'

class Treatmentevent(models.Model):
    id = models.IntegerField(primary_key=True, db_column='TreatmentEventID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    dateboxed = models.DateField(null=True, db_column='DateBoxed', blank=True)
    datecleaned = models.DateField(null=True, db_column='DateCleaned', blank=True)
    datecompleted = models.DateField(null=True, db_column='DateCompleted', blank=True)
    datereceived = models.DateField(null=True, db_column='DateReceived', blank=True)
    datetoisolation = models.DateField(null=True, db_column='DateToIsolation', blank=True)
    datetreatmentended = models.DateField(null=True, db_column='DateTreatmentEnded', blank=True)
    datetreatmentstarted = models.DateField(null=True, db_column='DateTreatmentStarted', blank=True)
    fieldnumber = models.CharField(max_length=150, db_column='FieldNumber', blank=True)
    storage = models.CharField(max_length=192, db_column='Storage', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    treatmentnumber = models.CharField(max_length=96, db_column='TreatmentNumber', blank=True)
    type = models.CharField(max_length=96, db_column='Type', blank=True)
    division = models.ForeignKey('specify.Division', null=True, db_column='DivisionID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    accession = models.ForeignKey('specify.Accession', null=True, db_column='AccessionID', blank=True, related_name='+')
    collectionobject = models.ForeignKey('specify.Collectionobject', null=True, db_column='CollectionObjectID', blank=True, related_name='+')
    class Meta:
        db_table = u'treatmentevent'

class Workbench(models.Model):
    id = models.IntegerField(primary_key=True, db_column='WorkbenchID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    allpermissionlevel = models.IntegerField(null=True, db_column='AllPermissionLevel', blank=True)
    tableid = models.IntegerField(null=True, db_column='TableID', blank=True)
    exportinstitutionname = models.CharField(max_length=384, db_column='ExportInstitutionName', blank=True)
    formid = models.IntegerField(null=True, db_column='FormId', blank=True)
    grouppermissionlevel = models.IntegerField(null=True, db_column='GroupPermissionLevel', blank=True)
    lockedbyusername = models.CharField(max_length=192, db_column='LockedByUserName', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    ownerpermissionlevel = models.IntegerField(null=True, db_column='OwnerPermissionLevel', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    srcfilepath = models.CharField(max_length=765, db_column='SrcFilePath', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    spprincipal = models.ForeignKey('specify.Spprincipal', null=True, db_column='SpPrincipalID', blank=True, related_name='+')
    workbenchtemplate = models.ForeignKey('specify.Workbenchtemplate', db_column='WorkbenchTemplateID', related_name='+')
    specifyuser = models.ForeignKey('specify.Specifyuser', db_column='SpecifyUserID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    exportedfromtablename = models.CharField(max_length=384, db_column='ExportedFromTableName', blank=True)
    class Meta:
        db_table = u'workbench'

class Workbenchdataitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='WorkbenchDataItemID')
    celldata = models.TextField(db_column='CellData', blank=True)
    rownumber = models.IntegerField(null=True, db_column='RowNumber', blank=True)
    validationstatus = models.IntegerField(null=True, db_column='ValidationStatus', blank=True)
    workbenchtemplatemappingitem = models.ForeignKey('specify.Workbenchtemplatemappingitem', db_column='WorkbenchTemplateMappingItemID', related_name='+')
    workbenchrow = models.ForeignKey('specify.Workbenchrow', db_column='WorkbenchRowID', related_name='+')
    class Meta:
        db_table = u'workbenchdataitem'

class Workbenchrow(models.Model):
    id = models.IntegerField(primary_key=True, db_column='WorkbenchRowID')
    biogeomancerresults = models.TextField(db_column='BioGeomancerResults', blank=True)
    cardimagedata = models.TextField(db_column='CardImageData', blank=True)
    cardimagefullpath = models.CharField(max_length=765, db_column='CardImageFullPath', blank=True)
    lat1text = models.CharField(max_length=150, db_column='Lat1Text', blank=True)
    lat2text = models.CharField(max_length=150, db_column='Lat2Text', blank=True)
    long1text = models.CharField(max_length=150, db_column='Long1Text', blank=True)
    long2text = models.CharField(max_length=150, db_column='Long2Text', blank=True)
    rownumber = models.IntegerField(null=True, db_column='RowNumber', blank=True)
    uploadstatus = models.IntegerField(null=True, db_column='UploadStatus', blank=True)
    workbench = models.ForeignKey('specify.Workbench', db_column='WorkbenchID', related_name='+')
    recordid = models.IntegerField(null=True, db_column='RecordID', blank=True)
    sgrstatus = models.IntegerField(null=True, db_column='SGRStatus', blank=True)
    class Meta:
        db_table = u'workbenchrow'

class Workbenchrowexportedrelationship(models.Model):
    id = models.IntegerField(primary_key=True, db_column='WorkbenchRowExportedRelationshipID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    recordid = models.IntegerField(null=True, db_column='RecordID', blank=True)
    relationshipname = models.CharField(max_length=360, db_column='RelationshipName', blank=True)
    sequence = models.IntegerField(null=True, db_column='Sequence', blank=True)
    tablename = models.CharField(max_length=360, db_column='TableName', blank=True)
    workbenchrow = models.ForeignKey('specify.Workbenchrow', db_column='WorkbenchRowID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'workbenchrowexportedrelationship'

class Workbenchrowimage(models.Model):
    id = models.IntegerField(primary_key=True, db_column='WorkbenchRowImageID')
    attachtotablename = models.CharField(max_length=192, db_column='AttachToTableName', blank=True)
    cardimagedata = models.TextField(db_column='CardImageData', blank=True)
    cardimagefullpath = models.CharField(max_length=765, db_column='CardImageFullPath', blank=True)
    imageorder = models.IntegerField(null=True, db_column='ImageOrder', blank=True)
    workbenchrow = models.ForeignKey('specify.Workbenchrow', db_column='WorkbenchRowID', related_name='+')
    class Meta:
        db_table = u'workbenchrowimage'

class Workbenchtemplate(models.Model):
    id = models.IntegerField(primary_key=True, db_column='WorkbenchTemplateID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    srcfilepath = models.CharField(max_length=765, db_column='SrcFilePath', blank=True)
    specifyuser = models.ForeignKey('specify.Specifyuser', db_column='SpecifyUserID', related_name='+')
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    class Meta:
        db_table = u'workbenchtemplate'

class Workbenchtemplatemappingitem(models.Model):
    id = models.IntegerField(primary_key=True, db_column='WorkbenchTemplateMappingItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    xcoord = models.IntegerField(null=True, db_column='XCoord', blank=True)
    ycoord = models.IntegerField(null=True, db_column='YCoord', blank=True)
    caption = models.CharField(max_length=192, db_column='Caption', blank=True)
    carryforward = models.NullBooleanField(null=True, db_column='CarryForward', blank=True)
    datafieldlength = models.IntegerField(null=True, db_column='DataFieldLength', blank=True)
    fieldname = models.CharField(max_length=765, db_column='FieldName', blank=True)
    fieldtype = models.IntegerField(null=True, db_column='FieldType', blank=True)
    importedcolname = models.CharField(max_length=765, db_column='ImportedColName', blank=True)
    isexportabletocontent = models.NullBooleanField(null=True, db_column='IsExportableToContent', blank=True)
    isincludedintitle = models.NullBooleanField(null=True, db_column='IsIncludedInTitle', blank=True)
    isrequired = models.NullBooleanField(null=True, db_column='IsRequired', blank=True)
    metadata = models.CharField(max_length=384, db_column='MetaData', blank=True)
    datacolumnindex = models.IntegerField(null=True, db_column='DataColumnIndex', blank=True)
    tableid = models.IntegerField(null=True, db_column='TableId', blank=True)
    tablename = models.CharField(max_length=192, db_column='TableName', blank=True)
    vieworder = models.IntegerField(null=True, db_column='ViewOrder', blank=True)
    createdbyagent = models.ForeignKey('specify.Agent', null=True, db_column='CreatedByAgentID', blank=True, related_name='+')
    workbenchtemplate = models.ForeignKey('specify.Workbenchtemplate', db_column='WorkbenchTemplateID', related_name='+')
    modifiedbyagent = models.ForeignKey('specify.Agent', null=True, db_column='ModifiedByAgentID', blank=True, related_name='+')
    iseditable = models.NullBooleanField(null=True, db_column='IsEditable', blank=True)
    class Meta:
        db_table = u'workbenchtemplatemappingitem'

