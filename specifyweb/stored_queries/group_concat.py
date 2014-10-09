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
    if len(element.clauses) == 2:
        separator = compiler.process(element.clauses.clauses[1])
        return 'GROUP_CONCAT(%s SEPARATOR %s)' % (expr, separator)
    else:
        return 'GROUP_CONCAT(%s)' % expr

