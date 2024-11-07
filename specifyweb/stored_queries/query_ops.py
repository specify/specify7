from collections import namedtuple
import re
import sqlalchemy

from specifyweb.specify.geo_time import search_co_ids_in_time_range, query_co_in_time_range, query_co_in_time_range_with_joins, search_co_ids_in_time_period
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
    ]

    PRECALCUALTED_OPERATION_NUMS = {16, 17}

    def by_op_num(self, op_num):
        return getattr(self, self.OPERATIONS[op_num])
    
    def is_precalculated(self, op_num):
        return op_num in self.PRECALCUALTED_OPERATION_NUMS

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

    def op_age_range_set(self, field, value, is_strict=False):
        values = [self.format(v.strip()) for v in value.split(',')[:2]]
        start_time, end_time = values
        co_ids = search_co_ids_in_time_range(start_time, end_time, require_full_overlap=is_strict)
        return field.in_(co_ids)

    def op_age_range_query(self, field, value, query, is_strict=False):
        values = [self.format(v.strip()) for v in value.split(',')[:2]]
        start_time, end_time = values
        return query_co_in_time_range(query.query, start_time, end_time, session=None, require_full_overlap=is_strict)

    def op_age_range_query_joins(self, field, value, query, is_strict=False):
        values = [self.format(v.strip()) for v in value.split(',')[:2]]
        start_time, end_time = values
        return query_co_in_time_range_with_joins(query.query, start_time, end_time, session=None, require_full_overlap=is_strict)

    def op_age_range(self, field, value, query, is_strict=False):
        # Choose implementation of age range filtering
        return self.op_age_range_simple(field, value, is_strict)
        # return self.op_age_range_query(field, value, query, is_strict)
        # return self.op_age_range_query_joins(field, value, query=query, is_strict=is_strict)

    def op_age_period(self, field, value, query, is_strict=False):
        time_period_name = value
        return field.in_(search_co_ids_in_time_period(time_period_name, require_full_overlap=False))