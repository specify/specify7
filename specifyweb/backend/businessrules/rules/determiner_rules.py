from django.db.models import Max
from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.datamodel import models

# Determiners were added in the Specify 6.8.01
# datamodel (schema version 2.9) update. 
# orm_signal_handler skips rules if the model does not exist 
# on the primary datamodel object

@orm_signal_handler('pre_save', 'Determiner')
def determiner_pre_save(determiner):
    if determiner.id is None:
        if determiner.ordernumber is None:
            # this should be atomic, but whatever
            others = models.Determiner.objects.filter(
                determination=determiner.determination)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max']
            determiner.ordernumber = 0 if top is None else top + 1
    
    if determiner.isprimary and determiner.determination is not None:
        determiner.determination.determiners.all().update(isprimary=False)
