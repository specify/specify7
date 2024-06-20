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

class CollectionObjectGroup(models.Model):
    specify_model = datamodel.get_table('collectionobjectgroup')

    # ID Field
    id = models.AutoField(primary_key=True, db_column='collectionobjectgroupid')

    # Fields
    name = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Name', db_index=False)
    description = models.TextField(blank=True, null=True, unique=False, db_column='Description', db_index=False)
    igsn = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='IGSN', db_index=False)
    guid = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='GUID', db_index=False)
    order = models.CharField(blank=True, max_length=255, null=True, unique=False, db_column='Order', db_index=False)
    number = models.SmallIntegerField(blank=True, null=True, unique=False, db_column='Number', db_index=False)
    version = models.IntegerField(blank=True, null=True, unique=False, db_column='Version', db_index=False, default=0)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)
    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now)

    # Relationships: Many-to-One
    createdbyagent = models.ForeignKey('Agent', db_column='CreatedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    modifiedbyagent = models.ForeignKey('Agent', db_column='ModifiedByAgentID', related_name='+', null=True, on_delete=protect_with_blockers)
    collection = models.ForeignKey('Collection', db_column='CollectionID', related_name='collectionobjectgroups', null=False, on_delete=protect_with_blockers)

    class Meta:
        db_table = 'collectionobjectgroup'
        ordering = ()

    timestamptracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])
    save = partialmethod(custom_save)