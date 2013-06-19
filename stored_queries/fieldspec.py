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
    'is_relation',
    'op_num',
    'value',
    'negate',
    'display',
    'sort_type',
    'spqueryfieldid'])):

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
                   is_relation  = field.isRelFld,
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
            query = query.outerjoin(aliased, get_field(table, fieldname))
            table = aliased
        return query, table

    def add_to_query(self, query, no_filter=False, collection=None):
        using_subquery = False
        no_filter = no_filter or self.value == ''

        query, table = self.build_join(query)

        insp = inspect(table)
        if is_tree(insp) and not is_regular_field(insp, self.field_name):
            query, field, using_subquery = handle_tree_field(query, self.field_name, table, insp, no_filter, collection)

        elif self.date_part is not None:
            field = extract(self.date_part, getattr(table, self.field_name))

        elif self.is_relation:
            field = getattr(table, table._id)

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

def get_tree_def(query, collection, tree_name):
    if tree_name == 'Storage':
        return collection.discipline.division.institution.storagetreedef_id
    else:
        treedef_field = "%streedef_id" % tree_name.lower()
        return  getattr(collection.discipline, treedef_field)


def handle_tree_field(query, field_name, node, insp, no_filter, collection):
    treedef_column = insp.class_.__name__ + 'TreeDefID'
    treedefitem = orm.aliased( models.classes[insp.class_.__name__ + 'TreeDefItem'] )

    rank_p = (treedefitem.name == field_name)

    ancestor = orm.aliased(node)

    if collection is not None:
        treedef = get_tree_def(query, collection, insp.class_.__name__)
        same_tree_p = getattr(ancestor, treedef_column) == treedef
        rank_p = ancestor.rankId == query.session.query(treedefitem.rankId).filter(rank_p).one()[0]
        join_treedefitem = False
    else:
        same_tree_p = getattr(node, treedef_column) == getattr(ancestor, treedef_column)
        join_treedefitem = True

    ancestor_p = sql.and_(
        same_tree_p,
        node.nodeNumber.between(ancestor.nodeNumber, ancestor.highestChildNodeNumber))

    if False:#no_filter:
        subquery = orm.Query(ancestor.name).with_session(query.session)
        if join_treedefitem:
            subquery = subquery.join(treedefitem)
        field = subquery\
                .filter(ancestor_p, rank_p)\
                .limit(1).as_scalar()
        using_subquery = True
    else:
        query = query.join(ancestor, ancestor_p)
        if join_treedefitem:
            query = query.join(treedefitem)
        query = query.filter(rank_p)
        field = ancestor.name
        using_subquery = False

    return query, field, using_subquery

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

def get_field(table, fieldname):
    fieldname = fieldname.lower()
    for attrname in dir(inspect(table).class_):
        if attrname.lower() == fieldname:
            return getattr(table, attrname)
