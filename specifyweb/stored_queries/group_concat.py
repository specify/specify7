# Based on stackoverflow answer from Wolph:
# http://stackoverflow.com/questions/19205850/how-do-i-write-a-group-concat-function-in-sqlalchemy

import sqlalchemy
from sqlalchemy.sql import expression
from sqlalchemy.ext import compiler

class group_concat(expression.FunctionElement):
    name = "group_concat"

def _process(element, compiler):
    expr = compiler.process(element.clauses.clauses[0])
    def process_clause(idx):
        return compiler.process(element.clauses.clauses[idx])

    separator = process_clause(1) if len(element.clauses) > 1 else None
    order_by = process_clause(2) if len(element.clauses) > 2 else None
    return expr, separator, order_by

@compiler.compiles(group_concat)
def _group_concat_mysql(element, compiler, **kwargs):
    inner, separator, order_by = _process(element, compiler)

    if order_by is not None:
        inner += " ORDER BY %s" % order_by
    if separator is not None:
        inner += " SEPARATOR %s" % separator

    return 'GROUP_CONCAT(%s)' % inner

@compiler.compiles(group_concat, 'postgresql')
def _group_concat_postgres(element, compiler, **kwargs):
    expr, separator, order_by = _process(element, compiler)

    delimiter = separator if separator is not None else ''
    return 'string_agg(%s, %s)' % (expr, delimiter)
