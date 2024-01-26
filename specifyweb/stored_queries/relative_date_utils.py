from datetime import datetime, timedelta
import re


relative_date_re = "today\s*([+-])\s*(\d+)\s*(second|minute|hour|day|week|month|year)"
def apply_absolute_date(query_field):
    if query_field.fieldspec.date_part is None or query_field.fieldspec.date_part != 'Full Date':
        return query_field

    field_value = query_field.value
    new_field_value = ','.join([relative_to_absolute_date(value_split) for value_split in field_value.split(',')])
    return query_field._replace(value=new_field_value)

def relative_to_absolute_date(raw_date_value):
    date_parse = re.findall(relative_date_re, raw_date_value)
    if len(date_parse) == 0:
        return raw_date_value

    direction = date_parse[0][0]
    size = date_parse[0][1]
    type = date_parse[0][2]
    offset = (1 if direction == '+' else -1) * int(size)
    delta = timedelta()
    if type == 'second':
        delta = timedelta(seconds=offset)
    elif type == 'minute':
        delta = timedelta(minutes=offset)
    elif type == 'hour':
        delta = timedelta(hours=offset)
    elif type == 'day':
        delta = timedelta(days=offset)
    elif type == 'week':
        delta = timedelta(weeks=offset)
    elif type == 'month':
        delta = timedelta(days=offset * 30)
    elif type == 'year':
        delta = timedelta(days=offset * 365)
    timenow = datetime.now()
    newtime = timenow + delta
    return newtime.date().isoformat()
