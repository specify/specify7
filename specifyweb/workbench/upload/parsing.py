
import logging
import math
import re

from typing import Dict, Any, Optional, List, NamedTuple, Tuple, Union
from dateparser import DateDataParser # type: ignore

from specifyweb.specify.datamodel import datamodel, Table
from specifyweb.specify.uiformatters import get_uiformatter

from .data import Filter, Row
from .validation_schema import CellIssue

logger = logging.getLogger(__name__)

class ParseFailure(NamedTuple):
    message: str

class ParseResult(NamedTuple):
    filter_on: Filter
    upload: Dict[str, Any]

def filter_and_upload(f: Filter) -> ParseResult:
    return ParseResult(f, f)

def parse_many(collection, tablename: str, mapping: Dict[str, str], row: Row) -> Tuple[List[ParseResult], List[CellIssue]]:
    results = [
        (caption, parse_value(collection, tablename, fieldname, row[caption]))
        for fieldname, caption in mapping.items()
    ]
    return (
        [r for _, r in results if isinstance(r, ParseResult)],
        [CellIssue(c, r.message) for c, r in results if isinstance(r, ParseFailure)]
    )

def parse_value(collection, tablename: str, fieldname: str, value: str) -> Union[ParseResult, ParseFailure]:
    value = value.strip()
    if value == "":
        return ParseResult({fieldname: None}, {})

    uiformatter = get_uiformatter(collection, tablename, fieldname)
    if uiformatter:
        canonicalized = uiformatter.canonicalize(uiformatter.parse(value))
        return filter_and_upload({fieldname: canonicalized})

    table = datamodel.get_table_strict(tablename)
    field = table.get_field_strict(fieldname)

    if is_latlong(table, field):
        return parse_latlong(field, value)

    if field.is_temporal():
        return parse_date(table, fieldname, value)

    return filter_and_upload({fieldname: value})

def parse_date(table: Table, fieldname: str, value: str) -> Union[ParseResult, ParseFailure]:
    precision_field = table.get_field(fieldname + 'precision')
    parsed = DateDataParser(
        settings={
            'PREFER_DAY_OF_MONTH': 'first',
            'PREFER_DATES_FROM': 'past',
            'STRICT_PARSING': precision_field is None,
        },
    ).get_date_data(value, date_formats=['%d/%m/%Y', '00/%m/%Y'])

    if parsed['date_obj'] is None:
        return ParseFailure("bad date value: {}".format(value))

    if precision_field is None:
        if parsed['period'] == 'day':
            return filter_and_upload({fieldname: parsed['date_obj']})
        else:
            return ParseFailure("bad date value: {}".format(value))
    else:
        prec = parsed['period']
        date = parsed['date_obj']
        if prec == 'day':
            return filter_and_upload({fieldname: date, precision_field.name.lower(): 0})
        elif prec == 'month':
            return filter_and_upload({fieldname: date.replace(day=1), precision_field.name.lower(): 1})
        elif prec == 'year':
            return filter_and_upload({fieldname: date.replace(day=1, month=1), precision_field.name.lower(): 2})
        else:
            return ParseFailure('expected date precision to be day month or year. got: {}'.format(prec))


def parse_string(value: str) -> Optional[str]:
    result = value.strip()
    if result == "":
        return None
    return result

def is_latlong(table, field) -> bool:
    return table.name == 'Locality' \
        and field.name in ('latitude1', 'longitude1', 'latitude2', 'longitude2')

def parse_latlong(field, value: str) -> Union[ParseResult, ParseFailure]:
    parsed = parse_coord(value)

    if parsed is None:
        return ParseFailure('bad latitude or longitude value: {}'.format(value))

    coord, unit = parsed
    text_filter = {field.name.replace('itude', '') + 'text': parse_string(value)}
    return ParseResult(text_filter,
                       {field.name: coord, 'originallatlongunit': unit, **text_filter})


def parse_coord(value: str) -> Optional[Tuple[float, int]]:
    for p in LATLONG_PARSER_DEFS:
        match = re.compile(p.regex, re.I).match(value)
        if match and match.group(1):
            comps = [float(match.group(i)) for i in p.comp_groups]
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
