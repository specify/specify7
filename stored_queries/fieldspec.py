import re

import models

from query_ops import QueryOps
from sqlalchemy import orm
from sqlalchemy.sql.expression import extract

query_ops = QueryOps()

class FieldSpec(object):
    # The stringid is a structure consisting of three fields seperated by '.':
    # (1) the join path to the specify field.
    # (2) the name of the table containing the field.
    # (3) name of the specify field.
    STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

    def __init__(self, **kwargs):
        for arg, value in kwargs.items():
            setattr(self, arg, value)

    @classmethod
    def from_spqueryfield(cls, field):
        path, table_name, field_name = cls.STRINGID_RE.match(field.stringid).groups()
        path_elems = path.split(',')

        join_path = []
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
                    getattr(node, fieldname)
                except AttributeError:
                    raise Exception("couldn't find related field for table %s in %s" % (table.__name__, node))

            join_path.append(fieldname)
            node = table

        field_name, date_part = extract_date_part(field_name)

        return cls(field_name   = field_name,
                   date_part    = date_part,
                   table        = node,
                   join_path    = join_path,
                   op_num       = field.operStart,
                   value        = field.startValue,
                   negate       = field.isNot,
                   spqueryfield = field)

    def add_to_query(self, query):
        op = query_ops.by_op_num(self.op_num)

        treedefitems = get_treedefitems(self.table, self.field_name)

        if treedefitems is not None:
            tree = self.table
            ancestor = orm.aliased(tree)
            ancestor_p = tree.nodeNumber.between(ancestor.nodeNumber, ancestor.highestChildNodeNumber)
            ancestor_name = ancestor.name
            q = query.\
                join(*self.join_path, aliased=True).\
                join(ancestor, ancestor_p).\
                filter(op(ancestor_name, self.value)).\
                filter(ancestor.rankId.in_(treedefitems)).\
                reset_joinpoint()
            return q, ancestor_name

        elif self.date_part is not None:
            table = orm.aliased(self.table)
            date_part = extract(self.date_part, getattr(table, self.field_name))
            q = query.\
                join(*self.join_path, aliased=True).\
                filter(op(date_part, self.value)).\
                reset_joinpoint()
            return q, date_part

        else:
            table = orm.aliased(self.table)
            field = getattr(table, self.field_name)
            q = query.\
                join(*self.join_path, aliased=True).\
                filter(op(field, self.value)).\
                reset_joinpoint()
            return q, field

def get_treedefitems(table, rank):
    if not is_tree(table) or rank in table.__dict__:
        return None

    TreeDefItem = models.classes[table.__name__ + 'TreeDefItem']
    treedefitems = orm.Query(TreeDefItem.rankId).filter(TreeDefItem.name == rank)
    return treedefitems

def is_tree(cls):
    return all(field in cls.__dict__
               for field in ('definition', 'definitionItem', 'nodeNumber', 'highestChildNodeNumber'))

# A date field name can be suffixed with 'numericday', 'numericmonth' or 'numericyear'
# to request a filter on that subportion of the date.
DATE_PART_RE = re.compile(r'(.*)((numericday)|(numericmonth)|(numericyear))$')

def extract_date_part(fieldname):
    match = DATE_PART_RE.match(fieldname)
    if match:
        fieldname, date_part = match.groups()[:2]
        date_part = date_part.replace('numeric', '')
    else:
        date_part = None
    return fieldname, date_part
