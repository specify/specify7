from attr import has
from django.db import models
from django.utils import timezone

from model_utils import FieldTracker

def pre_save_auto_timestamp_field_with_override(obj, *args, **kwargs):
    timestamp_override = kwargs.pop('timestamp_override', False)

    # Normal behavior is to update the timestamps automatically when saving.
    # If timestampcreated or timestampmodified have been edited, don't update them to the current time.
    # Also, if timestamp_override is True, don't update the timestamps.
    # if not timestamp_override and \
    #     'timestampcreated' not in obj.tracker.changed() and \
    #     'timestampmodified' not in obj.tracker.changed():
    #     if not obj.id:
    #         obj.timestampcreated = timezone.now()
        
    #     obj.timestampmodified = timezone.now()

    cur_time = timezone.now()
    if not timestamp_override:
        if hasattr(obj, 'timestampcreated') and 'timestampcreated' not in obj.tracker.changed() and not obj.id:
            obj.timestampcreated = cur_time
        if hasattr(obj, 'timestampmodified') and  'timestampmodified' not in obj.tracker.changed():
            obj.timestampmodified = cur_time
    else:
        if hasattr(obj, 'timestampcreated') and not obj.timestampcreated:
            obj.timestampcreated = cur_time
        if hasattr(obj, 'timestampmodified') and not obj.timestampmodified:
            obj.timestampmodified = cur_time

    avoid_null_timestamp_fields(obj)

def avoid_null_timestamp_fields(obj):
    if hasattr(obj, 'timestampcreated') and getattr(obj, 'timestampcreated') is None:
        obj.timestampcreated = timezone.now()
    if hasattr(obj, 'timestampmodified') and getattr(obj, 'timestampmodified') is None:
        obj.timestampmodified = timezone.now()

class SpTimestampManager(models.Manager):
    def create(self, **kwargs):
        manual_datetime = kwargs.get('timestampcreated', timezone.now())
        # Explicitly set timestamp fields if provided, or use the current time
        kwargs['timestampcreated'] = manual_datetime
        kwargs['timestampmodified'] = kwargs.get('timestampmodified', manual_datetime)
        
        obj = self.model(**kwargs)
        # Call the full_clean to trigger validation if needed
        # obj.full_clean()
        # Save the object to trigger FieldTracker
        obj.save()
        return obj

# NOTE: This class is needed for when we get rid of dynamic model creation from Specify 6 datamodel.xml file.
# NOTE: Currently in sperate file to avoid circular import.
class SpTimestampedModel(models.Model):
    """
    SpTimestampedModel(id, timestampcreated, timestampmodified)
    """

    timestampcreated = models.DateTimeField(db_column='TimestampCreated', default=timezone.now)
    timestampmodified = models.DateTimeField(db_column='TimestampModified', default=timezone.now)

    tracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])
    objects = SpTimestampManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        pre_save_auto_timestamp_field_with_override(self, *args, **kwargs)
        super().save(*args, **kwargs)
