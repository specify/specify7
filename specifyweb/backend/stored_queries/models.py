from contextlib import contextmanager
from typing import Dict

from MySQLdb.cursors import SSCursor
import sqlalchemy
from sqlalchemy.orm import sessionmaker

from django.conf import settings

# from specifyweb.specify.models import datamodel
from specifyweb.specify.datamodel import datamodel
from . import build_models

engine = sqlalchemy.create_engine(settings.SA_DATABASE_URL, pool_recycle=settings.SA_POOL_RECYCLE,
                                  connect_args={'cursorclass': SSCursor})
Session = sessionmaker(bind=engine)


@sqlalchemy.event.listens_for(engine, "before_cursor_execute", retval=True)
def tree_query_recursion_limit(conn, cursor, statement, parameters, context, executemany):
    if context.execution_options.get("specify_tree_ranks") is not None:
        # MariaDB otherwise returns truncated recursive results after 1,000
        # iterations. Scope the override to this statement, not the connection.
        statement = "SET STATEMENT max_recursive_iterations=4294967295 FOR " + statement
    return statement, parameters


def make_session_context(session_maker):
    @contextmanager
    def _session_context():
        session, connection = session_maker()
        try:
            if connection is None:
                connection = session.connection()
            session.info['connection'] = connection
            yield session
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()
    return _session_context


session_context = make_session_context(lambda: (Session(), None))


def generate_models():
    tables = build_models.make_tables(datamodel)
    classes = build_models.make_classes(datamodel)
    build_models.map_classes(datamodel, tables, classes)
    return tables, classes


tables, classes = generate_models()

models_by_tableid: dict[int, build_models.Table] = {cls.tableid: cls for cls in list(classes.values())}

globals().update(classes)

__all__ = ['session_context', 'tables', 'classes', 'models_by_tableid'] + list(classes.keys())
