from django.db.models import signals
from django.dispatch import receiver
from specify import models
from datetime import datetime

@receiver(signals.pre_save, sender=models.Determination)
def determination_pre_save(sender, **kwargs):
    determination = kwargs['instance']
    if determination.id is None:
        if determination.version is None:
            determination.version = 0
        if not determination.collectionmemberid:
            determination.collectionmemberid = determination.collectionobject.collectionmemberid

@receiver(signals.pre_save, sender=models.Preparation)
def preparation_pre_save(sender, **kwargs):
    preparation = kwargs['instance']
    if preparation.id is None:
        if preparation.version is None:
            preparation.version = 0
        if not preparation.collectionmemberid:
            preparation.collectionmemberid = preparation.collectionobject.collectionmemberid

