import re

from django.db.models import Q

def op_like(key, value):
    class Dummy(object):
        """Trick the django __contains lookup into doing an unescaped LIKE query"""
        def as_sql(self):
            return "%s", (value,)
    return Q(**{key + '__contains': Dummy()})

def op_equals(key, value):
    return Q(**{key: value})

def op_greaterthan(key, value):
    return Q(**{key + '__gt': value})

def op_lessthan(key, value):
    return Q(**{key + '__lt': value})

def op_greaterthanequals(key, value):
    return Q(**{key + '__gte': value})

def op_lessthanequals(key, value):
    return Q(**{key + '__lte': value})

def op_true(key, value):
    return Q(**{key: True})

def op_false(key, value):
    return Q(**{key: False})

def op_dontcare(key, value):
    return Q()

def op_between(key, value):
    return Q(**{key + '__range': value.split(',')[:2]})

def op_in(key, value):
    return Q(**{key + '__in': value.split(',')})

def op_contains(key, value):
    return Q(**{key + '__contains': value})

def op_empty(key, value):
    return Q(**{key + '__exact': ''})

def op_trueornull(key, value):
    return Q(**{key: True}) | Q(**{key + '__isnull': True})

def op_falseornull(key, value):
    return Q(**{key: False}) | Q(**{key + '__isnull': True})

DATE_PART_RE = re.compile(r'(.*)((numericday)|(numericmonth)|(numericyear))$')
DATE_PART_OPS = {
    'day': lambda key, val: Q(**{key + '__day': val}),
    'month': lambda key, val: Q(**{key + '__month': val}),
    'year': lambda key, val: Q(**{key + '__year': val}),
    }

def key_to_key_and_date_part(key):
    match = DATE_PART_RE.match(key)
    if match:
        key, date_part = match.groups()[:2]
        date_part = date_part.replace('numeric', '')
    else:
        date_part = None
    return key, date_part

def make_filter(model, key, op_num, value, negate):
    if isinstance(value, basestring) and len(value.strip()) == 0:
        return Q()

    key, date_part = key_to_key_and_date_part(key)

    op = OPERATIONS[op_num]

    if date_part is not None:
        assert op is op_equals, 'only equality is supported for now'
        op = DATE_PART_OPS[date_part]

    filtr = op(key, value)
    return -filtr if negate else filtr

OPERATIONS = [
    op_like,
    op_equals,
    op_greaterthan,
    op_lessthan,
    op_greaterthanequals,
    op_lessthanequals,
    op_true,
    op_false,
    op_dontcare,
    op_between,
    op_in,
    op_contains,
    op_empty,
    op_trueornull,
    op_falseornull,
    ]
