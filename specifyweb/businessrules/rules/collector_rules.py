from django.db.models import Max
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Collector
from specifyweb.businessrules.exceptions import BusinessRuleException


@orm_signal_handler('pre_save', 'Collector')
def collector_pre_save(collector):
    if collector.id is None:
        if collector.ordernumber is None:
            # this should be atomic, but whatever
            others = Collector.objects.filter(
                collectingevent=collector.collectingevent)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max']
            collector.ordernumber = 0 if top is None else top + 1

    if collector.agent is not None:
        collector.division = collector.agent.division
    else:
        raise BusinessRuleException("collector must be associated with an agent",
                                    {"table": "Collector",
                                     "fieldName": "agent",
                                     "collectorid": collector.id})
