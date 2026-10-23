from datetime import datetime, timedelta
import re


relative_date_re = r"today\s*([+-])\s*(\d+)\s*(second|minute|hour|day|week|month|year)"

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
