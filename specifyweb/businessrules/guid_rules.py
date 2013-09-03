from uuid import uuid4
from .orm_signal_handler import orm_signal_handler

@orm_signal_handler('pre_save')
def set_guids(sender, obj):
    if not hasattr(obj, 'guid'): return
    if obj.guid is None or obj.guid.strip() == "":
        obj.guid = str(uuid4())
