import logging
logger = logging.getLogger(__name__)

from django.db import models
from django.db.models import F, Q

from specifyweb.specify.lock_tables import lock_tables

class Tree(models.Model):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.rankid = self.definitionitem.rankid
        self.definition = self.definitionitem.treedef

        prev_self = None if self.id is None else self.__class__.objects.select_for_update().get(id=self.id)

        if prev_self is None:
            try:
                adding_node(self.__class__, self)
            except: # node numbering is borked.
                logger.warn("couldn't update tree node numbers when adding node")
                self.nodenumber = self.highestchildnodenumber = None

        else:
            if prev_self.parent != self.parent:
                try:
                    moving_node(self.__class__, self)
                except: # node numbering is borked.
                    logger.warn("couldn't update tree node numbers when moving node")
                    self.nodenumber = self.highestchildnodenumber = None

        super(Tree, self).save(*args, **kwargs)

        if (prev_self is None
            or prev_self.name != self.name
            or prev_self.definitionitem != self.definitionitem
            or prev_self.parent != self.parent
        ):
            set_fullnames_recursive(self.__class__.__name__.lower(), self.nodenumber, self.definition.fullnamedirection == -1)


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


def fullname_expr(depth, reverse):
    EMPTY = "''"
    TRUE = "true"
    FALSE = "false"

    def OR(exprs):
        if len(exprs) == 0:
            return FALSE
        elif len(exprs) == 1:
            return exprs[0]
        else:
            return '({})'.format(' or '.join(exprs))

    def IF(if_expr, then_expr, else_expr=EMPTY):
        if if_expr == TRUE:
            return then_expr
        elif if_expr == FALSE:
            return else_expr
        else:
            return 'if({}, {}, {})'.format(if_expr, then_expr, else_expr)

    def CONCAT(exprs):
        exprs = filter(lambda e: e != EMPTY, exprs)

        if len(exprs) == 0:
            return EMPTY
        elif len(exprs) == 1:
            return exprs[0]
        else:
            # use concat_ws because it skips nulls.
            return "concat_ws('', {})".format(', '.join(exprs))

    def NAME(index):
        return 't{}.name'.format(index)

    def IN_NAME(index):
        return 'd{}.isinfullname'.format(index)

    def SEPARATOR(index):
        return 'd{}.fullnameseparator'.format(index)

    def BEFORE(index):
        return 'd{}.textbefore'.format(index)

    def AFTER(index):
        return 'd{}.textafter'.format(index)

    fullname = CONCAT([
        IF(IN_NAME(i),
           CONCAT([
               BEFORE(i),
               NAME(i),
               AFTER(i),
               IF( # include separator if anything comes after
                OR([
                    IN_NAME(j)
                    # if going from leaf to root, "after" means farther down, j = i+1 -> depth-1.
                    # if going from root to leaf, "after" means farther up, j = i-1 -> 0.
                    for j in (range(i+1, depth) if reverse else reversed(range(i)))
                ]),
                SEPARATOR(i)
               )
           ]))
        # forward is root to leaf
        # reverse is leaf to root
        # leaf is i = 0, root is i = depth-1
        for i in (range(depth) if reverse else reversed(range(depth)))
    ])

    # if node is not in fullname, its fullname is just its name
    return IF(IN_NAME(0), fullname, NAME(0))

def fullname_joins(table, depth):
    return '\n'.join([
        "join {table} t{1} on t{0}.parentid = t{1}.{table}id".format(j-1, j, table=table)
        for j in range(1, depth)
    ] + [
        "join {table}treedefitem d{0} on t{0}.{table}treedefitemid = d{0}.{table}treedefitemid".format(j, table=table)
        for j in range(depth)
    ])

def set_fullnames(table, depth, node_number_range, reverse):
    from django.db import connection
    cursor = connection.cursor()
    sql = """
update {table} t0
{joins}
set {set_expr}
where t{root}.parentid is null
and t0.acceptedid is null
""".format(
        root=depth-1,
        table=table,
        set_expr="t0.fullname = {}".format(fullname_expr(depth, reverse)),
        joins=fullname_joins(table, depth),
    )
    if node_number_range is not None:
        sql += "and t0.nodenumber between %s and %s\n"
    logger.debug('fullname update sql: %s', sql)
    return cursor.execute(sql, node_number_range)

def set_fullnames_recursive(table, node_number=None, reverse=False):
    logger.info('setting fullnames with root node_number %s', node_number)
    from django.db import connection
    cursor = connection.cursor()

    if node_number is not None:
        cursor.execute("""
        select highestchildnodenumber from {table}
        where nodenumber = %s
        """.format(table=table), [node_number])
        highest_node_number = cursor.fetchone()[0]
        node_number_range = (node_number, highest_node_number)

        cursor.execute("""
        select count(*) from {table}
        where %s between nodenumber and highestchildnodenumber
        """.format(table=table), [node_number])
        depth = cursor.fetchone()[0]
    else:
        node_number_range = None
        depth = 1

    while True:
        rows_updated = set_fullnames(table, depth, node_number_range, reverse)
        if rows_updated < 1: break
        depth += 1
