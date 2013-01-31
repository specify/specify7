
class QueryOps(object):
    OPERATIONS = [
        'op_like',              # 0
        'op_equals',            # 1
        'op_greaterthan',       # 2
        'op_lessthan',          # 3
        'op_greaterthanequals', # 4
        'op_lessthanequals',    # 5
        'op_true',              # 6
        'op_false',             # 7
        'op_dontcare',          # 8
        'op_between',           # 9
        'op_in',                # 10
        'op_contains',          # 11
        'op_empty',             # 12
        'op_trueornull',        # 13
        'op_falseornull',       # 14
        ]

    def __init__(self, Q):
        self.Q = Q

    def by_op_num(self, op_num):
        return getattr(self, self.OPERATIONS[op_num])

    def op_like(self, key, value):
        class Dummy(object):
            """Trick the django __contains lookup into doing an unescaped LIKE query"""
            def as_sql(self):
                return "%s", (value,)
        return self.Q(**{key + '__contains': Dummy()})

    def op_equals(self, key, value):
        return self.Q(**{key: value})

    def op_greaterthan(self, key, value):
        return self.Q(**{key + '__gt': value})

    def op_lessthan(self, key, value):
        return self.Q(**{key + '__lt': value})

    def op_greaterthanequals(self, key, value):
        return self.Q(**{key + '__gte': value})

    def op_lessthanequals(self, key, value):
        return self.Q(**{key + '__lte': value})

    def op_true(self, key, value):
        return self.Q(**{key: True})

    def op_false(self, key, value):
        return self.Q(**{key: False})

    def op_dontcare(self, key, value):
        return self.Q()

    def op_between(self, key, value):
        values = value.split(',')[:2]
        return self.Q(**{key + '__range': values})

    def op_in(self, key, value):
        values = value.split(',')
        return self.Q(**{key + '__in': values})

    def op_contains(self, key, value):
        return self.Q(**{key + '__contains': value})

    def op_empty(self, key, value):
        return self.Q(**{key + '__exact': ''})

    def op_trueornull(self, key, value):
        return self.Q(**{key: True}) | self.Q(**{key + '__isnull': True})

    def op_falseornull(self, key, value):
        return self.Q(**{key: False}) | self.Q(**{key + '__isnull': True})

