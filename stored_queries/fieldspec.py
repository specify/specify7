import re
from django.db.models.fields import FieldDoesNotExist

from specify import models

from make_filter import make_filter

class FieldSpec(object):
    # The stringid is a structure consisting of three fields seperated by '.':
    # (1) the join path to the specify field.
    # (2) the name of the table containing the field.
    # (3) name of the specify field.
    STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

    def __init__(self, field):
        path, table_name, field_name = self.STRINGID_RE.match(field.stringid).groups()
        path_elems = path.split(',')

        path_fields = []
        node = models.models_by_tableid[int(path_elems[0])]
        for elem in path_elems[1:]:
            # the elements of the stringid path consist of the join tableid with
            # optionally the join field name.
            try:
                tableid, fieldname = elem.split('-')
            except ValueError:
                tableid, fieldname = elem, None

            table = models.models_by_tableid[int(tableid)]
            if fieldname is None:
                # if the join field name is not given, the field should have
                # the same name as the table
                try:
                    fieldname = table.__name__.lower()
                    node._meta.get_field(fieldname)
                except FieldDoesNotExist:
                    raise Exception("couldn't find related field for table %s in %s" % (table.__name__, node))

            path_fields.append(fieldname)
            node = table

        key = '__'.join(path_fields + field_name.split('.')).lower()
        key, self.date_part = extract_date_part(key)
        key, self.treedefitems = get_treedefitems(node, key)

        self.table = node
        self.key = key
        self.spqueryfield = field

    def make_filter(self):
        return make_filter(self.table, self.key, self.spqueryfield, self.treedefitems, self.date_part)

def get_treedefitems(table, key):
    """Try to find tree definition levels that have a named rank matching the
    final element of the lookup key. These are used for subtree filters.
    """
    if not is_tree(table):
        return key, None

    rank = key.split('__')[-1]
    tree_key = '__'.join(key.split('__')[:-1])

    Treedefitem = getattr(models, table.__name__ + 'treedefitem')
    treedefitems = Treedefitem.objects.filter(name__iexact=rank)
    return (tree_key, treedefitems) if treedefitems.count() > 0 else (key, None)

def is_tree(table):
    """True if the django model, table, has fields consistent with being a tree."""
    try:
        for field in  ('definition', 'definitionitem', 'nodenumber', 'highestchildnodenumber'):
            table._meta.get_field(field)
    except FieldDoesNotExist:
        return False
    else:
        return True

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

