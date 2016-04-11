import logging

from specifyweb.specify.tree_extras import Tree

from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException

logger = logging.getLogger(__name__)

def is_tree(obj):
    try:
        for f in ('parent', 'definition', 'definitionitem'):
            obj._meta.get_field(f)
        return True
    except:
        return False

@orm_signal_handler('pre_save')
def tree_save(sender, obj):
    if not isinstance(obj, Tree): return
    logger.debug("running tree business rules on %s", obj)

    node = obj
    while node.parent is not None:
        node = node.parent
        if node.id == obj.id:
            raise BusinessRuleException('Tree object has self as ancestor.')

    if obj.parent.rankid >= obj.rankid:
        raise BusinessRuleException('Tree object has parent with rank not greater than itself.')

    for child in obj.children.all():
        if obj.rankid >= child.rankid:
            raise BusinessRuleException('Tree object rank is not greater than some of its children.')


@orm_signal_handler('pre_delete')
def cannot_delete_root_treedefitem(sender, obj):
    if hasattr(obj, 'treedef'): # is it a treedefitem?
        if sender.objects.get(id=obj.id).parent is None:
            raise BusinessRuleException("cannot delete root level tree definition item")

