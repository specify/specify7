from django.db.models import Max
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify import models

# This check is provided to support the Specify 6.8.01
# datamodel (schema version 2.9). When support for that
# version is dropped it can be removed.
if hasattr(models, 'Determiner'):

    @orm_signal_handler('pre_save', 'Determiner')
    def determiner_pre_save(determiner):
        if determiner.id is None:
            if determiner.ordernumber is None:
                # this should be atomic, but whatever
                others = models.Determiner.objects.filter(
                    determination=determiner.determination)
                top = others.aggregate(Max('ordernumber'))['ordernumber__max']
                determiner.ordernumber = 0 if top is None else top + 1
