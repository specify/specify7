import re
import math

from typing import Dict, List, Tuple, Any, NamedTuple, Union, Optional, Literal
from datetime import datetime
from decimal import Decimal

from specifyweb.specify import models
from specifyweb.specify.agent_types import agent_types
from specifyweb.stored_queries.format import get_date_format, MYSQL_TO_YEAR, MYSQL_TO_MONTH
from specifyweb.specify.datamodel import datamodel, Table, Field, Relationship
from specifyweb.specify.uiformatters import get_uiformatter, UIFormatter, FormatMismatch, ScopedFormatter

ParseFailureKey = Literal[
'valueTooLong',
'formatMismatch',

'failedParsingDecimal',
'failedParsingFloat',
'failedParsingBoolean',
'failedParsingAgentType',

'invalidYear',
'badDateFormat',

'coordinateBadFormat',
'latitudeOutOfRange',
'longitudeOutOfRange'
]

class ParseFailure(NamedTuple):
    message: ParseFailureKey
    payload: Dict[str, Any]

    def to_json(self) -> List:
        return list(self)


class ParseSucess(NamedTuple):
    to_upload: Dict[str, Any]


ParseResult = Union[ParseSucess, ParseFailure]


def parse_field(table_name: str, field_name: str, raw_value: str, formatter: Optional[ScopedFormatter] = None) -> ParseResult:
    table = datamodel.get_table_strict(table_name)
    field = table.get_field_strict(field_name)

    if field.is_relationship:
        return parse_integer(field.name, raw_value)

    if formatter is not None:
        return parse_formatted(formatter, table, field, raw_value)

    if is_latlong(table, field):
        return parse_latlong(field, raw_value)

    if is_agenttype(table, field):
        return parse_agenttype(raw_value)

    if field.is_temporal():
        date_format = get_date_format() or "%Y-%m-%d"
        return parse_date(table, field_name, date_format, raw_value)

    if field.type == "java.lang.Boolean":
        return parse_boolean(field_name, raw_value)

    if field.type == 'java.math.BigDecimal':
        return parse_decimal(field_name, raw_value)

    if field.type in ('java.lang.Float', 'java.lang.Double'):
        return parse_float(field_name, raw_value)

    if field.type in ('java.lang.Integer', 'java.lang.Long', 'java.lang.Byte', 'java.lang.Short'):
        return parse_integer(field_name, raw_value)

    if hasattr(field, 'length') and field.length is not None and len(raw_value) > field.length:
        return ParseFailure('valueTooLong', {'field': field_name, 'maxLength': field.length})

    return ParseSucess({field_name.lower(): raw_value})


def parse_string(value: str) -> Optional[str]:
    result = value.strip()
    if result == "":
        return None
    return result


def parse_integer(field_name: str, value: str) -> ParseResult:
    try:
        result = int(value)
    except ValueError as e:
        return ParseFailure('failedParsingDecimal', {'value': value, 'field': field_name})

    return ParseSucess({field_name.lower(): result})


def parse_float(field_name: str, value: str) -> ParseResult:
    try:
        result = float(value)
    except ValueError as e:
        return ParseFailure('failedParsingFloat', {'value': value, 'field': field_name})

    return ParseSucess({field_name.lower(): result})


def parse_decimal(field_name: str, value: str) -> ParseResult:
    try:
        result = Decimal(value)
    except Exception as e:
        return ParseFailure(
            'failedParsingDecimal',
            {'value': value, 'field': field_name}
        )

    return ParseSucess({field_name.lower(): result})


def parse_boolean(field_name: str, value: str) -> ParseResult:
    if value.lower() in ["yes", "true"]:
        result = True
    elif value.lower() in ["no", "false"]:
        result = False
    else:
        return ParseFailure(
            'failedParsingBoolean',
            {'value': value, 'field': field_name}
        )

    return ParseSucess({field_name.lower(): result})


def parse_date(table: Table, field_name: str, dateformat: str, value: str) -> ParseResult:
    if re.search('[0-9]{4}', value) is None:
        return ParseFailure('invalidYear', {'value': value})

    dateformat = dateformat.replace('%y', '%Y')
    precision_field = table.get_field(field_name + 'precision')
    if precision_field is None:
        try:
            date = datetime.strptime(value, dateformat).date()
        except ValueError:
            return ParseFailure('badDateFormat', {'value': value, 'format': dateformat})
        return ParseSucess({field_name.lower(): date})

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
            return ParseSucess({field_name.lower(): date, precision_field.name.lower(): 1})
        elif '%m' in df or '%b' in df:
            return ParseSucess({field_name.lower(): date.replace(day=1), precision_field.name.lower(): 2})
        else:
            return ParseSucess({field_name.lower(): date.replace(day=1, month=1), precision_field.name.lower(): 3})

    return ParseFailure('badDateFormat', {'value': value, 'format': dateformat})


def parse_formatted(uiformatter: ScopedFormatter, table: Table, field: Union[Field, Relationship], value: str) -> ParseResult:
    try:
        canonicalized = uiformatter(table, value)
    except FormatMismatch as e:
        return ParseFailure('formatMismatch', {'value': e.value, 'formatter': e.formatter})

    if hasattr(field, 'length') and len(canonicalized) > field.length:
        return ParseFailure('valueTooLong', {'maxLength': field.length})

    return ParseSucess({field.name.lower(): canonicalized})


def parse_agenttype(value: str) -> ParseResult:
    value = value.capitalize()
    try:
        agenttype = agent_types.index(value)
    except ValueError:
        return ParseFailure('failedParsingAgentType', {'badType': value, 'validTypes': agent_types})
    return ParseSucess({'agenttype': agenttype})


def is_latlong(table: Table, field: Field) -> bool:
    return table.name == 'Locality' \
        and field.name in ('latitude1', 'longitude1', 'latitude2', 'longitude2')


def is_agenttype(table: Table, field: Field) -> bool:
    return table.name == "Agent" and field.name.lower() == 'agenttype'


def parse_latlong(field: Field, value: str) -> ParseResult:
    parsed = parse_coord(value)

    if parsed is None:
        return ParseFailure('coordinateBadFormat', {'value': value})

    coord, unit = parsed
    if field.name.startswith('lat') and abs(coord) > 90:
        return ParseFailure("latitudeOutOfRange", {'value': value})

    if field.name.startswith('long') and abs(coord) > 180:
        return ParseFailure('longitudeOutOfRange', {'value': value})

    return ParseSucess({field.name.lower(): coord,
                        'originallatlongunit': unit,
                        field.name.lower().replace('itude', '') + 'text': parse_string(value)})


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
