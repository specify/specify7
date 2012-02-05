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
    accessionid = models.IntegerField(primary_key=True, db_column='AccessionID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    divisionid = models.ForeignKey(Division, db_column='DivisionID')
    repositoryagreementid = models.ForeignKey(Repositoryagreement, null=True, db_column='RepositoryAgreementID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    addressofrecordid = models.ForeignKey(Addressofrecord, null=True, db_column='AddressOfRecordID', blank=True)
    class Meta:
        db_table = u'accession'

class Accessionagent(models.Model):
    accessionagentid = models.IntegerField(primary_key=True, db_column='AccessionAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=150, db_column='Role')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    accessionid = models.ForeignKey(Accession, null=True, db_column='AccessionID', blank=True)
    repositoryagreementid = models.ForeignKey(Repositoryagreement, null=True, db_column='RepositoryAgreementID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    class Meta:
        db_table = u'accessionagent'

class Accessionattachment(models.Model):
    accessionattachmentid = models.IntegerField(primary_key=True, db_column='AccessionAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    accessionid = models.ForeignKey(Accession, db_column='AccessionID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'accessionattachment'

class Accessionauthorization(models.Model):
    accessionauthorizationid = models.IntegerField(primary_key=True, db_column='AccessionAuthorizationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    permitid = models.ForeignKey(Permit, db_column='PermitID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    repositoryagreementid = models.ForeignKey(Repositoryagreement, null=True, db_column='RepositoryAgreementID', blank=True)
    accessionid = models.ForeignKey(Accession, null=True, db_column='AccessionID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'accessionauthorization'

class Address(models.Model):
    addressid = models.IntegerField(primary_key=True, db_column='AddressID')
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
    iscurrent = models.BooleanField(null=True, db_column='IsCurrent', blank=True)
    isprimary = models.BooleanField(null=True, db_column='IsPrimary', blank=True)
    isshipping = models.BooleanField(null=True, db_column='IsShipping', blank=True)
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
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, null=True, db_column='AgentID', blank=True)
    class Meta:
        db_table = u'address'

class Addressofrecord(models.Model):
    addressofrecordid = models.IntegerField(primary_key=True, db_column='AddressOfRecordID')
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
    agentid = models.ForeignKey(Agent, null=True, db_column='AgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'addressofrecord'

class Agent(models.Model):
    agentid = models.IntegerField(primary_key=True, db_column='AgentID')
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
    parentorganizationid = models.ForeignKey('self', null=True, db_column='ParentOrganizationID', blank=True)
    institutionccid = models.ForeignKey(Institution, null=True, db_column='InstitutionCCID', blank=True)
    modifiedbyagentid = models.ForeignKey('self', null=True, db_column='ModifiedByAgentID', blank=True)
    institutiontcid = models.ForeignKey(Institution, null=True, db_column='InstitutionTCID', blank=True)
    specifyuserid = models.ForeignKey(Specifyuser, null=True, db_column='SpecifyUserID', blank=True)
    divisionid = models.ForeignKey(Division, null=True, db_column='DivisionID', blank=True)
    collectionccid = models.ForeignKey(Collection, null=True, db_column='CollectionCCID', blank=True)
    createdbyagentid = models.ForeignKey('self', null=True, db_column='CreatedByAgentID', blank=True)
    collectiontcid = models.ForeignKey(Collection, null=True, db_column='CollectionTCID', blank=True)
    class Meta:
        db_table = u'agent'

class Agentattachment(models.Model):
    agentattachmentid = models.IntegerField(primary_key=True, db_column='AgentAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'agentattachment'

class Agentgeography(models.Model):
    agentgeographyid = models.IntegerField(primary_key=True, db_column='AgentGeographyID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(max_length=192, db_column='Role', blank=True)
    geographyid = models.ForeignKey(Geography, db_column='GeographyID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'agentgeography'

class Agentspecialty(models.Model):
    agentspecialtyid = models.IntegerField(primary_key=True, db_column='AgentSpecialtyID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordernumber = models.IntegerField(unique=True, db_column='OrderNumber')
    specialtyname = models.CharField(max_length=192, db_column='SpecialtyName')
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'agentspecialty'

class Agentvariant(models.Model):
    agentvariantid = models.IntegerField(primary_key=True, db_column='AgentVariantID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    country = models.CharField(max_length=6, db_column='Country', blank=True)
    language = models.CharField(max_length=6, db_column='Language', blank=True)
    name = models.CharField(max_length=765, db_column='Name', blank=True)
    vartype = models.IntegerField(db_column='VarType')
    variant = models.CharField(max_length=6, db_column='Variant', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    class Meta:
        db_table = u'agentvariant'

class Appraisal(models.Model):
    appraisalid = models.IntegerField(primary_key=True, db_column='AppraisalID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    appraisaldate = models.DateField(db_column='AppraisalDate')
    appraisalnumber = models.CharField(max_length=192, db_column='AppraisalNumber')
    appraisalvalue = models.DecimalField(decimal_places=2, null=True, max_digits=14, db_column='AppraisalValue', blank=True)
    monetaryunittype = models.CharField(max_length=24, db_column='MonetaryUnitType', blank=True)
    notes = models.TextField(db_column='Notes', blank=True)
    accessionid = models.ForeignKey(Accession, null=True, db_column='AccessionID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'appraisal'

class Attachment(models.Model):
    attachmentid = models.IntegerField(primary_key=True, db_column='AttachmentID')
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
    attachmentimageattributeid = models.ForeignKey(Attachmentimageattribute, null=True, db_column='AttachmentImageAttributeID', blank=True)
    visibilitysetbyid = models.ForeignKey(Specifyuser, null=True, db_column='VisibilitySetByID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'attachment'

class Attachmentimageattribute(models.Model):
    attachmentimageattributeid = models.IntegerField(primary_key=True, db_column='AttachmentImageAttributeID')
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
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    morphbankviewid = models.ForeignKey(Morphbankview, null=True, db_column='MorphBankViewID', blank=True)
    imagetype = models.CharField(max_length=240, db_column='ImageType', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=600, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=600, db_column='Text2', blank=True)
    viewdescription = models.CharField(max_length=240, db_column='ViewDescription', blank=True)
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    class Meta:
        db_table = u'attachmentimageattribute'

class Attachmentmetadata(models.Model):
    attachmentmetadataid = models.IntegerField(primary_key=True, db_column='AttachmentMetadataID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    value = models.CharField(max_length=384, db_column='Value')
    attachmentid = models.ForeignKey(Attachment, null=True, db_column='AttachmentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'attachmentmetadata'

class Attachmenttag(models.Model):
    attachmenttagid = models.IntegerField(primary_key=True, db_column='AttachmentTagID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    tag = models.CharField(max_length=192, db_column='Tag')
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'attachmenttag'

class Attributedef(models.Model):
    attributedefid = models.IntegerField(primary_key=True, db_column='AttributeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    datatype = models.IntegerField(null=True, db_column='DataType', blank=True)
    fieldname = models.CharField(max_length=96, db_column='FieldName', blank=True)
    tabletype = models.IntegerField(null=True, db_column='TableType', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    preptypeid = models.ForeignKey(Preptype, null=True, db_column='PrepTypeID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'attributedef'

class Author(models.Model):
    authorid = models.IntegerField(primary_key=True, db_column='AuthorID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordernumber = models.IntegerField(unique=True, db_column='OrderNumber')
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    referenceworkid = models.ForeignKey(Referencework, db_column='ReferenceWorkID')
    class Meta:
        db_table = u'author'

class Autonumberingscheme(models.Model):
    autonumberingschemeid = models.IntegerField(primary_key=True, db_column='AutoNumberingSchemeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    formatname = models.CharField(max_length=192, db_column='FormatName', blank=True)
    isnumericonly = models.BooleanField(db_column='IsNumericOnly')
    schemeclassname = models.CharField(max_length=192, db_column='SchemeClassName', blank=True)
    schemename = models.CharField(max_length=192, db_column='SchemeName', blank=True)
    tablenumber = models.IntegerField(db_column='TableNumber')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'autonumberingscheme'

class AutonumschColl(models.Model):
    collectionid = models.ForeignKey(Collection, db_column='CollectionID')
    autonumberingschemeid = models.ForeignKey(Autonumberingscheme, db_column='AutoNumberingSchemeID')
    class Meta:
        db_table = u'autonumsch_coll'

class AutonumschDiv(models.Model):
    divisionid = models.ForeignKey(Division, db_column='DivisionID')
    autonumberingschemeid = models.ForeignKey(Autonumberingscheme, db_column='AutoNumberingSchemeID')
    class Meta:
        db_table = u'autonumsch_div'

class AutonumschDsp(models.Model):
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    autonumberingschemeid = models.ForeignKey(Autonumberingscheme, db_column='AutoNumberingSchemeID')
    class Meta:
        db_table = u'autonumsch_dsp'

class Borrow(models.Model):
    borrowid = models.IntegerField(primary_key=True, db_column='BorrowID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    currentduedate = models.DateField(null=True, db_column='CurrentDueDate', blank=True)
    dateclosed = models.DateField(null=True, db_column='DateClosed', blank=True)
    invoicenumber = models.CharField(max_length=150, db_column='InvoiceNumber')
    isclosed = models.BooleanField(null=True, db_column='IsClosed', blank=True)
    isfinancialresponsibility = models.BooleanField(null=True, db_column='IsFinancialResponsibility', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    originalduedate = models.DateField(null=True, db_column='OriginalDueDate', blank=True)
    receiveddate = models.DateField(null=True, db_column='ReceivedDate', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    addressofrecordid = models.ForeignKey(Addressofrecord, null=True, db_column='AddressOfRecordID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'borrow'

class Borrowagent(models.Model):
    borrowagentid = models.IntegerField(primary_key=True, db_column='BorrowAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=96, db_column='Role')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    borrowid = models.ForeignKey(Borrow, db_column='BorrowID')
    class Meta:
        db_table = u'borrowagent'

class Borrowmaterial(models.Model):
    borrowmaterialid = models.IntegerField(primary_key=True, db_column='BorrowMaterialID')
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
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    borrowid = models.ForeignKey(Borrow, db_column='BorrowID')
    class Meta:
        db_table = u'borrowmaterial'

class Borrowreturnmaterial(models.Model):
    borrowreturnmaterialid = models.IntegerField(primary_key=True, db_column='BorrowReturnMaterialID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    returneddate = models.DateField(null=True, db_column='ReturnedDate', blank=True)
    borrowmaterialid = models.ForeignKey(Borrowmaterial, db_column='BorrowMaterialID')
    returnedbyid = models.ForeignKey(Agent, null=True, db_column='ReturnedByID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'borrowreturnmaterial'

class Collectingevent(models.Model):
    collectingeventid = models.IntegerField(primary_key=True, db_column='CollectingEventID')
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
    collectingtripid = models.ForeignKey(Collectingtrip, null=True, db_column='CollectingTripID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    localityid = models.ForeignKey(Locality, null=True, db_column='LocalityID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    collectingeventattributeid = models.ForeignKey(Collectingeventattribute, null=True, db_column='CollectingEventAttributeID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    visibilitysetbyid = models.ForeignKey(Specifyuser, null=True, db_column='VisibilitySetByID', blank=True)
    sgrstatus = models.IntegerField(null=True, db_column='SGRStatus', blank=True)
    class Meta:
        db_table = u'collectingevent'

class Collectingeventattachment(models.Model):
    collectingeventattachmentid = models.IntegerField(primary_key=True, db_column='CollectingEventAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    ordinal = models.IntegerField(db_column='Ordinal')
    remarks = models.TextField(db_column='Remarks', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    collectingeventid = models.ForeignKey(Collectingevent, db_column='CollectingEventID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'collectingeventattachment'

class Collectingeventattr(models.Model):
    attrid = models.IntegerField(primary_key=True, db_column='AttrID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    doublevalue = models.FloatField(null=True, db_column='DoubleValue', blank=True)
    strvalue = models.CharField(max_length=765, db_column='StrValue', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    collectingeventid = models.ForeignKey(Collectingevent, db_column='CollectingEventID')
    attributedefid = models.ForeignKey(Attributedef, db_column='AttributeDefID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'collectingeventattr'

class Collectingeventattribute(models.Model):
    collectingeventattributeid = models.IntegerField(primary_key=True, db_column='CollectingEventAttributeID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.BooleanField(null=True, db_column='YesNo3', blank=True)
    yesno4 = models.BooleanField(null=True, db_column='YesNo4', blank=True)
    yesno5 = models.BooleanField(null=True, db_column='YesNo5', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    hosttaxonid = models.ForeignKey(Taxon, null=True, db_column='HostTaxonID', blank=True)
    class Meta:
        db_table = u'collectingeventattribute'

class Collectingtrip(models.Model):
    collectingtripid = models.IntegerField(primary_key=True, db_column='CollectingTripID')
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
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'collectingtrip'

class Collection(models.Model):
    usergroupscopeid = models.IntegerField(unique=True, db_column='UserGroupScopeId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
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
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    institutionnetworkid = models.ForeignKey(Institution, null=True, db_column='InstitutionNetworkID', blank=True)
    class Meta:
        db_table = u'collection'

class Collectionobject(models.Model):
    collectionobjectid = models.IntegerField(primary_key=True, db_column='CollectionObjectID')
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
    deaccessioned = models.BooleanField(null=True, db_column='Deaccessioned', blank=True)
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.BooleanField(null=True, db_column='YesNo3', blank=True)
    yesno4 = models.BooleanField(null=True, db_column='YesNo4', blank=True)
    yesno5 = models.BooleanField(null=True, db_column='YesNo5', blank=True)
    yesno6 = models.BooleanField(null=True, db_column='YesNo6', blank=True)
    containerownerid = models.ForeignKey(Container, null=True, db_column='ContainerOwnerID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    paleocontextid = models.ForeignKey(Paleocontext, null=True, db_column='PaleoContextID', blank=True)
    catalogerid = models.ForeignKey(Agent, null=True, db_column='CatalogerID', blank=True)
    accessionid = models.ForeignKey(Accession, null=True, db_column='AccessionID', blank=True)
    fieldnotebookpageid = models.ForeignKey(Fieldnotebookpage, null=True, db_column='FieldNotebookPageID', blank=True)
    visibilitysetbyid = models.ForeignKey(Specifyuser, null=True, db_column='VisibilitySetByID', blank=True)
    appraisalid = models.ForeignKey(Appraisal, null=True, db_column='AppraisalID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    collectionid = models.ForeignKey(Collection, db_column='CollectionID')
    collectingeventid = models.ForeignKey(Collectingevent, null=True, db_column='CollectingEventID', blank=True)
    collectionobjectattributeid = models.ForeignKey(Collectionobjectattribute, null=True, db_column='CollectionObjectAttributeID', blank=True)
    containerid = models.ForeignKey(Container, null=True, db_column='ContainerID', blank=True)
    sgrstatus = models.IntegerField(null=True, db_column='SGRStatus', blank=True)
    class Meta:
        db_table = u'collectionobject'

class Collectionobjectattachment(models.Model):
    collectionobjectattachmentid = models.IntegerField(primary_key=True, db_column='CollectionObjectAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'collectionobjectattachment'

class Collectionobjectattr(models.Model):
    attrid = models.IntegerField(primary_key=True, db_column='AttrID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    doublevalue = models.FloatField(null=True, db_column='DoubleValue', blank=True)
    strvalue = models.CharField(max_length=765, db_column='StrValue', blank=True)
    attributedefid = models.ForeignKey(Attributedef, db_column='AttributeDefID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'collectionobjectattr'

class Collectionobjectattribute(models.Model):
    collectionobjectattributeid = models.IntegerField(primary_key=True, db_column='CollectionObjectAttributeID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.BooleanField(null=True, db_column='YesNo3', blank=True)
    yesno4 = models.BooleanField(null=True, db_column='YesNo4', blank=True)
    yesno5 = models.BooleanField(null=True, db_column='YesNo5', blank=True)
    yesno6 = models.BooleanField(null=True, db_column='YesNo6', blank=True)
    yesno7 = models.BooleanField(null=True, db_column='YesNo7', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'collectionobjectattribute'

class Collectionobjectcitation(models.Model):
    collectionobjectcitationid = models.IntegerField(primary_key=True, db_column='CollectionObjectCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    isfigured = models.BooleanField(null=True, db_column='IsFigured', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    referenceworkid = models.ForeignKey(Referencework, db_column='ReferenceWorkID')
    class Meta:
        db_table = u'collectionobjectcitation'

class CollectionobjecttypeCollectionobjecttypeid(models.Model):
    oldid = models.IntegerField(primary_key=True, db_column='OldID')
    newid = models.IntegerField(db_column='NewID')
    class Meta:
        db_table = u'collectionobjecttype_CollectionObjectTypeID'

class Collectionrelationship(models.Model):
    collectionrelationshipid = models.IntegerField(primary_key=True, db_column='CollectionRelationshipID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    rightsidecollectionid = models.ForeignKey(Collectionobject, db_column='RightSideCollectionID')
    collectionreltypeid = models.ForeignKey(Collectionreltype, null=True, db_column='CollectionRelTypeID', blank=True)
    leftsidecollectionid = models.ForeignKey(Collectionobject, db_column='LeftSideCollectionID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'collectionrelationship'

class Collectionreltype(models.Model):
    collectionreltypeid = models.IntegerField(primary_key=True, db_column='CollectionRelTypeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=96, db_column='Name', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    rightsidecollectionid = models.ForeignKey(Collection, null=True, db_column='RightSideCollectionID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    leftsidecollectionid = models.ForeignKey(Collection, null=True, db_column='LeftSideCollectionID', blank=True)
    class Meta:
        db_table = u'collectionreltype'

class Collector(models.Model):
    collectorid = models.IntegerField(primary_key=True, db_column='CollectorID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    isprimary = models.BooleanField(db_column='IsPrimary')
    ordernumber = models.IntegerField(db_column='OrderNumber')
    remarks = models.TextField(db_column='Remarks', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    divisionid = models.ForeignKey(Division, null=True, db_column='DivisionID', blank=True)
    collectingeventid = models.ForeignKey(Collectingevent, db_column='CollectingEventID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'collector'

class Commonnametx(models.Model):
    commonnametxid = models.IntegerField(primary_key=True, db_column='CommonNameTxID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    author = models.CharField(max_length=384, db_column='Author', blank=True)
    country = models.CharField(max_length=6, db_column='Country', blank=True)
    language = models.CharField(max_length=6, db_column='Language', blank=True)
    name = models.CharField(max_length=765, db_column='Name', blank=True)
    variant = models.CharField(max_length=6, db_column='Variant', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    taxonid = models.ForeignKey(Taxon, db_column='TaxonID')
    class Meta:
        db_table = u'commonnametx'

class Commonnametxcitation(models.Model):
    commonnametxcitationid = models.IntegerField(primary_key=True, db_column='CommonNameTxCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    commonnametxid = models.ForeignKey(Commonnametx, db_column='CommonNameTxID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    referenceworkid = models.ForeignKey(Referencework, db_column='ReferenceWorkID')
    class Meta:
        db_table = u'commonnametxcitation'

class Conservdescription(models.Model):
    conservdescriptionid = models.IntegerField(primary_key=True, db_column='ConservDescriptionID')
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
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    divisionid = models.ForeignKey(Division, null=True, db_column='DivisionID', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, null=True, db_column='CollectionObjectID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'conservdescription'

class Conservdescriptionattachment(models.Model):
    conservdescriptionattachmentid = models.IntegerField(primary_key=True, db_column='ConservDescriptionAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    conservdescriptionid = models.ForeignKey(Conservdescription, db_column='ConservDescriptionID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    class Meta:
        db_table = u'conservdescriptionattachment'

class Conservevent(models.Model):
    conserveventid = models.IntegerField(primary_key=True, db_column='ConservEventID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    treatmentcompdate = models.DateField(null=True, db_column='TreatmentCompDate', blank=True)
    treatmentreport = models.TextField(db_column='TreatmentReport', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    curatorid = models.ForeignKey(Agent, null=True, db_column='CuratorID', blank=True)
    treatedbyagentid = models.ForeignKey(Agent, null=True, db_column='TreatedByAgentID', blank=True)
    conservdescriptionid = models.ForeignKey(Conservdescription, db_column='ConservDescriptionID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    examinedbyagentid = models.ForeignKey(Agent, null=True, db_column='ExaminedByAgentID', blank=True)
    class Meta:
        db_table = u'conservevent'

class Conserveventattachment(models.Model):
    conserveventattachmentid = models.IntegerField(primary_key=True, db_column='ConservEventAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    conserveventid = models.ForeignKey(Conservevent, db_column='ConservEventID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    class Meta:
        db_table = u'conserveventattachment'

class Container(models.Model):
    containerid = models.IntegerField(primary_key=True, db_column='ContainerID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    number = models.IntegerField(null=True, db_column='Number', blank=True)
    type = models.IntegerField(null=True, db_column='Type', blank=True)
    storageid = models.ForeignKey(Storage, null=True, db_column='StorageID', blank=True)
    parentid = models.ForeignKey('self', null=True, db_column='ParentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'container'

class Datatype(models.Model):
    datatypeid = models.IntegerField(primary_key=True, db_column='DataTypeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=150, db_column='Name', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'datatype'

class Deaccession(models.Model):
    deaccessionid = models.IntegerField(primary_key=True, db_column='DeaccessionID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    accessionid = models.ForeignKey(Accession, null=True, db_column='AccessionID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'deaccession'

class Deaccessionagent(models.Model):
    deaccessionagentid = models.IntegerField(primary_key=True, db_column='DeaccessionAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=150, db_column='Role')
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    deaccessionid = models.ForeignKey(Deaccession, db_column='DeaccessionID')
    class Meta:
        db_table = u'deaccessionagent'

class Deaccessionpreparation(models.Model):
    deaccessionpreparationid = models.IntegerField(primary_key=True, db_column='DeaccessionPreparationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    preparationid = models.ForeignKey(Preparation, null=True, db_column='PreparationID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    deaccessionid = models.ForeignKey(Deaccession, db_column='DeaccessionID')
    class Meta:
        db_table = u'deaccessionpreparation'

class Determination(models.Model):
    determinationid = models.IntegerField(primary_key=True, db_column='DeterminationID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    taxonid = models.ForeignKey(Taxon, null=True, db_column='TaxonID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    preferredtaxonid = models.ForeignKey(Taxon, null=True, db_column='PreferredTaxonID', blank=True)
    determinerid = models.ForeignKey(Agent, null=True, db_column='DeterminerID', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    class Meta:
        db_table = u'determination'

class Determinationcitation(models.Model):
    determinationcitationid = models.IntegerField(primary_key=True, db_column='DeterminationCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    referenceworkid = models.ForeignKey(Referencework, db_column='ReferenceWorkID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    determinationid = models.ForeignKey(Determination, db_column='DeterminationID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'determinationcitation'

class Discipline(models.Model):
    usergroupscopeid = models.IntegerField(unique=True, db_column='UserGroupScopeId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    disciplineid = models.IntegerField(null=True, db_column='disciplineId', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    regnumber = models.CharField(max_length=72, db_column='RegNumber', blank=True)
    type = models.CharField(max_length=192, db_column='Type', blank=True)
    datatypeid = models.ForeignKey(Datatype, db_column='DataTypeID')
    geographytreedefid = models.ForeignKey(Geographytreedef, db_column='GeographyTreeDefID')
    divisionid = models.ForeignKey(Division, db_column='DivisionID')
    lithostrattreedefid = models.ForeignKey(Lithostrattreedef, null=True, db_column='LithoStratTreeDefID', blank=True)
    taxontreedefid = models.ForeignKey(Taxontreedef, null=True, db_column='TaxonTreeDefID', blank=True)
    geologictimeperiodtreedefid = models.ForeignKey(Geologictimeperiodtreedef, db_column='GeologicTimePeriodTreeDefID')
    class Meta:
        db_table = u'discipline'

class Division(models.Model):
    usergroupscopeid = models.IntegerField(unique=True, db_column='UserGroupScopeId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
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
    addressid = models.ForeignKey(Address, null=True, db_column='AddressID', blank=True)
    institutionid = models.ForeignKey(Institution, db_column='InstitutionID')
    class Meta:
        db_table = u'division'

class Dnasequence(models.Model):
    dnasequenceid = models.IntegerField(primary_key=True, db_column='DnaSequenceID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.BooleanField(null=True, db_column='YesNo3', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, null=True, db_column='CollectionObjectID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, null=True, db_column='AgentID', blank=True)
    class Meta:
        db_table = u'dnasequence'

class Dnasequenceattachment(models.Model):
    dnasequencingrunattachmentid = models.IntegerField(primary_key=True, db_column='DnaSequencingRunAttachmentId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    dnasequencingrunid = models.ForeignKey(Dnasequencingrun, db_column='DnaSequencingRunID')
    class Meta:
        db_table = u'dnasequenceattachment'

class Dnasequencingrun(models.Model):
    dnasequencingrunid = models.IntegerField(primary_key=True, db_column='DNASequencingRunID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    number3 = models.FloatField(null=True, db_column='Number3', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    pcrcocktailprimer = models.BooleanField(null=True, db_column='PCRCocktailPrimer', blank=True)
    pcrforwardprimercode = models.CharField(max_length=96, db_column='PCRForwardPrimerCode', blank=True)
    pcrprimername = models.CharField(max_length=96, db_column='PCRPrimerName', blank=True)
    pcrprimersequence5_3 = models.CharField(max_length=192, db_column='PCRPrimerSequence5_3', blank=True)
    pcrreverseprimercode = models.CharField(max_length=96, db_column='PCRReversePrimerCode', blank=True)
    readdirection = models.CharField(max_length=48, db_column='ReadDirection', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    rundate = models.DateField(null=True, db_column='RunDate', blank=True)
    scorefilename = models.CharField(max_length=96, db_column='ScoreFileName', blank=True)
    sequencecocktailprimer = models.BooleanField(null=True, db_column='SequenceCocktailPrimer', blank=True)
    sequenceprimercode = models.CharField(max_length=96, db_column='SequencePrimerCode', blank=True)
    sequenceprimername = models.CharField(max_length=96, db_column='SequencePrimerName', blank=True)
    sequenceprimersequence5_3 = models.CharField(max_length=192, db_column='SequencePrimerSequence5_3', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    text3 = models.CharField(max_length=192, db_column='Text3', blank=True)
    tracefilename = models.CharField(max_length=96, db_column='TraceFileName', blank=True)
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.BooleanField(null=True, db_column='YesNo3', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    dnasequenceid = models.ForeignKey(Dnasequence, db_column='DNASequenceID')
    runbyagentid = models.ForeignKey(Agent, null=True, db_column='RunByAgentID', blank=True)
    preparedbyagentid = models.ForeignKey(Agent, null=True, db_column='PreparedByAgentID', blank=True)
    class Meta:
        db_table = u'dnasequencingrun'

class Dnasequencingruncitation(models.Model):
    dnasequencingruncitationid = models.IntegerField(primary_key=True, db_column='DNASequencingRunCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    referenceworkid = models.ForeignKey(Referencework, db_column='ReferenceWorkID')
    dnasequencingrunid = models.ForeignKey(Dnasequencingrun, db_column='DNASequencingRunID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'dnasequencingruncitation'

class Exchangein(models.Model):
    exchangeinid = models.IntegerField(primary_key=True, db_column='ExchangeInID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    receivedfromorganizationid = models.ForeignKey(Agent, db_column='ReceivedFromOrganizationID')
    addressofrecordid = models.ForeignKey(Addressofrecord, null=True, db_column='AddressOfRecordID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    catalogedbyid = models.ForeignKey(Agent, db_column='CatalogedByID')
    divisionid = models.ForeignKey(Division, db_column='DivisionID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'exchangein'

class Exchangeinprep(models.Model):
    exchangeinprepid = models.IntegerField(primary_key=True, db_column='ExchangeInPrepID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    comments = models.TextField(db_column='Comments', blank=True)
    descriptionofmaterial = models.CharField(max_length=765, db_column='DescriptionOfMaterial', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    preparationid = models.ForeignKey(Preparation, null=True, db_column='PreparationID', blank=True)
    exchangeinid = models.ForeignKey(Exchangein, null=True, db_column='ExchangeInID', blank=True)
    class Meta:
        db_table = u'exchangeinprep'

class Exchangeout(models.Model):
    exchangeoutid = models.IntegerField(primary_key=True, db_column='ExchangeOutID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    divisionid = models.ForeignKey(Division, db_column='DivisionID')
    addressofrecordid = models.ForeignKey(Addressofrecord, null=True, db_column='AddressOfRecordID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    catalogedbyid = models.ForeignKey(Agent, db_column='CatalogedByID')
    senttoorganizationid = models.ForeignKey(Agent, db_column='SentToOrganizationID')
    class Meta:
        db_table = u'exchangeout'

class Exchangeoutprep(models.Model):
    exchangeoutprepid = models.IntegerField(primary_key=True, db_column='ExchangeOutPrepID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    comments = models.TextField(db_column='Comments', blank=True)
    descriptionofmaterial = models.CharField(max_length=765, db_column='DescriptionOfMaterial', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    exchangeoutid = models.ForeignKey(Exchangeout, null=True, db_column='ExchangeOutID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    preparationid = models.ForeignKey(Preparation, null=True, db_column='PreparationID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'exchangeoutprep'

class Exsiccata(models.Model):
    exsiccataid = models.IntegerField(primary_key=True, db_column='ExsiccataID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    title = models.CharField(max_length=765, db_column='Title')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    referenceworkid = models.ForeignKey(Referencework, db_column='ReferenceWorkID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'exsiccata'

class Exsiccataitem(models.Model):
    exsiccataitemid = models.IntegerField(primary_key=True, db_column='ExsiccataItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fascicle = models.CharField(max_length=48, db_column='Fascicle', blank=True)
    number = models.CharField(max_length=48, db_column='Number', blank=True)
    exsiccataid = models.ForeignKey(Exsiccata, db_column='ExsiccataID')
    collectionobjectid = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'exsiccataitem'

class Fieldnotebook(models.Model):
    fieldnotebookid = models.IntegerField(primary_key=True, db_column='FieldNotebookID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    storage = models.CharField(max_length=192, db_column='Storage', blank=True)
    name = models.CharField(max_length=96, db_column='Name', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    collectionid = models.ForeignKey(Collection, db_column='CollectionID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    class Meta:
        db_table = u'fieldnotebook'

class Fieldnotebookattachment(models.Model):
    fieldnotebookattachmentid = models.IntegerField(primary_key=True, db_column='FieldNotebookAttachmentId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    fieldnotebookid = models.ForeignKey(Fieldnotebook, db_column='FieldNotebookID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'fieldnotebookattachment'

class Fieldnotebookpage(models.Model):
    fieldnotebookpageid = models.IntegerField(primary_key=True, db_column='FieldNotebookPageID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=384, db_column='Description', blank=True)
    pagenumber = models.CharField(max_length=96, db_column='PageNumber')
    scandate = models.DateField(null=True, db_column='ScanDate', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    fieldnotebookpagesetid = models.ForeignKey(Fieldnotebookpageset, null=True, db_column='FieldNotebookPageSetID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    class Meta:
        db_table = u'fieldnotebookpage'

class Fieldnotebookpageattachment(models.Model):
    fieldnotebookpageattachmentid = models.IntegerField(primary_key=True, db_column='FieldNotebookPageAttachmentId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    fieldnotebookpageid = models.ForeignKey(Fieldnotebookpage, db_column='FieldNotebookPageID')
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    class Meta:
        db_table = u'fieldnotebookpageattachment'

class Fieldnotebookpageset(models.Model):
    fieldnotebookpagesetid = models.IntegerField(primary_key=True, db_column='FieldNotebookPageSetID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=384, db_column='Description', blank=True)
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    method = models.CharField(max_length=192, db_column='Method', blank=True)
    ordernumber = models.IntegerField(null=True, db_column='OrderNumber', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    agentid = models.ForeignKey(Agent, null=True, db_column='AgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    fieldnotebookid = models.ForeignKey(Fieldnotebook, null=True, db_column='FieldNotebookID', blank=True)
    class Meta:
        db_table = u'fieldnotebookpageset'

class Fieldnotebookpagesetattachment(models.Model):
    fieldnotebookpagesetattachmentid = models.IntegerField(primary_key=True, db_column='FieldNotebookPageSetAttachmentId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    fieldnotebookpagesetid = models.ForeignKey(Fieldnotebookpageset, db_column='FieldNotebookPageSetID')
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'fieldnotebookpagesetattachment'

class Geocoorddetail(models.Model):
    geocoorddetailid = models.IntegerField(primary_key=True, db_column='GeoCoordDetailID')
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
    localityid = models.ForeignKey(Locality, null=True, db_column='LocalityID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    agentid = models.ForeignKey(Agent, null=True, db_column='AgentID', blank=True)
    class Meta:
        db_table = u'geocoorddetail'

class Geography(models.Model):
    geographyid = models.IntegerField(primary_key=True, db_column='GeographyID')
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
    isaccepted = models.BooleanField(null=True, db_column='IsAccepted', blank=True)
    iscurrent = models.BooleanField(null=True, db_column='IsCurrent', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    number2 = models.IntegerField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    timestampversion = models.DateTimeField(null=True, db_column='TimestampVersion', blank=True)
    geographytreedefitemid = models.ForeignKey(Geographytreedefitem, db_column='GeographyTreeDefItemID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    parentid = models.ForeignKey('self', null=True, db_column='ParentID', blank=True)
    acceptedid = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    geographytreedefid = models.ForeignKey(Geographytreedef, db_column='GeographyTreeDefID')
    class Meta:
        db_table = u'geography'

class Geographytreedef(models.Model):
    geographytreedefid = models.IntegerField(primary_key=True, db_column='GeographyTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'geographytreedef'

class Geographytreedefitem(models.Model):
    geographytreedefitemid = models.IntegerField(primary_key=True, db_column='GeographyTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.BooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.BooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    geographytreedefid = models.ForeignKey(Geographytreedef, db_column='GeographyTreeDefID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    parentitemid = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True)
    class Meta:
        db_table = u'geographytreedefitem'

class Geologictimeperiod(models.Model):
    geologictimeperiodid = models.IntegerField(primary_key=True, db_column='GeologicTimePeriodID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    endperiod = models.FloatField(null=True, db_column='EndPeriod', blank=True)
    enduncertainty = models.FloatField(null=True, db_column='EndUncertainty', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isaccepted = models.BooleanField(null=True, db_column='IsAccepted', blank=True)
    isbiostrat = models.BooleanField(null=True, db_column='IsBioStrat', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    standard = models.CharField(max_length=192, db_column='Standard', blank=True)
    startperiod = models.FloatField(null=True, db_column='StartPeriod', blank=True)
    startuncertainty = models.FloatField(null=True, db_column='StartUncertainty', blank=True)
    text1 = models.CharField(max_length=384, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=384, db_column='Text2', blank=True)
    parentid = models.ForeignKey('self', null=True, db_column='ParentID', blank=True)
    geologictimeperiodtreedefid = models.ForeignKey(Geologictimeperiodtreedef, db_column='GeologicTimePeriodTreeDefID')
    acceptedid = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    geologictimeperiodtreedefitemid = models.ForeignKey(Geologictimeperiodtreedefitem, db_column='GeologicTimePeriodTreeDefItemID')
    class Meta:
        db_table = u'geologictimeperiod'

class Geologictimeperiodtreedef(models.Model):
    geologictimeperiodtreedefid = models.IntegerField(primary_key=True, db_column='GeologicTimePeriodTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'geologictimeperiodtreedef'

class Geologictimeperiodtreedefitem(models.Model):
    geologictimeperiodtreedefitemid = models.IntegerField(primary_key=True, db_column='GeologicTimePeriodTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.BooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.BooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    parentitemid = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    geologictimeperiodtreedefid = models.ForeignKey(Geologictimeperiodtreedef, db_column='GeologicTimePeriodTreeDefID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'geologictimeperiodtreedefitem'

class Gift(models.Model):
    giftid = models.IntegerField(primary_key=True, db_column='GiftID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    datereceived = models.DateField(null=True, db_column='DateReceived', blank=True)
    giftdate = models.DateField(null=True, db_column='GiftDate', blank=True)
    giftnumber = models.CharField(max_length=150, db_column='GiftNumber')
    isfinancialresponsibility = models.BooleanField(null=True, db_column='IsFinancialResponsibility', blank=True)
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    divisionid = models.ForeignKey(Division, null=True, db_column='DivisionID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    addressofrecordid = models.ForeignKey(Addressofrecord, null=True, db_column='AddressOfRecordID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    class Meta:
        db_table = u'gift'

class Giftagent(models.Model):
    giftagentid = models.IntegerField(primary_key=True, db_column='GiftAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=150, db_column='Role')
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    giftid = models.ForeignKey(Gift, db_column='GiftID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'giftagent'

class Giftpreparation(models.Model):
    giftpreparationid = models.IntegerField(primary_key=True, db_column='GiftPreparationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    descriptionofmaterial = models.CharField(max_length=765, db_column='DescriptionOfMaterial', blank=True)
    incomments = models.TextField(db_column='InComments', blank=True)
    outcomments = models.TextField(db_column='OutComments', blank=True)
    quantity = models.IntegerField(null=True, db_column='Quantity', blank=True)
    receivedcomments = models.TextField(db_column='ReceivedComments', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    giftid = models.ForeignKey(Gift, null=True, db_column='GiftID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    preparationid = models.ForeignKey(Preparation, null=True, db_column='PreparationID', blank=True)
    class Meta:
        db_table = u'giftpreparation'

class Groupperson(models.Model):
    grouppersonid = models.IntegerField(primary_key=True, db_column='GroupPersonID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordernumber = models.IntegerField(unique=True, db_column='OrderNumber')
    remarks = models.TextField(db_column='Remarks', blank=True)
    divisionid = models.ForeignKey(Division, db_column='DivisionID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    memberid = models.ForeignKey(Agent, db_column='MemberID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    groupid = models.ForeignKey(Agent, db_column='GroupID')
    class Meta:
        db_table = u'groupperson'

class HibernateUniqueKey(models.Model):
    next_hi = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'hibernate_unique_key'

class Inforequest(models.Model):
    inforequestid = models.IntegerField(primary_key=True, db_column='InfoRequestID')
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
    agentid = models.ForeignKey(Agent, null=True, db_column='AgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'inforequest'

class Institution(models.Model):
    usergroupscopeid = models.IntegerField(unique=True, db_column='UserGroupScopeId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    altname = models.CharField(max_length=384, db_column='AltName', blank=True)
    code = models.CharField(max_length=192, db_column='Code', blank=True)
    copyright = models.TextField(db_column='Copyright', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    disclaimer = models.TextField(db_column='Disclaimer', blank=True)
    hasbeenasked = models.BooleanField(null=True, db_column='HasBeenAsked', blank=True)
    iconuri = models.CharField(max_length=765, db_column='IconURI', blank=True)
    institutionid = models.IntegerField(null=True, db_column='institutionId', blank=True)
    ipr = models.TextField(db_column='Ipr', blank=True)
    isaccessionsglobal = models.BooleanField(db_column='IsAccessionsGlobal')
    isanonymous = models.BooleanField(null=True, db_column='IsAnonymous', blank=True)
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
    storagetreedefid = models.ForeignKey(Storagetreedef, null=True, db_column='StorageTreeDefID', blank=True)
    addressid = models.ForeignKey(Address, null=True, db_column='AddressID', blank=True)
    currentmanagedrelversion = models.CharField(max_length=24, db_column='CurrentManagedRelVersion', blank=True)
    currentmanagedschemaversion = models.CharField(max_length=24, db_column='CurrentManagedSchemaVersion', blank=True)
    isreleasemanagedglobally = models.BooleanField(null=True, db_column='IsReleaseManagedGlobally', blank=True)
    minimumpwdlength = models.IntegerField(null=True, db_column='MinimumPwdLength', blank=True)
    class Meta:
        db_table = u'institution'

class Institutionnetwork(models.Model):
    institutionnetworkid = models.IntegerField(primary_key=True, db_column='InstitutionNetworkID')
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
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    addressid = models.ForeignKey(Address, null=True, db_column='AddressID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'institutionnetwork'

class Journal(models.Model):
    journalid = models.IntegerField(primary_key=True, db_column='JournalID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    issn = models.CharField(max_length=48, db_column='ISSN', blank=True)
    journalabbreviation = models.CharField(max_length=150, db_column='JournalAbbreviation', blank=True)
    journalname = models.CharField(max_length=765, db_column='JournalName', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'journal'

class Latlonpolygon(models.Model):
    latlonpolygonid = models.IntegerField(primary_key=True, db_column='LatLonPolygonID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    ispolyline = models.BooleanField(db_column='IsPolyline')
    name = models.CharField(max_length=192, db_column='Name')
    localityid = models.ForeignKey(Locality, null=True, db_column='LocalityID', blank=True)
    spvisualqueryid = models.ForeignKey(Spvisualquery, null=True, db_column='SpVisualQueryID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'latlonpolygon'

class Latlonpolygonpnt(models.Model):
    latlonpolygonpntid = models.IntegerField(primary_key=True, db_column='LatLonPolygonPntID')
    elevation = models.IntegerField(null=True, db_column='Elevation', blank=True)
    latitude = models.DecimalField(decimal_places=10, max_digits=14, db_column='Latitude')
    longitude = models.DecimalField(decimal_places=10, max_digits=14, db_column='Longitude')
    ordinal = models.IntegerField(db_column='Ordinal')
    latlonpolygonid = models.ForeignKey(Latlonpolygon, db_column='LatLonPolygonID')
    class Meta:
        db_table = u'latlonpolygonpnt'

class Lithostrat(models.Model):
    lithostratid = models.IntegerField(primary_key=True, db_column='LithoStratID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isaccepted = models.BooleanField(null=True, db_column='IsAccepted', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    acceptedid = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True)
    lithostrattreedefitemid = models.ForeignKey(Lithostrattreedefitem, db_column='LithoStratTreeDefItemID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    lithostrattreedefid = models.ForeignKey(Lithostrattreedef, db_column='LithoStratTreeDefID')
    parentid = models.ForeignKey('self', null=True, db_column='ParentID', blank=True)
    class Meta:
        db_table = u'lithostrat'

class Lithostrattreedef(models.Model):
    lithostrattreedefid = models.IntegerField(primary_key=True, db_column='LithoStratTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'lithostrattreedef'

class Lithostrattreedefitem(models.Model):
    lithostrattreedefitemid = models.IntegerField(primary_key=True, db_column='LithoStratTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.BooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.BooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    parentitemid = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    lithostrattreedefid = models.ForeignKey(Lithostrattreedef, db_column='LithoStratTreeDefID')
    class Meta:
        db_table = u'lithostrattreedefitem'

class Loan(models.Model):
    loanid = models.IntegerField(primary_key=True, db_column='LoanID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    currentduedate = models.DateField(null=True, db_column='CurrentDueDate', blank=True)
    dateclosed = models.DateField(null=True, db_column='DateClosed', blank=True)
    datereceived = models.DateField(null=True, db_column='DateReceived', blank=True)
    isclosed = models.BooleanField(null=True, db_column='IsClosed', blank=True)
    isfinancialresponsibility = models.BooleanField(null=True, db_column='IsFinancialResponsibility', blank=True)
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    addressofrecordid = models.ForeignKey(Addressofrecord, null=True, db_column='AddressOfRecordID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    divisionid = models.ForeignKey(Division, null=True, db_column='DivisionID', blank=True)
    class Meta:
        db_table = u'loan'

class Loanagent(models.Model):
    loanagentid = models.IntegerField(primary_key=True, db_column='LoanAgentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    role = models.CharField(unique=True, max_length=150, db_column='Role')
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    loanid = models.ForeignKey(Loan, db_column='LoanID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'loanagent'

class Loanattachment(models.Model):
    loanattachmentid = models.IntegerField(primary_key=True, db_column='LoanAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    loanid = models.ForeignKey(Loan, db_column='LoanID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'loanattachment'

class Loanpreparation(models.Model):
    loanpreparationid = models.IntegerField(primary_key=True, db_column='LoanPreparationID')
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
    loanid = models.ForeignKey(Loan, db_column='LoanID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    preparationid = models.ForeignKey(Preparation, null=True, db_column='PreparationID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    class Meta:
        db_table = u'loanpreparation'

class Loanreturnpreparation(models.Model):
    loanreturnpreparationid = models.IntegerField(primary_key=True, db_column='LoanReturnPreparationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    quantityresolved = models.IntegerField(null=True, db_column='QuantityResolved', blank=True)
    quantityreturned = models.IntegerField(null=True, db_column='QuantityReturned', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    returneddate = models.DateField(null=True, db_column='ReturnedDate', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    deaccessionpreparationid = models.ForeignKey(Deaccessionpreparation, null=True, db_column='DeaccessionPreparationID', blank=True)
    receivedbyid = models.ForeignKey(Agent, null=True, db_column='ReceivedByID', blank=True)
    loanpreparationid = models.ForeignKey(Loanpreparation, db_column='LoanPreparationID')
    class Meta:
        db_table = u'loanreturnpreparation'

class Locality(models.Model):
    localityid = models.IntegerField(primary_key=True, db_column='LocalityID')
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
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    geographyid = models.ForeignKey(Geography, null=True, db_column='GeographyID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    visibilitysetbyid = models.ForeignKey(Specifyuser, null=True, db_column='VisibilitySetByID', blank=True)
    sgrstatus = models.IntegerField(null=True, db_column='SGRStatus', blank=True)
    class Meta:
        db_table = u'locality'

class Localityattachment(models.Model):
    localityattachmentid = models.IntegerField(primary_key=True, db_column='LocalityAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    localityid = models.ForeignKey(Locality, db_column='LocalityID')
    class Meta:
        db_table = u'localityattachment'

class Localitycitation(models.Model):
    localitycitationid = models.IntegerField(primary_key=True, db_column='LocalityCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    localityid = models.ForeignKey(Locality, db_column='LocalityID')
    referenceworkid = models.ForeignKey(Referencework, db_column='ReferenceWorkID')
    class Meta:
        db_table = u'localitycitation'

class Localitydetail(models.Model):
    localitydetailid = models.IntegerField(primary_key=True, db_column='LocalityDetailID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    localityid = models.ForeignKey(Locality, null=True, db_column='LocalityID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'localitydetail'

class Localitynamealias(models.Model):
    localitynamealiasid = models.IntegerField(primary_key=True, db_column='LocalityNameAliasID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=765, db_column='Name')
    source = models.CharField(max_length=192, db_column='Source')
    localityid = models.ForeignKey(Locality, db_column='LocalityID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'localitynamealias'

class Morphbankview(models.Model):
    morphbankviewid = models.IntegerField(primary_key=True, db_column='MorphBankViewID')
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
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'morphbankview'

class Otheridentifier(models.Model):
    otheridentifierid = models.IntegerField(primary_key=True, db_column='OtherIdentifierID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    identifier = models.CharField(max_length=192, db_column='Identifier')
    institution = models.CharField(max_length=192, db_column='Institution', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    class Meta:
        db_table = u'otheridentifier'

class Paleocontext(models.Model):
    paleocontextid = models.IntegerField(primary_key=True, db_column='PaleoContextID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    lithostratid = models.ForeignKey(Lithostrat, null=True, db_column='LithoStratID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    chronosstratid = models.ForeignKey(Geologictimeperiod, null=True, db_column='ChronosStratID', blank=True)
    biostratid = models.ForeignKey(Geologictimeperiod, null=True, db_column='BioStratID', blank=True)
    chronosstratendid = models.ForeignKey(Geologictimeperiod, null=True, db_column='ChronosStratEndID', blank=True)
    class Meta:
        db_table = u'paleocontext'

class Permit(models.Model):
    permitid = models.IntegerField(primary_key=True, db_column='PermitID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    issuedtoid = models.ForeignKey(Agent, null=True, db_column='IssuedToID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    issuedbyid = models.ForeignKey(Agent, null=True, db_column='IssuedByID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'permit'

class Permitattachment(models.Model):
    permitattachmentid = models.IntegerField(primary_key=True, db_column='PermitAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    permitid = models.ForeignKey(Permit, db_column='PermitID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'permitattachment'

class Picklist(models.Model):
    picklistid = models.IntegerField(primary_key=True, db_column='PickListID')
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
    collectionid = models.ForeignKey(Collection, db_column='CollectionID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'picklist'

class Picklistitem(models.Model):
    picklistitemid = models.IntegerField(primary_key=True, db_column='PickListItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    title = models.CharField(max_length=192, db_column='Title')
    value = models.CharField(max_length=192, db_column='Value', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    picklistid = models.ForeignKey(Picklist, db_column='PickListID')
    class Meta:
        db_table = u'picklistitem'

class Preparation(models.Model):
    preparationid = models.IntegerField(primary_key=True, db_column='PreparationID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.BooleanField(null=True, db_column='YesNo3', blank=True)
    storageid = models.ForeignKey(Storage, null=True, db_column='StorageID', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    preparationattributeid = models.ForeignKey(Preparationattribute, null=True, db_column='PreparationAttributeID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    preparedbyid = models.ForeignKey(Agent, null=True, db_column='PreparedByID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    preptypeid = models.ForeignKey(Preptype, db_column='PrepTypeID')
    class Meta:
        db_table = u'preparation'

class Preparationattachment(models.Model):
    preparationattachmentid = models.IntegerField(primary_key=True, db_column='PreparationAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    preparationid = models.ForeignKey(Preparation, db_column='PreparationID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    class Meta:
        db_table = u'preparationattachment'

class Preparationattr(models.Model):
    attrid = models.IntegerField(primary_key=True, db_column='AttrID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    doublevalue = models.FloatField(null=True, db_column='DoubleValue', blank=True)
    strvalue = models.CharField(max_length=765, db_column='StrValue', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    attributedefid = models.ForeignKey(Attributedef, db_column='AttributeDefID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    preparationid = models.ForeignKey(Preparation, db_column='PreparationId')
    class Meta:
        db_table = u'preparationattr'

class Preparationattribute(models.Model):
    preparationattributeid = models.IntegerField(primary_key=True, db_column='PreparationAttributeID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    yesno3 = models.BooleanField(null=True, db_column='YesNo3', blank=True)
    yesno4 = models.BooleanField(null=True, db_column='YesNo4', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'preparationattribute'

class Preptype(models.Model):
    preptypeid = models.IntegerField(primary_key=True, db_column='PrepTypeID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    isloanable = models.BooleanField(db_column='IsLoanable')
    name = models.CharField(max_length=192, db_column='Name')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    collectionid = models.ForeignKey(Collection, db_column='CollectionID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'preptype'

class Project(models.Model):
    projectid = models.IntegerField(primary_key=True, db_column='ProjectID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    projectagentid = models.ForeignKey(Agent, null=True, db_column='ProjectAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'project'

class ProjectColobj(models.Model):
    projectid = models.ForeignKey(Project, db_column='ProjectID')
    collectionobjectid = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    class Meta:
        db_table = u'project_colobj'

class Recordset(models.Model):
    recordsetid = models.IntegerField(primary_key=True, db_column='RecordSetID')
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
    inforequestid = models.ForeignKey(Inforequest, null=True, db_column='InfoRequestID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    specifyuserid = models.ForeignKey(Specifyuser, db_column='SpecifyUserID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    spprincipalid = models.ForeignKey(Spprincipal, null=True, db_column='SpPrincipalID', blank=True)
    class Meta:
        db_table = u'recordset'

class Recordsetitem(models.Model):
    recordsetitemid = models.IntegerField(primary_key=True, db_column='RecordSetItemID')
    recordid = models.IntegerField(db_column='RecordId')
    recordsetid = models.ForeignKey(Recordset, db_column='RecordSetID')
    class Meta:
        db_table = u'recordsetitem'

class Referencework(models.Model):
    referenceworkid = models.IntegerField(primary_key=True, db_column='ReferenceWorkID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    ispublished = models.BooleanField(null=True, db_column='IsPublished', blank=True)
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    containedrfparentid = models.ForeignKey('self', null=True, db_column='ContainedRFParentID', blank=True)
    journalid = models.ForeignKey(Journal, null=True, db_column='JournalID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'referencework'

class Repositoryagreement(models.Model):
    repositoryagreementid = models.IntegerField(primary_key=True, db_column='RepositoryAgreementID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    addressofrecordid = models.ForeignKey(Addressofrecord, null=True, db_column='AddressOfRecordID', blank=True)
    agentid = models.ForeignKey(Agent, db_column='AgentID')
    divisionid = models.ForeignKey(Division, db_column='DivisionID')
    class Meta:
        db_table = u'repositoryagreement'

class Repositoryagreementattachment(models.Model):
    repositoryagreementattachmentid = models.IntegerField(primary_key=True, db_column='RepositoryAgreementAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    repositoryagreementid = models.ForeignKey(Repositoryagreement, db_column='RepositoryAgreementID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'repositoryagreementattachment'

class Shipment(models.Model):
    shipmentid = models.IntegerField(primary_key=True, db_column='ShipmentID')
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
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    exchangeoutid = models.ForeignKey(Exchangeout, null=True, db_column='ExchangeOutID', blank=True)
    loanid = models.ForeignKey(Loan, null=True, db_column='LoanID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    shipperid = models.ForeignKey(Agent, null=True, db_column='ShipperID', blank=True)
    shippedbyid = models.ForeignKey(Agent, null=True, db_column='ShippedByID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    shippedtoid = models.ForeignKey(Agent, null=True, db_column='ShippedToID', blank=True)
    giftid = models.ForeignKey(Gift, null=True, db_column='GiftID', blank=True)
    borrowid = models.ForeignKey(Borrow, null=True, db_column='BorrowID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'shipment'

class SpSchemaMapping(models.Model):
    spexportschemamappingid = models.ForeignKey(Spexportschemamapping, db_column='SpExportSchemaMappingID')
    spexportschemaid = models.ForeignKey(Spexportschema, db_column='SpExportSchemaID')
    class Meta:
        db_table = u'sp_schema_mapping'

class Spappresource(models.Model):
    spappresourceid = models.IntegerField(primary_key=True, db_column='SpAppResourceID')
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
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    spprincipalid = models.ForeignKey(Spprincipal, null=True, db_column='SpPrincipalID', blank=True)
    spappresourcedirid = models.ForeignKey(Spappresourcedir, db_column='SpAppResourceDirID')
    specifyuserid = models.ForeignKey(Specifyuser, db_column='SpecifyUserID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'spappresource'

class Spappresourcedata(models.Model):
    spappresourcedataid = models.IntegerField(primary_key=True, db_column='SpAppResourceDataID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    data = models.TextField(blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    spviewsetobjid = models.ForeignKey(Spviewsetobj, null=True, db_column='SpViewSetObjID', blank=True)
    spappresourceid = models.ForeignKey(Spappresource, null=True, db_column='SpAppResourceID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'spappresourcedata'

class Spappresourcedir(models.Model):
    spappresourcedirid = models.IntegerField(primary_key=True, db_column='SpAppResourceDirID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    disciplinetype = models.CharField(max_length=192, db_column='DisciplineType', blank=True)
    ispersonal = models.BooleanField(db_column='IsPersonal')
    usertype = models.CharField(max_length=192, db_column='UserType', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, null=True, db_column='DisciplineID', blank=True)
    specifyuserid = models.ForeignKey(Specifyuser, null=True, db_column='SpecifyUserID', blank=True)
    collectionid = models.ForeignKey(Collection, null=True, db_column='CollectionID', blank=True)
    class Meta:
        db_table = u'spappresourcedir'

class Spauditlog(models.Model):
    spauditlogid = models.IntegerField(primary_key=True, db_column='SpAuditLogID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    action = models.IntegerField(db_column='Action')
    parentrecordid = models.IntegerField(null=True, db_column='ParentRecordId', blank=True)
    parenttablenum = models.IntegerField(null=True, db_column='ParentTableNum', blank=True)
    recordid = models.IntegerField(null=True, db_column='RecordId', blank=True)
    recordversion = models.IntegerField(db_column='RecordVersion')
    tablenum = models.IntegerField(db_column='TableNum')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'spauditlog'

class Spauditlogfield(models.Model):
    spauditlogfieldid = models.IntegerField(primary_key=True, db_column='SpAuditLogFieldID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fieldname = models.CharField(max_length=96, db_column='FieldName')
    newvalue = models.CharField(max_length=192, db_column='NewValue')
    oldvalue = models.CharField(max_length=192, db_column='OldValue')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    spauditlogid = models.ForeignKey(Spauditlog, null=True, db_column='SpAuditLogID', blank=True)
    class Meta:
        db_table = u'spauditlogfield'

class Specifyuser(models.Model):
    specifyuserid = models.IntegerField(primary_key=True, db_column='SpecifyUserID')
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
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'specifyuser'

class SpecifyuserSpprincipal(models.Model):
    specifyuserid = models.ForeignKey(Specifyuser, db_column='SpecifyUserID')
    spprincipalid = models.ForeignKey(Spprincipal, db_column='SpPrincipalID')
    class Meta:
        db_table = u'specifyuser_spprincipal'

class Spexportschema(models.Model):
    spexportschemaid = models.IntegerField(primary_key=True, db_column='SpExportSchemaID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    schemaname = models.CharField(max_length=240, db_column='SchemaName', blank=True)
    schemaversion = models.CharField(max_length=240, db_column='SchemaVersion', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'spexportschema'

class Spexportschemaitem(models.Model):
    spexportschemaitemid = models.IntegerField(primary_key=True, db_column='SpExportSchemaItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    datatype = models.CharField(max_length=96, db_column='DataType', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    fieldname = models.CharField(max_length=192, db_column='FieldName', blank=True)
    formatter = models.CharField(max_length=96, db_column='Formatter', blank=True)
    splocalecontaineritemid = models.ForeignKey(Splocalecontaineritem, null=True, db_column='SpLocaleContainerItemID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    spexportschemaid = models.ForeignKey(Spexportschema, db_column='SpExportSchemaID')
    class Meta:
        db_table = u'spexportschemaitem'

class Spexportschemaitemmapping(models.Model):
    spexportschemaitemmappingid = models.IntegerField(primary_key=True, db_column='SpExportSchemaItemMappingID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    remarks = models.CharField(max_length=765, db_column='Remarks', blank=True)
    spqueryfieldid = models.ForeignKey(Spqueryfield, null=True, db_column='SpQueryFieldID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    spexportschemamappingid = models.ForeignKey(Spexportschemamapping, null=True, db_column='SpExportSchemaMappingID', blank=True)
    exportschemaitemid = models.ForeignKey(Spexportschemaitem, null=True, db_column='ExportSchemaItemID', blank=True)
    class Meta:
        db_table = u'spexportschemaitemmapping'

class Spexportschemamapping(models.Model):
    spexportschemamappingid = models.IntegerField(primary_key=True, db_column='SpExportSchemaMappingID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    mappingname = models.CharField(max_length=150, db_column='MappingName', blank=True)
    timestampexported = models.DateTimeField(null=True, db_column='TimeStampExported', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    collectionmemberid = models.IntegerField(null=True, db_column='CollectionMemberID', blank=True)
    class Meta:
        db_table = u'spexportschemamapping'

class Spfieldvaluedefault(models.Model):
    spfieldvaluedefaultid = models.IntegerField(primary_key=True, db_column='SpFieldValueDefaultID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    collectionmemberid = models.IntegerField(db_column='CollectionMemberID')
    fieldname = models.CharField(max_length=96, db_column='FieldName', blank=True)
    idvalue = models.IntegerField(null=True, db_column='IdValue', blank=True)
    strvalue = models.CharField(max_length=192, db_column='StrValue', blank=True)
    tablename = models.CharField(max_length=96, db_column='TableName', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'spfieldvaluedefault'

class Splocalecontainer(models.Model):
    splocalecontainerid = models.IntegerField(primary_key=True, db_column='SpLocaleContainerID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    format = models.CharField(max_length=192, db_column='Format', blank=True)
    ishidden = models.BooleanField(db_column='IsHidden')
    issystem = models.BooleanField(db_column='IsSystem')
    isuiformatter = models.BooleanField(null=True, db_column='IsUIFormatter', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    picklistname = models.CharField(max_length=192, db_column='PickListName', blank=True)
    type = models.CharField(max_length=96, db_column='Type', blank=True)
    aggregator = models.CharField(max_length=192, db_column='Aggregator', blank=True)
    defaultui = models.CharField(max_length=192, db_column='DefaultUI', blank=True)
    schematype = models.IntegerField(db_column='SchemaType')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, db_column='DisciplineID')
    class Meta:
        db_table = u'splocalecontainer'

class Splocalecontaineritem(models.Model):
    splocalecontaineritemid = models.IntegerField(primary_key=True, db_column='SpLocaleContainerItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    format = models.CharField(max_length=192, db_column='Format', blank=True)
    ishidden = models.BooleanField(db_column='IsHidden')
    issystem = models.BooleanField(db_column='IsSystem')
    isuiformatter = models.BooleanField(null=True, db_column='IsUIFormatter', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    picklistname = models.CharField(max_length=192, db_column='PickListName', blank=True)
    type = models.CharField(max_length=96, db_column='Type', blank=True)
    isrequired = models.BooleanField(null=True, db_column='IsRequired', blank=True)
    weblinkname = models.CharField(max_length=96, db_column='WebLinkName', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    splocalecontainerid = models.ForeignKey(Splocalecontainer, db_column='SpLocaleContainerID')
    class Meta:
        db_table = u'splocalecontaineritem'

class Splocaleitemstr(models.Model):
    splocaleitemstrid = models.IntegerField(primary_key=True, db_column='SpLocaleItemStrID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    country = models.CharField(max_length=6, db_column='Country', blank=True)
    language = models.CharField(max_length=6, db_column='Language')
    text = models.CharField(max_length=765, db_column='Text')
    variant = models.CharField(max_length=6, db_column='Variant', blank=True)
    splocalecontaineritemdescid = models.ForeignKey(Splocalecontaineritem, null=True, db_column='SpLocaleContainerItemDescID', blank=True)
    splocalecontainerdescid = models.ForeignKey(Splocalecontainer, null=True, db_column='SpLocaleContainerDescID', blank=True)
    splocalecontainernameid = models.ForeignKey(Splocalecontainer, null=True, db_column='SpLocaleContainerNameID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    splocalecontaineritemnameid = models.ForeignKey(Splocalecontaineritem, null=True, db_column='SpLocaleContainerItemNameID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'splocaleitemstr'

class Sppermission(models.Model):
    sppermissionid = models.IntegerField(primary_key=True, db_column='SpPermissionID')
    actions = models.TextField(db_column='Actions', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    permissionclass = models.TextField(db_column='PermissionClass')
    targetid = models.IntegerField(null=True, db_column='TargetId', blank=True)
    class Meta:
        db_table = u'sppermission'

class Spprincipal(models.Model):
    spprincipalid = models.IntegerField(primary_key=True, db_column='SpPrincipalID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    groupsubclass = models.CharField(max_length=765, db_column='GroupSubClass')
    grouptype = models.CharField(max_length=96, db_column='groupType', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    priority = models.IntegerField(db_column='Priority')
    remarks = models.TextField(db_column='Remarks', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    usergroupscopeid = models.IntegerField(null=True, db_column='userGroupScopeID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'spprincipal'

class SpprincipalSppermission(models.Model):
    sppermissionid = models.ForeignKey(Sppermission, db_column='SpPermissionID')
    spprincipalid = models.ForeignKey(Spprincipal, db_column='SpPrincipalID')
    class Meta:
        db_table = u'spprincipal_sppermission'

class Spquery(models.Model):
    spqueryid = models.IntegerField(primary_key=True, db_column='SpQueryID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    contextname = models.CharField(max_length=192, db_column='ContextName')
    contexttableid = models.IntegerField(db_column='ContextTableId')
    countonly = models.BooleanField(null=True, db_column='CountOnly', blank=True)
    isfavorite = models.BooleanField(null=True, db_column='IsFavorite', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    searchsynonymy = models.BooleanField(null=True, db_column='SearchSynonymy', blank=True)
    selectdistinct = models.BooleanField(null=True, db_column='SelectDistinct', blank=True)
    sqlstr = models.CharField(max_length=192, db_column='SqlStr', blank=True)
    specifyuserid = models.ForeignKey(Specifyuser, db_column='SpecifyUserID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'spquery'

class Spqueryfield(models.Model):
    spqueryfieldid = models.IntegerField(primary_key=True, db_column='SpQueryFieldID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    alwaysfilter = models.BooleanField(null=True, db_column='AlwaysFilter', blank=True)
    columnalias = models.CharField(max_length=192, db_column='ColumnAlias', blank=True)
    contexttableident = models.IntegerField(null=True, db_column='ContextTableIdent', blank=True)
    endvalue = models.CharField(max_length=192, db_column='EndValue', blank=True)
    fieldname = models.CharField(max_length=96, db_column='FieldName')
    formatname = models.CharField(max_length=192, db_column='FormatName', blank=True)
    isdisplay = models.BooleanField(db_column='IsDisplay')
    isnot = models.BooleanField(db_column='IsNot')
    isprompt = models.BooleanField(null=True, db_column='IsPrompt', blank=True)
    isrelfld = models.BooleanField(null=True, db_column='IsRelFld', blank=True)
    operend = models.IntegerField(null=True, db_column='OperEnd', blank=True)
    operstart = models.IntegerField(db_column='OperStart')
    position = models.IntegerField(db_column='Position')
    sorttype = models.IntegerField(db_column='SortType')
    startvalue = models.CharField(max_length=192, db_column='StartValue')
    stringid = models.TextField(db_column='StringId')
    tablelist = models.TextField(db_column='TableList')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    spqueryid = models.ForeignKey(Spquery, null=True, db_column='SpQueryID', blank=True)
    allownulls = models.BooleanField(null=True, db_column='AllowNulls', blank=True)
    class Meta:
        db_table = u'spqueryfield'

class Spreport(models.Model):
    spreportid = models.IntegerField(primary_key=True, db_column='SpReportId')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    repeatcount = models.IntegerField(null=True, db_column='RepeatCount', blank=True)
    repeatfield = models.CharField(max_length=765, db_column='RepeatField', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    appresourceid = models.ForeignKey(Spappresource, db_column='AppResourceID')
    specifyuserid = models.ForeignKey(Specifyuser, db_column='SpecifyUserID')
    workbenchtemplateid = models.ForeignKey(Workbenchtemplate, null=True, db_column='WorkbenchTemplateID', blank=True)
    spqueryid = models.ForeignKey(Spquery, null=True, db_column='SpQueryID', blank=True)
    class Meta:
        db_table = u'spreport'

class Sptasksemaphore(models.Model):
    tasksemaphoreid = models.IntegerField(primary_key=True, db_column='TaskSemaphoreID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    context = models.CharField(max_length=96, db_column='Context', blank=True)
    islocked = models.BooleanField(null=True, db_column='IsLocked', blank=True)
    lockedtime = models.DateTimeField(null=True, db_column='LockedTime', blank=True)
    machinename = models.CharField(max_length=192, db_column='MachineName', blank=True)
    scope = models.IntegerField(null=True, db_column='Scope', blank=True)
    taskname = models.CharField(max_length=96, db_column='TaskName', blank=True)
    usagecount = models.IntegerField(null=True, db_column='UsageCount', blank=True)
    ownerid = models.ForeignKey(Specifyuser, null=True, db_column='OwnerID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    collectionid = models.ForeignKey(Collection, null=True, db_column='CollectionID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    disciplineid = models.ForeignKey(Discipline, null=True, db_column='DisciplineID', blank=True)
    class Meta:
        db_table = u'sptasksemaphore'

class Spversion(models.Model):
    spversionid = models.IntegerField(primary_key=True, db_column='SpVersionID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    appname = models.CharField(max_length=96, db_column='AppName', blank=True)
    appversion = models.CharField(max_length=48, db_column='AppVersion', blank=True)
    schemaversion = models.CharField(max_length=48, db_column='SchemaVersion', blank=True)
    isdbclosed = models.BooleanField(null=True, db_column='IsDBClosed', blank=True)
    dbclosedby = models.CharField(max_length=96, db_column='DbClosedBy', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'spversion'

class Spviewsetobj(models.Model):
    spviewsetobjid = models.IntegerField(primary_key=True, db_column='SpViewSetObjID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    filename = models.CharField(max_length=765, db_column='FileName', blank=True)
    level = models.IntegerField(db_column='Level')
    metadata = models.CharField(max_length=765, db_column='MetaData', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    spappresourcedirid = models.ForeignKey(Spappresourcedir, db_column='SpAppResourceDirID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'spviewsetobj'

class Spvisualquery(models.Model):
    spvisualqueryid = models.IntegerField(primary_key=True, db_column='SpVisualQueryID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    description = models.TextField(db_column='Description', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    specifyuserid = models.ForeignKey(Specifyuser, db_column='SpecifyUserID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'spvisualquery'

class Storage(models.Model):
    storageid = models.IntegerField(primary_key=True, db_column='StorageID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    abbrev = models.CharField(max_length=48, db_column='Abbrev', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isaccepted = models.BooleanField(null=True, db_column='IsAccepted', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    number2 = models.IntegerField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    timestampversion = models.DateTimeField(null=True, db_column='TimestampVersion', blank=True)
    storagetreedefitemid = models.ForeignKey(Storagetreedefitem, db_column='StorageTreeDefItemID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    parentid = models.ForeignKey('self', null=True, db_column='ParentID', blank=True)
    acceptedid = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True)
    storagetreedefid = models.ForeignKey(Storagetreedef, db_column='StorageTreeDefID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'storage'

class Storagetreedef(models.Model):
    storagetreedefid = models.IntegerField(primary_key=True, db_column='StorageTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.TextField(db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'storagetreedef'

class Storagetreedefitem(models.Model):
    storagetreedefitemid = models.IntegerField(primary_key=True, db_column='StorageTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.BooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.BooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    storagetreedefid = models.ForeignKey(Storagetreedef, db_column='StorageTreeDefID')
    parentitemid = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'storagetreedefitem'

class Taxon(models.Model):
    taxonid = models.IntegerField(primary_key=True, db_column='TaxonID')
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
    isaccepted = models.BooleanField(null=True, db_column='IsAccepted', blank=True)
    ishybrid = models.BooleanField(null=True, db_column='IsHybrid', blank=True)
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
    taxontreedefid = models.ForeignKey(Taxontreedef, db_column='TaxonTreeDefID')
    acceptedid = models.ForeignKey('self', null=True, db_column='AcceptedID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    visibilitysetbyid = models.ForeignKey(Specifyuser, null=True, db_column='VisibilitySetByID', blank=True)
    parentid = models.ForeignKey('self', null=True, db_column='ParentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    hybridparent2id = models.ForeignKey('self', null=True, db_column='HybridParent2ID', blank=True)
    hybridparent1id = models.ForeignKey('self', null=True, db_column='HybridParent1ID', blank=True)
    taxontreedefitemid = models.ForeignKey(Taxontreedefitem, db_column='TaxonTreeDefItemID')
    class Meta:
        db_table = u'taxon'

class Taxonattachment(models.Model):
    taxonattachmentid = models.IntegerField(primary_key=True, db_column='TaxonAttachmentID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    ordinal = models.IntegerField(null=True, db_column='Ordinal', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    attachmentid = models.ForeignKey(Attachment, db_column='AttachmentID')
    taxonid = models.ForeignKey(Taxon, db_column='TaxonID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'taxonattachment'

class Taxoncitation(models.Model):
    taxoncitationid = models.IntegerField(primary_key=True, db_column='TaxonCitationID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    yesno1 = models.BooleanField(null=True, db_column='YesNo1', blank=True)
    yesno2 = models.BooleanField(null=True, db_column='YesNo2', blank=True)
    referenceworkid = models.ForeignKey(Referencework, db_column='ReferenceWorkID')
    taxonid = models.ForeignKey(Taxon, db_column='TaxonID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'taxoncitation'

class Taxontreedef(models.Model):
    taxontreedefid = models.IntegerField(primary_key=True, db_column='TaxonTreeDefID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    fullnamedirection = models.IntegerField(null=True, db_column='FullNameDirection', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    remarks = models.CharField(max_length=765, db_column='Remarks', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'taxontreedef'

class Taxontreedefitem(models.Model):
    taxontreedefitemid = models.IntegerField(primary_key=True, db_column='TaxonTreeDefItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    formattoken = models.CharField(max_length=96, db_column='FormatToken', blank=True)
    fullnameseparator = models.CharField(max_length=96, db_column='FullNameSeparator', blank=True)
    isenforced = models.BooleanField(null=True, db_column='IsEnforced', blank=True)
    isinfullname = models.BooleanField(null=True, db_column='IsInFullName', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    textafter = models.CharField(max_length=192, db_column='TextAfter', blank=True)
    textbefore = models.CharField(max_length=192, db_column='TextBefore', blank=True)
    title = models.CharField(max_length=192, db_column='Title', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    parentitemid = models.ForeignKey('self', null=True, db_column='ParentItemID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    taxontreedefid = models.ForeignKey(Taxontreedef, db_column='TaxonTreeDefID')
    class Meta:
        db_table = u'taxontreedefitem'

class Treatmentevent(models.Model):
    treatmenteventid = models.IntegerField(primary_key=True, db_column='TreatmentEventID')
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
    divisionid = models.ForeignKey(Division, null=True, db_column='DivisionID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    accessionid = models.ForeignKey(Accession, null=True, db_column='AccessionID', blank=True)
    collectionobjectid = models.ForeignKey(Collectionobject, null=True, db_column='CollectionObjectID', blank=True)
    class Meta:
        db_table = u'treatmentevent'

class Workbench(models.Model):
    workbenchid = models.IntegerField(primary_key=True, db_column='WorkbenchID')
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
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    spprincipalid = models.ForeignKey(Spprincipal, null=True, db_column='SpPrincipalID', blank=True)
    workbenchtemplateid = models.ForeignKey(Workbenchtemplate, db_column='WorkbenchTemplateID')
    specifyuserid = models.ForeignKey(Specifyuser, db_column='SpecifyUserID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    exportedfromtablename = models.CharField(max_length=384, db_column='ExportedFromTableName', blank=True)
    class Meta:
        db_table = u'workbench'

class Workbenchdataitem(models.Model):
    workbenchdataitemid = models.IntegerField(primary_key=True, db_column='WorkbenchDataItemID')
    celldata = models.TextField(db_column='CellData', blank=True)
    rownumber = models.IntegerField(null=True, db_column='RowNumber', blank=True)
    validationstatus = models.IntegerField(null=True, db_column='ValidationStatus', blank=True)
    workbenchtemplatemappingitemid = models.ForeignKey(Workbenchtemplatemappingitem, db_column='WorkbenchTemplateMappingItemID')
    workbenchrowid = models.ForeignKey(Workbenchrow, db_column='WorkbenchRowID')
    class Meta:
        db_table = u'workbenchdataitem'

class Workbenchrow(models.Model):
    workbenchrowid = models.IntegerField(primary_key=True, db_column='WorkbenchRowID')
    biogeomancerresults = models.TextField(db_column='BioGeomancerResults', blank=True)
    cardimagedata = models.TextField(db_column='CardImageData', blank=True)
    cardimagefullpath = models.CharField(max_length=765, db_column='CardImageFullPath', blank=True)
    lat1text = models.CharField(max_length=150, db_column='Lat1Text', blank=True)
    lat2text = models.CharField(max_length=150, db_column='Lat2Text', blank=True)
    long1text = models.CharField(max_length=150, db_column='Long1Text', blank=True)
    long2text = models.CharField(max_length=150, db_column='Long2Text', blank=True)
    rownumber = models.IntegerField(null=True, db_column='RowNumber', blank=True)
    uploadstatus = models.IntegerField(null=True, db_column='UploadStatus', blank=True)
    workbenchid = models.ForeignKey(Workbench, db_column='WorkbenchID')
    recordid = models.IntegerField(null=True, db_column='RecordID', blank=True)
    sgrstatus = models.IntegerField(null=True, db_column='SGRStatus', blank=True)
    class Meta:
        db_table = u'workbenchrow'

class Workbenchrowexportedrelationship(models.Model):
    workbenchrowexportedrelationshipid = models.IntegerField(primary_key=True, db_column='WorkbenchRowExportedRelationshipID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    recordid = models.IntegerField(null=True, db_column='RecordID', blank=True)
    relationshipname = models.CharField(max_length=360, db_column='RelationshipName', blank=True)
    sequence = models.IntegerField(null=True, db_column='Sequence', blank=True)
    tablename = models.CharField(max_length=360, db_column='TableName', blank=True)
    workbenchrowid = models.ForeignKey(Workbenchrow, db_column='WorkbenchRowID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    class Meta:
        db_table = u'workbenchrowexportedrelationship'

class Workbenchrowimage(models.Model):
    workbenchrowimageid = models.IntegerField(primary_key=True, db_column='WorkbenchRowImageID')
    attachtotablename = models.CharField(max_length=192, db_column='AttachToTableName', blank=True)
    cardimagedata = models.TextField(db_column='CardImageData', blank=True)
    cardimagefullpath = models.CharField(max_length=765, db_column='CardImageFullPath', blank=True)
    imageorder = models.IntegerField(null=True, db_column='ImageOrder', blank=True)
    workbenchrowid = models.ForeignKey(Workbenchrow, db_column='WorkbenchRowID')
    class Meta:
        db_table = u'workbenchrowimage'

class Workbenchtemplate(models.Model):
    workbenchtemplateid = models.IntegerField(primary_key=True, db_column='WorkbenchTemplateID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    srcfilepath = models.CharField(max_length=765, db_column='SrcFilePath', blank=True)
    specifyuserid = models.ForeignKey(Specifyuser, db_column='SpecifyUserID')
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    class Meta:
        db_table = u'workbenchtemplate'

class Workbenchtemplatemappingitem(models.Model):
    workbenchtemplatemappingitemid = models.IntegerField(primary_key=True, db_column='WorkbenchTemplateMappingItemID')
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(null=True, db_column='TimestampModified', blank=True)
    version = models.IntegerField(null=True, db_column='Version', blank=True)
    xcoord = models.IntegerField(null=True, db_column='XCoord', blank=True)
    ycoord = models.IntegerField(null=True, db_column='YCoord', blank=True)
    caption = models.CharField(max_length=192, db_column='Caption', blank=True)
    carryforward = models.BooleanField(null=True, db_column='CarryForward', blank=True)
    datafieldlength = models.IntegerField(null=True, db_column='DataFieldLength', blank=True)
    fieldname = models.CharField(max_length=765, db_column='FieldName', blank=True)
    fieldtype = models.IntegerField(null=True, db_column='FieldType', blank=True)
    importedcolname = models.CharField(max_length=765, db_column='ImportedColName', blank=True)
    isexportabletocontent = models.BooleanField(null=True, db_column='IsExportableToContent', blank=True)
    isincludedintitle = models.BooleanField(null=True, db_column='IsIncludedInTitle', blank=True)
    isrequired = models.BooleanField(null=True, db_column='IsRequired', blank=True)
    metadata = models.CharField(max_length=384, db_column='MetaData', blank=True)
    datacolumnindex = models.IntegerField(null=True, db_column='DataColumnIndex', blank=True)
    tableid = models.IntegerField(null=True, db_column='TableId', blank=True)
    tablename = models.CharField(max_length=192, db_column='TableName', blank=True)
    vieworder = models.IntegerField(null=True, db_column='ViewOrder', blank=True)
    createdbyagentid = models.ForeignKey(Agent, null=True, db_column='CreatedByAgentID', blank=True)
    workbenchtemplateid = models.ForeignKey(Workbenchtemplate, db_column='WorkbenchTemplateID')
    modifiedbyagentid = models.ForeignKey(Agent, null=True, db_column='ModifiedByAgentID', blank=True)
    iseditable = models.BooleanField(null=True, db_column='IsEditable', blank=True)
    class Meta:
        db_table = u'workbenchtemplatemappingitem'

