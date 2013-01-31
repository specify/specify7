import types
from django.db.models import Q
from django.db.models.sql.query import Constraint
from django.db.models.sql.where import WhereNode

from query_ops import QueryOps

class DatePartValueWrapper(object):
    def __init__(self, date_part, value):
        self.date_part = date_part
        self.value = value

sql_for_columns = WhereNode().sql_for_columns

constraint_prepare = Constraint.prepare
def prepare(self, lookup_type, value):
    if not isinstance(value, DatePartValueWrapper):
        value = constraint_prepare(self, lookup_type, value)
    return value
Constraint.prepare = types.MethodType(prepare, None, Constraint)

constraint_process = Constraint.process
def process(self, lookup_type, value, connection):
    if isinstance(value, DatePartValueWrapper):
        value, date_part = value.value, value.date_part
    else:
        date_part = None

    lvalue, params = constraint_process(self, lookup_type, value, connection)

    if date_part is None: return lvalue, params

    class LValue(object):
        def as_sql(self, qn, connection):
            field_sql = sql_for_columns(lvalue, qn, connection)
            return extract_date_part_sql(date_part, field_sql)

    return LValue(), map(int, params)
Constraint.process = types.MethodType(process, None, Constraint)

extractors_sql = {
    'year': 'YEAR(%s)',
    'month': 'MONTH(%s)',
    'day': 'DAY(%s)'}

def extract_date_part_sql(date_part, field_sql):
    return extractors_sql[date_part] % field_sql

precision_filters = {
    'day': lambda key: Q(**{key+'precision': 1}),
    'month': lambda key: Q(**{key+'precision__in': (1,2)}),
    'year': lambda key: Q()}

def make_date_part_filter(date_part, op_num, key, value):
    if QueryOps.OPERATIONS[op_num] == 'op_empty':
        return Q(**{key + "__isnull": True}) | ~precision_filters[date_part](key)

    def DatePartFilterQ(**kwargs):
        wrapped = dict((k, DatePartValueWrapper(date_part, v))
                       for k, v in kwargs.items())
        return Q(**wrapped)

    query_ops = QueryOps(DatePartFilterQ)
    q = query_ops.by_op_num(op_num)(key, value) & precision_filters[date_part](key)
    return q
