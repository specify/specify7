
import logging
import math
import re
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional, List, NamedTuple, Tuple, Union, NoReturn

from django.core.exceptions import ObjectDoesNotExist

from specifyweb.specify import models
from specifyweb.specify.datamodel import datamodel, Table
from specifyweb.specify.uiformatters import FormatMismatch
from specifyweb.stored_queries.format import MYSQL_TO_YEAR, MYSQL_TO_MONTH
from .column_options import ExtendedColumnOptions

Row = Dict[str, str]
Filter = Dict[str, Any]

logger = logging.getLogger(__name__)

class PicklistAddition(NamedTuple):
    picklist: Any
    column: str
    value: str

class ParseFailure(NamedTuple):
    message: str
    payload: Dict[str, Union[str, int, List[str], List[int]]]
    column: str

    def to_json(self) -> List:
        return list(self)

class ParseResult(NamedTuple):
    filter_on: Filter
    upload: Dict[str, Any]
    add_to_picklist: Optional[PicklistAddition]
    column: str
    missing_required: Optional[str]

    def match_key(self) -> str:
        from .uploadable import filter_match_key
        return filter_match_key(self.filter_on)

def filter_and_upload(f: Filter, column: str) -> ParseResult:
    return ParseResult(f, f, None, column, None)

def parse_many(collection, tablename: str, mapping: Dict[str, ExtendedColumnOptions], row: Row) -> Tuple[List[ParseResult], List[ParseFailure]]:
    results = [
        parse_value(collection, tablename, fieldname, row[colopts.column], colopts)
        for fieldname, colopts in mapping.items()
    ]
    return (
        [r for r in results if isinstance(r, ParseResult)],
        [r for r in results if isinstance(r, ParseFailure)]
    )

def parse_value(collection, tablename: str, fieldname: str, value_in: str, colopts: ExtendedColumnOptions) -> Union[ParseResult, ParseFailure]:
    required_by_schema = colopts.schemaitem and colopts.schemaitem.isrequired

    result: Union[ParseResult, ParseFailure]
    was_blank = value_in.strip() == ""
    if was_blank:
        if colopts.default is None:
            missing_required = (
                "field is required by upload plan mapping" if not colopts.nullAllowed else
                "field is required by schema config" if required_by_schema else
                None
            )
            result = ParseResult({fieldname: None}, {}, None, colopts.column, missing_required)
        else:
            result = _parse(collection, tablename, fieldname, colopts, colopts.default)
    else:
        result = _parse(collection, tablename, fieldname, colopts, value_in.strip())

    if isinstance(result, ParseFailure):
        return result

    if colopts.matchBehavior == "ignoreAlways":
        return result._replace(filter_on={})

    elif colopts.matchBehavior == "ignoreWhenBlank":
        return result._replace(filter_on={}) if was_blank else result

    elif colopts.matchBehavior == "ignoreNever":
        return result

    else:
        assertNever(colopts.matchBehavior)


def _parse(collection, tablename: str, fieldname: str, colopts: ExtendedColumnOptions, value: str) -> Union[ParseResult, ParseFailure]:
    if tablename.lower() == 'agent' and fieldname.lower() == 'agenttype':
        return parse_agenttype(value, colopts.column)

    table = datamodel.get_table_strict(tablename)
    field = table.get_field_strict(fieldname)

    if colopts.picklist:
        result = parse_with_picklist(collection, colopts.picklist, fieldname, value, colopts.column)
        if result is not None:
            if isinstance(result, ParseResult) and hasattr(field, 'length') and len(result.upload[fieldname]) > field.length:
                return ParseFailure(
                    'pickListValueTooLong',
                    {
                        'pickList': colopts.picklist.name,
                        'maxLength': field.length,
                    },
                    colopts.column
                )
            return result

    if field.is_relationship:
        return parse_integer(fieldname, value, colopts.column)

    if colopts.uiformatter:
        try:
            parsed = colopts.uiformatter.parse(value)
        except FormatMismatch as e:
            return ParseFailure(e.args[0], {}, colopts.column)

        if colopts.uiformatter.needs_autonumber(parsed):
            canonicalized = colopts.uiformatter.autonumber_now(collection, getattr(models, tablename.capitalize()), parsed)
        else:
            canonicalized = colopts.uiformatter.canonicalize(parsed)

        if hasattr(field, 'length') and len(canonicalized) > field.length:
            return ParseFailure('valueTooLong',{'maxLength':field.length}, colopts.column)

        return filter_and_upload({fieldname: canonicalized}, colopts.column)

    if is_latlong(table, field):
        return parse_latlong(field, value, colopts.column)

    if field.is_temporal():
        return parse_date(table, fieldname, colopts.dateformat or "%Y-%m-%d", value, colopts.column)

    if field.type == "java.lang.Boolean":
        return parse_boolean(fieldname, value, colopts.column)

    if field.type == 'java.math.BigDecimal':
        return parse_decimal(fieldname, value, colopts.column)

    if field.type in ('java.lang.Float', 'java.lang.Double'):
        return parse_float(fieldname, value, colopts.column)

    if field.type in ('java.lang.Integer', 'java.lang.Long', 'java.lang.Byte', 'java.lang.Short'):
        return parse_integer(fieldname, value, colopts.column)

    if hasattr(field, 'length') and len(value) > field.length:
        return ParseFailure('valueTooLong', {'maxLength':field.length}, colopts.column)

    return filter_and_upload({fieldname: value}, colopts.column)

def parse_boolean(fieldname: str, value: str, column: str) -> Union[ParseResult, ParseFailure]:
    if value.lower() in ["yes", "true"]:
        result = True
    elif value.lower() in ["no", "false"]:
        result = False
    else:
        return ParseFailure(
            'failedParsingBoolean',
            {'value': value},
            column
        )

    return filter_and_upload({fieldname: result}, column)

def parse_decimal(fieldname: str, value: str, column) -> Union[ParseResult, ParseFailure]:
    try:
        result = Decimal(value)
    except Exception as e:
        return ParseFailure(
            'failedParsingDecimal',
            {'value': value},
            column
        )

    return filter_and_upload({fieldname: result}, column)

def parse_float(fieldname: str, value: str, column) -> Union[ParseResult, ParseFailure]:
    try:
        result = float(value)
    except ValueError as e:
        return ParseFailure('failedParsingFloat', {'value': value}, column)

    return filter_and_upload({fieldname: result}, column)

def parse_integer(fieldname: str, value: str, column: str) -> Union[ParseResult, ParseFailure]:
    try:
        result = int(value)
    except ValueError as e:
        return ParseFailure('failedParsingDecimal', {'value': value}, column)

    return filter_and_upload({fieldname: result}, column)

def parse_with_picklist(collection, picklist, fieldname: str, value: str, column: str) -> Union[ParseResult, ParseFailure, None]:
    if picklist.type == 0: # items from picklistitems table
        try:
            item = picklist.picklistitems.get(title=value)
            return filter_and_upload({fieldname: item.value}, column)
        except ObjectDoesNotExist:
            if picklist.readonly:
                return ParseFailure(
                    'failedParsingPickList',
                    {'value': value},
                    column
                )
            else:
                return filter_and_upload({fieldname: value}, column)._replace(
                    add_to_picklist=PicklistAddition(picklist=picklist, column=column, value=value)
                )
            return filter_and_upload({fieldname: value})

    elif picklist.type == 1: # items from rows in some table
        # we ignore this type of picklist because it is primarily used to choose many-to-one's on forms
        # so it is not expected to appear on actual fields
        return None

    elif picklist.type == 2: # items from a field in some table
        # this picklist type is rarely used and seems mostly for convenience on forms to allow
        # quickly selecting existing values from other rows in the same table. e.g. moleculeType
        return None

    else:
        raise NotImplementedError("unknown picklist type {}".format(picklist.type))

def parse_agenttype(value: str, column: str) -> Union[ParseResult, ParseFailure]:
    agenttypes = ['Organization', 'Person', 'Other', 'Group']

    value = value.capitalize()
    try:
        agenttype = agenttypes.index(value)
    except ValueError:
        return ParseFailure('failedParsingAgentType', {'badType': value, 'validTypes': agenttypes}, column)
    return filter_and_upload({'agenttype': agenttype}, column)

def parse_date(table: Table, fieldname: str, dateformat: str, value: str, column: str) -> Union[ParseResult, ParseFailure]:
    if re.search('[0-9]{4}', value) is None:
        return ParseFailure('invalidYear',{'value':value}, column)

    dateformat = dateformat.replace('%y', '%Y')
    precision_field = table.get_field(fieldname + 'precision')
    if precision_field is None:
        try:
            date = datetime.strptime(value, dateformat).date()
        except ValueError:
            return ParseFailure('badDateFormat', {'value':value,'format':dateformat}, column)
        return filter_and_upload({fieldname: date}, column)

    date_formats = [
        dateformat,
        MYSQL_TO_MONTH[dateformat],
        MYSQL_TO_YEAR[dateformat],
        dateformat.replace('%d', '00'),
        re.sub('(%m)|(%d)', '00', dateformat),
    ]

    for df in date_formats:
        try:
            date = datetime.strptime(value, df).date()
        except ValueError:
            continue
        if '%d' in df:
            return filter_and_upload({fieldname: date, precision_field.name.lower(): 1}, column)
        elif '%m' in df or '%b' in df:
            return filter_and_upload({fieldname: date.replace(day=1), precision_field.name.lower(): 2}, column)
        else:
            return filter_and_upload({fieldname: date.replace(day=1, month=1), precision_field.name.lower(): 3}, column)

    return ParseFailure('badDateFormat', {'value':value, 'format':dateformat}, column)

def parse_string(value: str) -> Optional[str]:
    result = value.strip()
    if result == "":
        return None
    return result

def is_latlong(table, field) -> bool:
    return table.name == 'Locality' \
        and field.name in ('latitude1', 'longitude1', 'latitude2', 'longitude2')

def parse_latlong(field, value: str, column: str) -> Union[ParseResult, ParseFailure]:
    parsed = parse_coord(value)

    if parsed is None:
        return ParseFailure('coordinateBadFormat', {'value':value}, column)

    coord, unit = parsed
    if field.name.startswith('lat') and abs(coord) >= 90:
        return ParseFailure('latitudeOutOfRange', {'value':value}, column)

    if field.name.startswith('long') and abs(coord) >= 180:
        return ParseFailure('longitudeOutOfRange', {'value': value}, column)

    text_filter = {field.name.replace('itude', '') + 'text': parse_string(value)}
    return ParseResult(
        text_filter,
        {field.name: coord, 'originallatlongunit': unit, **text_filter},
        None,
        column,
        None
    )


def parse_coord(value: str) -> Optional[Tuple[float, int]]:
    for p in LATLONG_PARSER_DEFS:
        match = re.compile(p.regex, re.I).match(value)
        if match and match.group(1):
            try:
                # relies on signed zeros in floats
                # see https://docs.python.org/3/library/math.html#math.copysign
                comps = [float(match.group(i)) for i in p.comp_groups]
            except ValueError:
                continue
            result, divisor = 0.0, 1
            for comp in comps:
                result += abs(comp) / divisor
                divisor *= 60
            result = math.copysign(result, comps[0])
            if match.group(p.dir_group).lower() in ("s", "w"):
                result = -result
            return (result, p.unit)
    return None

class LatLongParserDef(NamedTuple):
    regex: str
    comp_groups: List[int]
    dir_group: int
    unit: int

LATLONG_PARSER_DEFS = [
    LatLongParserDef(
        r'^(-?\d{0,3}(\.\d*)?)[^\d\.nsew]*([nsew]?)$',
        [1],
        3,
        0
    ),

    LatLongParserDef(
        r'^(-?\d{1,3})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$',
        [1, 2],
        4,
        2
    ),

    LatLongParserDef(
        r'^(-?\d{1,3})[^\d\.]+(\d{1,2})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$',
        [1, 2, 3],
        5,
        1
    ),
]


def assertNever(x: NoReturn) -> NoReturn:
    assert False, f"unhandled type {x}"
