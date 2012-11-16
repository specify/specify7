from django.db.models import signals, Max
from django.dispatch import receiver
from specify import models
from datetime import datetime

class BusinessRuleException(Exception):
    pass

@receiver(signals.pre_save, sender=models.Collector)
def collector_pre_save(sender, **kwargs):
    collector = kwargs['instance']
    if collector.id is None:
        if collector.ordernumber is None:
            # this should be atomic, but whatever
            others = models.Collector.objects.filter(collectingevent=collector.collectingevent)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max'] or 0
            collector.ordernumber = top + 1


@receiver(signals.pre_save, sender=models.Collectionobject)
def collectionobject_pre_save(sender, **kwargs):
    co = kwargs['instance']
    if co.collectionmemberid is None:
        co.collectionmemberid = co.collection.id

@receiver(signals.pre_save, sender=models.Determination)
def determination_pre_save(sender, **kwargs):
    det = kwargs['instance']
    if det.collectionmemberid is None:
        det.collectionmemberid = det.collectionobject.collectionmemberid

@receiver(signals.post_delete)
def remove_from_recordsets(sender, **kwargs):
    if not hasattr(sender, 'tableid'): return
    obj = kwargs['instance']
    rsis = models.Recordsetitem.objects.filter(recordset__dbtableid=sender.tableid,
                                               recordid=obj.id)
    rsis.delete()

@receiver(signals.pre_save, sender=models.Recordset)
def recordset_pre_save(sender, **kwargs):
    recordset = kwargs['instance']
    if recordset.specifyuser_id is None:
        recordset.specifyuser = recordset.createdbyagent.specifyuser

@receiver(signals.pre_save)
def set_rankid(sender, **kwargs):
    obj = kwargs['instance']
    if hasattr(obj, 'definitionitem'):
        obj.rankid = obj.definitionitem.rankid
        obj.definition = obj.definitionitem.treedef

    if hasattr(obj, 'parent') and obj.parent is not None:
        if obj.parent.rankid >= obj.rankid:
            raise BusinessRuleException('Tree object has parent with rank not greater than itself.')
