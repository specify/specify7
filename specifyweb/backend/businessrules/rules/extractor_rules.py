from django.db.models import Max
from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.datamodel.models import Extractor


@orm_signal_handler('pre_save', 'Extractor')
def collector_pre_save(extractor):
    if extractor.id is None:
        if extractor.ordernumber is None:
            # this should be atomic, but whatever
            others = Extractor.objects.filter(
                dnasequence=extractor.dnasequence)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max']
            extractor.ordernumber = 0 if top is None else top + 1
