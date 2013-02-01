import re
from django.db.models.fields import FieldDoesNotExist
from django.db.models import Q

from specify import models
from query_ops import QueryOps
from date_part_filter import make_date_part_filter

query_ops = QueryOps(Q)

def is_tree(table):
    """True if the django model, table, has fields consistent with being a tree."""
    try:
        for field in  ('definition', 'definitionitem', 'nodenumber', 'highestchildnodenumber'):
            table._meta.get_field(field)
    except FieldDoesNotExist:
        return False
    else:
        return True

def get_treedefitems_by_rank(table, key):
    """Try to find tree definition levels that have a named rank matching the
    final element of the lookup key. These are used for subtree filters.
    """
    rank = key.split('__')[-1]
    Treedefitem = getattr(models, table.__name__ + 'treedefitem')
    return Treedefitem.objects.filter(name__iexact=rank)

def get_subtrees(tree, treedefitems, op, value):
    """Look for nodes in tree at the levels given by treedefitems that
    match the predicate, op, with the given value. These will be the
    root nodes of subtrees to match.
    """
    q = op('name', value) & Q(definitionitem__in=treedefitems)
    return tree.objects.filter(q)

def make_subtree_filter(key, subtrees):
    """Return a filter that matches items falling within any of the
    subtrees rooted at the values in subtrees.
    """
    tree_lookup = '__'.join(key.split('__')[:-1])
    def make_q(subtree):
        """Make a filter that uses node numbers to match descendants of subtree."""
        return Q(**{
            tree_lookup + '__nodenumber__range': (
                subtree.nodenumber, subtree.highestchildnodenumber)})

    # return the union of the filters for each subtree
    return reduce(lambda p,q: p|q, map(make_q, subtrees), Q())

# A date field name can be suffixed with 'numericday', 'numericmonth' or 'numericyear'
# to request a filter on that subportion of the date.
DATE_PART_RE = re.compile(r'(.*)((numericday)|(numericmonth)|(numericyear))$')

def extract_date_part(key):
    """Process a lookup key into the field lookup and the date part if the key
    represents a partial date filter on a date field. Returns None for the date
    part if the lookup is not a partial date predicate.
    """
    match = DATE_PART_RE.match(key)
    if match:
        key, date_part = match.groups()[:2]
        date_part = date_part.replace('numeric', '')
    else:
        date_part = None
    return key, date_part

def make_filter(table, key, query_field):
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

    # if the table we are filtering on is a tree, try to get tree levels to
    # make subtree filters. if the key doesn't correspond to a tree level,
    # the result will be empty
    treedefitems = get_treedefitems_by_rank(table, key) if is_tree(table) else None

    if treedefitems is not None and treedefitems.count() > 0:
        subtrees = get_subtrees(table, treedefitems, op, value)
        q = make_subtree_filter(key, subtrees)
    else:
        key, date_part = extract_date_part(key)
        if date_part is not None:
            # if the key includes a date part (year, month, day), then
            # we have to handle it separately since django filters
            # don't support arbitrary predicates on subparts of dates
            q = make_date_part_filter(date_part, op_num, key, value)
        else:
            q = op(key, value)

    return ~q if negate else q
