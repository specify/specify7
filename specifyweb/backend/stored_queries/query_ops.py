import re
import sqlalchemy
from sqlalchemy.orm.query import Query
from collections import namedtuple
from typing import Literal

from specifyweb.backend.stored_queries.geology_time import geo_time_query, geo_time_period_query
from specifyweb.specify.utils.uiformatters import CNNField, FormatMismatch, UIFormatter

QUERYFIELD_OPERATION_NUMBER = Literal[
    0,  # Like
    1,  # Equals
    2,  # Greater Than
    3,  # Less Than
    4,  # Greater Than or Equals
    5,  # Less Than or Equals
    6,  # True
    7,  # False
    8,  # Dont Care / Any
    9,  # Between
    10, # In
    11, # Contains
    12, # Null / Empty
    13, # True or Null/Empty
    14, # False or Null/Empty
    15, # Starts With
    16, # Age Range
    17, # Age Period
    18  # Ends With
]

class QueryOps(namedtuple("QueryOps", "uiformatter")):
    """Instances of this class turn Spqueryfield operation numbers into
    functions that turn lookup keys and predicate values into Django filters.
    """
    uiformatter: UIFormatter | None

    OPERATIONS = [
        # operation,            # op number
        "op_like",              # 0
        "op_equals",            # 1
        "op_greaterthan",       # 2
        "op_lessthan",          # 3
        "op_greaterthanequals", # 4
        "op_lessthanequals",    # 5
        "op_true",              # 6
        "op_false",             # 7
        "op_dontcare",          # 8
        "op_between",           # 9
        "op_in",                # 10
        "op_contains",          # 11
        "op_empty",             # 12
        "op_trueornull",        # 13
        "op_falseornull",       # 14
        "op_startswith",        # 15
        "op_age_range",         # 16
        "op_age_period",        # 17
        "op_endswith",          # 18
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
        values = [self.format(v.strip()) for v in value.split(",")[:2]]
        return field.between(*values)

    def op_in(self, field, values):
        if hasattr(values, "split"):
            values = [self.format(v.strip()) for v in values.split(",")]
        return field.in_(values)

    def op_contains(self, field, value):
        return field.contains(value)

    def op_empty(self, field, value):
        if isinstance(field.type, sqlalchemy.types.String):
            return (field == "") | (field == None)
        else:
            return field == None

    def op_trueornull(self, field, value):
        return (field == True) | (field == None)

    def op_falseornull(self, field, value):
        return (field == False) | (field == None)

    def op_startswith(self, field, value):
        if (
            self.uiformatter is not None
            and isinstance(self.uiformatter.fields[0], CNNField)
            and len(self.uiformatter.fields) == 1
        ):
            value = value.lstrip("0")
            return field.op("REGEXP")("^0*" + value)
        else:
            return field.like(value + "%")

    def op_endswith(self, field, value):
        if isinstance(
            field.type,
            (
                sqlalchemy.types.Numeric,
                sqlalchemy.types.Float,
            ),
        ):
            str_field = sqlalchemy.func.cast(field, sqlalchemy.String)
            # Handle the trailing zeroes for decimal numeric fields
            normalized_field = sqlalchemy.func.regexp_replace(
                str_field,
                r"\.?0+$",
                "",
            )
            return normalized_field.like("%" + value)

        return field.like("%" + value)

    def op_age_range(self, field, value, query, is_strict=False):
        values = [self.format(v.strip()) for v in value.split(",")[:2]]
        start_time, end_time = float(values[0]), float(values[1])
        geo_time_co_ids = geo_time_query(
            start_time, end_time, require_full_overlap=is_strict, query=query.query
        )
        if isinstance(geo_time_co_ids, Query):
            return geo_time_co_ids
        else:
            return field.in_(geo_time_co_ids)

    def op_age_period(self, field, value, query, is_strict=False):
        time_period_name = value
        geo_time_co_ids = geo_time_period_query(
            time_period_name, require_full_overlap=is_strict, query=query.query
        )
        if isinstance(geo_time_co_ids, Query):
            return geo_time_co_ids
        else:
            return field.in_(geo_time_co_ids)
