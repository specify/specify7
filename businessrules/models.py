from django.db.models import signals, Max
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist
from specify import models

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

@receiver(signals.pre_delete, sender=models.Agent)
def agent_delete_blocked_by_related_specifyuser(sender, **kwargs):
    agent = kwargs['instance']
    try:
        models.Specifyuser.objects.get(agents=agent)
    except models.Specifyuser.DoesNotExist:
        return
    raise BusinessRuleException("agent cannot be deleted while associated with a specifyuser")

@receiver(signals.pre_save, sender=models.Agent)
def agent_types_other_and_group_do_not_have_addresses(sender, **kwargs):
    from specify.agent_types import agent_types
    agent = kwargs['instance']
    if agent_types[agent.agenttype] in ('Other', 'Group'):
        agent.addresses.all().delete()

@receiver(signals.pre_save)
def set_rankid(sender, **kwargs):
    obj = kwargs['instance']
    if hasattr(obj, 'definitionitem'):
        obj.rankid = obj.definitionitem.rankid
        obj.definition = obj.definitionitem.treedef

    if hasattr(obj, 'parent') and obj.parent is not None:
        if obj.parent.rankid >= obj.rankid:
            raise BusinessRuleException('Tree object has parent with rank not greater than itself.')

@receiver(signals.pre_delete, sender=models.Accession)
def accession_no_delete_if_has_collection_objects(sender, **kwargs):
    accession = kwargs['instance']
    if models.Collectionobject.objects.filter(accession=accession).count() > 0:
        raise BusinessRuleException("can't delete accession with associated collection objects")

def make_uniqueness_rule(model, parent_field, unique_field):
    @receiver(signals.pre_save, sender=model)
    def check_unique(sender, **kwargs):
        instance = kwargs['instance']

        try:
            parent = getattr(instance, parent_field, None)
        except ObjectDoesNotExist:
            parent = None

        if  parent is None: return
        conflicts = model.objects.filter(**{
            parent_field: parent,
            unique_field: getattr(instance, unique_field)})
        if instance.id is not None:
            conflicts = conflicts.exclude(id=instance.id)
        if conflicts.count() > 0:
            raise BusinessRuleException("%s must have unique %s in %s" % (model.__name__, unique_field, parent_field))
    return check_unique

UNIQUENESS_RULES = {
    models.Accession: {
        'accessionnumber': ['division'],
        },
    models.Accessionagent: {
        'agent': ['accession', 'repositoryagreement'],
        'role': ['accession', 'repositoryagreement'],
        },
    models.Appraisal: {
        'appraisalnumber': ['accession'],
        },
    models.Author: {
        'agent': ['referencework'],
        },
    models.Borrowagent: {
        'role': ['borrow'],
        },
    models.Collection: {
        'collectionname': ['discipline'],
        },
    models.Collectionobject: {
        'catalognumber': ['collection'],
        },
    models.Collector: {
        'agent': ['collectingevent'],
        },
    models.Discipline: {
        'name': ['division'],
        },
    models.Division: {
        'name': ['institution'],
        },
    models.Gift: {
        'giftnumber': ['discipline'],
        },
    models.Loan: {
        'loannumber': ['discipline'],
        },
    models.Picklist: {
        'name': ['collection'],
        },
    models.Preptype: {
        'name': ['collection'],
        },
    models.Repositoryagreement: {
        'repositoryagreementnumber': ['division'],
        },
    }

uniqueness_rules = [make_uniqueness_rule(model, parent_field, unique_field)
                    for model, rules in UNIQUENESS_RULES.items()
                    for unique_field, parent_fields in rules.items()
                    for parent_field in parent_fields]
