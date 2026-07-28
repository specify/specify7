from contextvars import ContextVar
from contextlib import contextmanager

_use_migration_connection = ContextVar[bool]("use_migration_connection", default=False)

@contextmanager
def use_migration_connection():
    """
    This can be used as a decorator or context manager to tell Django to use
    the 'migrations' database defined in specifyweb/settings/__init__.py

    Examples:

    ```py
    @use_migration_connection()
    def my_func():
        ... # For this function block, Django will use the same connection it
        # uses for migrations
    
    with use_migration_connection():
        ... # Within this block, Django will use the same connection it uses
        # for migrations
    ```
    """
    token = _use_migration_connection.set(True)
    try:
        yield
    finally:
        _use_migration_connection.reset(token)

"""
A simple MigrationRouter that automatically routes reads and writes through the
migration connection when the use_migration_connection decorator/context manager
is used.

This is referenced by string in the DATABASE_ROUTERS Django setting within
specifyweb/settings/__init__.py

See the Django docs on Database Routers:
https://docs.djangoproject.com/en/4.2/topics/db/multi-db/#automatic-database-routing
"""
class MigrationRouter:
    def db_for_read(self, model, **hints):
        if _use_migration_connection.get():
            return 'migrations'
    
    def db_for_write(self, model, **hints):
        if _use_migration_connection.get():
            return 'migrations'
