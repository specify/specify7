from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException
from specifyweb.specify.models import Picklistitem

from django.db.models import Max

@orm_signal_handler('pre_save', 'Picklistitem')
def picklistitem_pre_save(picklistitem):
    if picklistitem.id is None:
        # adding an item to a picklist
        pl = picklistitem.picklist
        if pl.sizelimit is not None and pl.sizelimit > 0 and pl.picklistitems.count() + 1 > pl.sizelimit:
            raise BusinessRuleException("adding item to picklist {} would exceed size limit of {} items.".format(pl.name, pl.sizelimit))
