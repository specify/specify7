
import logging
import math
import re

from typing import Dict, Any, Optional, List, NamedTuple, Tuple
from dateparser import DateDataParser

from specifyweb.specify.datamodel import datamodel

from .data import Filter

logger = logging.getLogger(__name__)

class ParseResult(NamedTuple):
    filter_on: Filter
    upload: Dict[str, Any]

def filter_and_upload(f: Filter) -> ParseResult:
    return ParseResult(f, f)

def parse_value(tablename: str, fieldname: str, value: str) -> ParseResult:
    value = value.strip()
    if value == "":
        return ParseResult({fieldname: None}, {})

    table = datamodel.get_table(tablename)
    field = table.get_field(fieldname)

    if is_latlong(table, field):
        return parse_latlong(field, value)

    if field.is_temporal():
        precision_field = table.get_field(fieldname + 'precision')
        parsed = DateDataParser(settings={
            'PREFER_DAY_OF_MONTH': 'first',
            'PREFER_DATES_FROM': 'past',
            'STRICT_PARSING': precision_field is None,
        }).get_date_data(value)

        if parsed['date_obj'] is None:
            raise Exception("bad date value: {}".format(value))

        if precision_field is None:
            if parsed['period'] == 'day':
                return filter_and_upload({fieldname: parsed['date_obj']})
            else:
                raise Exception("bad date value: {}".format(value))
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
                raise Exception('expected date precision to be day month or year. got: {}'.format(prec))
    else:
        return filter_and_upload({fieldname: value})


def parse_string(value: str) -> Optional[str]:
    result = value.strip()
    if result == "":
        return None
    return result

def is_latlong(table, field) -> bool:
    return table.name == 'Locality' \
        and field.name in ('latitude1', 'longitude1', 'latitude2', 'longitude2')

def parse_latlong(field, value: str) -> ParseResult:
    coord, unit = parse_coord(value)

    if coord is None:
        raise Exception('bad latitude or longitude value: {}'.format(value))

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
