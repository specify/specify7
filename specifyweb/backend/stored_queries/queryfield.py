from __future__ import annotations

from email.policy import strict
import logging
from collections import namedtuple
from typing import Any, NamedTuple, Literal, TYPE_CHECKING

from .query_ops import QueryOps, QUERYFIELD_OPERATION_NUMBER

if TYPE_CHECKING:
    from .queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)

QUREYFIELD_SORT_T = Literal[
    0,  # NONE
    1,  # Ascending
    2  # Descending
]

# REFACTOR: Base QueryField from this class, or merge the two classes
class EphemeralField(NamedTuple):
    stringId: str
    isRelFld: bool
    operStart: QUERYFIELD_OPERATION_NUMBER
    startValue: str
    isNot: bool
    isDisplay: bool
    sortType: QUREYFIELD_SORT_T
    formatName: str
    isStrict: bool


def fields_from_json(json_fields) -> list["QueryField"]:
    """Given deserialized json data representing an array of SpQueryField
    records, return an array of QueryField objects that can build the
    corresponding sqlalchemy query.
    """

    def ephemeral_field_from_json(json: dict[str, Any]):
        return EphemeralField(
            **{field: json.get(field.lower(), None) for field in EphemeralField._fields}
        )

    field_specs = [
        QueryField.from_spqueryfield(ephemeral_field_from_json(data))
        for data in sorted(json_fields, key=lambda field: field["position"])
    ]

    return field_specs


class QueryField(NamedTuple):
    fieldspec: QueryFieldSpec
    op_num: QUERYFIELD_OPERATION_NUMBER
    value: str | None
    negate: bool
    display: bool
    format_name: str | None
    sort_type: QUREYFIELD_SORT_T
    strict: bool = False

    @classmethod
    def from_spqueryfield(cls, field: EphemeralField, value: str | None=None):
        from .queryfieldspec import QueryFieldSpec

        logger.info("processing field from %r", field)
        fieldspec = QueryFieldSpec.from_stringid(
            field.stringId, field.isRelFld)

        if field.isRelFld:
            # force no filtering on formatted / aggregated fields
            value = ""

        return cls(
            fieldspec=fieldspec,
            op_num=field.operStart,
            value=field.startValue if value is None else value,
            negate=field.isNot,
            display=field.isDisplay,
            format_name=field.formatName,
            sort_type=field.sortType,
            strict=field.isStrict,
        )

    def add_to_query(self, query, no_filter=False, formatauditobjs=False, collection=None, user=None, optimize_tree=True):
        from .queryfieldspec import TreeRankQuery

        logger.info("adding field %s", self)
        value_required_for_filter = QueryOps.OPERATIONS[self.op_num] not in (
            "op_true",  # 6
            "op_false",  # 7
            "op_empty",  # 12
            "op_trueornull",  # 13
            "op_falseornull",  # 14
        )

        no_filter = no_filter or (
            self.value == "" and value_required_for_filter and not self.negate
        )

        # Positive scalar filters reject missing ancestors, allowing MariaDB to
        # start at the matching rank instead of walking up from every specimen.
        # Empty/negated filters need the existing missing-ancestor semantics;
        # relationship paths and date transformations retain their usual joins.
        path = self.fieldspec.join_path
        use_tree_range = (
            optimize_tree
            and not no_filter
            and not self.negate
            and (not value_required_for_filter or isinstance(self.value, str))
            and self.op_num in {0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 15, 18}
            and len(path) >= 2
            and isinstance(path[-2], TreeRankQuery)
            and not path[-1].is_relationship
            and sum(isinstance(part, TreeRankQuery) for part in path) == 1
            and self.fieldspec.date_part is None
        )
        # Exact matches can start at the matching ancestor and range over its
        # descendants. Other operators share a descendant-to-rank lookup so
        # they do not repeatedly walk every node's parent chain.
        use_rank_lookup = use_tree_range and self.op_num != 1

        return self.fieldspec.add_to_query(
            query,
            value=self.value,
            op_num=None if no_filter else self.op_num,
            negate=self.negate,
            formatter=self.format_name,
            formatauditobjs=formatauditobjs,
            strict=self.strict,
            collection=collection,
            user=user,
            use_tree_range=use_tree_range,
            use_rank_lookup=use_rank_lookup,
        )
