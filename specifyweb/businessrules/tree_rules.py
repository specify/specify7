from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException

@orm_signal_handler('pre_save')
def set_rankid(sender, obj):
    if hasattr(obj, 'definitionitem'):
        obj.rankid = obj.definitionitem.rankid
        obj.definition = obj.definitionitem.treedef

    if hasattr(obj, 'parent'):
        node = obj
        while node.parent is not None:
            node = node.parent
            if node.id == obj.id:
                raise BusinessRuleException('Tree object has self as ansector.')
        if obj.parent.rankid >= obj.rankid:
            raise BusinessRuleException('Tree object has parent with rank not greater than itself.')

    if hasattr(obj, 'children'):
        for child in obj.children.all():
            if obj.rankid >= child.rankid:
                raise BusinessRuleException('Tree object rank is not greater than some of its children.')

@orm_signal_handler('pre_delete')
def cannot_delete_root_treedefitem(sender, obj):
    if hasattr(obj, 'treedef'): # is it a treedefitem?
        if sender.objects.get(id=obj.id).parent is None:
            raise BusinessRuleException("cannot delete root level tree definition item")

