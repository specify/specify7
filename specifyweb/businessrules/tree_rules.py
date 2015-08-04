from django.db.models import F, Q

from specifyweb.specify.lock_tables import lock_tables

from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException

def is_tree(obj):
    try:
        for f in ('parent', 'definition', 'definitionitem'):
            obj._meta.get_field(f)
        return True
    except:
        return False

@orm_signal_handler('pre_save')
def tree_save(sender, obj):
    if not is_tree(obj): return

    obj.rankid = obj.definitionitem.rankid
    obj.definition = obj.definitionitem.treedef

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

    if obj.id is None:
        adding_node(sender, obj)
        return

    prev_obj = sender.objects.get(id=obj.id)

    if prev_obj.parent != obj.parent:
        moving_node(sender, obj)
        return

@orm_signal_handler('pre_delete')
def cannot_delete_root_treedefitem(sender, obj):
    if hasattr(obj, 'treedef'): # is it a treedefitem?
        if sender.objects.get(id=obj.id).parent is None:
            raise BusinessRuleException("cannot delete root level tree definition item")


def open_interval(model, parent_node_number, size):
    """Open a space of given size in a tree model under the given parent.
    The insertion point will be directly after the parent_node_number.
    Returns the instertion point.
    """
    # All intervals to the right of parent node get shifted right by size.
    model.objects.filter(nodenumber__gt=parent_node_number).update(
        nodenumber=F('nodenumber')+size,
        highestchildnodenumber=F('highestchildnodenumber')+size,
    )
    # All intervals containing the insertion point get expanded by size.
    model.objects.filter(nodenumber__lte=parent_node_number, highestchildnodenumber__gte=parent_node_number)\
        .update(highestchildnodenumber=F('highestchildnodenumber')+size)

    return parent_node_number + 1

def move_interval(model, old_node_number, old_highest_child_node_number, new_node_number):
    """Adjust the node numbers to move an interval and all of its children
    to a new nodenumber range. There must be a gap of sufficient size
    at the destination. Leaves a gap at the old node number range.
    """
    delta = new_node_number - old_node_number
    model.objects.filter(nodenumber__gte=old_node_number, nodenumber__lte=old_highest_child_node_number)\
        .update(nodenumber=F('nodenumber')+delta, highestchildnodenumber=F('highestchildnodenumber')+delta)

def close_interval(model, node_number, size):
    """Close a gap where an interval was removed."""
    # All intervals containing the gap get reduced by size.
    model.objects.filter(nodenumber__lte=node_number, highestchildnodenumber__gte=node_number)\
        .update(highestchildnodenumber=F('highestchildnodenumber')-size)
    # All intervals to the right of node_number get shifted left by size.
    model.objects.filter(nodenumber__gt=node_number).update(
        nodenumber=F('nodenumber')-size,
        highestchildnodenumber=F('highestchildnodenumber')-size,
    )

def adding_node(sender, obj):
    with lock_tables(obj._meta.db_table):
        parent = sender.objects.get(id=obj.parent.id)
        insertion_point = open_interval(sender, parent.nodenumber, 1)
        obj.highestchildnodenumber = obj.nodenumber = insertion_point

def moving_node(sender, to_save):
    with lock_tables(sender._meta.db_table):
        current = sender.objects.get(id=to_save.id)
        size = current.highestchildnodenumber - current.nodenumber + 1
        new_parent = sender.objects.get(id=to_save.parent.id)

        insertion_point = open_interval(sender, new_parent.nodenumber, size)
        # node interval will have moved if it is to the right of the insertion point
        # so fetch again
        current = sender.objects.get(id=current.id)
        move_interval(sender, current.nodenumber, current.highestchildnodenumber, insertion_point)
        close_interval(sender, current.nodenumber, size)

        # update the nodenumbers in to_save so the new values are not overwritten.
        current = sender.objects.get(id=current.id)
        to_save.nodenumber = current.nodenumber
        to_save.highestchildnodenumber = current.highestchildnodenumber

def validate_tree(model):
    from django.db import connection
    cursor = connection.cursor()
    result = cursor.execute("""
    select
        t1.taxonid, t1.name, t1.nodenumber, t1.highestchildnodenumber, t1.parentid,
        t2.taxonid, t2.name, t2.nodenumber, t2.highestchildnodenumber, t2.parentid
    from taxon t1 join taxon t2 on t1.taxonid < t2.taxonid
    where not (
        t1.nodenumber <= t1.highestchildnodenumber
        and
        t2.nodenumber <= t2.highestchildnodenumber
        and
        t1.nodenumber != t2.nodenumber
        and case
          when t1.parentid = t2.taxonid then
             (t1.nodenumber > t2.nodenumber) and (t1.highestchildnodenumber <= t2.highestchildnodenumber)
          when t2.parentid = t1.taxonid then
             (t2.nodenumber > t1.nodenumber) and (t2.highestchildnodenumber <= t1.highestchildnodenumber)
          when t1.parentid = t2.parentid then
             (t1.nodenumber < t2.nodenumber and t1.highestchildnodenumber < t2.nodenumber)
           or
             (t2.nodenumber < t1.nodenumber and t2.highestchildnodenumber < t1.nodenumber)
          else true
        end
    )
    """)
    return result
