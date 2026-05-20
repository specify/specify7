# Based on stackoverflow answer from Wolph:
# https://stackoverflow.com/questions/19205850/how-do-i-write-a-group-concat-function-in-sqlalchemy

import sqlalchemy
from sqlalchemy.sql import expression, bindparam
from sqlalchemy.ext import compiler
from sqlalchemy.sql.elements import ClauseElement
from sqlalchemy.types import String

from specifyweb.backend.stored_queries.query_construct import QueryConstruct

class group_concat(expression.ColumnElement):
    # MySQL GROUP_CONCAT(expr [ORDER BY ...] [SEPARATOR ...])
    name = "group_concat"
    type = String()
    inherit_cache = True

    def __init__(self, expr: ClauseElement, separator=None, order_by: ClauseElement | None = None):
        super().__init__()
        self.expr = expr
        self.separator = separator
        self.order_by = order_by

@compiler.compiles(group_concat)
def _group_concat_mysql(element, compiler, **kwargs):
    inner_expr = compiler.process(element.expr, **kwargs)

    if element.order_by is not None:
        if isinstance(element.order_by, (list, tuple, set)):
            ob = ", ".join(compiler.process(ob, **kwargs) for ob in element.order_by)
        else:
            ob = compiler.process(element.order_by, **kwargs)
        inner_expr += f" ORDER BY {ob}"

    if element.separator is not None:
        if isinstance(element.separator, ClauseElement):
            sep_sql = compiler.process(element.separator, **kwargs)
        else:
            sep_sql = compiler.process(bindparam("sep", element.separator, type_=String()), **kwargs)
        inner_expr += f" SEPARATOR {sep_sql}"

    return 'GROUP_CONCAT(%s)' % inner_expr

def group_by_displayed_fields(query: QueryConstruct, fields, ignore_cat_num=False):
    for field in fields:
        if (
            ignore_cat_num
            and hasattr(field, "clause")
            and field.clause is not None
            and hasattr(field.clause, "key")
            and field.clause.key == "CatalogNumber"
        ):
            continue
        query = query.group_by(field)

    return query
