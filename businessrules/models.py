from django.db.models import signals, Max
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


@receiver(signals.pre_save, sender=models.Collector)
def collector_pre_save(sender, **kwargs):
    collector = kwargs['instance']
    if collector.id is None:
        if collector.version is None:
            collector.version = 0
        if collector.ordernumber is None:
            # this should be atomic, but whatever
            others = models.Collector.objects.filter(collectingevent=collector.collectingevent)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max'] or 0
            collector.ordernumber = top + 1

@receiver(signals.pre_save, sender=models.Collectionobject)
def collectionobject_pre_save(sender, **kwargs):
    collectionobject = kwargs['instance']
    if collectionobject.id is None:
        if collectionobject.version is None:
            collectionobject.version = 0
        if collectionobject.collectionmemberid is None:
            collectionobject.collectionmemberid = collectionobject.collection.id
