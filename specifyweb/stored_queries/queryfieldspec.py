from dataclasses import fields
import logging
import re
from collections import namedtuple, deque
from typing import NamedTuple, Optional, Tuple

from sqlalchemy import sql

from specifyweb.specify.load_datamodel import Field, Table
from specifyweb.specify.models import datamodel
from specifyweb.specify.uiformatters import get_uiformatter
from specifyweb.specify.geo_time import query_co_in_time_range
from . import models
from .query_ops import QueryOps

logger = logging.getLogger(__name__)

# The stringid is a structure consisting of three fields seperated by '.':
# (1) the join path to the specify field.
# (2) the name of the table containing the field.
# (3) name of the specify field.
STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

# A date field name can be suffixed with 'numericday', 'numericmonth' or 'numericyear'
# to request a filter on that subportion of the date.
DATE_PART_RE = re.compile(r'(.*)((NumericDay)|(NumericMonth)|(NumericYear))$')

# Pull out author or groupnumber field from taxon query fields.
TAXON_FIELD_RE = re.compile(r'(.*) ((Author)|(groupNumber))$')

# Pull out geographyCode field from geography query fields.
GEOGRAPHY_FIELD_RE = re.compile(r'(.*) ((geographyCode))$')

# Look to see if we are dealing with a tree node ID.
TREE_ID_FIELD_RE = re.compile(r'(.*) (ID)$')

def extract_date_part(fieldname):
    match = DATE_PART_RE.match(fieldname)
    if match:
        fieldname, date_part = match.groups()[:2]
        date_part = date_part.replace('Numeric', '')
    else:
        date_part = None
    return fieldname, date_part

def make_table_list(fs):
    path = fs.join_path if fs.tree_rank or not fs.join_path or fs.is_relationship() else fs.join_path[:-1]
    first = [str(fs.root_table.tableId)]

    def field_to_elem(field):
        related_model = datamodel.get_table(field.relatedModelName)
        if field.relatedModelName.lower() == field.name.lower():
            return str(related_model.tableId)
        else:
            return "%d-%s" % (related_model.tableId, field.name.lower())


    rest = [field_to_elem(f) for f in path]
    return ','.join(first + rest)

def make_stringid(fs, table_list):
    field_name = fs.tree_rank or (fs.join_path[-1].name if fs.join_path else '')
    if fs.date_part is not None and fs.date_part != "Full Date":
        field_name += 'Numeric' + fs.date_part
    return table_list, fs.table.name.lower(), field_name

# class QueryFieldSpec(NamedTuple):
#     root_table: 'Table'
#     root_sql_table: 'SQLTable' # type: ignore
#     join_path: Tuple['Field', ...]
#     table: 'Table'
#     date_part: Optional[str]
#     tree_rank: Optional[str]
#     tree_field: Optional[str]

#     @classmethod
#     def create(cls, root_table, root_sql_table, join_path, table, date_part=None, tree_rank=None, tree_field=None):
#         # Create a new QueryFieldSpec instance
#         instance = cls(
#             root_table=root_table,
#             root_sql_table=root_sql_table,
#             join_path=join_path,
#             table=table,
#             date_part=date_part,
#             tree_rank=tree_rank,
#             tree_field=tree_field
#         )
#         # Validate the instance
#         instance.validate()
#         return instance

#     def validate(self):
#         valid_date_parts = ('Full Date', 'Day', 'Month', 'Year', None)
#         assert self.is_temporal() or self.date_part is None
#         if self.date_part not in valid_date_parts:
#             raise AssertionError(
#                 f"Invalid date part '{self.date_part}'. Expected one of {valid_date_parts}",
#                 {"datePart": self.date_part,
#                  "validDateParts": str(valid_date_parts),
#                  "localizationKey": "invalidDatePart"})
class QueryFieldSpec(namedtuple("QueryFieldSpec", "root_table root_sql_table join_path table date_part tree_rank tree_field")):
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
                   date_part='Full Date' if (join_path and join_path[-1].is_temporal()) else None,
                   tree_rank=None,
                   tree_field=None)


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
        tree_rank = tree_field = None
        if field is None:
            tree_id_match = TREE_ID_FIELD_RE.match(extracted_fieldname)
            if tree_id_match:
                tree_rank = tree_id_match.group(1)
                tree_field = 'ID'
            else:
                tree_field_match = TAXON_FIELD_RE.match(extracted_fieldname) if node is datamodel.get_table('Taxon') else GEOGRAPHY_FIELD_RE.match(extracted_fieldname) if node is datamodel.get_table('Geography') else None
                if tree_field_match:
                    tree_rank = tree_field_match.group(1)
                    tree_field = tree_field_match.group(2)
                else:
                    tree_rank = extracted_fieldname if extracted_fieldname else None
        else:
            join_path.append(field)
            if field.is_temporal() and date_part is None:
                date_part = "Full Date"

        result = cls(root_table=root_table,
                     root_sql_table=getattr(models, root_table.name),
                     join_path=tuple(join_path),
                     table=node,
                     date_part=date_part,
                     tree_rank=tree_rank,
                     tree_field=tree_field)

        logger.debug('parsed %s (is_relation %s) to %s. extracted_fieldname = %s',
                     stringid, is_relation, result, extracted_fieldname)
        return result

    def __init__(self, *args, **kwargs):
        self.validate()

    def validate(self):
        valid_date_parts = ('Full Date', 'Day', 'Month', 'Year', None)
        assert self.is_temporal() or self.date_part is None
        if self.date_part not in valid_date_parts:
            raise AssertionError(
                f"Invalid date part '{self.date_part}'. Expected one of {valid_date_parts}",
                {"datePart": self.date_part,
                 "validDateParts": str(valid_date_parts),
                 "localizationKey": "invalidDatePart"})

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
        return self.tree_rank is None and self.get_field() is not None and self.get_field().is_relationship

    def is_temporal(self):
        field = self.get_field()
        return field is not None and field.is_temporal()

    def is_json(self):
        field = self.get_field()
        return field is not None and field.type == 'json'

    def build_join(self, query, join_path):
        return query.build_join(self.root_table, self.root_sql_table, join_path)

    def is_auditlog_obj_format_field(self, formatauditobjs):
        if not formatauditobjs or self.get_field() is None:
            return False
        else:
            return self.get_field().name.lower() in ['oldvalue','newvalue']

    def is_specify_username_end(self):
       return len(self.join_path) > 2 and self.join_path[-1].name == 'name' and self.join_path[-2].is_relationship and self.join_path[-2].relatedModelName == 'SpecifyUser'

    def apply_filter(self, query, orm_field, field, table, value=None, op_num=None, negate=False):
        no_filter = op_num is None or (self.tree_rank is None and self.get_field() is None)
        if not no_filter:
            if isinstance(value, QueryFieldSpec):
                _, other_field, _ = value.add_to_query(query.reset_joinpoint())
                uiformatter = None
                value = other_field
            else:
                uiformatter = field and get_uiformatter(query.collection, table.name, field.name)
                value = value

            query_op = QueryOps(uiformatter)
            op = query_op.by_op_num(op_num)
            if query_op.is_preprocessed(op_num):
                # f = op(orm_field, value, query)
                new_query = op(orm_field, value, query)
                query = query._replace(query=new_query)
                f = None
            else:
                f = op(orm_field, value) # TODO: Handle when orm_field is a function instead of a field
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

        if self.tree_rank is None and self.get_field() is None:
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
            if self.tree_rank is not None:
                query, orm_field = query.handle_tree_field(orm_model, table, self.tree_rank, self.tree_field)
            else:
                try:
                    field_name = self.get_field().name
                    orm_field = getattr(orm_model, field_name)
                except AttributeError:
                    # TODO: Cleanup once an implementation for virtual QB fields is decieded on
                    # if self.is_virtual_field(field.name):
                    # if hasattr(self, 'is_virtual_field') and self.is_virtual_field(field.name):
                    # if table.is_virtual_field(self.get_field().name):
                    if table.is_virtual_field(field.name) and table.name == 'CollectionObject' and field_name == 'age': # TODO: Create map for all special cases
                        # orm_field = orm_model.catalogNumber
                        orm_field = orm_model.collectionObjectId
                    # TODO: Remove once an implementation for virtual QB fields is decieded on
                    # elif table.is_virtual_field(field.name):
                    #     # TODO: Handle SQLAlchemy virtual field creation
                    #     # NOTE: This might not be the right place to call query_co_in_time_range, maybe find a better place
                    #     orm_field = query_co_in_time_range # Look at me, I'm a function now!
                    #     # raise NotImplementedError("Virtual field not implemented yet")
                    #     # query_co_in_time_range(query.query, start_time, end_time, session=None, require_full_overlap=False)
                    else:
                        raise

                if field.type == "java.sql.Timestamp":
                    # Only consider the date portion of timestamp fields.
                    # This is to replicate the behavior of Sp6. It might
                    # make sense to condition this on whether there is a
                    # time component in the input value.
                    orm_field = sql.func.DATE(orm_field)

                if field.is_temporal() and self.date_part != "Full Date":
                    orm_field = sql.extract(self.date_part, orm_field)

        return query, orm_field, field, table