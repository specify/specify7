from django.db import models
from django.utils import timezone

class SpecifyBaseModel(models.Model):
    def protect(collector, field, sub_objs, using):
        if hasattr(collector, 'delete_blockers'):
            collector.delete_blockers.append((field, sub_objs))
        else:
            return models.PROTECT(collector, field, sub_objs, using)

    def save(self, *args, **kwargs):
        try:
            # Custom save logic here, if necessary
            super().save(*args, **kwargs)
        except AbortSave as e:
            # Handle AbortSave exception as needed
            logger.error("Save operation aborted: %s", e)
            return

class Accession(models.Model):
    """
    Accession(id, accessioncondition, accessionnumber, dateaccessioned, dateacknowledged, 
    datereceived, integer1, integer2, integer3, number1, number2, remarks, status, text1, text2, 
    text3, text4, text5, timestampcreated, timestampmodified, totalvalue, type, verbatimdate, 
    version, yesno1, yesno2, addressofrecord, createdbyagent, division, modifiedbyagent, repositoryagreement)
    """

    # Assuming field types based on names, adjust as necessary
    accessioncondition = models.CharField(max_length=255, null=True, blank=True)
    accessionnumber = models.CharField(max_length=255)
    dateaccessioned = models.DateField(null=True, blank=True)
    dateacknowledged = models.DateField(null=True, blank=True)
    datereceived = models.DateField(null=True, blank=True)
    integer1 = models.IntegerField(null=True, blank=True)
    integer2 = models.IntegerField(null=True, blank=True)
    integer3 = models.IntegerField(null=True, blank=True)
    number1 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    number2 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=255, null=True, blank=True)
    text1 = models.CharField(max_length=255, null=True, blank=True)
    text2 = models.CharField(max_length=255, null=True, blank=True)
    text3 = models.CharField(max_length=255, null=True, blank=True)
    text4 = models.CharField(max_length=255, null=True, blank=True)
    text5 = models.CharField(max_length=255, null=True, blank=True)
    timestampcreated = models.DateTimeField(auto_now_add=True)
    timestampmodified = models.DateTimeField(auto_now=True)
    totalvalue = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    type = models.CharField(max_length=255, null=True, blank=True)
    verbatimdate = models.CharField(max_length=255, null=True, blank=True)
    version = models.IntegerField(default=0)
    yesno1 = models.BooleanField(default=False)
    yesno2 = models.BooleanField(default=False)

    # ForeignKeys and relationships, example:
    addressofrecord = models.ForeignKey('Address', on_delete=models.CASCADE, related_name='accessions')
    createdbyagent = models.ForeignKey('Agent', on_delete=models.CASCADE, related_name='+')
    division = models.ForeignKey('Division', on_delete=models.CASCADE, related_name='accessions')
    modifiedbyagent = models.ForeignKey('Agent', on_delete=models.CASCADE, related_name='+')
    repositoryagreement = models.ForeignKey('RepositoryAgreement', on_delete=models.CASCADE, related_name='accessions')

    # Custom save method if needed
    def save(self, *args, **kwargs):
        # Custom save logic here
        super().save(*args, **kwargs)

    class Meta:
        # Any meta options
        pass

from django.db import models

class Accession2(models.Model):
    # Fields
    accessionCondition = models.CharField(max_length=255, blank=True, null=True, db_column='AccessionCondition')
    accessionNumber = models.CharField(max_length=60, db_index=True, unique=False, db_column='AccessionNumber')
    dateAccessioned = models.DateTimeField(blank=True, null=True, db_column='DateAccessioned')
    dateAcknowledged = models.DateTimeField(blank=True, null=True, db_column='DateAcknowledged')
    dateReceived = models.DateTimeField(blank=True, null=True, db_column='DateReceived')
    integer1 = models.IntegerField(blank=True, null=True, db_column='Integer1')
    integer2 = models.IntegerField(blank=True, null=True, db_column='Integer2')
    integer3 = models.IntegerField(blank=True, null=True, db_column='Integer3')
    number1 = models.DecimalField(max_digits=22, decimal_places=10, blank=True, null=True, db_column='Number1')
    number2 = models.DecimalField(max_digits=22, decimal_places=10, blank=True, null=True, db_column='Number2')
    remarks = models.TextField(blank=True, null=True, db_column='Remarks')
    status = models.CharField(max_length=32, blank=True, null=True, db_column='Status')
    text1 = models.TextField(blank=True, null=True, db_column='Text1')
    text2 = models.TextField(blank=True, null=True, db_column='Text2')
    text3 = models.TextField(blank=True, null=True, db_column='Text3')
    text4 = models.TextField(blank=True, null=True, db_column='Text4')
    text5 = models.TextField(blank=True, null=True, db_column='Text5')
    timestampCreated = models.DateTimeField(auto_now_add=True, db_column='TimestampCreated')
    timestampModified = models.DateTimeField(auto_now=True, blank=True, null=True, db_column='TimestampModified')
    totalValue = models.DecimalField(max_digits=22, decimal_places=10, blank=True, null=True, db_column='TotalValue')
    type = models.CharField(max_length=32, blank=True, null=True, db_column='Type')
    verbatimDate = models.CharField(max_length=50, blank=True, null=True, db_column='VerbatimDate')
    version = models.IntegerField(default=0, blank=True, null=True, db_column='Version')
    yesNo1 = models.BooleanField(default=False, db_column='YesNo1')
    yesNo2 = models.BooleanField(default=False, db_column='YesNo2')

    # Relationships
    addressofrecord = models.ForeignKey('Address', on_delete=models.CASCADE, related_name='accessions')
    # addressofrecord_id = models.ForeignKey('Address', on_delete=models.CASCADE, related_name='accessions')
    createdbyagent = models.ForeignKey('Agent', on_delete=models.CASCADE, related_name='+')
    division = models.ForeignKey('Division', on_delete=models.CASCADE, related_name='accessions')
    modifiedbyagent = models.ForeignKey('Agent', on_delete=models.CASCADE, related_name='+')
    repositoryagreement = models.ForeignKey('RepositoryAgreement', on_delete=models.CASCADE, related_name='accessions')

    # ID Field
    # accessionId = models.id

    # Specify Model (Table)

    class Meta:
        db_table = 'accession'
        # Assuming ordering and other Meta options as needed, e.g., ordering

    def save(self, *args, **kwargs):
        super(Accession, self).save(*args, **kwargs)

# Note: Relationships are not included in this snippet. You should define ForeignKey or OneToOneField as needed.

class Accession3(models.Model):
    pass
    # Fields

    # Relationships

    # ID Field

    # Specify Model

class Accession4(SpecifyBaseModel):
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

    # Relationships: One-to-One

    # Relationships: Many-to-One
    addressOfRecord = models.ForeignKey('AddressOfRecord', db_column='AddressOfRecordID', related_name='accessions', null=True, on_delete=protect)
    createdByAgent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect)
    division = models.ForeignKey('Division', db_column='DivisionID', related_name='+', null=False, on_delete=protect)
    modifiedByAgent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect)
    repositoryAgreement = models.ForeignKey('RepositoryAgreement', db_column='RepositoryAgreementID', related_name='accessions', null=True, on_delete=protect)

    class Meta:
        db_table = 'accession'
        ordering = ()
        indexes = [
            models.Index(fields=['AccessionNumber'], name='AccessionNumberIDX'),
            models.Index(fields=['DateAccessioned'], name='AccessionDateIDX')
        ]

class SpTimestampedModel(models.Model):
    """
    SpTimestampedModel(id, timestampcreated, timestampmodified)
    """

    # Fields
    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(db_column='TimestampModified')

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        timestamp_override = kwargs.pop('timestamp_override', False)

        if not timestamp_override:
            # If timestamp_override is not True, update the timestamps
            if not self.id:
                # This is a new record, set timestampCreated
                self.timestampcreated = timezone.now()
            
            # Always update timestampModified
            self.timestampmodified = timezone.now()
        
        super().save(*args, **kwargs)

