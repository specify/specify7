from django.db.models import Max
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Pcrperson


@orm_signal_handler('pre_save', 'Pcrperson')
def collector_pre_save(pcr_person):
    if pcr_person.id is None:
        if pcr_person.ordernumber is None:
            # this should be atomic, but whatever
            others = Pcrperson.objects.filter(
                dnasequence=pcr_person.dnasequence)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max']
            pcr_person.ordernumber = 0 if top is None else top + 1
