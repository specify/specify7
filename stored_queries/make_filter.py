from django.db.models import Q

from query_ops import QueryOps
from date_part_filter import make_date_part_filter

query_ops = QueryOps(Q)

def get_subtrees(tree, treedefitems, op, value):
    """Look for nodes in tree at the levels given by treedefitems that
    match the predicate, op, with the given value. These will be the
    root nodes of subtrees to match.
    """
    q = op('name', value) & Q(definitionitem__in=treedefitems)
    return tree.objects.filter(q).values('nodenumber', 'highestchildnodenumber')

def make_subtree_filter(key, subtrees):
    """Return a filter that matches items falling within any of the
    subtrees rooted at the values in subtrees.
    """
    def make_q(subtree):
        """Make a filter that uses node numbers to match descendants of subtree."""
        return Q(**{
            key + '__nodenumber__range': (
                subtree['nodenumber'], subtree['highestchildnodenumber'])})

    # return the union of the filters for each subtree
    qs = map(make_q, subtrees)
    always_false_q = Q(id__isnull=True)
    return reduce(lambda p,q: p|q, qs, always_false_q)

def make_filter(table, key, query_field, treedefitems, date_part):
    """Returns a django Q object that implements a filter defined in a Spqueryfield.

    table - the django model object for the table containing the filtered field
    key - the django lookup from the root table to the field
    query_field - the Spquerfield object
    """
    op_num, value, negate = [getattr(query_field, a) for a in ('operstart', 'startvalue', 'isnot')]
    op = query_ops.by_op_num(op_num)

    # if the predicate value is empty, then we don't filter on this field
    if isinstance(value, basestring) and len(value.strip()) == 0:
        return Q()

    if treedefitems is not None:
        subtrees = get_subtrees(table, treedefitems, op, value)
        q = make_subtree_filter(key, subtrees)
    elif date_part is not None:
        # if the key includes a date part (year, month, day), then
        # we have to handle it separately since django filters
        # don't support arbitrary predicates on subparts of dates
        q = make_date_part_filter(date_part, op_num, key, value)
    else:
        q = op(key, value)

    return ~q if negate else q

