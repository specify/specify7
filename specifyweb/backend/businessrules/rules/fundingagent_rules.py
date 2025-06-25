from django.db.models import Max
from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.businessrules.exceptions import BusinessRuleException
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
    
    if fundingagent.isprimary and fundingagent.collectingtrip is not None:
        fundingagent.collectingtrip.fundingagents.all().update(isprimary=False)

    if fundingagent.agent is not None:
        fundingagent.division = fundingagent.agent.division
    else:
        raise BusinessRuleException("fundingAgent must be associated with an agent",
                                    {"table": "FundingAgent",
                                     "fieldName": "agent",
                                     "fundingAgentId": fundingagent.id})
