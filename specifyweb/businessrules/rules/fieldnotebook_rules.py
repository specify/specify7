from django.db.models import Max
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Fieldnotebookpageset


@orm_signal_handler('pre_save', 'Fieldnotebookpageset')
def collector_pre_save(pageset):
    if pageset.id is None:
        if pageset.ordernumber is None:
            # this should be atomic, but whatever
            others = Fieldnotebookpageset.objects.filter(
                fieldnotebook=pageset.fieldnotebook)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max']
            pageset.ordernumber = 0 if top is None else top + 1
