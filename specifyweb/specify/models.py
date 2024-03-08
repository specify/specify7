"""
Sets up Django ORM with the Specify datamodel
"""

from .build_models import build_models
from .check_versions import check_versions
from .datamodel import datamodel
from django.db import models
from django.utils import timezone
from model_utils import FieldTracker

class SpTimestampedModel(models.Model):
    """
    SpTimestampedModel(id, timestampcreated, timestampmodified)
    """

    timestampcreated = models.DateTimeField(db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(db_column='TimestampModified')

    tracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # timestamp_override = kwargs.pop('timestamp_override', False)

        if 'timestampcreated' not in self.tracker.changed() and \
           'timestampmodified' not in self.tracker.changed():
            if not self.id:
                self.timestampcreated = timezone.now()
            
            self.timestampmodified = timezone.now()
        
        super().save(*args, **kwargs)

models_by_tableid = build_models(__name__, datamodel)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in list(models_by_tableid.values()))

#check_versions(Spversion)

# clean up namespace
del build_models, check_versions
