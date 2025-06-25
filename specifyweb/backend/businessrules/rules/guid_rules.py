from uuid import uuid4
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler

from specifyweb.specify.models import Taxon, Geography


@orm_signal_handler('pre_save')
def set_guids(sender, obj):
    if not hasattr(obj, 'guid'):
        return

    # See https://github.com/specify/specify7/issues/4243#issuecomment-1836990623
    if sender in (Taxon, Geography):
        return
    if obj.guid is None or obj.guid.strip() == "":
        obj.guid = str(uuid4())
