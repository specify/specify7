import logging
from typing import Dict, Any, Optional, List, NamedTuple, Tuple, Union, NoReturn

from django.core.exceptions import ObjectDoesNotExist

from specifyweb.specify.datamodel import datamodel
from specifyweb.workbench.upload.predicates import filter_match_key
from .column_options import ExtendedColumnOptions
from specifyweb.specify.parse import parse_field, is_latlong, ParseSucess, ParseFailure

Row = Dict[str, str]
Filter = Dict[str, Any]

logger = logging.getLogger(__name__)


class PicklistAddition(NamedTuple):
    picklist: Any
    column: str
    value: str


class WorkBenchParseFailure(NamedTuple):
    message: str
    payload: Dict[str, Union[str, int, List[str], List[int]]]
    column: str

    @classmethod
    def from_parse_failure(cls, pf: ParseFailure, column: str):
        return cls(message=pf.message, payload=pf.payload, column=column)

    def to_json(self) -> List:
        return list(self)

class ParseResult(NamedTuple):
    filter_on: Filter
    upload: Filter
    add_to_picklist: Optional[PicklistAddition]
    column: str
    missing_required: Optional[str]

    @classmethod
    def from_parse_success(cls, ps: ParseSucess, filter_on: Filter, add_to_picklist: Optional[PicklistAddition], column: str, missing_required: Optional[str]):
        return cls(filter_on=filter_on, upload=ps.to_upload, add_to_picklist=add_to_picklist, column=column, missing_required=missing_required)

    def match_key(self) -> str:
        return filter_match_key(self.filter_on)


def filter_and_upload(f: Filter, column: str) -> ParseResult:
    return ParseResult(f, f, None, column, None)


def parse_many(tablename: str, mapping: Dict[str, ExtendedColumnOptions], row: Row) -> Tuple[List[ParseResult], List[WorkBenchParseFailure]]:
    results = [
        parse_value(tablename, fieldname,
                    row[colopts.column], colopts)
        for fieldname, colopts in mapping.items()
    ]
    return (
        [r for r in results if isinstance(r, ParseResult)],
        [r for r in results if isinstance(r, WorkBenchParseFailure)]
    )


def parse_value(tablename: str, fieldname: str, value_in: str, colopts: ExtendedColumnOptions) -> Union[ParseResult, WorkBenchParseFailure]:
    required_by_schema = colopts.schemaitem and colopts.schemaitem.isrequired

    result: Union[ParseResult, WorkBenchParseFailure]
    was_blank = value_in.strip() == ""
    if was_blank:
        if colopts.default is None:
            missing_required = (
                "field is required by upload plan mapping" if not colopts.nullAllowed else
                "field is required by schema config" if required_by_schema else
                None
            )
            result = ParseResult({fieldname: None}, {fieldname: None},
                                 None, colopts.column, missing_required)
        else:
            result = _parse(tablename, fieldname,
                            colopts, colopts.default)
    else:
        result = _parse(tablename, fieldname,
                        colopts, value_in.strip())

    if isinstance(result, WorkBenchParseFailure):
        return result

    if colopts.matchBehavior == "ignoreAlways":
        return result._replace(filter_on={})

    elif colopts.matchBehavior == "ignoreWhenBlank":
        return result._replace(filter_on={}) if was_blank else result

    elif colopts.matchBehavior == "ignoreNever":
        return result

    else:
        assertNever(colopts.matchBehavior)


def _parse(tablename: str, fieldname: str, colopts: ExtendedColumnOptions, value: str) -> Union[ParseResult, WorkBenchParseFailure]:
    table = datamodel.get_table_strict(tablename)
    field = table.get_field_strict(fieldname)

    if colopts.picklist:
        result = parse_with_picklist(colopts.picklist, fieldname, value, colopts.column)
        if result is not None:
            if isinstance(result, ParseResult) and hasattr(field, 'length') and field.length is not None and len(result.upload[fieldname]) > field.length:
                return WorkBenchParseFailure(
                    'pickListValueTooLong',
                    {
                        'pickList': colopts.picklist.name,
                        'maxLength': field.length if field.length is not None else 0,
                    },
                    colopts.column
                )
            return result

    formatter = colopts.uiformatter
    parsed = parse_field(tablename, fieldname, value, formatter)

    if is_latlong(table, field) and isinstance(parsed, ParseSucess):
        coord_text_field = field.name.replace('itude', '') + 'text'
        filter_on = {coord_text_field: parsed.to_upload[coord_text_field]}
        return ParseResult.from_parse_success(parsed, filter_on, None, colopts.column, None)

    if isinstance(parsed, ParseFailure):
        return WorkBenchParseFailure.from_parse_failure(parsed, colopts.column)
    else:
        return ParseResult.from_parse_success(parsed, parsed.to_upload, None, colopts.column, None)


def parse_with_picklist(picklist, fieldname: str, value: str, column: str) -> Union[ParseResult, WorkBenchParseFailure, None]:
    if picklist.type == 0:  # items from picklistitems table
        try:
            item = picklist.picklistitems.get(title=value)
            return filter_and_upload({fieldname: item.value}, column)
        except ObjectDoesNotExist:
            if picklist.readonly:
                return WorkBenchParseFailure(
                    'failedParsingPickList',
                    {'value': value},
                    column
                )
            else:
                return filter_and_upload({fieldname: value}, column)._replace(
                    add_to_picklist=PicklistAddition(
                        picklist=picklist, column=column, value=value)
                )
            return filter_and_upload({fieldname: value})

    elif picklist.type == 1:  # items from rows in some table
        # we ignore this type of picklist because it is primarily used to choose many-to-one's on forms
        # so it is not expected to appear on actual fields
        return None

    elif picklist.type == 2:  # items from a field in some table
        # this picklist type is rarely used and seems mostly for convenience on forms to allow
        # quickly selecting existing values from other rows in the same table. e.g. moleculeType
        return None

    else:
        raise NotImplementedError(
            "unknown picklist type {}".format(picklist.type))


def assertNever(x: NoReturn) -> NoReturn:
    assert False, f"unhandled type {x}"
