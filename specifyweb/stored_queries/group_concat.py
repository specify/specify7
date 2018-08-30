# Based on stackoverflow answer from Wolph:
# http://stackoverflow.com/questions/19205850/how-do-i-write-a-group-concat-function-in-sqlalchemy

import sqlalchemy
from sqlalchemy.sql import expression
from sqlalchemy.ext import compiler

class group_concat(expression.FunctionElement):
    name = "group_concat"

@compiler.compiles(group_concat)
def _group_concat_mysql(element, compiler, **kwargs):
    expr = compiler.process(element.clauses.clauses[0])
    def process_clause(idx):
        return compiler.process(element.clauses.clauses[idx])

    separator = process_clause(1) if len(element.clauses) > 1 else None
    order_by = process_clause(2) if len(element.clauses) > 2 else None

    inner = expr
    if order_by is not None:
        inner += " ORDER BY %s" % order_by
    if separator is not None:
        inner += " SEPARATOR %s" % separator

    return 'GROUP_CONCAT(%s)' % inner

