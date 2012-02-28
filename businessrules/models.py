from django.db.models import signals
from django.dispatch import receiver
from specify import models
from datetime import datetime

@receiver(signals.pre_save, sender=models.Determination)
def determination_pre_save(sender, **kwargs):
    determination = kwargs['instance']
    if determination.id is None:
        if determination.timestampcreated is None:
            determination.timestampcreated = datetime.now()
        if determination.version is None:
            determination.version = 0
        if not determination.collectionmemberid:
            determination.collectionmemberid = determination.collectionobject.collectionmemberid

