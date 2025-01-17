from sqlalchemy.sql import expression
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import String
from sqlalchemy.dialects.mysql.mysqldb import MySQLCompiler_mysqldb

""" The blank_nulls class is used extensively in .format.py
The functionality of the class depends on it being compiled with a sqlalchemy compiler 
(see the _blank_nulls function) which registers the class with a function and
tells sqlalchemy to run the function when the class is compiled to a string

When a blank_nulls object is created, it is given a single column clause

See the sqlalchemy docs on FunctionElement for more information
    https://docs.sqlalchemy.org/en/14/core/functions.html#sqlalchemy.sql.functions.FunctionElement

"""
class blank_nulls(expression.FunctionElement):
    name = 'blank_nulls'

""" The `@compiles` decorator tells sqlalchemy to run this function whenever 
a blank_nulls object needs to be compiled.

See the sqlalchemy docs on Constructs and Compilation for more information
    https://docs.sqlalchemy.org/en/14/core/compiler.html

"""
@compiles(blank_nulls)
def _blank_nulls(element: blank_nulls, compiler: MySQLCompiler_mysqldb, **kwargs) -> str:
    """ Returns an expression as a string which is to be executed by the database 
    to produce the desired result

    The <compiler> processes the clause given to the <element> and converts it 
    into valid SQL

    An example of a returned string when querying a Taxon record would be: 
        IFNULL(taxon.`FullName`, '') 
    """
    expr = compiler.process(element.clauses.clauses[0])
    if isinstance(element.clauses.clauses[0], blank_nulls):
        return expr
    else:
        return "IFNULL(%s, '')" % expr
