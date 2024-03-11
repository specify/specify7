from attr import has
from django.db import models
from django.utils import timezone

from model_utils import FieldTracker
from requests import get

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
        timestamp_override = kwargs.pop('timestamp_override', False)

        # Normal behavior is to update the timestamps automatically when saving.
        # If timestampcreated or timestampmodified have been edited, don't update them to the current time.
        # Also, if timestamp_override is True, don't update the timestamps.
        if not timestamp_override and \
           'timestampcreated' not in self.tracker.changed() and \
           'timestampmodified' not in self.tracker.changed():
            if not self.id:
                self.timestampcreated = timezone.now()
            
            self.timestampmodified = timezone.now()

        if hasattr(self, 'timestampcreated') and getattr(self, 'timestampcreated') is None:
            self.timestampcreated = timezone.now()
        if hasattr(self, 'timestampmodified') and getattr(self, 'timestampmodified') is None:
            self.timestampmodified = timezone.now()
        
        super().save(*args, **kwargs)