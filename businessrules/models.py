from django.db.models import signals, Max
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist
from specify import models

class BusinessRuleException(Exception):
    pass

def orm_signal_handler(signal, model=None):
    def _dec(rule):
        receiver_kwargs = {}
        if model is not None:
            receiver_kwargs['sender'] = getattr(models, model)
            def handler(sender, **kwargs):
                # since the rule knows what model the signal comes from
                # the sender value is redundant.
                rule(kwargs['instance'])
        else:
            def handler(sender, **kwargs):
                rule(sender, kwargs['instance'])

        return receiver(getattr(signals, signal), **receiver_kwargs)(handler)
    return _dec

@orm_signal_handler('post_delete')
def remove_from_recordsets(sender, obj):
    if not hasattr(sender, 'tableid'): return
    rsis = models.Recordsetitem.objects.filter(recordset__dbtableid=sender.tableid,
                                               recordid=obj.id)
    rsis.delete()

@orm_signal_handler('pre_save', 'Recordset')
def recordset_pre_save(recordset):
    if recordset.specifyuser_id is None:
        recordset.specifyuser = recordset.createdbyagent.specifyuser

@orm_signal_handler('pre_save', 'Collector')
def collector_pre_save(collector):
    if collector.id is None:
        if collector.ordernumber is None:
            # this should be atomic, but whatever
            others = models.Collector.objects.filter(collectingevent=collector.collectingevent)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max'] or 0
            collector.ordernumber = top + 1

@orm_signal_handler('pre_save', 'Collectionobject')
def collectionobject_pre_save(co):
    if co.collectionmemberid is None:
        co.collectionmemberid = co.collection.id

@orm_signal_handler('pre_save', 'Determination')
def determination_pre_save(det):
    if det.collectionmemberid is None:
        det.collectionmemberid = det.collectionobject.collectionmemberid

@orm_signal_handler('pre_delete', 'Agent')
def agent_delete_blocked_by_related_specifyuser(agent):
    try:
        models.Specifyuser.objects.get(agents=agent)
    except models.Specifyuser.DoesNotExist:
        return
    raise BusinessRuleException("agent cannot be deleted while associated with a specifyuser")

@orm_signal_handler('pre_save', 'Agent')
def agent_division_must_not_be_null(agent):
    if agent.division is None:
        raise BusinessRuleException("agent.division cannot be null")

@orm_signal_handler('pre_save', 'Agent')
def agent_types_other_and_group_do_not_have_addresses(agent):
    from specify.agent_types import agent_types
    if agent.agenttype is None:
        raise BusinessRuleException("agenttype cannot be null")
    if agent_types[agent.agenttype] in ('Other', 'Group'):
        agent.addresses.all().delete()

@orm_signal_handler('pre_save')
def set_rankid(sender, obj):
    if hasattr(obj, 'definitionitem'):
        obj.rankid = obj.definitionitem.rankid
        obj.definition = obj.definitionitem.treedef

    if hasattr(obj, 'parent') and obj.parent is not None:
        if obj.parent.rankid >= obj.rankid:
            raise BusinessRuleException('Tree object has parent with rank not greater than itself.')

@orm_signal_handler('pre_save', 'Address')
def at_most_one_primary_address_per_agent(address):
    if address.isprimary and address.agent is not None:
        address.agent.addresses.all().update(isprimary=False)

@orm_signal_handler('pre_save', 'Collector')
def division_cannot_be_null(collector):
    if collector.division is None:
        raise BusinessRuleException("collector.division cannot be null")

@orm_signal_handler('pre_save', 'Determination')
def only_one_determination_iscurrent(determination):
    if determination.iscurrent:
        determination.collectionobject.determinations.all().update(iscurrent=False)

@orm_signal_handler('pre_save', 'Discipline')
def create_taxontreedef_if_null(discipline):
    if discipline.id is not None:
        # only do this for new disciplines
        return
    if discipline.taxontreedef is None:
        discipline.taxontreedef = models.Taxontreedef.objects.create(
            name='Sample')

def make_uniqueness_rule(model_name, parent_field, unique_field):
    model = getattr(models, model_name)
    @orm_signal_handler('pre_save', model_name)
    def check_unique(instance):
        try:
            parent = getattr(instance, parent_field, None)
        except ObjectDoesNotExist:
            parent = None

        if  parent is None: return
        value = getattr(instance, unique_field)
        if value is None: return
        conflicts = model.objects.filter(**{
            parent_field: parent,
            unique_field: value})
        if instance.id is not None:
            conflicts = conflicts.exclude(id=instance.id)
        if conflicts.count() > 0:
            raise BusinessRuleException("%s must have unique %s in %s" % (model.__name__, unique_field, parent_field))
    return check_unique

UNIQUENESS_RULES = {
    'Accession': {
        'accessionnumber': ['division'],
        },
    'Accessionagent': {
        'agent': ['accession', 'repositoryagreement'],
        'role': ['accession', 'repositoryagreement'],
        },
    'Appraisal': {
        'appraisalnumber': ['accession'],
        },
    'Author': {
        'agent': ['referencework'],
        'ordernumber': ['referencework'],
        },
    'Borrowagent': {
        'role': ['borrow'],
        },
    'Collection': {
        'collectionname': ['discipline'],
        'code': ['discipline'],
        },
    'Collectionobject': {
        'catalognumber': ['collection'],
        },
    'Collector': {
        'agent': ['collectingevent'],
        },
    'Discipline': {
        'name': ['division'],
        },
    'Division': {
        'name': ['institution'],
        },
    'Gift': {
        'giftnumber': ['discipline'],
        },
    'Loan': {
        'loannumber': ['discipline'],
        },
    'Picklist': {
        'name': ['collection'],
        },
    'Preptype': {
        'name': ['collection'],
        },
    'Repositoryagreement': {
        'repositoryagreementnumber': ['division'],
        },
    }

uniqueness_rules = [make_uniqueness_rule(model, parent_field, unique_field)
                    for model, rules in UNIQUENESS_RULES.items()
                    for unique_field, parent_fields in rules.items()
                    for parent_field in parent_fields]
