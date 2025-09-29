import logging
from typing import Any, Optional

from sqlalchemy.dialects import mysql as mysql_dialect
from sqlalchemy.sql.elements import ClauseElement
from sqlalchemy.sql.selectable import Select
from sqlalchemy.sql.sqltypes import NullType

logger = logging.getLogger(__name__)

def _coerce_statement(obj: Any) -> ClauseElement:
    """
    Accepts an ORM Query (legacy), a Select, or any ClauseElement.
    Returns a ClauseElement suitable for compilation.
    """
    # Legacy ORM Query has .statement
    stmt = getattr(obj, "statement", None)
    if stmt is not None:
        return stmt
    if isinstance(obj, ClauseElement):
        return obj
    raise TypeError(f"Unsupported query/select type: {type(obj)!r}")

def _debug_nulltype_columns(stmt: ClauseElement) -> None:
    """
    Scan for expressions with NullType before compiling, to
    help explain TypeError crashes when using literal_binds=True.
    """
    try:
        raw_cols = getattr(stmt, "_raw_columns", None)
        if not raw_cols:
            return
        for i, expr in enumerate(raw_cols):
            t = getattr(expr, "type", None)
            if t is None or isinstance(t, NullType):
                logger.debug("[SA-NullType] col #%s expr=%r type=%r", i, expr, t)
    except Exception:
        pass

def log_sqlalchemy_query(
    query_or_stmt: Any,
    *,
    literal_binds: bool = True,
    dialect: Optional[Any] = None,
    level: int = logging.DEBUG,
) -> Optional[str]:
    """
    Log the SQL for a query/statement.
    Run in the stored_queries.execute file, in the execute function, right before the return statement:
        from specifyweb.specify.utils import log_sqlalchemy_query; log_sqlalchemy_query(query)
    """
    if not logger.isEnabledFor(level):
        return None  # skip compiling and logging if we're not logging at this level

    dialect = dialect or mysql_dialect.dialect()
    stmt = _coerce_statement(query_or_stmt)

    # help trace NullType roots issues
    _debug_nulltype_columns(stmt)

    try:
        compiled = stmt.compile(dialect=dialect, compile_kwargs={"literal_binds": literal_binds})
        sql = str(compiled).replace("\n", " ") + ";"
        sep = "=" * 80
        logger.log(level, "%s\n%s\n%s", sep, sql, sep)
        return sql

    except TypeError as e:
        try:
            compiled_fb = stmt.compile(dialect=dialect)
            sql_fb = str(compiled_fb)
            logger.log(
                level,
                "[fallback no-literal-binds]\n%s\n[compile TypeError: %s]",
                sql_fb,
                e,
            )
            return sql_fb
        except Exception as e2:
            logger.log(level, "[query logging failed after TypeError: %s] (fallback err: %s)", e, e2)
            return None

    except Exception as e:
        logger.log(level, "[query logging failed: %s]", e, exc_info=True)
        return None