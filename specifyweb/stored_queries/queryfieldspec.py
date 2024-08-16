import logging
import re
from collections import deque, namedtuple
from typing import NamedTuple, Tuple, Union, Optional

from sqlalchemy import sql, Table as SQLTable

from specifyweb.specify.models import datamodel
from specifyweb.specify.uiformatters import get_uiformatter
from . import models
from .query_ops import QueryOps
from ..specify.load_datamodel import Table, Field, Relationship

logger = logging.getLogger(__name__)

# The stringid is a structure consisting of three fields seperated by '.':
# (1) the join path to the specify field.
# (2) the name of the table containing the field.
# (3) name of the specify field.
STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

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

def make_table_list(fs):
    path = fs.join_path if not fs.join_path or fs.is_relationship() else fs.join_path[:-1]
    first = [str(fs.root_table.tableId)]

    def field_to_elem(field):
        related_model = datamodel.get_table(field.relatedModelName)
        if field.relatedModelName.lower() == field.name.lower():
            return str(related_model.tableId)
        else:
            return "%d-%s" % (related_model.tableId, field.name.lower())


    rest = [field_to_elem(f) for f in path if not isinstance(f, TreeRankQuery)]
    return ','.join(first + rest)

def make_tree_fieldnames(table: Table, reverse=False):
    mapping = {
        'ID': table.idFieldName.lower(),
        '': 'name' 
    }
    if reverse:
        return {value: key for (key, value) in mapping.items()}
    return mapping

def find_tree_and_field(table, fieldname: str):
    fieldname = fieldname.strip()
    if fieldname == '':
        return None, None
    tree_rank_and_field = fieldname.split(' ')
    mapping = make_tree_fieldnames(table)
    if len(tree_rank_and_field) == 1:
        return tree_rank_and_field[0], mapping[""]
    tree_rank, tree_field = tree_rank_and_field
    return tree_rank, mapping.get(tree_field, tree_field)

def make_stringid(fs, table_list):
    tree_ranks = [f.name for f in fs.join_path if isinstance(f, TreeRankQuery)]
    if tree_ranks:
        field_name = tree_ranks
        reverse = make_tree_fieldnames(fs.table, reverse=True)
        last_field_name = fs.join_path[-1].name
        field_name = " ".join([*field_name, reverse.get(last_field_name.lower(), last_field_name)])
    else:
        # BUG: Malformed previous stringids are rejected. they desrve it.
        field_name = (fs.join_path[-1].name if fs.join_path else '')
    if fs.date_part is not None and fs.date_part != "Full Date":
        field_name += 'Numeric' + fs.date_part
    return table_list, fs.table.name.lower(), field_name.strip()

class TreeRankQuery(Relationship):
    # FUTURE: used to remember what the previous value was. Useless after 6 retires
    original_field: str
    pass

FieldSpecJoinPath = Tuple[Union[Field, Relationship, TreeRankQuery]]

class QueryFieldSpec(namedtuple("QueryFieldSpec", "root_table root_sql_table join_path table date_part")):
    root_table: Table
    root_sql_table: SQLTable
    join_path: FieldSpecJoinPath
    table: Table
    date_part: Optional[str]

    @classmethod
    def from_path(cls, path_in, add_id=False):
        path = deque(path_in)
        root_table = datamodel.get_table(path.popleft(), strict=True)

        join_path = []
        node = root_table
        while len(path) > 0:
            fieldname = path.popleft()
            field = node.get_field(fieldname, strict=True)
            join_path.append(field)
            if field.is_relationship:
                node = datamodel.get_table(field.relatedModelName)
            else:
                assert len(path) == 0
                assert not add_id

        if add_id:
            join_path.append(node.idField)

        return cls(root_table=root_table,
                   root_sql_table=getattr(models, root_table.name),
                   join_path=tuple(join_path),
                   table=node,
                   date_part='Full Date' if (join_path and join_path[-1].is_temporal()) else None)


    @classmethod
    def from_stringid(cls, stringid, is_relation):
        path_str, table_name, field_name = STRINGID_RE.match(stringid).groups()
        path = deque(path_str.split(','))
        root_table = datamodel.get_table_by_id(int(path.popleft()))

        if is_relation:
            path.pop()

        join_path = []
        node = root_table
        for elem in path:
            try:
                tableid, fieldname = elem.split('-')
            except ValueError:
                tableid, fieldname = elem, None
            table = datamodel.get_table_by_id(int(tableid))
            field = node.get_field(fieldname) if fieldname else node.get_field(table.name)
            join_path.append(field)
            node = table

        extracted_fieldname, date_part = extract_date_part(field_name)
        field = node.get_field(extracted_fieldname, strict=False)

        if field is None: # try finding tree
            tree_rank_name, field = find_tree_and_field(node, extracted_fieldname)
            if tree_rank_name:
                tree_rank = TreeRankQuery(name=tree_rank_name)
                # doesn't make sense to query across ranks of trees. no, it doesn't block a theoretical query like family -> continent
                tree_rank.relatedModelName = node.name
                tree_rank.type = 'many-to-one'
                join_path.append(tree_rank)
                field = node.get_field(field or 'name') # to replicate 6 for now.

        if field is not None:
            join_path.append(field)
            if field.is_temporal() and date_part is None:
                date_part = "Full Date"

        result = cls(root_table=root_table,
                     root_sql_table=getattr(models, root_table.name),
                     join_path=tuple(join_path),
                     table=node,
                     date_part=date_part)

        logger.debug('parsed %s (is_relation %s) to %s. extracted_fieldname = %s',
                     stringid, is_relation, result, extracted_fieldname)
        return result

    def __init__(self, *args, **kwargs):
        valid_date_parts = ('Full Date', 'Day', 'Month', 'Year', None)
        assert self.is_temporal() or self.date_part is None
        if self.date_part not in valid_date_parts: raise AssertionError(
            f"Invalid date part '{self.date_part}'. Expected one of {valid_date_parts}",
            {"datePart" : self.date_part,
             "validDateParts" : str(valid_date_parts),
             "localizationKey" : "invalidDatePart"})

    def to_spquery_attrs(self):
        table_list = make_table_list(self)
        stringid = make_stringid(self, table_list)

        return {
            'tablelist': table_list,
            'stringid': '.'.join(stringid),
            'fieldname': stringid[-1],
            'isrelfld': self.is_relationship()
        }

    def to_stringid(self):
        table_list = make_table_list(self)
        return '.'.join(make_stringid(self, table_list))

    def get_field(self):
        try:
            return self.join_path[-1]
        except IndexError:
            return None

    def is_relationship(self):
        return self.get_field() is not None and self.get_field().is_relationship

    def is_temporal(self):
        field = self.get_field()
        return field is not None and field.is_temporal()

    def is_json(self):
        field = self.get_field()
        return field is not None and field.type == 'json'

    def build_join(self, query, join_path):
        return query.build_join(self.root_table, self.root_sql_table, join_path)

    def is_auditlog_obj_format_field(self, formatauditobjs):
            return formatauditobjs and self.join_path and self.table.name.lower() == 'spauditlog' and self.get_field().name.lower() in ['oldvalue','newvalue']

    def is_specify_username_end(self):
        # TODO: Add unit tests.
        return self.join_path and self.table.name.lower() == 'specifyuser' and self.join_path[-1].name == 'name'

    def needs_formatted(self):
        return len(self.join_path) == 0 or self.is_relationship()
    
    def apply_filter(self, query, orm_field, field, table, value=None, op_num=None, negate=False):
        no_filter = op_num is None or (self.get_field() is None)
        if not no_filter:
            if isinstance(value, QueryFieldSpec):
                _, other_field, _ = value.add_to_query(query.reset_joinpoint())
                uiformatter = None
                value = other_field
            else:
                uiformatter = field and get_uiformatter(query.collection, table.name, field.name)
                value = value

            op = QueryOps(uiformatter).by_op_num(op_num)

            f = op(orm_field, value)
            predicate = sql.not_(f) if negate else f
        else:
            predicate = None

        query = query.reset_joinpoint()
        return query, orm_field, predicate

    def add_to_query(self, query, value=None, op_num=None, negate=False, formatter=None, formatauditobjs=False):
        # print "############################################################################"
        # print "formatauditobjs " + str(formatauditobjs)
        # if self.get_field() is not None:
        #    print "field name " + self.get_field().name
        # print "is auditlog obj format field = " + str(self.is_auditlog_obj_format_field(formatauditobjs))
        # print "############################################################################"
        query, orm_field, field, table = self.add_spec_to_query(query, formatter)
        return self.apply_filter(query, orm_field, field, table, value, op_num, negate)

    def add_spec_to_query(self, query, formatter=None, aggregator=None, cycle_detector=[]):

        if self.get_field() is None:
            return (*query.objectformatter.objformat(
                query, self.root_sql_table, formatter), None, self.root_table)

        if self.is_relationship():
            # will be formatting or aggregating related objects
            if self.get_field().type == 'many-to-one':
                query, orm_model, table, field = self.build_join(query, self.join_path)
                query, orm_field = query.objectformatter.objformat(query, orm_model, formatter, cycle_detector)
            else:
                query, orm_model, table, field = self.build_join(query, self.join_path[:-1])
                orm_field = query.objectformatter.aggregate(query, self.get_field(), orm_model, aggregator or formatter, cycle_detector)
        else:
            query, orm_model, table, field = self.build_join(query, self.join_path)
            if isinstance(field, TreeRankQuery):
                tree_rank_idx = self.join_path.index(field)
                query, orm_field, field, table = query.handle_tree_field(orm_model, table, field.name, self.join_path[tree_rank_idx+1:], self)
            else:
                orm_field = getattr(orm_model, self.get_field().name)
                if field.type == "java.sql.Timestamp":
                    # Only consider the date portion of timestamp fields.
                    # This is to replicate the behavior of Sp6. It might
                    # make sense to condition this on whether there is a
                    # time component in the input value.
                    orm_field = sql.func.DATE(orm_field)

                if field.is_temporal() and self.date_part != "Full Date":
                    orm_field = sql.extract(self.date_part, orm_field)

        return query, orm_field, field, table
