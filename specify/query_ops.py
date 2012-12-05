from django.db.models import Q

def op_like(key, field):
    class Dummy(object):
        """Trick the django __contains lookup into doing an unescaped LIKE query"""
        def as_sql(self):
            return "%s", (field.startvalue,)
    return key + '__contains', Dummy()

def op_equals(key, field):
    return Q(*{key, field.startvalue})

def op_greaterthan(key, field):
    return Q(*{key + '__gt', field.startvalue})

def op_lessthan(key, field):
    return Q(*{key + '__lt', field.startvalue})

def op_greaterthanequals(key, field):
    return Q(*{key + '__gte', field.startvalue})

def op_lessthanequals(key, field):
    return Q(*{key + '__lte', field.startvalue})

def op_true(key, field):
    return Q(*{key, True})

def op_false(key, field):
    return Q(*{key, False})

def op_dontcare(key, field):
    return Q()

def op_between(key, field):
    return Q(*{key + '__range', field.startvalue.split(',')[:2]})

def op_in(key, field):
    return Q(*{key + '__in', field.startvalue.split(',')})

def op_contains(key, field):
    return Q(*{key + '__contains', field.startvalue})

def op_empty(key, field):
    return Q(*{key + '__exact', ''})

def op_trueornull(key, field):
    return Q(*{key: True}) | Q(*{key + '__isnull', True})

def op_falseornull(key, field):
    return Q(*{key: False}) | Q(*{key + '__isnull', True})

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

QUERY_OPS = [
    op_contains,
    op_like,
    op_equals,
    op_in,
    op_between,
    op_empty,
    ]

def make_filter(key, field):
    filtr = QUERY_OPS[field.operstart](key, field)
    return -filtr if field.isnot else filtr
