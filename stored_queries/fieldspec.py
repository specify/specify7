import re
from collections import namedtuple

import models

from query_ops import QueryOps
from sqlalchemy import orm, inspect, sql, not_
from sqlalchemy.sql.expression import extract

query_ops = QueryOps()

class FieldSpec(namedtuple('FieldSpec', [
    'field_name',
    'date_part',
    'root_table',
    'join_path',
    'op_num',
    'value',
    'negate',
    'display',
    'sort_type',
    'spqueryfieldid'])):
    __slots__ = ()

    # The stringid is a structure consisting of three fields seperated by '.':
    # (1) the join path to the specify field.
    # (2) the name of the table containing the field.
    # (3) name of the specify field.
    STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

    @classmethod
    def from_spqueryfield(cls, field, value=None):
        path, table_name, field_name = cls.STRINGID_RE.match(field.stringId).groups()
        path_elems = path.split(',')
        root_table = models.models_by_tableid[int(path_elems[0])]

        join_path = []
        node = root_table
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
                tablename = inspect(table).class_.__name__.lower()
                fields = inspect(node).class_.__dict__
                for fieldname in fields:
                    if fieldname.lower() == tablename: break
                else:
                    raise Exception("couldn't find related field for table %s in %s" % (tablename, node))

            join_path.append((fieldname, table))
            node = table

        field_name, date_part = extract_date_part(field_name)

        return cls(field_name   = field_name,
                   date_part    = date_part,
                   root_table   = root_table,
                   join_path    = join_path,
                   op_num       = field.operStart,
                   value        = field.startValue if value is None else value,
                   negate       = field.isNot,
                   display      = field.isDisplay,
                   sort_type    = field.sortType,
                   spqueryfieldid = field.spQueryFieldId)

    def build_join(self, query):
        table = self.root_table
        for fieldname, next_table in self.join_path:
            aliased = orm.aliased(next_table)
            query = query.join(aliased, getattr(table, fieldname))
            table = aliased
        return query, table

    def add_to_query(self, query, no_filter=False):
        using_subquery = False
        no_filter = no_filter or self.value == ''

        query, table = self.build_join(query)

        insp = inspect(table)
        if is_tree(insp) and not is_regular_field(insp, self.field_name):
            field, using_subquery = handle_tree_field(query, self.field_name, table, insp)

        elif self.date_part is not None:
            field = extract(self.date_part, getattr(table, self.field_name))

        else:
            field = getattr(table, self.field_name)

        if not no_filter:
            op = query_ops.by_op_num(self.op_num)
            f = op(field, self.value)
            if self.negate: f = not_(f)
            query = query.having(f) if using_subquery else query.filter(f)

        if not using_subquery:
            query = query.reset_joinpoint()

        return query, field

def handle_tree_field(query, field_name, node, insp):
    treedef_column = insp.class_.__name__ + 'TreeDefID'

    ancestor = orm.aliased(node)
    ancestor_p = sql.and_(
        getattr(node, treedef_column) == getattr(ancestor, treedef_column),
        node.nodeNumber.between(ancestor.nodeNumber, ancestor.highestChildNodeNumber)
        )

    treedefitem = orm.aliased( models.classes[insp.class_.__name__ + 'TreeDefItem'] )
    rank_p = (treedefitem.name == field_name)
    field = orm.Query(ancestor.name).with_session(query.session)\
            .join(treedefitem)\
            .filter(ancestor_p, rank_p)\
            .limit(1).as_scalar()
    return field, True

def is_regular_field(insp, field_name):
    return field_name in insp.class_.__dict__

def is_tree(insp):
    fields = insp.class_.__dict__
    return all(field in fields for field in ('definition', 'definitionItem', 'nodeNumber', 'highestChildNodeNumber'))

# A date field name can be suffixed with 'numericday', 'numericmonth' or 'numericyear'
# to request a filter on that subportion of the date.
DATE_PART_RE = re.compile(r'(.*)((NumericDay)|(NumericMonth)|(NumericYear))$')

def extract_date_part(fieldname):
    match = DATE_PART_RE.match(fieldname)
    if match:
        fieldname, date_part = match.groups()[:2]
        date_part = date_part.replace('Numeric', '')
    else:
        date_part = None
    return fieldname, date_part
