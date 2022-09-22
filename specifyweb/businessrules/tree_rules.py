import logging

from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException

logger = logging.getLogger(__name__)

@orm_signal_handler('pre_delete')
def cannot_delete_root_treedefitem(sender, obj):
    if hasattr(obj, 'treedef'): # is it a treedefitem?
        if sender.objects.get(id=obj.id).parent is None:
            raise BusinessRuleException({
                "type": "DELETE_TREE_ROOT",
                "table": obj.__class__.__name__,
                "message": "cannot delete root level tree definition item"
            })

