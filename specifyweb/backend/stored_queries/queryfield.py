from email.policy import strict
import logging
from collections import namedtuple
from typing import Any, NamedTuple

from .query_ops import QueryOps
from .queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)

EphemeralField = namedtuple(
    "EphemeralField",
    "stringId isRelFld operStart startValue isNot isDisplay sortType formatName isStrict",
)


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
    op_num: int
    value: str | None
    negate: bool
    display: bool
    format_name: str | None
    sort_type: int
    strict: bool = False

    @classmethod
    def from_spqueryfield(cls, field: EphemeralField, value=None):
        logger.info("processing field from %r", field)
        fieldspec = QueryFieldSpec.from_stringid(field.stringId, field.isRelFld)

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

    def add_to_query(self, query, no_filter=False, formatauditobjs=False, collection=None, user=None):
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
        )
