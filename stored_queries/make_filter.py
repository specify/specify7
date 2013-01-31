import re
from django.db.models.fields import FieldDoesNotExist
from django.db.models import Q

from specify import models
from query_ops import QueryOps
from date_part_filter import make_date_part_filter

query_ops = QueryOps(Q)

def is_tree(table):
    try:
        for field in  ('definition', 'definitionitem', 'nodenumber', 'highestchildnodenumber'):
            table._meta.get_field(field)
    except FieldDoesNotExist:
        return False
    else:
        return True

def get_treedefitems_by_rank(table, key):
    rank = key.split('__')[-1]
    Treedefitem = getattr(models, table.__name__ + 'treedefitem')
    return Treedefitem.objects.filter(name__iexact=rank)

def get_subtrees(tree, treedefitems, op, value):
    q = op('name', value) & Q(definitionitem__in=treedefitems)
    return tree.objects.filter(q)

def make_subtree_filter(key, subtrees):
    tree_lookup = '__'.join(key.split('__')[:-1])
    def make_q(subtree):
        return Q(**{
            tree_lookup + '__nodenumber__range': (
                subtree.nodenumber, subtree.highestchildnodenumber)})

    return reduce(lambda p,q: p|q, map(make_q, subtrees), Q())

DATE_PART_RE = re.compile(r'(.*)((numericday)|(numericmonth)|(numericyear))$')

def extract_date_part(key):
    match = DATE_PART_RE.match(key)
    if match:
        key, date_part = match.groups()[:2]
        date_part = date_part.replace('numeric', '')
    else:
        date_part = None
    return key, date_part

def make_filter(model, table, key, query_field):
    op_num, value, negate = [getattr(query_field, a) for a in ('operstart', 'startvalue', 'isnot')]
    op = query_ops.by_op_num(op_num)

    if isinstance(value, basestring) and len(value.strip()) == 0:
        return Q()

    treedefitems = get_treedefitems_by_rank(table, key) if is_tree(table) else None

    if treedefitems is not None and treedefitems.count() > 0:
        subtrees = get_subtrees(table, treedefitems, op, value)
        q = make_subtree_filter(key, subtrees)
    else:
        key, date_part = extract_date_part(key)
        if date_part is not None:
            q = make_date_part_filter(date_part, op_num, key, value)
        else:
            q = op(key, value)

    return ~q if negate else q
