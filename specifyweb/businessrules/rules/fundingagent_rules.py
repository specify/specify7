from django.db.models import Max
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Fundingagent


@orm_signal_handler('pre_save', 'Fundingagent')
def fundingagent_pre_save(fundingagent):
    if fundingagent.id is None:
        if fundingagent.ordernumber is None:
            # this should be atomic, but whatever
            others = Fundingagent.objects.filter(
                collectingtrip=fundingagent.collectingtrip)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max']
            fundingagent.ordernumber = 0 if top is None else top + 1
