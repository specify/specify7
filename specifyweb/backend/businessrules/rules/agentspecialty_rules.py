from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.datamodel.models import Agentspecialty

from django.db.models import Max


@orm_signal_handler('pre_save', 'Agentspecialty')
def agentspecialty_pre_save(agentspecialty):
    if agentspecialty.id is None:
        if agentspecialty.ordernumber is None:
            # this should be atomic, but whatever
            others = Agentspecialty.objects.filter(agent=agentspecialty.agent)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max']
            agentspecialty.ordernumber = 0 if top is None else top + 1
