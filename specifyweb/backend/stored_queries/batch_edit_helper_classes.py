# type: ignore

# ^^ The above is because we etensively use recursive typedefs of named tuple in this file not supported on our MyPy 0.97 version.
# When typechecked in MyPy 1.11 (supports recursive typedefs), there is no type issue in the file.
# However, using 1.11 makes things slower in other files.

from functools import reduce
from typing import (
    Any,
    NamedTuple,
    TypedDict,
)
from collections.abc import Callable

from specifyweb.specify.api.filter_by_col import CONCRETE_HIERARCHY
from specifyweb.specify.models_utils.load_datamodel import Field
from specifyweb.backend.stored_queries.queryfield import QueryField
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec, TreeRankQuery
from specifyweb.specify.utils.func import Func

MaybeField = Callable[[QueryFieldSpec], Field | None]

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

FLOAT_FIELDS = ["java.lang.Float", "java.lang.Double", "java.math.BigDecimal"]

class BatchEditFieldPack(NamedTuple):
    field: QueryField | None = None
    idx: int | None = None  # default value not there, for type safety
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

# These constants are purely for memory optimization, no code depends and/or cares if this is constant.
EMPTY_FIELD = BatchEditFieldPack()
EMPTY_PACK = BatchEditPack(id=EMPTY_FIELD, order=EMPTY_FIELD, version=EMPTY_FIELD)
    
class FieldLabel(NamedTuple):
    field_name: str
    caption: str
    is_used: bool = False

    def __str__(self) -> str:
        return (
            "FieldLabel("
            f"field_name={self.field_name!r}, "
            f"caption={self.caption!r}, "
            f"is_used={self.is_used}"
            ")"
        )

    __repr__ = __str__

class TableFieldLabels:
    table_name: str
    field_labels: list[FieldLabel]

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.field_labels = []

    def __iter__(self):
        return iter(self.field_labels)

    def add_field_label(self, field_label: FieldLabel):
        self.field_labels.append(field_label)

    def get_field_label_names(self) -> list[str]:
        return [field.field_name for field in self.field_labels]

    def has_field_label(self, field_name: str) -> bool:
        return any(field.field_name == field_name for field in self.field_labels)

    def use_field_label(
        self,
        field_name: str,
        expected_caption: str | None = None,
    ) -> FieldLabel | None:
        last_match_idx: int | None = None
        for idx, field_label in enumerate(self.field_labels):
            if field_label.field_name != field_name:
                continue
            caption_matches = (
                expected_caption is None
                or field_label.caption.lower() == expected_caption.lower()
            )
            last_match_idx = idx
            if not field_label.is_used and caption_matches:
                updated = field_label._replace(is_used=True)
                self.field_labels[idx] = updated
                return updated
        if last_match_idx is not None:
            updated = self.field_labels[last_match_idx]._replace(is_used=True)
            self.field_labels[last_match_idx] = updated
            return updated
        return None

    def __str__(self) -> str:
        indent_str = " " * indent
        inner_indent = " " * (indent + 2)
        if not self.field_labels:
            return (
                f"{indent_str}TableFieldLabels("
                f"table_name={self.table_name!r}, field_labels=[]"
                ")"
            )
        lines = [
            f"{indent_str}TableFieldLabels(",
            f"{indent_str}  table_name={self.table_name!r},",
            f"{indent_str}  field_labels=[",
        ]
        lines.extend(f"{inner_indent}{label}" for label in self.field_labels)
        lines.append(f"{indent_str}  ]")
        lines.append(f"{indent_str})")
        return "\n".join(lines)

    __repr__ = __str__

class BatchEditMetaTables:
    table_labels: dict[str, TableFieldLabels] = {}

    def __init__(self):
        self.table_labels = {}

    def __init__(self, localization_dump: dict[str, list[tuple[str, str, bool]]]):
        self.table_labels = {}
        for table_name, field_labels in localization_dump.items():
            table_field_labels = TableFieldLabels(table_name)
            for field_label in field_labels:
                table_field_labels.add_field_label(FieldLabel(field_label[0], field_label[1], field_label[2]))
            self.table_labels[table_name] = table_field_labels

    def add_field_label(self, table_name: str, field_label: FieldLabel):
        if table_name not in self.table_labels:
            self.table_labels[table_name] = TableFieldLabels(table_name)
        self.table_labels[table_name].add_field_label(field_label)

    def get_table_field_labels(self, table_name: str) -> TableFieldLabels | None:
        return self.table_labels.get(table_name, None)

    def get_all_table_names(self) -> list[str]:
        return list(self.table_labels.keys())

    def __str__(self) -> str:
        indent_str = " " * indent
        if not self.table_labels:
            return f"{indent_str}BatchEditMetaTables(table_labels={{}})"
        lines = [f"{indent_str}BatchEditMetaTables("]
        for table_name in sorted(self.table_labels.keys()):
            table_lines = self.table_labels[table_name].to_pretty_string(indent + 4)
            lines.append(f"{indent_str}  {table_name!r}:")
            lines.append(table_lines)
        lines.append(f"{indent_str})")
        return "\n".join(lines)

    __repr__ = __str__

class BatchEditProps(TypedDict):
    collection: Any
    user: Any
    contexttableid: int
    captions: Any
    limit: int | None
    recordsetid: int | None
    session_maker: Any
    fields: list[QueryField]
    omit_relationships: bool | None 
    treedefsfilter: Any
