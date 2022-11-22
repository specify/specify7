from sqlalchemy.sql import expression
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import String

class blank_nulls(expression.FunctionElement):
    name = 'blank_nulls'

@compiles(blank_nulls)
def _blank_nulls(element, compiler, **kwargs):
    expr = compiler.process(element.clauses.clauses[0])
    if isinstance(element.clauses.clauses[0], blank_nulls):
        return expr
    else:
        return "coalesce(%s, '')" % expr
