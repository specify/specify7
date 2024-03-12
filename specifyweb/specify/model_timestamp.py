from datetime import datetime
from attr import has
from django.db import models
from django.utils import timezone
from django.db.models.signals import pre_save
from django.dispatch import receiver

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

    # obj.timestampcreated = datetime(1960, 1, 1, 0, 0, 0)
    cur_time = timezone.now()
    timestamp_fields = ['timestampcreated', 'timestampmodified']
    for field in timestamp_fields:
        if hasattr(obj, field):
            if not timestamp_override and field not in obj.tracker.changed() and \
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

# @receiver(pre_save, sender=YourModel)
def auto_timestamp_fields(sender, instance, **kwargs):
    cur_time = timezone.now()
    is_new_instance = not instance.id

    # if is_new_instance and not getattr(instance, 'timestampcreated', None):
    if getattr(instance, 'timestampcreated', None):
        instance.timestampcreated = cur_time

    if not getattr(instance, 'timestampmodified', None):
        instance.timestampmodified = cur_time
