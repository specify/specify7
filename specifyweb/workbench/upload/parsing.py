
import logging
import math
import re

from typing import Dict, Any, Optional, List, NamedTuple
from dateparser import DateDataParser

from specifyweb.specify.datamodel import datamodel

logger = logging.getLogger(__name__)

def parse_value(tablename: str, fieldname: str, value: str) -> Dict[str, Any]:
    value = value.strip()
    if value == "":
        return {fieldname: None}

    table = datamodel.get_table(tablename)
    field = table.get_field(fieldname)

    if table.name == 'Locality' and field.name in ('latitude1', 'longitude1', 'latitude2', 'longitude2'):
        latlong = parse_latlong(value)
        if latlong is None:
            raise Exception('bad latitude or longitude value: {}'.format(value))
        return {fieldname: latlong}

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
                return {fieldname: parsed['date_obj']}
            else:
                raise Exception("bad date value: {}".format(value))
        else:
            prec = parsed['period']
            date = parsed['date_obj']
            if prec == 'day':
                return {fieldname: date, precision_field.name.lower(): 0}
            elif prec == 'month':
                return {fieldname: date.replace(day=1), precision_field.name.lower(): 1}
            elif prec == 'year':
                return {fieldname: date.replace(day=1, month=1), precision_field.name.lower(): 2}
            else:
                raise Exception('expected date precision to be day month or year. got: {}'.format(prec))
    else:
        return {fieldname: value}


def parse_string(value: str) -> Optional[str]:
    result = value.strip()
    if result == "":
        return None
    return result

def parse_latlong(value: str) -> Optional[float]:
    for p in LATLONG_PARSER_DEFS:
        match = re.compile(p.regex, re.I).match(value)
        if match and match.group(1):
            comps = [float(match.group(i)) for i in p.comp_groups]
            result, divisor = 0, 1
            for comp in comps:
                result += abs(comp) / divisor
                divisor *= 60
            result = math.copysign(result, comps[0])
            if match.group(p.dir_group).lower() in ("s", "w"):
                result = -result
            return result
    return None

class LatLongParserDef(NamedTuple):
    regex: str
    comp_groups: List[int]
    dir_group: int

LATLONG_PARSER_DEFS = [
    LatLongParserDef(
        r'^(-?\d{0,3}(\.\d*)?)[^\d\.nsew]*([nsew]?)$',
        [1],
        3
    ),

    LatLongParserDef(
        r'^(-?\d{1,3})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$',
        [1, 2],
        4
    ),

    LatLongParserDef(
        r'^(-?\d{1,3})[^\d\.]+(\d{1,2})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$',
        [1, 2, 3],
        5
    ),
]
