# Based on stackoverflow answer from Wolph:
# https://stackoverflow.com/questions/19205850/how-do-i-write-a-group-concat-function-in-sqlalchemy

import sqlalchemy
from sqlalchemy.sql import expression
from sqlalchemy.ext import compiler

from specifyweb.stored_queries.query_construct import QueryConstruct

# class changed from FunctionElement to ColumnElement
class group_concat(expression.ColumnElement):
    name = "group_concat"
    def __init__(self, expr, separator=None, order_by=None):
        self.expr = expr
        self.separator = separator
        self.order_by = order_by

@compiler.compiles(group_concat)
def _group_concat_mysql(element, compiler, **kwargs):
    # Old way of extracting clauses, when group_concat was a FunctionElement
    # expr, separator, order_by = extract_clauses(element, compiler)

    inner_expr= compiler.process(element.expr, **kwargs)

    if element.order_by is not None:
        order_by = compiler.process(element.order_by, **kwargs)
        inner_expr+= " ORDER BY %s" % order_by
    if element.separator is not None:
        # Resorting to text() + bindparams to avoid SQL injection and fix parameter ordering bug
        separator = compiler.process(sqlalchemy.text(" SEPARATOR :sep").bindparams(sep=element.separator), **kwargs)
        inner_expr+= " %s" % separator

    return 'GROUP_CONCAT(%s)' % inner_expr

def extract_clauses(element, compiler):
    expr = compiler.process(element.clauses.clauses[0])
    def process_clause(idx):
        return compiler.process(element.clauses.clauses[idx])

    separator = process_clause(1) if len(element.clauses) > 1 else None
    order_by = process_clause(2) if len(element.clauses) > 2 else None

    return expr, separator, order_by

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
