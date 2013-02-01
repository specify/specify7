"""
Because the Django ORM does not handle arbitrary predicates on
subportions of date fields it is necessary to invoke some
trickiness. We want to make use of the ORM's ability to calculate
joins, etc. To do this the Constraint class in django.db.models.sql is
monkey-patched to detect specially wrapped values and handle them as
special cases.  This is sort of AOP advice like.
"""

import types
from django.db.models import Q
from django.db.models.sql.query import Constraint
from django.db.models.sql.where import WhereNode

from query_ops import QueryOps

class DatePartValueWrapper(object):
    """A wrapper that signals a value is to be used in a
    partial date filter.
    """
    def __init__(self, date_part, value):
        self.date_part = date_part
        self.value = value

# This is OK because the sql_for_columns method is not dependent on
# the WhereNode instance it is invoked on.
sql_for_columns = WhereNode().sql_for_columns

# Monkey patching the Constraint.prepare method.  This is necessary to
# prevent Django complaining that we are not giving date values to
# compare to a date field.
constraint_prepare = Constraint.prepare
def prepare(self, lookup_type, value):
    # If the value is not one of our wrapped values, handle it
    # normally. Otherwise, leave it 'unprepared'.
    if not isinstance(value, DatePartValueWrapper):
        value = constraint_prepare(self, lookup_type, value)
    return value
Constraint.prepare = types.MethodType(prepare, None, Constraint)

# Monkey patching the Constraint.process method.  If the value is
# wrapped in our wrapper, emit a specialized object that wraps
# Django's SQL expression for the field inside another SQL expression
# that extracts the relevant portion of the date.
constraint_process = Constraint.process
def process(self, lookup_type, value, connection):
    # Pull the date part out of the wrapper.
    if isinstance(value, DatePartValueWrapper):
        value, date_part = value.value, value.date_part
    else:
        date_part = None

    # Do the processing as normal.
    lvalue, params = constraint_process(self, lookup_type, value, connection)

    # If the value wasn't wrapped, just return normally.
    if date_part is None: return lvalue, params

    # Construct an object that adds the date part extraction.
    class LValue(object):
        """By default Django passes the lvalue from Constraint.process
        to sql_for_columns to generate the SQL for the LHS of the
        predicate.  If the lvalue has a 'as_sql' method, it calls that
        instead.
        """
        def as_sql(self, qn, connection):
            """Use the sql_for_columns function just as Django
            normally would, but then wrap the result in SQL to extract
            the relevant portion of the date.
            """
            field_sql = sql_for_columns(lvalue, qn, connection)
            return extract_date_part_sql(date_part, field_sql)

    return LValue(), map(int, params)
Constraint.process = types.MethodType(process, None, Constraint)

# The SQL to extract portions of dates from date columns.  This might
# be MySQL specific.
extractors_sql = {
    'year': 'YEAR(%s)',
    'month': 'MONTH(%s)',
    'day': 'DAY(%s)'}

def extract_date_part_sql(date_part, field_sql):
    return extractors_sql[date_part] % field_sql

# Since dates in Specify can be 'partial', we need filters to match
# dates that have the portions we are comparing to.
precision_filters = {
    'day': lambda key: Q(**{key+'precision': 1}),
    'month': lambda key: Q(**{key+'precision__in': (1,2)}),
    'year': lambda key: Q()}

def make_date_part_filter(date_part, op_num, key, value):
    """Return a Django filter object that implements the predicate
    indicated by op_num on the date field referenced by key comparing
    the given value to the portion of the date determined by
    date_part.
    """
    # a portion of a date is 'empty' if the date itself is missing or
    # if the precision of the date does not include the desired portion
    if QueryOps.OPERATIONS[op_num] == 'op_empty':
        return Q(**{key + "__isnull": True}) | ~precision_filters[date_part](key)

    def DatePartFilterQ(**kwargs):
        """A Q factory function that wraps input values in our special wrapper."""
        wrapped = dict((k, DatePartValueWrapper(date_part, v))
                       for k, v in kwargs.items())
        return Q(**wrapped)

    # Use an instance of QueryOps with the specialized behavior for
    # wrapping values.
    query_ops = QueryOps(DatePartFilterQ)

    # The final filter matches the date portion to the value and makes
    # sure the date has sufficient precision for the match to mean something.
    return query_ops.by_op_num(op_num)(key, value) & precision_filters[date_part](key)

