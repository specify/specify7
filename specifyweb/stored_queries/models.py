from contextlib import contextmanager

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

def make_session_context(session_maker):
    @contextmanager
    def _session_context():
        session = session_maker()
        try:
            yield session
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()
    return _session_context

session_context = make_session_context(Session)

def generate_models():
    tables = build_models.make_tables(datamodel)
    classes = build_models.make_classes(datamodel)
    build_models.map_classes(datamodel, tables, classes)
    return tables, classes

tables, classes = generate_models()

models_by_tableid = dict((cls.tableid, cls) for cls in list(classes.values()))

globals().update(classes)

__all__ = ['session_context', 'tables', 'classes', 'models_by_tableid'] + list(classes.keys())
