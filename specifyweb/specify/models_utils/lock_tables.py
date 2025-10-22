from django.db import connection, transaction
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

@contextmanager
def lock_tables(*tables):
    cursor = connection.cursor()
    if cursor.db.vendor != 'mysql':
        logger.warning("unable to lock tables")
        yield
    else:
        try:
            # NOTE: Should not do within a transaction.atomic() block
            cursor.execute('lock tables %s' %
                           ' write, '.join(tables) + ' write')
            yield
        finally:
            cursor.execute('unlock tables')

@contextmanager
def mysql_named_lock(lock_name: str, timeout: int = 10):
    """
    Connection-scoped mutex using MySQL GET_LOCK/RELEASE_LOCK.
    Safe to use inside transaction.atomic().
    """
    if connection.vendor != "mysql":
        yield
        return

    with connection.cursor() as cur:
        cur.execute("SELECT GET_LOCK(%s, %s)", [lock_name, timeout])
        got = cur.fetchone()[0]

    if not got:
        raise TimeoutError(f"Could not acquire MySQL named lock {lock_name!r}")

    try:
        yield
    finally:
        try:
            with connection.cursor() as cur:
                cur.execute("SELECT RELEASE_LOCK(%s)", [lock_name])
        except Exception:
            logger.info("Failed to release MySQL named lock %r", lock_name, exc_info=True)

def get_autonumbering_lock_name(collection):
    return f"autonumbering:{collection.discipline_id}:{collection.id}"

def get_autonumbering_lock_name():
    return f"autonumbering"

@contextmanager
def autonumbering_lock_tables(tables):
    if transaction.get_connection().in_atomic_block:
        yield
    else:
        with lock_tables(*tables):
            with transaction.atomic():
                yield

@contextmanager
def autonumbering_lock(colleciton, tables):
    # lock_name = get_autonumbering_lock_name(colleciton)
    lock_name = get_autonumbering_lock_name()
    if transaction.get_connection().in_atomic_block:
        with mysql_named_lock(lock_name):
            yield
    else:
        with lock_tables(*tables):
            with transaction.atomic():
                yield

@contextmanager
def autonumbering_full_lock(colleciton, tables):
    # lock_name = get_autonumbering_lock_name(colleciton)
    lock_name = get_autonumbering_lock_name()
    with mysql_named_lock(lock_name):
        if transaction.get_connection().in_atomic_block:
            yield
        else:
            with lock_tables(*tables):
                with transaction.atomic():
                    yield
