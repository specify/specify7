from contextlib import contextmanager

from MySQLdb.cursors import SSCursor
import sqlalchemy
from sqlalchemy.orm import sessionmaker

from django.conf import settings

from specifyweb.specify.models import datamodel
from . import build_models

engine = (
    sqlalchemy.create_engine(settings.SA_DATABASE_URL)
    if settings.DATABASE_ENGINE == 'postgres' else
    sqlalchemy.create_engine(settings.SA_DATABASE_URL, pool_recycle=settings.SA_POOL_RECYCLE,
                             connect_args={'cursorclass': SSCursor})
)

Session = sessionmaker(bind=engine)

@contextmanager
def session_context():
    session = Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()

def generate_models():
    tables = build_models.make_tables(datamodel)
    classes = build_models.make_classes(datamodel)
    build_models.map_classes(datamodel, tables, classes)
    return tables, classes

tables, classes = generate_models()

models_by_tableid = dict((cls.tableid, cls) for cls in list(classes.values()))

globals().update(classes)

__all__ = ['session_context', 'tables', 'classes', 'models_by_tableid'] + list(classes.keys())
