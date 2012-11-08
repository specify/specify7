from django.db.models import signals, Max
from django.dispatch import receiver
from specify import models
from datetime import datetime

@receiver(signals.pre_save, sender=models.Collector)
def collector_pre_save(sender, **kwargs):
    collector = kwargs['instance']
    if collector.id is None:
        if collector.ordernumber is None:
            # this should be atomic, but whatever
            others = models.Collector.objects.filter(collectingevent=collector.collectingevent)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max'] or 0
            collector.ordernumber = top + 1

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

