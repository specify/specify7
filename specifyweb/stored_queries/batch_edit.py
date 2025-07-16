# type: ignore

# ^^ The above is because we etensively use recursive typedefs of named tuple in this file not supported on our MyPy 0.97 version.
# When typechecked in MyPy 1.11 (supports recursive typedefs), there is no type issue in the file.
# However, using 1.11 makes things slower in other files.

from functools import reduce
from typing import (
    Any,
    Callable,
    Dict,
    List,
    NamedTuple,
    Optional,
    TypedDict,
)

from specifyweb.permissions.permissions import has_target_permission
from specifyweb.specify.filter_by_col import CONCRETE_HIERARCHY
from specifyweb.specify.models import datamodel
from specifyweb.specify.load_datamodel import Field, Relationship, Table
from specifyweb.specify.tree_views import TREE_INFORMATION, get_all_tree_information
from specifyweb.specify.tree_utils import SPECIFY_TREES
from specifyweb.specify.datamodel import is_tree_table
from specifyweb.stored_queries.execution import execute
from specifyweb.stored_queries.queryfield import QueryField, fields_from_json
from specifyweb.stored_queries.queryfieldspec import (
    QueryFieldSpec,
    QueryNode,
    TreeRankQuery,
)
from specifyweb.workbench.models import Spdataset
from specifyweb.workbench.permissions import BatchEditDataSetPT
from specifyweb.workbench.upload.treerecord import TreeRecord, TreeRankRecord, RANK_KEY_DELIMITER
from specifyweb.workbench.upload.upload_plan_schema import parse_column_options
from specifyweb.workbench.upload.upload_table import UploadTable
from specifyweb.workbench.upload.uploadable import NULL_RECORD, Uploadable
from specifyweb.workbench.views import regularize_rows
from specifyweb.specify.func import Func
from . import models
import json

from specifyweb.workbench.upload.upload_plan_schema import schema
from jsonschema import validate

from django.db import transaction

MaybeField = Callable[[QueryFieldSpec], Optional[Field]]

# TODO:
# Investigate if any/some/most of the logic for making an upload plan could be moved to frontend and reused.
#   - does generation of upload plan in the backend bc upload plan is not known (we don't know count of to-many).
#       - seemed complicated to merge upload plan from the frontend
#   - need to place id markers at correct level, so need to follow upload plan anyways.
# REFACTOR: Break this file into smaller pieaces

# TODO: Play-around with localizing
BATCH_EDIT_NULL_RECORD_DESCRIPTION = ""

# TODO: add backend support for making system tables readonly
BATCH_EDIT_READONLY_TABLES = [*CONCRETE_HIERARCHY]

BATCH_EDIT_SHARED_READONLY_FIELDS = [
    "timestampcreated",
    "timestampmodified",
    "version",
    "nodenumber",
    "highestchildnodenumber",
    "rankid",
    "fullname",
    "age",
]

BATCH_EDIT_SHARED_READONLY_RELATIONSHIPS = ["createdbyagent", "modifiedbyagent"]

BATCH_EDIT_REQUIRED_TREE_FIELDS = ["name"]


def get_readonly_fields(table: Table):
    fields = [*BATCH_EDIT_SHARED_READONLY_FIELDS, table.idFieldName.lower()]

    # FEATURE: Remove this when lat/long is officially supported
    # See https://github.com/specify/specify7/issues/6251 and
    # https://github.com/specify/specify7/issues/6655
    if table.name.lower() == 'locality':
        fields.extend(('latitude1', 'longitude1', 'lat1text', 'long1text',
                      'latitude2', 'longitude2', 'lat2text', 'long2text'))

    relationships = [
        rel.name
        for rel in table.relationships
        if rel.relatedModelName.lower() in BATCH_EDIT_READONLY_TABLES
    ]
    if table.name.lower() == "determination":
        relationships = ["preferredtaxon"]
    elif is_tree_table(table):
        relationships = ["definitionitem"]

    return fields, [*BATCH_EDIT_SHARED_READONLY_RELATIONSHIPS, *relationships]


FLOAT_FIELDS = ["java.lang.Float", "java.lang.Double", "java.math.BigDecimal"]


def parse(value: Optional[Any], query_field: QueryField) -> Any:
    field = query_field.fieldspec.get_field()
    if field is None or value is None:
        return value
    if field.type in FLOAT_FIELDS:
        return float(value)
    return value


def _get_nested_order(field_spec: QueryFieldSpec):
    # don't care about ordernumber if it ain't nested
    # won't affect logic, just data being saved.
    if len(field_spec.join_path) == 0:
        return None
    return field_spec.table.get_field("ordernumber")


batch_edit_fields: dict[str, tuple[MaybeField, int]] = {
    # technically, if version updates are correct, this is useless beyond base tables
    # and to-manys. TODO: Do just that. remove it. sorts asc. using sort, the optimized
    # dataset construction takes place.
    "id": (lambda field_spec: field_spec.table.idField, 1),
    # version control gets added here. no sort.
    "version": (lambda field_spec: field_spec.table.get_field("version"), 0),
    # ordernumber. no sort (actually adding a sort here is useless)
    "order": (_get_nested_order, 1),
}


class BatchEditFieldPack(NamedTuple):
    field: Optional[QueryField] = None
    idx: Optional[int] = None  # default value not there, for type safety
    value: Any = None  # stricten this?


class BatchEditPack(NamedTuple):
    id: BatchEditFieldPack
    order: BatchEditFieldPack
    version: BatchEditFieldPack

    # extends a path to contain the last field + for a defined fields
    @staticmethod
    def from_field_spec(field_spec: QueryFieldSpec) -> "BatchEditPack":
        # don't care about which way. bad things will happen if not sorted.
        # not using assert () since it can be optimised out.
        if batch_edit_fields["id"][1] == 0 or batch_edit_fields["order"][1] == 0:
            raise Exception("the ID field should always be sorted!")

        def extend_callback(sort_type):
            def _callback(field):
                return BatchEditPack._query_field(
                    field_spec._replace(
                        join_path=(*field_spec.join_path, field), date_part=None
                    ),
                    sort_type,
                )

            return _callback

        new_field_specs = {
            key: BatchEditFieldPack(
                idx=None,
                field=Func.maybe(callback(field_spec), extend_callback(sort_type)),
                value=None,
            )
            for key, (callback, sort_type) in batch_edit_fields.items()
        }
        return BatchEditPack(**new_field_specs)

    def merge(self, other: "BatchEditPack") -> "BatchEditPack":
        return BatchEditPack(
            id=self.id if self.id.field is not None else other.id,
            version=self.version if self.version.field is not None else other.version,
            order=self.order if self.order.field is not None else other.order,
        )

    # a basic query field spec to field
    @staticmethod
    def _query_field(field_spec: QueryFieldSpec, sort_type: int):
        return QueryField(
            fieldspec=field_spec,
            op_num=8,
            value=None,
            negate=False,
            display=True,
            format_name=None,
            sort_type=sort_type,
            strict=False,
        )

    def _index(
        self,
        start_idx: int,
        current: tuple[dict[str, BatchEditFieldPack], list[QueryField]],
        next: tuple[int, tuple[str, tuple[MaybeField, int]]],
    ):
        current_dict, fields = current
        field_idx, (field_name, _) = next
        value: BatchEditFieldPack = getattr(self, field_name)
        new_dict = {
            **current_dict,
            field_name: value._replace(
                field=None, idx=((field_idx + start_idx) if value.field else None)
            ),
        }
        new_fields = fields if value.field is None else [*fields, value.field]
        return new_dict, new_fields

    def index_plan(self, start_index=0) -> tuple["BatchEditPack", list[QueryField]]:
        init: tuple[dict[str, BatchEditFieldPack], list[QueryField]] = (
            {},
            [],
        )
        _dict, fields = reduce(
            lambda accum, next: self._index(
                start_idx=start_index, current=accum, next=next
            ),
            enumerate(batch_edit_fields.items()),
            init,
        )
        return BatchEditPack(**_dict), fields

    def bind(self, row: tuple[Any]):
        return BatchEditPack(
            id=self.id._replace(
                value=row[self.id.idx] if self.id.idx is not None else None,
            ),
            order=self.order._replace(
                value=row[self.order.idx] if self.order.idx is not None else None
            ),
            version=self.version._replace(
                value=row[self.version.idx] if self.version.idx is not None else None
            ),
        )

    def to_json(self) -> dict[str, Any]:
        return {
            "id": self.id.value,
            "ordernumber": self.order.value,
            "version": self.version.value,
        }

    # we not only care that it is part of tree, but also care that there is rank to tree
    def is_part_of_tree(self, query_fields: list[QueryField]) -> bool:
        if self.id.idx is None:
            return False
        id_field = self.id.idx
        field = query_fields[id_field - 1]
        join_path = field.fieldspec.join_path
        if len(join_path) < 2:
            return False
        return isinstance(join_path[-2], TreeRankQuery)
    
    @staticmethod
    def replace_tree_rank(fieldspec: QueryFieldSpec, tree_rank: TreeRankQuery) -> QueryFieldSpec:
        return fieldspec._replace(
            join_path=tuple(
                [
                    tree_rank if isinstance(node, TreeRankQuery) else node
                    for node in fieldspec.join_path
                ]
            )
        )
    
    def readjust_tree_rank(self, tree_rank: TreeRankQuery):
        id_field = self.id._replace(field=self.id.field._replace(fieldspec=BatchEditPack.replace_tree_rank(self.id.field.fieldspec, tree_rank))) if self.id.field is not None else self.id
        order_field = self.order._replace(field=self.order.field._replace(fieldspec=BatchEditPack.replace_tree_rank(self.order.field.fieldspec, tree_rank))) if self.order.field is not None else self.order
        version_field  = self.version._replace(field=self.version.field._replace(fieldspec=BatchEditPack.replace_tree_rank(self.version.field.fieldspec, tree_rank))) if self.version.field is not None else self.version
        return BatchEditPack(id=id_field, order=order_field, version=version_field)
    
def get_tree_rank_record(key) -> TreeRankRecord:
    from specifyweb.workbench.upload.treerecord import RANK_KEY_DELIMITER

    tree_name, rank_name, tree_def_id = tuple(key.split(RANK_KEY_DELIMITER))
    return TreeRankRecord(RANK_KEY_DELIMITER.join([tree_name, rank_name]), int(tree_def_id))


# These constants are purely for memory optimization, no code depends and/or cares if this is constant.
EMPTY_FIELD = BatchEditFieldPack()
EMPTY_PACK = BatchEditPack(id=EMPTY_FIELD, order=EMPTY_FIELD, version=EMPTY_FIELD)


# FUTURE: this already supports nested-to-many for most part
# wb plan, but contains query fields along with indexes to look-up in a result row.
# TODO: see if it can be moved + combined with front-end logic. I kept all parsing on backend, but there might be possible beneft in doing this
# on the frontend (it already has code from mapping path -> upload plan)
class RowPlanMap(NamedTuple):
    batch_edit_pack: BatchEditPack
    columns: list[BatchEditFieldPack] = []
    to_one: dict[str, "RowPlanMap"] = {}
    to_many: dict[str, "RowPlanMap"] = {}
    is_naive: bool = True
    tree_rank: Optional[TreeRankQuery] = None

    @staticmethod
    def _merge(
        current: dict[str, "RowPlanMap"], other: tuple[str, "RowPlanMap"]
    ) -> dict[str, "RowPlanMap"]:
        key, other_plan = other
        return {
            **current,
            # merge if other is also found in ours
            key: (other_plan if key not in current else current[key].merge(other_plan)),
        }

    # takes two row plans, combines them together. Adjusts is_naive.
    def merge(self: "RowPlanMap", other: "RowPlanMap") -> "RowPlanMap":
        new_columns = [*self.columns, *other.columns]
        batch_edit_pack = other.batch_edit_pack.merge(self.batch_edit_pack)
        is_self_naive = self.is_naive and other.is_naive
        # BUG: Handle this more gracefully for to-ones.
        # That is, we'll currently incorrectly disallow making new ones. Fine for now.
        to_one = reduce(RowPlanMap._merge, other.to_one.items(), self.to_one)
        to_many = reduce(RowPlanMap._merge, other.to_many.items(), self.to_many)
        assert not (
            (self.tree_rank is None) ^ (other.tree_rank is None)
        ), "Trying to merge inconsistent rowplanmaps"
        return RowPlanMap(
            batch_edit_pack,
            new_columns,
            to_one,
            to_many,
            is_naive=is_self_naive,
            tree_rank=self.tree_rank,
        )

    @staticmethod
    def _index(
        current: tuple[int, dict[str, "RowPlanMap"], list[QueryField]],
        other: tuple[str, "RowPlanMap"],
    ):
        next_start_index = current[0]
        other_indexed, fields = other[1].index_plan(start_index=next_start_index)
        to_return = (
            (next_start_index + len(fields)),
            {**current[1], other[0]: other_indexed},
            [*current[2], *fields],
        )
        return to_return

    # to make things simpler, returns the QueryFields along with indexed plan, which are expected to be used together
    def index_plan(self, start_index=1) -> tuple["RowPlanMap", list[QueryField]]:
        intermediary_to_tree = any(
            rowmap.tree_rank is not None for _, rowmap in self.to_one.items()
        )
        
        next_index = len(self.columns) + start_index
        # For optimization, and sanity, we remove the field from columns, as they are now completely redundant (we always know what they are using the id)
        _columns = [
            column._replace(idx=index, field=None)
            for index, column in zip(range(start_index, next_index), self.columns)
        ]
        _batch_indexed, _batch_fields = (
            self.batch_edit_pack.index_plan(start_index=next_index)
            if self.batch_edit_pack
            else (None, [])
        )
        next_index += len(_batch_fields)
        init: Callable[[int], tuple[int, dict[str, RowPlanMap], list[QueryField]]] = (
            lambda _start: (_start, {}, [])
        )
        next_index, _to_one, to_one_fields = reduce(
            RowPlanMap._index,
            # makes the order deterministic, would be funny otherwise
            Func.obj_to_list(self.to_one) if intermediary_to_tree else Func.sort_by_key(self.to_one),
            init(next_index),
        )
        next_index, _to_many, to_many_fields = reduce(
            RowPlanMap._index, Func.sort_by_key(self.to_many), (init(next_index))
        )
        column_fields = [column.field for column in self.columns if column.field]
        return (
            RowPlanMap(
                columns=_columns,
                to_one=_to_one,
                to_many=_to_many,
                batch_edit_pack=_batch_indexed,
                is_naive=self.is_naive,
            ),
            [*column_fields, *_batch_fields, *to_one_fields, *to_many_fields],
        )

    # helper for generating an row plan for a single query field
    # handles formatted/aggregated self or relationships correctly (places them in upload-plan at correct level)
    # it's complicated to place aggregated within the to-many table. but, since we don't map it to anything, we equivalently place it
    # on the penultimate table's column. that is, say collectingevent -> collectors (aggregated). Semantically, (aggregated) should be on
    # on the colletors table (as a column). Instead, we put it as a column in collectingevent. This has no visual difference (it is unmapped) anyways.
    @staticmethod
    def _recur_row_plan(
        running_path: list[QueryNode],  # using tuple causes typing issue
        next_path: list[QueryNode],
        next_table: Table,  # bc queryfieldspecs will be terminated early on
        original_field: QueryField,
    ) -> "RowPlanMap":

        original_field_spec = original_field.fieldspec

        # contains partial path
        partial_field_spec = original_field_spec._replace(
            join_path=tuple(running_path), table=next_table
        )

        # to handle CO->(formatted), that's it. this function will never be called with empty path other than top-level formatted/aggregated
        rest: list[QueryNode] = []

        if len(next_path) == 0:
            node = None
            rest = []
        else:
            node = next_path[0]
            rest = next_path[1:]

        # Meh, simplifies other stuff going on in other places
        # that is, we'll include the pack of CO if query is like CO -> (formatted) or CO -> CE (formatted).
        # No, this doesn't mean IDs of the formatted/aggregated are including (that is impossible)
        batch_edit_pack = BatchEditPack.from_field_spec(partial_field_spec)

        if len(rest) == 0:
            # we are at the end
            return RowPlanMap(
                columns=[BatchEditFieldPack(field=original_field)],
                batch_edit_pack=batch_edit_pack,
                is_naive=(original_field.op_num == 8),
            )

        assert isinstance(node, TreeRankQuery) or isinstance(
            node, Relationship
        ), "using a non-relationship as a pass through!"

        rel_type = (
            "to_many"
            if node.type.endswith("to-many") or node.type == "zero-to-one" or node.is_remote_to_one()
            else "to_one"
        )

        rel_name = (
            node.name.lower() if not isinstance(node, TreeRankQuery) else node.name
        )

        remaining_map = RowPlanMap._recur_row_plan(
            [*running_path, node],
            rest,
            datamodel.get_table_strict(node.relatedModelName),
            original_field,
        )

        remaining_map = remaining_map._replace(tree_rank=node if isinstance(node, TreeRankQuery) else None)

        boiler = RowPlanMap(
            columns=[],
            batch_edit_pack=batch_edit_pack,
        )

        rest_plan = {rel_name: remaining_map}
        if rel_type == "to_one":
            # Propagate is_naive up
            return boiler._replace(
                is_naive=remaining_map.is_naive, to_one=rest_plan
            )

        # bc the user eperience guys want to be able to make new dets/preps one hop away
        # but, we can't allow it for ordernumber when filtering. pretty annoying.
        # and definitely not naive for any tree, well, technically it is possible, but for user's sake.
        is_naive = not is_tree_table(next_table) and (
            (
                len(running_path) == 0
                and (remaining_map.batch_edit_pack.order.field is None)
            )
            or remaining_map.is_naive
        )
        return boiler._replace(
            to_many={
                # to force-naiveness
                rel_name: remaining_map._replace(is_naive=is_naive)
            }
        )

    # generates multiple row plan maps, and merges them into one
    # this doesn't index the row plan, bc that is complicated.
    # instead, see usage of index_plan() which indexes the plan in one go.
    @staticmethod
    def get_row_plan(fields: list[QueryField]) -> "RowPlanMap":
        start: list[QueryNode] = []
        iter = [
            RowPlanMap._recur_row_plan(
                start,
                list(field.fieldspec.join_path),
                field.fieldspec.root_table,
                field,
            )
            for field in fields
        ]

        plan = reduce(
            lambda current, other: current.merge(other),
            iter,
            RowPlanMap(batch_edit_pack=EMPTY_PACK),
        )
        return plan

    @staticmethod
    def _bind_null(value: "RowPlanCanonical") -> list["RowPlanCanonical"]:
        if value.batch_edit_pack.id.value is None:
            return []
        return [value]

    def bind(
        self, row: tuple[Any], query_fields: list[QueryField]
    ) -> "RowPlanCanonical":
        columns = [
            column._replace(
                # accounting for id below
                value=parse(row[column.idx], query_fields[column.idx - 1]),
                field=None,
            )
            for column in self.columns
            # Careful: this can be 0, so not doing "if not column.idx"
            if column.idx is not None
        ]
        to_ones = {
            key: value.bind(row, query_fields) for (key, value) in self.to_one.items()
        }
        to_many = {
            key: RowPlanMap._bind_null(value.bind(row, query_fields))
            for (key, value) in self.to_many.items()
        }
        pack = self.batch_edit_pack.bind(row)
        return RowPlanCanonical(pack, columns, to_ones, to_many)

    # gets a null record to fill-out empty space
    # doesn't support nested-to-many's yet - complicated
    def nullify(self, parent_is_phantom=False) -> "RowPlanCanonical":
        # since is_naive is set,
        is_phantom = parent_is_phantom or not self.is_naive
        columns = [
            pack._replace(
                value=BATCH_EDIT_NULL_RECORD_DESCRIPTION if is_phantom else None
            )
            for pack in self.columns
        ]
        to_ones = {
            key: value.nullify(is_phantom) for (key, value) in self.to_one.items()
        }
        batch_edit_pack = self.batch_edit_pack._replace(
            id=self.batch_edit_pack.id._replace(
                value=(NULL_RECORD if is_phantom else None)
            )
        )
        return RowPlanCanonical(batch_edit_pack, columns, to_ones)

    # a fake upload plan that keeps track of the maximum ids / order numbrs seen in to-manys
    def to_many_planner(self) -> "RowPlanMap":
        to_one = {key: value.to_many_planner() for (key, value) in self.to_one.items()}
        to_many = {
            key: RowPlanMap(
                batch_edit_pack=(
                    BatchEditPack(
                        # NOTE: Check if default needs to be 1 here as well?
                        order=BatchEditFieldPack(value=0),
                        id=EMPTY_FIELD,
                        version=EMPTY_FIELD,
                    )
                    if value.batch_edit_pack.order.idx is not None
                    # only use id if order field is not present
                    else BatchEditPack(
                        # Default value is 1 to ensure at least one to-many is added to the dataset. 
                        # Check _extend_id_order for how this is used
                        id=BatchEditFieldPack(value=1), 
                        order=EMPTY_FIELD,
                        version=EMPTY_FIELD,
                    )
                )
            )
            for (key, value) in self.to_many.items()
        }
        return RowPlanMap(
            batch_edit_pack=EMPTY_PACK,
            columns=[],
            to_one=to_one,
            to_many=to_many,
        )

    def rewrite(
        self, table: Table, all_tree_info: TREE_INFORMATION, running_path=[]
    ) -> "RowPlanMap":
        from .batch_edit_query_rewrites import _batch_edit_rewrite  # ugh, fix this

        # NOTE: This is written in a very generic way, and makes future rewrites also not too hard.
        # However, tree rank rewrites was probably the hardest that needed to be done.
        return _batch_edit_rewrite(self, table, all_tree_info, running_path)


# the main data-structure which stores the data
# RowPlanMap is just a map, this stores actual data (to many is a dict of list, rather than just a dict)
# maybe unify that with RowPlanMap?


class RowPlanCanonical(NamedTuple):
    batch_edit_pack: BatchEditPack
    columns: list[BatchEditFieldPack] = []
    to_one: dict[str, "RowPlanCanonical"] = {}
    to_many: dict[str, list["RowPlanCanonical"]] = {}

    @staticmethod
    def _maybe_extend(
        values: list["RowPlanCanonical"],
        result: tuple[bool, "RowPlanCanonical"],
    ):
        is_new = result[0]
        new_values = (is_new, [*values, result[1]] if is_new else values)
        return new_values

    # FUTURE: already handles nested to-many.
    def merge(
        self, row: tuple[Any], indexed_plan: RowPlanMap, query_fields: list[QueryField]
    ) -> tuple[bool, "RowPlanCanonical"]:
        # nothing to compare against. useful for recursion + handing default null as default value for reduce
        if self.batch_edit_pack.id.value is None:
            return False, indexed_plan.bind(row, query_fields)

        # trying to defer actual bind to later
        batch_fields = indexed_plan.batch_edit_pack.bind(row)
        if batch_fields.id.value != self.batch_edit_pack.id.value:
            # if the id itself is different, we are on a different record. just bind and return
            return True, indexed_plan.bind(row, query_fields)

        # now, ids are the same. no reason to bind other's to one.
        # however, still need to handle to-manys inside to-ones (this will happen when a row gets duplicated due to to-many)
        def _reduce_to_one(
            accum: tuple[bool, dict[str, "RowPlanCanonical"]],
            current: tuple[str, RowPlanCanonical],
        ):
            key, value = current
            is_stalled, previous_chain = accum
            new_stalled, result = (
                (True, value)
                if is_stalled
                else value.merge(row, indexed_plan.to_one[key], query_fields)
            )
            return (is_stalled or new_stalled, {**previous_chain, key: result})

        init: tuple[bool, dict[str, RowPlanCanonical]] = (False, {})
        to_one_stalled, to_one = reduce(
            _reduce_to_one, Func.sort_by_key(self.to_one), init
        )

        # the most tricky lines in this file
        def _reduce_to_many(
            accum: tuple[int, list[tuple[str, bool, list["RowPlanCanonical"]]]],
            current: tuple[str, list[RowPlanCanonical]],
        ):
            key, values = current
            previous_length, previous_chain = accum
            is_stalled = previous_length > 1
            if len(values) == 0:
                new_values = []
                new_stalled = False
            else:
                new_stalled, new_values = (
                    (True, values)
                    if is_stalled
                    else RowPlanCanonical._maybe_extend(
                        values,
                        values[-1].merge(row, indexed_plan.to_many[key], query_fields),
                    )
                )
            return (
                max(len(new_values), previous_length),
                [*previous_chain, (key, is_stalled or new_stalled, new_values)],
            )

        if to_one_stalled:
            to_many = self.to_many
            to_many_stalled = True
        else:
            # We got stalled early on.
            init_to_many: tuple[
                int, list[tuple[str, bool, list["RowPlanCanonical"]]]
            ] = (0, [])
            most_length, to_many_result = reduce(
                _reduce_to_many, Func.sort_by_key(self.to_many), init_to_many
            )

            to_many_stalled = (
                any(results[1] for results in to_many_result) or most_length > 1
            )
            to_many = {key: values for (key, _, values) in to_many_result}

        # TODO: explain why those arguments
        stalled = to_one_stalled or to_many_stalled
        return stalled, RowPlanCanonical(
            self.batch_edit_pack,
            self.columns,
            to_one,
            to_many,
        )

    @staticmethod
    def _update_id_order(values: list["RowPlanCanonical"], plan: RowPlanMap):
        is_id = plan.batch_edit_pack.order.value is None
        new_value = (
            len(values)
            if is_id
            else (
                0
                if len(values) == 0
                else max([value.batch_edit_pack.order.value for value in values])
            )
        )
        current_value = (
            plan.batch_edit_pack.order.value
            if not is_id
            else plan.batch_edit_pack.id.value
        )
        new_pack = BatchEditFieldPack(field=None, value=max(new_value, current_value))
        return RowPlanMap(
            batch_edit_pack=(
                plan.batch_edit_pack._replace(id=new_pack)
                if is_id
                else plan.batch_edit_pack._replace(order=new_pack)
            )
        )

    # as we iterate through rows, need to update the to-many stats (number of ids or maximum order we saw)
    # this is done to expand the rows at the end
    def update_to_manys(self, to_many_planner: RowPlanMap) -> RowPlanMap:
        to_one = {
            key: value.update_to_manys(to_many_planner.to_one[key])
            for (key, value) in self.to_one.items()
        }
        to_many = {
            key: RowPlanCanonical._update_id_order(values, to_many_planner.to_many[key])
            for key, values in self.to_many.items()
        }
        return RowPlanMap(batch_edit_pack=EMPTY_PACK, to_one=to_one, to_many=to_many)

    # Responsible for extending a to-many relationship to include all to-many records in the same row
    # Example: Consider a CO with 3 determinations. This function ensures all 3 determinations get added to the same row of the dataset
    @staticmethod
    def _extend_id_order(
        values: list["RowPlanCanonical"],
        to_many_planner: RowPlanMap,
        indexed_plan: RowPlanMap,
    ) -> list["RowPlanCanonical"]:
        is_id = to_many_planner.batch_edit_pack.order.value is None
        fill_out = None
        # minor memoization, hehe
        null_record = indexed_plan.nullify()
        if not is_id:  # if order is present, things are more complex
            max_order = (
                0
                if len(values) == 0
                else max([value.batch_edit_pack.order.value for value in values])
            )
            # this might be useless
            assert len(values) == 0 or (
                len({value.batch_edit_pack.order.value for value in values})
                == len(values)
            )
            # fill-in before, out happens later anyways
            fill_in_range = range(
                min(max_order, to_many_planner.batch_edit_pack.order.value) + 1
            )
            # TODO: this is generic and doesn't assume items aren't sorted by order. maybe we can optimize, knowing that.
            filled_in = [
                next(
                    filter(
                        lambda pack: pack.batch_edit_pack.order.value == fill_in, values
                    ),
                    null_record,
                )
                for fill_in in fill_in_range
            ]
            values = filled_in
            fill_out = to_many_planner.batch_edit_pack.order.value - max_order

        if fill_out is None:
            fill_out = to_many_planner.batch_edit_pack.id.value - len(values)

        assert fill_out >= 0, "filling out in opposite directon!"
        rest = range(fill_out)
        values = [*values, *(null_record for _ in rest)]
        _ids = [
            value.batch_edit_pack.id.value
            for value in values
            if isinstance(value.batch_edit_pack.id.value, int)
        ]
        if len(_ids) != len(set(_ids)):
            raise Exception("Inserted duplicate ids")
        return values

    def extend(
        self, to_many_planner: RowPlanMap, plan: RowPlanMap
    ) -> "RowPlanCanonical":
        to_ones = {
            key: value.extend(to_many_planner.to_one[key], plan.to_one[key])
            for (key, value) in self.to_one.items()
        }
        to_many = {
            key: RowPlanCanonical._extend_id_order(
                values, to_many_planner.to_many[key], plan.to_many[key]
            )
            for (key, values) in self.to_many.items()
        }
        return self._replace(to_one=to_ones, to_many=to_many)

    @staticmethod
    def _make_to_one_flat(
        callback: Callable[[str, Func.I], tuple[list[Any], dict[str, Func.O]]]
    ):
        def _flat(
            accum: tuple[list[Any], dict[str, Func.O]], current: tuple[str, Func.I]
        ):
            to_one_fields, to_one_pack = callback(*current)
            return [*accum[0], *to_one_fields], {**accum[1], current[0]: to_one_pack}

        return _flat

    @staticmethod
    def _make_to_many_flat(
        callback: Callable[[str, Func.I], tuple[list[Any], dict[str, Func.O]]]
    ):
        def _flat(
            accum: tuple[list[Any], dict[str, Func.O]],
            current: tuple[str, list[Func.I]],
        ):
            rel_name, to_many = current
            to_many_flattened = [callback(rel_name, canonical) for canonical in to_many]
            row_data = [cell for row in to_many_flattened for cell in row[0]]
            to_many_pack = [cell[1] for cell in to_many_flattened]
            return [*accum[0], *row_data], {**accum[1], rel_name: to_many_pack}

        return _flat

    def flatten(self) -> tuple[list[Any], Optional[dict[str, Any]]]:
        cols = [col.value for col in self.columns]
        base_pack = (
            self.batch_edit_pack.to_json()
            if self.batch_edit_pack.id.value is not None
            else None
        )

        def _flatten(_: str, _self: "RowPlanCanonical"):
            return _self.flatten()

        _to_one_reducer = RowPlanCanonical._make_to_one_flat(_flatten)
        _to_many_reducer = RowPlanCanonical._make_to_many_flat(_flatten)

        to_one_init: tuple[list[Any], dict[str, Any]] = ([], {})
        to_many_init: tuple[list[Any], dict[str, list[Any]]] = ([], {})

        to_ones = reduce(_to_one_reducer, Func.sort_by_key(self.to_one), to_one_init)
        to_many = reduce(_to_many_reducer, Func.sort_by_key(self.to_many), to_many_init)
        all_data = [*cols, *to_ones[0], *to_many[0]]

        # Removing all the unnecceary keys to save up on the size of the dataset
        return all_data, (
            Func.remove_keys(
                {
                    "self": base_pack,
                    "to_one": Func.remove_keys(to_ones[1], Func.is_not_empty),
                    "to_many": Func.remove_keys(
                        to_many[1],
                        lambda key, records: any(
                            Func.is_not_empty(key, record) for record in records
                        ),
                    ),
                },
                Func.is_not_empty,
            )
            if base_pack
            else None
        )

    def to_upload_plan(
        self,
        base_table: Table,
        localization_dump: dict[str, dict[str, str]],
        query_fields: list[QueryField],
        fields_added: dict[str, int],
        get_column_id: Callable[[str], int],
        omit_relationships: bool,
    ) -> tuple[list[tuple[tuple[int, int], str]], Uploadable]:
        # Yuk, finally.

        # Whether we are something like [det-> (T -- what we are) -> tree].
        # Set break points in handle_tree_field in query_construct.py to figure out what this means.
        intermediary_to_tree = any(
            canonical.batch_edit_pack is not None
            and canonical.batch_edit_pack.is_part_of_tree(query_fields)
            for canonical in self.to_one.values()
        )

        def _lookup_in_fields(_id: Optional[int], readonly_fields: list[str]):
            assert _id is not None, "invalid lookup used!"
            field = query_fields[
                _id - 1
            ]  # Need to go off by 1, bc we added 1 to account for id fields
            table_name, field_name = _get_table_and_field(field)
            field_labels = localization_dump.get(table_name, {})
            # It could happen that the field we saw doesn't exist.
            # Plus, the default options get chosen in the cases of
            if field_name not in field_labels or field.fieldspec.contains_tree_rank():
                localized_label = naive_field_format(field.fieldspec)
            else:
                localized_label = field_labels[field_name]
            string_id = field.fieldspec.to_stringid()
            fields_added[localized_label] = fields_added.get(localized_label, 0) + 1
            _count = fields_added[localized_label]
            if _count > 1:
                localized_label += f" #{_count}"
            fieldspec = field.fieldspec

            is_null = (
                fieldspec.needs_formatted()
                or intermediary_to_tree
                or (fieldspec.is_temporal() and fieldspec.date_part != "Full Date")
                or fieldspec.get_field().name.lower() in readonly_fields
                or fieldspec.table.name.lower() in BATCH_EDIT_READONLY_TABLES
            )
            id_in_original_fields = get_column_id(string_id)
            return (
                (id_in_original_fields, _count),
                (None if is_null else fieldspec.get_field().name.lower()),
                localized_label,
            )

        readonly_fields, readonly_rels = get_readonly_fields(base_table)
        key_and_fields_and_headers = [
            _lookup_in_fields(column.idx, readonly_fields) for column in self.columns
        ]

        wb_cols = {
            key: parse_column_options(value)
            for _, key, value in key_and_fields_and_headers
            if key is not None  # will happen for not-editable fields.
        }

        def _to_upload_plan(rel_name: str, _self: "RowPlanCanonical"):
            related_model = (
                base_table
                if intermediary_to_tree
                else datamodel.get_table_strict(
                    base_table.get_relationship(rel_name).relatedModelName
                )
            )
            return _self.to_upload_plan(
                related_model,
                localization_dump,
                query_fields,
                fields_added,
                get_column_id,
                omit_relationships,
            )

        _to_one_reducer = RowPlanCanonical._make_to_one_flat(_to_upload_plan)
        _to_many_reducer = RowPlanCanonical._make_to_many_flat(_to_upload_plan)

        # will don't modify the list directly, so we can use it for both to-one and to-many
        headers_init: list[tuple[tuple[int, int], str]] = []
        _to_one_table: dict[str, Uploadable] = {}

        to_one_headers, to_one_upload_tables = reduce(
            _to_one_reducer,
            Func.sort_by_key(self.to_one),
            (headers_init, _to_one_table),
        )

        _to_many_table: dict[str, list[Uploadable]] = {}
        to_many_headers, to_many_upload_tables = reduce(
            _to_many_reducer,
            Func.sort_by_key(self.to_many),
            (headers_init, _to_many_table),
        )

        raw_headers = [
            (key, header) for (key, __, header) in key_and_fields_and_headers
        ]
        all_headers = [*raw_headers, *to_one_headers, *to_many_headers]

        def _is_anyrank_tree_relationship(name, value):
            return name.lower() in SPECIFY_TREES and not isinstance(value, TreeRecord)

        def _relationship_is_editable(name, value):
            return (
                Func.is_not_empty(name, value)
                and name not in readonly_rels
                and not _is_anyrank_tree_relationship(name, value)
                and not omit_relationships
            )

        if intermediary_to_tree:
            assert len(to_many_upload_tables) == 0, "Found to-many for tree!"
            upload_plan: Uploadable = TreeRecord(
                name=base_table.django_name,
                ranks={
                    get_tree_rank_record(key): upload_table.wbcols  # type: ignore
                    for (key, upload_table) in to_one_upload_tables.items()
                },
            )
        else:
            upload_plan = UploadTable(
                name=base_table.django_name,
                overrideScope=None,
                wbcols=wb_cols,
                static={},
                # FEAT: Remove this restriction to allow adding brand new data anywhere
                # that's about the best we can do, to make relationships readonly. we can't really omit them during headers finding, because they are "still" there
                toOne=Func.remove_keys(to_one_upload_tables, _relationship_is_editable),
                toMany=Func.remove_keys(
                    to_many_upload_tables, _relationship_is_editable
                ),
            )

        return all_headers, upload_plan


# TODO: This really only belongs on the front-end.
# Using this as a last resort to show fields, for unit tests
def naive_field_format(fieldspec: QueryFieldSpec):
    field = fieldspec.get_field()
    tree_rank = fieldspec.get_first_tree_rank()
    prefix = f"{tree_rank[1].treedef_name} - {tree_rank[1].name} - " if tree_rank else ""
    if field is None:
        return f"{prefix}{fieldspec.table.name} (formatted)"
    if field.is_relationship:
        return f"{prefix}{fieldspec.table.name} ({'formatted' if field.type.endswith('to-one') else 'aggregatd'})"
    return f"{prefix}{fieldspec.table.name} {field.name}"


# @transaction.atomic <--- we DONT do this because the query logic could take up possibly multiple minutes
def run_batch_edit(collection, user, spquery, agent):
    props = BatchEditProps(
        collection=collection,
        user=user,
        contexttableid=int(spquery["contexttableid"]),
        captions=spquery.get("captions", None),
        limit=spquery.get("limit", 0),
        recordsetid=spquery.get("recordsetid", None),
        fields=fields_from_json(spquery["fields"]),
        session_maker=models.session_context,
        omit_relationships=spquery.get("omitrelationships", False),
        treedefsfilter=spquery.get("treedefsfilter", None)
    )
    (headers, rows, packs, json_upload_plan, visual_order) = run_batch_edit_query(props)
    mapped_raws = [
        [*row, json.dumps({"batch_edit": pack})] for (row, pack) in zip(rows, packs)
    ]
    # Skipping empty because we can have a funny case where all the query fields don't contain any data
    regularized_rows = regularize_rows(len(headers), mapped_raws, skip_empty=False)
    return make_dataset(
        user=user,
        collection=collection,
        name=spquery["name"],
        headers=headers,
        regularized_rows=regularized_rows,
        agent=agent,
        json_upload_plan=json_upload_plan,
        visual_order=visual_order,
    )


class BatchEditProps(TypedDict):
    collection: Any
    user: Any
    contexttableid: int
    captions: Any
    limit: Optional[int]
    recordsetid: Optional[int]
    session_maker: Any
    fields: list[QueryField]
    omit_relationships: Optional[bool]
    treedefsfilter: Any

def _get_table_and_field(field: QueryField):
    table_name = field.fieldspec.table.name
    field_name = None if field.fieldspec.get_field() is None else field.fieldspec.get_field().name
    return (table_name, field_name)

def run_batch_edit_query(props: BatchEditProps):

    offset = 0
    tableid = int(props["contexttableid"])
    captions = props["captions"]
    limit = props["limit"]

    recordsetid = props["recordsetid"]
    fields = props["fields"]

    visible_fields = [field for field in fields if field.display]

    treedefsfilter = props["treedefsfilter"]

    assert captions is None or (
        len(visible_fields) == len(captions)
    ), "Got misaligned captions!"

    localization_dump = {}
    if captions:
        for (field, caption) in zip(visible_fields, captions):
            table_name, field_name = _get_table_and_field(field)
            field_labels = localization_dump.get(table_name, {})
            field_labels[field_name] = caption
            localization_dump[table_name] = field_labels

    naive_row_plan = RowPlanMap.get_row_plan(visible_fields)
    all_tree_info = get_all_tree_information(props["collection"], props["user"].id)
    base_table = datamodel.get_table_by_id_strict(tableid, strict=True)
    running_path = [base_table.name]

    if treedefsfilter is not None:
        all_tree_info = filter_tree_info(treedefsfilter, all_tree_info)
    row_plan = naive_row_plan.rewrite(base_table, all_tree_info, running_path)

    indexed, query_fields = row_plan.index_plan()
    # we don't really care about these fields, since we'have already done the numbering (and it won't break with
    # more fields). We also don't caree about their sort, since their sort is guaranteed to be after ours
    query_with_hidden = [
        *query_fields,
        *[field for field in fields if not field.display],
    ]

    with props["session_maker"]() as session:
        rows = execute(
            session=session,
            collection=props["collection"],
            user=props["user"],
            tableid=tableid,
            distinct=True,
            series=False,
            count_only=False,
            field_specs=query_with_hidden,
            limit=limit,
            offset=offset,
            format_agent_type=True,
            recordsetid=recordsetid,
            formatauditobjs=False,
            format_picklist=True,
            format_types=False,
            numeric_catalog_number=False,
            format_expr=False,
        )

    to_many_planner = indexed.to_many_planner()

    visited_rows: list[RowPlanCanonical] = []
    previous_id = None
    previous_row = RowPlanCanonical(EMPTY_PACK)
    for row in rows["results"]:
        _, new_row = previous_row.merge(row, indexed, query_with_hidden)
        to_many_planner = new_row.update_to_manys(to_many_planner)
        if previous_id != new_row.batch_edit_pack.id.value:
            visited_rows.append(previous_row)
            previous_id = new_row.batch_edit_pack.id.value
        previous_row = new_row

    # The very last row will not have anybody to commit by, so we need to add it.
    # At this point though, we _know_ we need to commit it
    visited_rows.append(previous_row)

    visited_rows = visited_rows[1:]
    assert len(visited_rows) > 0, "nothing to return!"

    raw_rows: list[tuple[list[Any], Optional[dict[str, Any]]]] = []
    for visited_row in visited_rows:
        extend_row = visited_row.extend(to_many_planner, indexed)
        row_data, row_batch_edit_pack = extend_row.flatten()
        raw_rows.append((row_data, row_batch_edit_pack))

    assert (
        len({len(raw_row[0]) for raw_row in raw_rows}) == 1
    ), "Made irregular rows somewhere!"

    def _get_orig_column(string_id: str):
        try:
            return next(
            filter(
                lambda field: field[1].fieldspec.to_stringid() == string_id,
                enumerate(visible_fields),
            ))[0]
        except StopIteration:
            # Put the other ones at the very last.
            return len(visible_fields)

    # Consider optimizing when relationships are not-editable? May not benefit actually
    # This permission just gets enforced here
    omit_relationships = props["omit_relationships"] or not has_target_permission(
        props["collection"].id,
        props["user"].id,
        [BatchEditDataSetPT.edit_multiple_tables],
    )

    # The keys are lookups into original query field (not modified by us). Used to get ids in the original one.
    key_and_headers, upload_plan = extend_row.to_upload_plan(
        base_table,
        localization_dump,
        query_fields,
        {},
        _get_orig_column,
        omit_relationships,
    )

    headers_enumerated = enumerate(key_and_headers)

    # We would have arbitarily sorted the columns, so our columns will not be correct.
    # Rather than sifting the data, we just add a default visual order.
    visual_order = Func.first(headers_enumerated)

    headers = Func.second(key_and_headers)

    json_upload_plan = upload_plan.unparse()
    validate(json_upload_plan, schema)

    return (
        headers,
        Func.first(raw_rows),
        Func.second(raw_rows),
        json_upload_plan,
        visual_order,
    )


def make_dataset(
    user,
    collection,
    name,
    headers,
    regularized_rows,
    agent,
    json_upload_plan,
    visual_order,
):
    # We are _finally_ ready to make a new dataset

    with transaction.atomic():
        ds = Spdataset.objects.create(
            specifyuser=user,
            collection=collection,
            name=name,
            columns=headers,
            data=regularized_rows,
            importedfilename=name,
            createdbyagent=agent,
            modifiedbyagent=agent,
            uploadplan=json.dumps(json_upload_plan),
            visualorder=visual_order,
            isupdate=True,
        )

        ds_id, ds_name = (ds.id, ds.name)
        ds.id = None
        ds.name = f"Backs - {ds.name}"
        ds.parent_id = ds_id
        # Create the backer.
        ds.save()

    return (ds_id, ds_name)


def filter_tree_info(filters: Dict[str, List[int]], all_tree_info: Dict[str, List[TREE_INFORMATION]]):
    for tablename in filters:
        treetable_key = tablename.title()
        if treetable_key in all_tree_info:
            tree_filter = set(filters[tablename])
            all_tree_info[treetable_key] = list(filter(lambda tree_info : tree_info['definition']['id'] in tree_filter, all_tree_info[treetable_key]))

    return all_tree_info