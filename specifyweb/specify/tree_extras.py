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
            set_fullnames(self.__class__.__name__.lower(),
                          self.definition.treedefitems.count(),
                          self.definition.fullnamedirection == -1)


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

def CONCAT(exprs, separator=''):
    exprs = filter(lambda e: e != EMPTY, exprs)

    if len(exprs) == 0:
        return EMPTY
    elif len(exprs) == 1:
        return exprs[0]
    else:
        # use concat_ws because it skips nulls.
        return "concat_ws('{}', {})".format(separator, ', '.join(exprs))

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

def ID(table, index):
    return 't{}.{table}id'.format(index, table=table)

def NODENUMBER(index):
    return 't{}.nodenumber'.format(index)

def fullname_expr(depth, reverse):
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

def parent_joins(table, depth):
    return '\n'.join([
        "left join {table} t{1} on t{0}.parentid = t{1}.{table}id".format(j-1, j, table=table)
        for j in range(1, depth)
    ])

def definition_joins(table, depth):
    return '\n'.join([
        "left join {table}treedefitem d{0} on t{0}.{table}treedefitemid = d{0}.{table}treedefitemid".format(j, table=table)
        for j in range(depth)
    ])

def set_fullnames(table, depth, reverse=False, node_number_range=None):
    from django.db import connection
    cursor = connection.cursor()
    sql = (
        "update {table} t0\n"
        "{parent_joins}\n"
        "{definition_joins}\n"
        "set {set_expr}\n"
        "where t{root}.parentid is null\n"
        "and t0.acceptedid is null\n"
    ).format(
        root=depth-1,
        table=table,
        set_expr="t0.fullname = {}".format(fullname_expr(depth, reverse)),
        parent_joins=parent_joins(table, depth),
        definition_joins=definition_joins(table, depth),
    )
    if node_number_range is not None:
        sql += "and t0.nodenumber between %s and %s\n"
    logger.debug('fullname update sql:\n%s', sql)
    return cursor.execute(sql, node_number_range)

def validate_tree_numbering(table):
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute(
        "select count(*), count(distinct nodenumber), count(highestchildnodenumber)\n"
        "from {table}".format(table=table)
    )
    node_count, nn_count, hcnn_count = cursor.fetchone()
    assert node_count == nn_count == hcnn_count, \
        "found {} nodes but {} nodenumbers and {} highestchildnodenumbers" \
        .format(node_count, nn_count, hcnn_count)

    cursor.execute((
        "select count(*) from {table} t join {table} p on t.parentid = p.{table}id\n"
        "where t.nodenumber not between p.nodenumber and p.highestchildnodenumber\n"
    ).format(table=table))
    not_nested_count, = cursor.fetchone()
    assert not_nested_count == 0, \
        "found {} nodenumbers not nested by parent".format(not_nested_count)

def path_expr(table, depth):
    return CONCAT([ID(table, i) for i in reversed(range(depth))], ',')

def print_paths(table, depth):
    from django.db import connection
    cursor = connection.cursor()
    sql = "select t0.nodenumber as nn, {path} as path from {table} t0 {parent_joins} order by nn".format(
        table=table,
        path=path_expr(table, depth),
        parent_joins=parent_joins(table, depth),
    )
    cursor.execute(sql)
    for r in cursor.fetchall()[:100]:
        print r
    print sql

def renumber_tree(table):
    from django.db import connection
    cursor = connection.cursor()

    cursor.execute((
        "update {table} t\n"
        "join {table}treedefitem d on t.{table}treedefitemid = d.{table}treedefitemid\n"
        "set t.rankid = d.rankid\n"
    ).format(table=table))

    cursor.execute((
        "select count(*) from {table} t\n"
        "join {table} p on t.parentid = p.{table}id\n"
        "where t.rankid <= p.rankid\n"
    ).format(table=table))
    assert (0, ) == cursor.fetchone(), "bad tree structure"

    cursor.execute("select distinct rankid from {} order by rankid desc".format(table))
    ranks = [rank for (rank,) in cursor.fetchall()]
    depth = len(ranks)

    cursor.execute((
        "update {table} t\n"
        "join (select @rn := @rn + 1 as nn, p.id as id from \n"
        "         (select t0.{table}id as id, {path} as path\n"
        "          from {table} t0\n"
        "          {parent_joins}\n"
        "          order by path) p\n"
        ") r on t.{table}id = r.id\n"
        "join (select @rn := 0) rn\n"
        "set t.nodenumber = r.nn, t.highestchildnodenumber = r.nn\n"
    ).format(
        table=table,
        path=path_expr(table, depth),
        parent_joins=parent_joins(table, depth),
    ))

    for rank in ranks[1:]:
        cursor.execute((
            "update {table} t join (\n"
            "   select max(highestchildnodenumber) as hcnn, parentid\n"
            "   from {table} where rankid > %(rank)s group by parentid\n"
            ") as sub on sub.parentid = t.{table}id\n"
            "set highestchildnodenumber = hcnn where rankid = %(rank)s\n"
        ).format(table=table), {'rank': rank})
