from django.db import models
from django.utils import timezone
from django.conf import settings

from model_utils import FieldTracker

def pre_save_auto_timestamp_field_with_override(obj, timestamp_override=None):
    # Normal behavior is to update the timestamps automatically when saving.
    # If timestampcreated or timestampmodified have been edited, don't update them to the current time.
    cur_time = timezone.now()
    timestamp_override = (
        timestamp_override
        if timestamp_override is not None
        else getattr(settings, "TIMESTAMP_SAVE_OVERRIDE", False)
    )
    timestamp_fields = ['timestampcreated', 'timestampmodified']
    for field in timestamp_fields:
        if hasattr(obj, field) and hasattr(obj, 'timestamptracker'):
            if not timestamp_override and field not in obj.timestamptracker.changed() and \
                (not obj.id or not getattr(obj, field)):
                setattr(obj, field, cur_time)
            elif timestamp_override and not getattr(obj, field):
                setattr(obj, field, cur_time)

    avoid_null_timestamp_fields(obj)

def avoid_null_timestamp_fields(obj):
    cur_time = timezone.now()
    if hasattr(obj, 'timestampcreated') and getattr(obj, 'timestampcreated') is None:
        obj.timestampcreated = cur_time
    if hasattr(obj, 'timestampmodified') and getattr(obj, 'timestampmodified') is None:
        obj.timestampmodified = cur_time

# NOTE: This class is needed for when we get rid of dynamic model creation from Specify 6 datamodel.xml file.
# NOTE: Currently in sperate file to avoid circular import.
class SpTimestampedModel(models.Model):
    """
    SpTimestampedModel(id, timestampcreated, timestampmodified)
    """

    timestampcreated = models.DateTimeField(db_column='TimestampCreated', default=timezone.now)
    timestampmodified = models.DateTimeField(db_column='TimestampModified', default=timezone.now)

    timestamptracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        pre_save_auto_timestamp_field_with_override(self)
        super().save(*args, **kwargs)
