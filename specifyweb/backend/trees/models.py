from functools import partialmethod
from django.db import models
from django.db.models import Q, CheckConstraint
from django.utils import timezone
from specifyweb.backend.businessrules.exceptions import AbortSave
from specifyweb.specify.model_timestamp import save_auto_timestamp_field_with_override
from specifyweb.specify import model_extras
from specifyweb.specify.datamodel import datamodel, Table
import logging
from specifyweb.specify.models import custom_save, protect_with_blockers

class Geographytreedef(models.Model):
    specify_model = datamodel.get_table_strict('geographytreedef')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='geographytreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='geographytreedefs', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geographytreedef'
        ordering = ()

    
    save = partialmethod(custom_save)

class Geographytreedefitem(model_extras.Geographytreedefitem):
    specify_model = datamodel.get_table_strict('geographytreedefitem')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='geographytreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index=False)
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index=False)
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index=False)
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('GeographyTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=models.DO_NOTHING)
    treedef = models.ForeignKey('GeographyTreeDef', db_column='GeographyTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geographytreedefitem'
        ordering = ()

    
    save = partialmethod(custom_save)

class Geologictimeperiod(model_extras.Geologictimeperiod):
    specify_model = datamodel.get_table_strict('geologictimeperiod') # aka. Chronostratigraphy

    # ID Field
    id = models.AutoField(primary_key=True, db_column='geologictimeperiodid')

    # Fields
    endperiod = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='EndPeriod', db_index=False)
    enduncertainty = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='EndUncertainty', db_index=False)
    fullname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FullName', db_index=False)
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index=False)
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index=False)
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index=False)
    isbiostrat = models.BooleanField(blank=True, null=True, unique=False, db_column='IsBioStrat', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    standard = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Standard', db_index=False)
    startperiod = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='StartPeriod', db_index=False)
    startuncertainty = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='StartUncertainty', db_index=False)
    text1 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text1', db_index=False)
    text2 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text2', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    acceptedgeologictimeperiod = models.ForeignKey('GeologicTimePeriod', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('GeologicTimePeriodTreeDef', db_column='GeologicTimePeriodTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionitem = models.ForeignKey('GeologicTimePeriodTreeDefItem', db_column='GeologicTimePeriodTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('GeologicTimePeriod', db_column='ParentID', related_name='children', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'geologictimeperiod'
        ordering = ()
        indexes = [
            models.Index(fields=['name'], name='GTPNameIDX'),
            models.Index(fields=['fullname'], name='GTPFullNameIDX'),
            models.Index(fields=['guid'], name='GTPGuidIDX')
        ]

    
    save = partialmethod(custom_save)

class Geologictimeperiodtreedef(models.Model):
    specify_model = datamodel.get_table_strict('geologictimeperiodtreedef')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='geologictimeperiodtreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='geologictimeperiodtreedefs', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geologictimeperiodtreedef'
        ordering = ()

    
    save = partialmethod(custom_save)

class Geologictimeperiodtreedefitem(model_extras.Geologictimeperiodtreedefitem):
    specify_model = datamodel.get_table_strict('geologictimeperiodtreedefitem')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='geologictimeperiodtreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index=False)
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index=False)
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index=False)
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('GeologicTimePeriodTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=models.DO_NOTHING)
    treedef = models.ForeignKey('GeologicTimePeriodTreeDef', db_column='GeologicTimePeriodTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'geologictimeperiodtreedefitem'
        ordering = ()

    
    save = partialmethod(custom_save)
    
    
class Geography(model_extras.Geography):
    specify_model = datamodel.get_table_strict('geography')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='geographyid')

    # Fields
    abbrev = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Abbrev', db_index=False)
    centroidlat = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='CentroidLat', db_index=False)
    centroidlon = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='CentroidLon', db_index=False)
    commonname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='CommonName', db_index=False)
    fullname = models.CharField(blank=True, max_length=500, null=True, unique=False, db_column='FullName', db_index=False)
    geographycode = models.CharField(blank=True, max_length=24, null=True, unique=False, db_column='GeographyCode', db_index=False)
    gml = models.TextField(blank=True, null=True, unique=False, db_column='GML', db_index=False)
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index=False)
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index=False)
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index=False)
    iscurrent = models.BooleanField(blank=True, null=True, unique=False, db_column='IsCurrent', db_index=False)
    name = models.CharField(blank=False, max_length=128, null=False, unique=False, db_column='Name', db_index=False)
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index=False)
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index=False)
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index=False)
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    timestampversion = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampVersion', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    acceptedgeography = models.ForeignKey('Geography', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('GeographyTreeDef', db_column='GeographyTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionitem = models.ForeignKey('GeographyTreeDefItem', db_column='GeographyTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('Geography', db_column='ParentID', related_name='children', null=True, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'geography'
        ordering = ()
        indexes = [
            models.Index(fields=['name'], name='GeoNameIDX'),
            models.Index(fields=['fullname'], name='GeoFullNameIDX')
        ]

    
    save = partialmethod(custom_save)

class Lithostrat(model_extras.Lithostrat):
    specify_model = datamodel.get_table_strict('lithostrat')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='lithostratid')

    # Fields
    fullname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FullName', db_index=False)
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index=False)
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index=False)
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index=False)
    number1 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number1', db_index=False)
    number2 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number2', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index=False)
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index=False)
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index=False)

    # Relationships: Many-to-One
    acceptedlithostrat = models.ForeignKey('LithoStrat', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('LithoStratTreeDef', db_column='LithoStratTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionitem = models.ForeignKey('LithoStratTreeDefItem', db_column='LithoStratTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('LithoStrat', db_column='ParentID', related_name='children', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'lithostrat'
        ordering = ()
        indexes = [
            models.Index(fields=['name'], name='LithoNameIDX'),
            models.Index(fields=['fullname'], name='LithoFullNameIDX'),
            models.Index(fields=['guid'], name='LithoGuidIDX')
        ]

    
    save = partialmethod(custom_save)

class Lithostrattreedef(models.Model):
    specify_model = datamodel.get_table_strict('lithostrattreedef')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='lithostrattreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='lithostratstreedefs', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'lithostrattreedef'
        ordering = ()

    
    save = partialmethod(custom_save)

class Lithostrattreedefitem(model_extras.Lithostrattreedefitem):
    specify_model = datamodel.get_table_strict('lithostrattreedefitem')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='lithostrattreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index=False)
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index=False)
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index=False)
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('LithoStratTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=models.DO_NOTHING)
    treedef = models.ForeignKey('LithoStratTreeDef', db_column='LithoStratTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'lithostrattreedefitem'
        ordering = ()

    
    save = partialmethod(custom_save)

class Storage(model_extras.Storage):
    specify_model = datamodel.get_table_strict('storage')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='storageid')

    # Fields
    abbrev = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='Abbrev', db_index=False)
    fullname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FullName', db_index=False)
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index=False)
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index=False)
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index=False)
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index=False)
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    timestampversion = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampVersion', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)
    uniqueidentifier = models.CharField(blank=True, max_length=128, null=True, unique=True, db_column='UniqueIdentifier', db_index=False)

    # Relationships: Many-to-One
    acceptedstorage = models.ForeignKey('Storage', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('StorageTreeDef', db_column='StorageTreeDefID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    definitionitem = models.ForeignKey('StorageTreeDefItem', db_column='StorageTreeDefItemID', related_name='treeentries', null=False, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('Storage', db_column='ParentID', related_name='children', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'storage'
        ordering = ()
        indexes = [
            models.Index(fields=['name'], name='StorNameIDX'),
            models.Index(fields=['fullname'], name='StorFullNameIDX')
        ]

    
    save = partialmethod(custom_save)

class Storagetreedef(models.Model):
    specify_model = datamodel.get_table_strict('storagetreedef')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='storagetreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    institution = models.ForeignKey('specify.Institution', db_column='InstitutionID', related_name='storagetreedefs', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'storagetreedef'
        ordering = ()

    
    save = partialmethod(custom_save)

class Storagetreedefitem(model_extras.Storagetreedefitem):
    specify_model = datamodel.get_table_strict('storagetreedefitem')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='storagetreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index=False)
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index=False)
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index=False)
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('StorageTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=models.DO_NOTHING)
    treedef = models.ForeignKey('StorageTreeDef', db_column='StorageTreeDefID', related_name='treedefitems', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'storagetreedefitem'
        ordering = ()

    
    save = partialmethod(custom_save)

class Taxon(model_extras.Taxon):
    specify_model = datamodel.get_table_strict('taxon')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxonid')

    # Fields
    author = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Author', db_index=False)
    citesstatus = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='CitesStatus', db_index=False)
    colstatus = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='COLStatus', db_index=False)
    commonname = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='CommonName', db_index=False)
    cultivarname = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='CultivarName', db_index=False)
    environmentalprotectionstatus = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='EnvironmentalProtectionStatus', db_index=False)
    esastatus = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='EsaStatus', db_index=False)
    fullname = models.CharField(blank=True, max_length=512, null=True, unique=False, db_column='FullName', db_index=False)
    groupnumber = models.CharField(blank=True, max_length=20, null=True, unique=False, db_column='GroupNumber', db_index=False)
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index=False)
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index=False)
    integer1 = models.BigIntegerField(blank=True, null=True, unique=False, db_column='Integer1', db_index=False)
    integer2 = models.BigIntegerField(blank=True, null=True, unique=False, db_column='Integer2', db_index=False)
    integer3 = models.BigIntegerField(blank=True, null=True, unique=False, db_column='Integer3', db_index=False)
    integer4 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer4', db_index=False)
    integer5 = models.IntegerField(blank=True, null=True, unique=False, db_column='Integer5', db_index=False)
    isaccepted = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsAccepted', db_index=False)
    ishybrid = models.BooleanField(blank=False, default=False, null=False, unique=False, db_column='IsHybrid', db_index=False)
    isisnumber = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='IsisNumber', db_index=False)
    labelformat = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='LabelFormat', db_index=False)
    lsid = models.TextField(blank=True, null=True, unique=False, db_column='LSID', db_index=False)
    name = models.CharField(blank=False, max_length=256, null=False, unique=False, db_column='Name', db_index=False)
    ncbitaxonnumber = models.CharField(blank=True, max_length=8, null=True, unique=False, db_column='NcbiTaxonNumber', db_index=False)
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index=False)
    number1 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number1', db_index=False)
    number2 = models.IntegerField(blank=True, null=True, unique=False, db_column='Number2', db_index=False)
    number3 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number3', db_index=False)
    number4 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number4', db_index=False)
    number5 = models.DecimalField(blank=True, max_digits=22, decimal_places=10, null=True, unique=False, db_column='Number5', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    source = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Source', db_index=False)
    taxonomicserialnumber = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='TaxonomicSerialNumber', db_index=False)
    text1 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text1', db_index=False)
    text10 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text10', db_index=False)
    text11 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text11', db_index=False)
    text12 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text12', db_index=False)
    text13 = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='Text13', db_index=False)
    text14 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text14', db_index=False)
    text15 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text15', db_index=False)
    text16 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text16', db_index=False)
    text17 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text17', db_index=False)
    text18 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text18', db_index=False)
    text19 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text19', db_index=False)
    text2 = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='Text2', db_index=False)
    text20 = models.CharField(blank=True, max_length=256, null=True, unique=False, db_column='Text20', db_index=False)
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index=False)
    text4 = models.TextField(blank=True, null=True, unique=False, db_column='Text4', db_index=False)
    text5 = models.TextField(blank=True, null=True, unique=False, db_column='Text5', db_index=False)
    text6 = models.TextField(blank=True, null=True, unique=False, db_column='Text6', db_index=False)
    text7 = models.TextField(blank=True, null=True, unique=False, db_column='Text7', db_index=False)
    text8 = models.TextField(blank=True, null=True, unique=False, db_column='Text8', db_index=False)
    text9 = models.TextField(blank=True, null=True, unique=False, db_column='Text9', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    unitind1 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitInd1', db_index=False)
    unitind2 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitInd2', db_index=False)
    unitind3 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitInd3', db_index=False)
    unitind4 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitInd4', db_index=False)
    unitname1 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitName1', db_index=False)
    unitname2 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitName2', db_index=False)
    unitname3 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitName3', db_index=False)
    unitname4 = models.CharField(blank=True, max_length=50, null=True, unique=False, db_column='UnitName4', db_index=False)
    usfwscode = models.CharField(blank=True, max_length=16, null=True, unique=False, db_column='UsfwsCode', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)
    visibility = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Visibility', db_index=False)
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index=False)
    yesno10 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo10', db_index=False)
    yesno11 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo11', db_index=False)
    yesno12 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo12', db_index=False)
    yesno13 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo13', db_index=False)
    yesno14 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo14', db_index=False)
    yesno15 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo15', db_index=False)
    yesno16 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo16', db_index=False)
    yesno17 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo17', db_index=False)
    yesno18 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo18', db_index=False)
    yesno19 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo19', db_index=False)
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index=False)
    yesno3 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo3', db_index=False)
    yesno4 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo4', db_index=False)
    yesno5 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo5', db_index=False)
    yesno6 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo6', db_index=False)
    yesno7 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo7', db_index=False)
    yesno8 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo8', db_index=False)
    yesno9 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo9', db_index=False)

    # Relationships: Many-to-One
    acceptedtaxon = models.ForeignKey('Taxon', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    definition = models.ForeignKey('TaxonTreeDef', db_column='TaxonTreeDefID', related_name='treeentries', null=False, on_delete=models.CASCADE)
    definitionitem = models.ForeignKey('TaxonTreeDefItem', db_column='TaxonTreeDefItemID', related_name='treeentries', null=False, on_delete=models.CASCADE)
    hybridparent1 = models.ForeignKey('Taxon', db_column='HybridParent1ID', related_name='hybridchildren1', null=True, on_delete=protect_with_blockers)
    hybridparent2 = models.ForeignKey('Taxon', db_column='HybridParent2ID', related_name='hybridchildren2', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('Taxon', db_column='ParentID', related_name='children', null=True, on_delete=models.CASCADE)
    taxonattribute = models.ForeignKey('specify.TaxonAttribute', db_column='TaxonAttributeID', related_name='taxons', null=True, on_delete=protect_with_blockers)
    visibilitysetby = models.ForeignKey('specify.SpecifyUser', db_column='VisibilitySetByID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'taxon'
        ordering = ()
        indexes = [
            models.Index(fields=['guid'], name='TaxonGuidIDX'),
            models.Index(fields=['taxonomicserialnumber'], name='TaxonomicSerialNumberIDX'),
            models.Index(fields=['commonname'], name='TaxonCommonNameIDX'),
            models.Index(fields=['name'], name='TaxonNameIDX'),
            models.Index(fields=['fullname'], name='TaxonFullNameIDX'),
            models.Index(fields=['environmentalprotectionstatus'], name='EPSIDX') # Avoid error: The index name 'EnvironmentalProtectionStatusIDX' cannot be longer than 30 characters.
        ]

    
    save = partialmethod(custom_save)


class Taxontreedef(models.Model):
    specify_model = datamodel.get_table_strict('taxontreedef')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxontreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    remarks = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Remarks', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: One-to-One

    # Relationships: Many-to-One
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='taxontreedefs', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'taxontreedef'
        ordering = ()

    
    save = partialmethod(custom_save)

class Taxontreedefitem(model_extras.Taxontreedefitem):
    specify_model = datamodel.get_table_strict('taxontreedefitem')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='taxontreedefitemid')

    # Fields
    formattoken = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FormatToken', db_index=False)
    fullnameseparator = models.CharField(blank=True, max_length=32, null=True, unique=False, db_column='FullNameSeparator', db_index=False)
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index=False)
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index=False)
    name = models.CharField(blank=False, max_length=64, null=False, unique=False, db_column='Name', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    textafter = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextAfter', db_index=False)
    textbefore = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TextBefore', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now) # auto_now=True
    title = models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='Title', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)

    # Relationships: Many-to-One
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('TaxonTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=models.DO_NOTHING)
    treedef = models.ForeignKey('TaxonTreeDef', db_column='TaxonTreeDefID', related_name='treedefitems', null=False, on_delete=models.CASCADE)

    class Meta:
        db_table = 'taxontreedefitem'
        ordering = ()

    
    save = partialmethod(custom_save)

class Tectonicunit(model_extras.Tectonicunit):
    specify_model = datamodel.get_table_strict('tectonicunit')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='tectonicunitid')

    # Fields
    fullname = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FullName', db_index=False)
    guid = models.CharField(blank=True, max_length=128, null=True, unique=False, db_column='GUID', db_index=False)
    highestchildnodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='HighestChildNodeNumber', db_index=False)
    isaccepted = models.BooleanField(blank=False, null=False, unique=False, db_column='IsAccepted', db_index=False, default=False)
    name = models.CharField(blank=False, max_length=255, null=False, unique=False, db_column='Name', db_index=False)
    nodenumber = models.IntegerField(blank=True, null=True, unique=False, db_column='NodeNumber', db_index=False)   
    number1 = models.DecimalField(blank=True, max_digits=20, decimal_places=10, null=True, unique=False, db_column='Number1', db_index=False)
    number2 = models.DecimalField(blank=True, max_digits=20, decimal_places=10, null=True, unique=False, db_column='Number2', db_index=False)
    rankid = models.IntegerField(blank=False, null=False, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index=False)
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)
    yesno1 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo1', db_index=False)
    yesno2 = models.BooleanField(blank=True, null=True, unique=False, db_column='YesNo2', db_index=False)
    
    # Relationships: Many-to-One
    acceptedtectonicunit = models.ForeignKey('TectonicUnit', db_column='AcceptedID', related_name='acceptedchildren', null=True, on_delete=protect_with_blockers)
    definitionitem = models.ForeignKey('TectonicUnitTreeDefItem', db_column='TectonicUnitTreeDefItemID', related_name='treeentries', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('TectonicUnit', db_column='ParentID', related_name='children', null=True, on_delete=models.CASCADE)
    definition = models.ForeignKey('TectonicUnitTreeDef', db_column='TectonicUnitTreeDefID', related_name='treeentries', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    
    class Meta:
        db_table = 'tectonicunit'
        ordering = ()

    save = partialmethod(custom_save)

class Tectonicunittreedef(models.Model):
    specify_model = datamodel.get_table_strict('tectonicunittreedef')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='tectonicunittreedefid')

    # Fields
    fullnamedirection = models.IntegerField(blank=True, null=True, unique=False, db_column='FullNameDirection', db_index=False, default=0)
    name = models.CharField(blank=False, max_length=255, null=False, unique=False, db_column='Name', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)
    
    # Relationships: Many-to-One
    discipline = models.ForeignKey('specify.Discipline', db_column='DisciplineID', related_name='tectonicunittreedefs', null=True, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    
    class Meta:
        db_table = 'tectonicunittreedef'
        ordering = ()

    save = partialmethod(custom_save)

class Tectonicunittreedefitem(model_extras.Tectonicunittreedefitem):
    specify_model = datamodel.get_table_strict('tectonicUnittreedefitem')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='tectonicunittreedefitemid')

    # Fields
    fullnameseparator = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='FullNameSeparator', db_index=False)
    isenforced = models.BooleanField(blank=True, null=True, unique=False, db_column='IsEnforced', db_index=False)
    isinfullname = models.BooleanField(blank=True, null=True, unique=False, db_column='IsInFullName', db_index=False)
    name = models.CharField(blank=False, max_length=255, null=False, unique=False, db_column='Name', db_index=False)
    rankid = models.IntegerField(blank=True, null=True, unique=False, db_column='RankID', db_index=False)
    remarks = models.TextField(blank=True, null=True, unique=False, db_column='Remarks', db_index=False)
    textafter = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='TextAfter', db_index=False)
    textbefore = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='TextBefore', db_index=False)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now)
    title = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Title', db_index=False)
    version = models.IntegerField(blank=True, null=False, unique=False, db_column='Version', db_index=False, default=0)
    
    # Relationships: Many-to-One
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    parent = models.ForeignKey('TectonicUnitTreeDefItem', db_column='ParentItemID', related_name='children', null=True, on_delete=models.DO_NOTHING)
    treedef = models.ForeignKey('TectonicUnitTreeDef', db_column='TectonicUnitTreeDefID', related_name='treedefitems', null=True, on_delete=protect_with_blockers)
    
    class Meta:
        db_table = 'tectonicunittreedefitem'
        ordering = ()

    save = partialmethod(custom_save)