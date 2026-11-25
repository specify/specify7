import logging
from typing import Any, Optional

from sqlalchemy import type_coerce, types
from sqlalchemy.dialects import mysql as mysql_dialect
from sqlalchemy.sql.elements import ClauseElement
from sqlalchemy.sql.selectable import Select
from sqlalchemy.sql.sqltypes import NullType

from django.conf import settings

this_logger = logging.getLogger(__name__)

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

def _debug_nulltype_columns(stmt: ClauseElement, logger = None) -> None:
    """
    Scan for expressions with NullType before compiling, to
    help explain TypeError crashes when using literal_binds=True.
    """
    resolved_logger = logger or this_logger
    try:
        raw_cols = getattr(stmt, "_raw_columns", None)
        if not raw_cols:
            return
        for i, expr in enumerate(raw_cols):
            t = getattr(expr, "type", None)
            if t is None or isinstance(t, NullType):
                resolved_logger.debug("[SA-NullType] col #%s expr=%r type=%r", i, expr, t, stacklevel=2)
    except Exception:
        pass

def log_sqlalchemy_query(
    query_or_stmt: Any,
    *,
    logger = None,
    literal_binds: bool = True,
    dialect: Optional[Any] = None,
    level: int = logging.DEBUG,
) -> Optional[str]:
    """
    Log the SQL for a query/statement.
    Run in the stored_queries.execute file, in the execute function, right before the return statement:
        from specifyweb.specify.utils import log_sqlalchemy_query; log_sqlalchemy_query(query)
    """
    resolved_logger = logger or this_logger
    if not resolved_logger.isEnabledFor(level) or not settings.DEBUG:
        return None  # skip compiling and logging if we're not logging at this level

    dialect = dialect or mysql_dialect.dialect()
    stmt = _coerce_statement(query_or_stmt)

    # help trace NullType roots issues
    _debug_nulltype_columns(stmt)

    try:
        compiled = stmt.compile(dialect=dialect, compile_kwargs={"literal_binds": literal_binds})
        sql = str(compiled).replace("\n", " ") + ";"
        sep = "=" * 80
        resolved_logger.log(level, "%s\n%s\n%s", sep, sql, sep, stacklevel=2)
        return sql

    except TypeError as e:
        try:
            compiled_fb = stmt.compile(dialect=dialect)
            sql_fb = str(compiled_fb)
            resolved_logger.log(
                level,
                "[fallback no-literal-binds]\n%s\n[compile TypeError: %s]",
                sql_fb,
                e,
                stacklevel=2
            )
            return sql_fb
        except Exception as e2:
            resolved_logger.log(level, "[query logging failed after TypeError: %s] (fallback err: %s)", e, e2, stacklevel=2)
            return None

    except Exception as e:
        resolved_logger.log(level, "[query logging failed: %s]", e, exc_info=True, stacklevel=2)
        return None

def ensure_string_type_if_null(expr):
    t = getattr(expr, "type", None)
    return type_coerce(expr, types.String()) if t is None or isinstance(t, NullType) else expr
