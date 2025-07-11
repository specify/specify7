import logging
import re
from collections import namedtuple, deque
from typing import Union, Optional, Tuple

# from specifyweb.specify.utils import get_parent_cat_num_inheritance_setting
from sqlalchemy import sql, Table as SQLTable
from sqlalchemy.orm.query import Query

from specifyweb.specify.load_datamodel import Field, Table
from specifyweb.specify.models import Collectionobject, Collectionobjectgroupjoin, datamodel
from specifyweb.specify.uiformatters import get_uiformatter
from specifyweb.specify.utils import get_cat_num_inheritance_setting
from specifyweb.stored_queries.models import CollectionObject as sq_CollectionObject

from . import models
from .query_ops import QueryOps
from ..specify.load_datamodel import Table, Field, Relationship

logger = logging.getLogger(__name__)

# The stringid is a structure consisting of three fields seperated by '.':
# (1) the join path to the specify field.
# (2) the name of the table containing the field.
# (3) name of the specify field.
STRINGID_RE = re.compile(r"^([^\.]*)\.([^\.]*)\.(.*)$")

# A date field name can be suffixed with 'numericday', 'numericmonth' or 'numericyear'
# to request a filter on that subportion of the date.
DATE_PART_RE = re.compile(r"(.*)((NumericDay)|(NumericMonth)|(NumericYear))$")

# Pull out author or groupnumber field from taxon query fields.
TAXON_FIELD_RE = re.compile(r"(.*) ((Author)|(groupNumber))$")

# Pull out geographyCode field from geography query fields.
GEOGRAPHY_FIELD_RE = re.compile(r"(.*) ((geographyCode))$")

# Look to see if we are dealing with a tree node ID.
TREE_ID_FIELD_RE = re.compile(r"(.*) (ID)$")

# Precalculated fields that are not in the database. Map from table name to field name.
PRECALCULATED_FIELDS = {
    "CollectionObject": "age",
}


def extract_date_part(fieldname):
    match = DATE_PART_RE.match(fieldname)
    if match:
        fieldname, date_part = match.groups()[:2]
        date_part = date_part.replace("Numeric", "")
    else:
        date_part = None
    return fieldname, date_part


def make_table_list(fs):
    path = (
        fs.join_path if not fs.join_path or fs.is_relationship() else fs.join_path[:-1]
    )
    first = [str(fs.root_table.tableId)]

    def field_to_elem(field):
        related_model = datamodel.get_table(field.relatedModelName)
        if field.relatedModelName.lower() == field.name.lower():
            return str(related_model.tableId)
        else:
            return "%d-%s" % (related_model.tableId, field.name.lower())

    rest = [field_to_elem(f) for f in path if not isinstance(f, TreeRankQuery)]
    return ",".join(first + rest)


def make_tree_fieldnames(table: Table, reverse=False):
    mapping = {"ID": table.idFieldName.lower(), "": "name"}
    if reverse:
        return {value: key for (key, value) in mapping.items()}
    return mapping


def find_tree_and_field(table: Table, fieldname: str):
    fieldname = fieldname.strip()
    if fieldname == "":
        return None, None
    
    tree_rank_and_field = fieldname.split(" ")
    mapping = make_tree_fieldnames(table)

    if len(tree_rank_and_field) == 1:
        return tree_rank_and_field[0], mapping[""]
    
    # Handles case where rank name contains spaces
    field = tree_rank_and_field[-1]
    if table.get_field(field) or field in mapping:
        tree_rank = " ".join(tree_rank_and_field[:-1])
    else:
        # Edge case: rank name contains spaces, and no field exists (ie: fullname query)
        tree_rank = " ".join(tree_rank_and_field)
        field = ""
    
    return tree_rank, mapping.get(field, field)


def make_stringid(fs, table_list):
    tree_ranks = [f.name for f in fs.join_path if isinstance(f, TreeRankQuery)]
    if tree_ranks:
        field_name = tree_ranks
        reverse = make_tree_fieldnames(fs.table, reverse=True)
        last_field_name = fs.join_path[-1].name
        field_name = " ".join(
            [*field_name, reverse.get(last_field_name.lower(), last_field_name)]
        )
    else:
        # BUG: Malformed previous stringids are rejected. they desrve it.
        field_name = fs.join_path[-1].name if fs.join_path else ""
    if fs.date_part is not None and fs.date_part != "Full Date":
        field_name += "Numeric" + fs.date_part
    return table_list, fs.table.name.lower(), field_name.strip()


class TreeRankQuery(Relationship):
    # FUTURE: used to remember what the previous value was. Useless after 6 retires
    original_field: str
    # This is used to query a particular treedef. If this is none, all treedefs are searched, otherwise a specific treedef is searched.
    treedef_id: Optional[int]
    # Yeah this can be inferred from treedef_id but doing it this way avoids a database lookup because we already fetch it once.
    treedef_name: Optional[str]

    def __hash__(self):
        return hash((TreeRankQuery, self.relatedModelName, self.name))

    def __eq__(self, value):
        return (
            isinstance(value, TreeRankQuery)
            and value.name == self.name
            and value.relatedModelName == self.relatedModelName
        )

    @staticmethod
    def create(name, table_name, treedef_id=None, treedef_name=None):
        obj = TreeRankQuery(
            name=name,
            relatedModelName=table_name,
            type="many-to-one",
            column=datamodel.get_table_strict(table_name).idFieldName
        )
        obj.treedef_id = treedef_id
        obj.treedef_name = treedef_name
        return obj

    def get_workbench_name(self):
        from specifyweb.workbench.upload.treerecord import RANK_KEY_DELIMITER
        # Treedef id included to make it easier to pass it to batch edit
        return f"{self.treedef_name}{RANK_KEY_DELIMITER}{self.name}{RANK_KEY_DELIMITER}{self.treedef_id}"


QueryNode = Union[Field, Relationship, TreeRankQuery]
FieldSpecJoinPath = tuple[QueryNode]


class QueryFieldSpec(
    namedtuple(
        "QueryFieldSpec",
        "root_table root_sql_table join_path table date_part tree_rank tree_field",
    )
):
    root_table: Table
    root_sql_table: SQLTable
    join_path: FieldSpecJoinPath
    table: Table
    date_part: Optional[str]
    tree_rank: Optional[str]
    tree_field: Optional[str]

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

        return cls(
            root_table=root_table,
            root_sql_table=getattr(models, root_table.name),
            join_path=tuple(join_path),
            table=node,
            date_part=(
                "Full Date" if (join_path and join_path[-1].is_temporal()) else None
            ),
            tree_rank=None,
            tree_field=None,
        )

    @classmethod
    def from_stringid(cls, stringid, is_relation):
        path_str, table_name, field_name = STRINGID_RE.match(stringid).groups()
        path = deque(path_str.split(","))
        root_table = datamodel.get_table_by_id(int(path.popleft()))

        if is_relation:
            path.pop()

        join_path = []
        node = root_table
        for elem in path:
            try:
                tableid, fieldname = elem.split("-")
            except ValueError:
                tableid, fieldname = elem, None
            table = datamodel.get_table_by_id(int(tableid))
            field = (
                node.get_field(fieldname) if fieldname else node.get_field(table.name)
            )
            join_path.append(field)
            node = table

        extracted_fieldname, date_part = extract_date_part(field_name)
        field = node.get_field(extracted_fieldname, strict=False)

        tree_rank_name = None
        if field is None:  # try finding tree
            tree_rank_name, field = find_tree_and_field(node, extracted_fieldname)
            if tree_rank_name:
                tree_rank = TreeRankQuery.create(
                    tree_rank_name,
                    node.name
                )
                # doesn't make sense to query across ranks of trees. no, it doesn't block a theoretical query like family -> continent
                join_path.append(tree_rank)
                assert field is not None
                field = node.get_field(field)

        if field is not None:
            join_path.append(field)
            if field.is_temporal() and date_part is None:
                date_part = "Full Date"

        result = cls(
            root_table=root_table,
            root_sql_table=getattr(models, root_table.name),
            join_path=tuple(join_path),
            table=node,
            date_part=date_part,
            tree_rank=tree_rank_name,
            tree_field=field,
        )

        logger.debug(
            "parsed %s (is_relation %s) to %s. extracted_fieldname = %s",
            stringid,
            is_relation,
            result,
            extracted_fieldname,
        )
        return result

    def __init__(self, *args, **kwargs):
        self.validate()

    def get_first_tree_rank(self):
        for node in enumerate(list(self.join_path)):
            if isinstance(node[1], TreeRankQuery):
                return node
        return None

    def contains_tree_rank(self):
        return self.get_first_tree_rank() is not None

    def validate(self):
        valid_date_parts = ("Full Date", "Day", "Month", "Year", None)
        assert self.is_temporal() or self.date_part is None
        if self.date_part not in valid_date_parts:
            raise AssertionError(
                f"Invalid date part '{self.date_part}'. Expected one of {valid_date_parts}",
                {
                    "datePart": self.date_part,
                    "validDateParts": str(valid_date_parts),
                    "localizationKey": "invalidDatePart",
                },
            )

    def to_spquery_attrs(self):
        table_list = make_table_list(self)
        stringid = make_stringid(self, table_list)

        return {
            "tablelist": table_list,
            "stringid": ".".join(stringid),
            "fieldname": stringid[-1],
            "isrelfld": self.is_relationship(),
        }

    def to_stringid(self):
        table_list = make_table_list(self)
        return ".".join(make_stringid(self, table_list))

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
        return field is not None and field.type == "json"

    def build_join(self, query, join_path):
        return query.build_join(self.root_table, self.root_sql_table, join_path)

    def is_auditlog_obj_format_field(self, formatauditobjs):
        return (
            formatauditobjs
            and self.join_path
            and self.table.name.lower() == "spauditlog"
            and self.get_field().name.lower() in ["oldvalue", "newvalue"]
        )

    def is_specify_username_end(self):
        # TODO: Add unit tests.
        return (
            self.join_path
            and self.table.name.lower() == "specifyuser"
            and self.join_path[-1].name == "name"
        )

    def needs_formatted(self):
        return len(self.join_path) == 0 or self.is_relationship()

    def apply_filter(
        self,
        query,
        orm_field,
        field,
        table,
        value=None,
        op_num=None,
        negate=False,
        strict=False,
        collection=None,
        user=None
    ):
        no_filter = op_num is None or (
            self.tree_rank is None and self.get_field() is None
        )
        if not no_filter:
            if isinstance(value, QueryFieldSpec):
                _, other_field, _ = value.add_to_query(query.reset_joinpoint())
                uiformatter = None
                value = other_field
            else:
                uiformatter = field and get_uiformatter(
                    query.collection, table.name, field.name
                )
                value = value

            query_op = QueryOps(uiformatter)
            op = query_op.by_op_num(op_num)
            if query_op.is_precalculated(op_num):
                f = op(
                    orm_field, value, query, is_strict=strict
                )  # Needed if using op_age_range_simple
                # Handle modifying query from op_age_range
                # new_query = op(orm_field, value, query, is_strict=strict)
                # query = query._replace(query=new_query)
                # f = None
                if isinstance(f, Query):
                    query = query._replace(query=f)
                    query = query.reset_joinpoint()
                    return query, None, None
            else:
                op, mod_orm_field, value = apply_special_filter_cases(orm_field, field, table, value, op, op_num, uiformatter, collection, user)
                f = op(mod_orm_field, value)

            predicate = sql.not_(f) if negate else f
        else:
            predicate = None

        query = query.reset_joinpoint()
        return query, orm_field, predicate

    def add_to_query(
        self,
        query,
        value=None,
        op_num=None,
        negate=False,
        formatter=None,
        formatauditobjs=False,
        strict=False,
        collection=None,
        user=None,
    ):
        # print "############################################################################"
        # print "formatauditobjs " + str(formatauditobjs)
        # if self.get_field() is not None:
        #    print "field name " + self.get_field().name
        # print "is auditlog obj format field = " + str(self.is_auditlog_obj_format_field(formatauditobjs))
        # print "############################################################################"
        query, orm_field, field, table = self.add_spec_to_query(query, formatter)
        return self.apply_filter(
            query, orm_field, field, table, value, op_num, negate, strict=strict, collection=collection, user=user
        )

    def add_spec_to_query(
        self, query, formatter=None, aggregator=None, cycle_detector=[]
    ):

        if self.get_field() is None:
            return (
                *query.objectformatter.objformat(query, self.root_sql_table, formatter),
                None,
                self.root_table,
            )

        if self.is_relationship():
            # will be formatting or aggregating related objects
            if self.get_field().type in {"many-to-one", "one-to-one"}:
                query, orm_model, table, field = self.build_join(query, self.join_path)
                query, orm_field = query.objectformatter.objformat(
                    query, orm_model, formatter, cycle_detector
                )
            else:
                query, orm_model, table, field = self.build_join(
                    query, self.join_path[:-1]
                )
                orm_field = query.objectformatter.aggregate(
                    query,
                    self.get_field(),
                    orm_model,
                    aggregator or formatter,
                    cycle_detector,
                )
        else:
            query, orm_model, table, field = self.build_join(query, self.join_path)
            if isinstance(field, TreeRankQuery):
                tree_rank_idx = self.join_path.index(field)
                query, orm_field, field, table = query.handle_tree_field(
                    orm_model,
                    table,
                    field,
                    self.join_path[tree_rank_idx + 1 :],
                    self,
                )
            else:
                try:
                    field_name = self.get_field().name
                    orm_field = getattr(orm_model, field_name)
                except AttributeError:
                    if table.name in PRECALCULATED_FIELDS:
                        field_name = PRECALCULATED_FIELDS[table.name]
                        # orm_field = getattr(orm_model, field_name)
                        orm_field = getattr(
                            orm_model, orm_model._id
                        )  # Replace with recordId, future just remove column from results
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

# def apply_special_filter_cases(orm_field, field, table, value, op, op_num, uiformatter, collection=None, user=None):
#     parent_inheritance_pref = get_parent_cat_num_inheritance_setting(collection, user)

#     if parent_inheritance_pref: 
#         op, orm_field, value = parent_inheritance_filter_cases(orm_field, field, table, value, op, op_num, uiformatter, collection, user)
#     else: 
#         op, orm_field, value = cog_inheritance_filter_cases(orm_field, field, table, value, op, op_num, uiformatter, collection, user)

#     return op, orm_field, value

def apply_special_filter_cases(orm_field, field, table, value, op, op_num, uiformatter, collection=None, user=None):
    op, orm_field, value = cog_inheritance_filter_cases(orm_field, field, table, value, op, op_num, uiformatter, collection, user)

    return op, orm_field, value

def cog_inheritance_filter_cases(orm_field, field, table, value, op, op_num, uiformatter, collection=None, user=None):
    if (
        table.name == "CollectionObject"
        and field.name == "catalogNumber"
        and op_num == 1
        and get_cat_num_inheritance_setting(collection, user)
    ):
        sibling_ids = cog_primary_co_sibling_ids(value, collection)
        if sibling_ids:
            # Modify the query to filter operation and values for sibling collection objects
            value = ','.join(sibling_ids)
            orm_field = getattr(sq_CollectionObject, 'collectionObjectId')
            op = QueryOps(uiformatter).by_op_num(10)

    return op, orm_field, value

def cog_primary_co_sibling_ids(cat_num, collection):
    # Get the collection object with the given catalog number
    co = Collectionobject.objects.filter(catalognumber=cat_num, collection=collection).first()
    if not co:
        return []

    # Get the primary group join for the collection object
    cojo = Collectionobjectgroupjoin.objects.filter(childco=co, isprimary=True).first()
    if not cojo:
        return []

    # Get sibling collection objects in the same parent group
    sibling_co_ids = Collectionobjectgroupjoin.objects.filter(
        parentcog=cojo.parentcog, childco__isnull=False
    ).exclude(childco=co).values_list('childco_id', flat=True)

    # Filter siblings with no catalog number and return all IDs as strings
    target_sibling_co_ids = Collectionobject.objects.filter(
        id__in=sibling_co_ids, catalognumber=None
    ).values_list('id', flat=True)

    return [str(i) for i in [co.id] + list(target_sibling_co_ids)]

# def parent_inheritance_filter_cases(orm_field, field, table, value, op, op_num, uiformatter, collection=None, user=None):
#     if (
#         table.name == "CollectionObject"
#         and field.name == "catalogNumber"
#         and op_num == 1
#         and get_parent_cat_num_inheritance_setting(collection, user)
#     ):
#         components_ids = co_components_ids(value, collection)
#         if components_ids:
#             # Modify the query to filter operation and values for component collection objects
#             value = ','.join(components_ids)
#             orm_field = getattr(sq_CollectionObject, 'collectionObjectId')
#             op = QueryOps(uiformatter).by_op_num(10)

#     return op, orm_field, value

# def co_components_ids(cat_num, collection):
    # Get the collection object with the given catalog number
    parentcomponent = Collectionobject.objects.filter(catalognumber=cat_num, collection=collection).first()
    if not parentcomponent:
        return []

    # Get component objects directly from the related name
    components = parentcomponent.components.filter(catalognumber=None)

    # Get their IDs
    target_component_co_ids = components.values_list('id', flat=True)

    return [str(i) for i in [parentcomponent.id] + list(target_component_co_ids)]