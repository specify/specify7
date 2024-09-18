from collections import namedtuple
import sqlalchemy

from specifyweb.specify.geo_time import query_co_in_time_period, query_co_in_time_range, search_co_ids_in_time_range
from specifyweb.specify.uiformatters import CNNField, FormatMismatch


class QueryOps(namedtuple("QueryOps", "uiformatter")):
    """Instances of this class turn Spqueryfield operation numbers into
    functions that turn lookup keys and predicate values into Django filters.
    """

    OPERATIONS = [
        # operation,      # op number
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
        'op_startswith',        # 15
        'op_age_range',         # 16
        'op_age_period',        # 17
        'op_age_range_strict',  # 18
        'op_age_period_strict', # 19
    ]

    PREPROSESSED_OPERATIONS = [
        'op_age_range,'
        'op_age_period',
        'op_age_range_strict',
        'op_age_period_strict',
    ]

    PREPROSESSED_OPERATION_NUMS = {16, 17, 18, 19}

    def by_op_num(self, op_num):
        return getattr(self, self.OPERATIONS[op_num])
    
    def is_preprocessed(self, op_num):
        return op_num in self.PREPROSESSED_OPERATION_NUMS

    def format(self, value):
        if self.uiformatter is not None:
            try:
                value = self.uiformatter.canonicalize(self.uiformatter.parse(value))
            except FormatMismatch:
                # If the value doesn't match the formatter
                # just use it as it literally appears.
                pass
        return value

    def op_like(self, field, value):
        return field.like(value)

    def op_equals(self, field, value):
        value = self.format(value)
        return field == value

    def op_greaterthan(self, field, value):
        value = self.format(value)
        return field > value

    def op_lessthan(self, field, value):
        value = self.format(value)
        return field < value

    def op_greaterthanequals(self, field, value):
        value = self.format(value)
        return field >= value

    def op_lessthanequals(self, field, value):
        value = self.format(value)
        return field <= value

    def op_true(self, field, value):
        return field == True

    def op_false(self, field, value):
        return field == False

    def op_dontcare(self, field, value):
        return None

    def op_between(self, field, value):
        values = [self.format(v.strip()) for v in value.split(',')[:2]]
        return field.between(*values)

    def op_in(self, field, values):
        if hasattr(values, 'split'):
            values = [self.format(v.strip()) for v in values.split(',')]
        return field.in_(values)

    def op_contains(self, field, value):
        return field.contains(value)

    def op_empty(self, field, value):
        if isinstance(field.type, sqlalchemy.types.String):
            return (field == '') | (field == None)
        else:
            return field == None

    def op_trueornull(self, field, value):
        return (field == True) | (field == None)

    def op_falseornull(self, field, value):
        return (field == False) | (field == None)

    def op_startswith(self, field, value):
        if self.uiformatter is not None and isinstance(self.uiformatter.fields[0], CNNField) and len(self.uiformatter.fields) == 1:
            value = value.lstrip('0')
            return field.op('REGEXP')("^0*" + value)
        else:
            return field.like(value + "%")

    # TODO: Remove once an implementation which implemention to keep
    def op_age_range_simple(self, field, value):
        values = [self.format(v.strip()) for v in value.split(',')[:2]]
        start_time, end_time = values
        co_ids = search_co_ids_in_time_range(start_time, end_time, require_full_overlap=False)
        return field.in_(co_ids)

    def op_age_range(self, field, value, query):
        values = [self.format(v.strip()) for v in value.split(',')[:2]]
        start_time, end_time = values
        return query_co_in_time_range(query.query, start_time, end_time, session=None, require_full_overlap=False)

    # TODO: Add new operations for age range and period
    def op_age_range_2(self, field, value, query):
        values = [self.format(v.strip()) for v in value.split(',')[:2]]
        query.query = field(query.query, values[0], values[1], session=None, require_full_overlap=False)
        return field.between(*values)
        # TODO: Maybe call query_co_in_time_range here, or maybe outside of this function maybe in apply_filter.
        # Need to either add a join a filter statement to the query,
        # or do a subquery, or run query to get the data and add to the query with filter statement (in [1,2,3]).
    
    def op_age_period(self, field, value, query):
        time_period_name = value
        return query_co_in_time_period(query.query, time_period_name, session=None, require_full_overlap=False)

    def op_age_range_strict(self, field, value, query):
        values = [self.format(v.strip()) for v in value.split(',')[:2]]
        start_time, end_time = values
        return query_co_in_time_range(query.query, start_time, end_time, session=None, require_full_overlap=True)

    def op_age_period_strict(self, field, value, query):
        time_period_name = value
        return query_co_in_time_period(query.query, time_period_name, session=None, require_full_overlap=True)