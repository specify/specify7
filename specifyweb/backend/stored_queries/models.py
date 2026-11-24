from contextlib import contextmanager
from typing import Dict

from MySQLdb.cursors import SSCursor
import sqlalchemy
from sqlalchemy.orm import sessionmaker

from django.conf import settings
from django.db import models as django_models

# from specifyweb.specify.models import datamodel
from specifyweb.specify.datamodel import datamodel
from . import build_models

engine = sqlalchemy.create_engine(settings.SA_DATABASE_URL, pool_recycle=settings.SA_POOL_RECYCLE,
                                  connect_args={'cursorclass': SSCursor})
Session = sessionmaker(bind=engine)


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


class QueryFolder(django_models.Model):
    class Section(django_models.TextChoices):
        PERSONAL = 'personal', 'Your queries'
        SHARING = 'sharing', 'Queries I share'
        SHARED = 'shared', 'Shared queries'

    name = django_models.CharField(max_length=256)
    section = django_models.CharField(
        max_length=8,
        choices=Section.choices,
        default=Section.PERSONAL,
    )
    owner = django_models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=django_models.CASCADE,
        related_name='query_folders',
    )
    parent = django_models.ForeignKey(
        'self',
        on_delete=django_models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
    )

    class Meta:
        db_table = 'stored_query_folder'


class QueryFolderMembership(django_models.Model):
    owner = django_models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=django_models.CASCADE
    )
    query = django_models.ForeignKey(
        'specify.Spquery',
        on_delete=django_models.CASCADE,
        related_name='folder_memberships',
    )
    section = django_models.CharField(
        max_length=8, choices=QueryFolder.Section.choices
    )
    folder = django_models.ForeignKey(
        QueryFolder, on_delete=django_models.CASCADE, related_name='memberships'
    )

    class Meta:
        db_table = 'stored_query_folder_membership'
        constraints = [
            django_models.UniqueConstraint(
                fields=['owner', 'query', 'section'],
                name='unique_query_folder_per_user_section',
            ),
        ]


class QueryFavorite(django_models.Model):
    owner = django_models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=django_models.CASCADE
    )
    query = django_models.ForeignKey(
        'specify.Spquery',
        on_delete=django_models.CASCADE,
        related_name='favorites',
    )

    class Meta:
        db_table = 'stored_query_favorite'
        constraints = [
            django_models.UniqueConstraint(
                fields=['owner', 'query'], name='unique_query_favorite_per_user'
            ),
        ]


class QueryArchive(django_models.Model):
    owner = django_models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=django_models.CASCADE, related_name='+'
    )
    query = django_models.ForeignKey(
        'specify.Spquery',
        on_delete=django_models.CASCADE,
        related_name='+',
    )

    class Meta:
        db_table = 'stored_query_archive'
        constraints = [
            django_models.UniqueConstraint(
                fields=['owner', 'query'], name='unique_query_archive_per_user'
            ),
        ]


__all__ = [
    'session_context',
    'tables',
    'classes',
    'models_by_tableid',
] + list(classes.keys())
