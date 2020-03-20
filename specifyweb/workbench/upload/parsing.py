import logging

from typing import Dict, Any, Optional
from dateparser import DateDataParser

from specifyweb.specify.datamodel import datamodel

logger = logging.getLogger(__name__)

def parse_value(tablename: str, fieldname: str, value: str) -> Dict[str, Any]:
    value = value.strip()
    if value == "":
        return {fieldname: None}

    table = datamodel.get_table(tablename)
    field = table.get_field(fieldname)

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
