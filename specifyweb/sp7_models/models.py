from functools import partialmethod
from django.db import models
from django.utils import timezone
from model_utils import FieldTracker
from specifyweb.businessrules.exceptions import AbortSave
from specifyweb.specify.model_timestamp import pre_save_auto_timestamp_field_with_override
from specifyweb.specify.models import protect_with_blockers, custom_save
from specifyweb.specify.datamodel import datamodel
import logging

logger = logging.getLogger(__name__)

class CollectionObjectType(models.Model):
    specify_model = datamodel.get_table('collectionobjecttype')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='CollectionObjectTypeID')

    # Fields
    name = models.CharField(blank=False, max_length=255, null=False, unique=False, db_column='Name', db_index=False)
    isloanable = models.BooleanField(blank=True, null=True, unique=False, db_column='IsLoanable', db_index=False)
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index=False, default=0)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now)
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index=False)
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index=False)
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index=False)
    
    # Relationships: Many-to-One
    collection = models.ForeignKey('specify.Collection', db_column='CollectionID', related_name='collectionobjecttypes', null=False, on_delete=protect_with_blockers)
    taxontreedef = models.ForeignKey('specify.TaxonTreeDef', db_column='TaxonTreeDefID', related_name='collectionobjecttypes', null=False, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    
    class Meta:
        db_table = 'collectionobjecttype'
        ordering = ()

    timestamptracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])
    save = partialmethod(custom_save)

class CollectionObjectGroup(models.Model): # aka. Cog
    specify_model = datamodel.get_table('collectionobjectgroup')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionobjectgroupid')

    # Fields
    name = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Name', db_index=False)
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index=False)
    igsn = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='IGSN', db_index=False)
    guid = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='GUID', db_index=False)
    number = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Number', db_index=False)
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index=False, default=0)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now)
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index=False)
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index=False)
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index=False)

    # Relationships: Many-to-One
    collection = models.ForeignKey('specify.Collection', db_column='CollectionID', related_name='collectionobjectgroups', null=False, on_delete=protect_with_blockers)
    createdbyagent = models.ForeignKey('specify.Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('specify.Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionobjectgroup'
        ordering = ()

    timestamptracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])
    save = partialmethod(custom_save)

class CollectionObjectGroupJoin(models.Model): # aka. CoJo or CogJoin
    specify_model = datamodel.get_table('collectionobjectgroupjoin')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionobjectgroupjoinid')

    # Fields
    # TODO: Check if order, version, timestampcreated, and timestampmodified are needed
    isprimary = models.BooleanField(blank=True, null=True, unique=False, db_column='IsPrimary', db_index=False)
    issubstrate = models.BooleanField(blank=True, null=True, unique=False, db_column='IsSubstrate', db_index=False)
    precedence = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Precedence', db_index=False)
    order = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Order', db_index=False)
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index=False, default=0)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now)
    text1 = models.TextField(blank=True, null=True, unique=False, db_column='Text1', db_index=False)
    text2 = models.TextField(blank=True, null=True, unique=False, db_column='Text2', db_index=False)
    text3 = models.TextField(blank=True, null=True, unique=False, db_column='Text3', db_index=False)

    # Relationships: Many-to-Many
    collectionobjectgroupparent = models.ForeignKey('CollectionObjectGroup', db_column='CollectionObjectGroupParentID', related_name='collectionobjectgroupparents', null=False, on_delete=models.CASCADE)
    collectionobjectgroupchild = models.ForeignKey('CollectionObjectGroup', db_column='CollectionObjectGroupChildID', related_name='collectionobjectgroupchildren', null=True, on_delete=models.CASCADE)
    collectionobjectchild = models.ForeignKey('specify.CollectionObject', db_column='CollectionObjectChildID', related_name='collectionobjectchildren', null=True, on_delete=models.CASCADE)

    class Meta:
        db_table = 'collectionobjectgroupjoin'
        ordering = ()

    timestamptracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])
    save = partialmethod(custom_save)
