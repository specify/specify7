from attr import has
from django.db import models
from django.utils import timezone

from model_utils import FieldTracker

def pre_save_auto_timestamp_field_with_override(obj, *args, **kwargs):
    timestamp_override = kwargs.pop('timestamp_override', False)

    # Normal behavior is to update the timestamps automatically when saving.
    # If timestampcreated or timestampmodified have been edited, don't update them to the current time.
    # Also, if timestamp_override is True, don't update the timestamps.
    if not timestamp_override and \
        'timestampcreated' not in obj.tracker.changed() and \
        'timestampmodified' not in obj.tracker.changed():
        if not obj.id:
            obj.timestampcreated = timezone.now()
        
        obj.timestampmodified = timezone.now()

    obj = avoid_null_timestamp_fields(obj)

def avoid_null_timestamp_fields(obj):
    if hasattr(obj, 'timestampcreated') and getattr(obj, 'timestampcreated') is None:
        obj.timestampcreated = timezone.now()
    if hasattr(obj, 'timestampmodified') and getattr(obj, 'timestampmodified') is None:
        obj.timestampmodified = timezone.now()

# NOTE: This class is needed for when we get rid of dynamic model creation from Specify 6 datamodel.xml file.
class SpTimestampedModel(models.Model):
    """
    SpTimestampedModel(id, timestampcreated, timestampmodified)
    """

    timestampcreated = models.DateTimeField(db_column='TimestampCreated', default=timezone.now)
    timestampmodified = models.DateTimeField(db_column='TimestampModified', default=timezone.now)

    tracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        pre_save_auto_timestamp_field_with_override(self, *args, **kwargs)
        super().save(*args, **kwargs)