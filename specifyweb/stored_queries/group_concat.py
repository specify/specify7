# Based on stackoverflow answer from Wolph:
# https://stackoverflow.com/questions/19205850/how-do-i-write-a-group-concat-function-in-sqlalchemy

import sqlalchemy
from sqlalchemy.sql import expression
from sqlalchemy.ext import compiler

class group_concat(expression.ColumnElement):
    name = "group_concat"
    def __init__(self, expr, separator=None, order_by=None):
        self.expr = expr
        self.separator = separator
        self.order_by = order_by

@compiler.compiles(group_concat)
def _group_concat_mysql(element, compiler, **kwargs):
    expr = compiler.process(element.expr, **kwargs)
    order_by = compiler.process(element.order_by, **kwargs) if element.order_by is not None else None
    # text() + bindparams is done purely for safety. Can't directly trust user provided separator
    separator = compiler.process(sqlalchemy.text(" SEPARATOR :sep").bindparams(sep=element.separator), **kwargs) if element.separator is not None else None
    inner = expr
    if order_by is not None:
        inner += " ORDER BY %s" % order_by
    if separator is not None:
        inner += ' %s' % separator

    return 'GROUP_CONCAT(%s)' % inner

