from django.db import connection
from django.conf import settings
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)


@contextmanager
def lock_tables(*tables):
    cursor = connection.cursor()
    # REFACTOR: Extract this functionality to a decorator or contextmanager
    if cursor.db.vendor != 'mysql':
        logger.warning("unable to lock tables")
        yield
    else:
        try:
            cursor.execute('lock tables %s' %
                           ' write, '.join(tables) + ' write')
            yield
        finally:
            cursor.execute('unlock tables')

@contextmanager
def named_lock(raw_lock_name: str, timeout: int = 5, retry_attempts: int = 0):
    """
    Handles acquiring and finally releasing a named user advisory lock.
    While the lock is held, no other connection can acquire the same named lock.

    Use this sparingly: these locks do not impose any behavior on the database
    like normal locks--agents interacting with the database can opt to not
    follow traditional application flow and circumnavigate application behavior

    Raises a TimeoutError if timeout seconds have elapsed without acquiring the
    lock (another connection holds the lock), and a ConnectionError if the
    database was otherwise unable to acquire the lock.

    Example:
    ```
    try:
        with named_lock('my_lock') as lock:
        ... # do something
    except TimeoutError:
        ... # handle case when lock is held by other connection
    ```

    :param raw_lock_name: The name of lock to acquire
    :type raw_lock_name: str
    :param timeout: The time in seconds to wait for lock release if another 
    connection holds the lock
    :type timeout: int
    :return: yields True if the lock was obtained successfully and None 
    otherwise
    :rtype: Generator[Literal[True] | None, Any, None]
    """

    # REFACTOR: Extract this functionality to a decorator or contextmanager
    if connection.vendor != "mysql":
        yield
        return

    db_name = getattr(settings, "DATABASE_NAME")
    lock_name = f"{db_name}_{raw_lock_name}"

    acquired = acquired_named_lock(lock_name, timeout)

    while retry_attempts > 0 and acquired != True:
        acquired = acquired_named_lock(lock_name, timeout)
        retry_attempts -= 1

    if acquired == False:
        raise TimeoutError(f"Unable to acquire named lock: '{lock_name}'. Held by other connection")
    if acquired is None:
        raise ConnectionError(f"Unable to acquire named lock: '{lock_name}'. The process might have run out of memory")

    try:
        yield acquired
    finally:
        release_named_lock(lock_name)

def acquired_named_lock(lock_name: str, timeout: int) -> bool | None:
    """
    Attempts to acquire a named lock in the database. Will wait for timeout 
    seconds for the lock to be released if held by another connection.
    
    See https://mariadb.com/docs/server/reference/sql-functions/secondary-functions/miscellaneous-functions/get_lock
    
    :param lock_name: The name of the lock to acquire
    :type lock_name: str
    :param timeout: The time in seconds to wait for lock release if another 
    connection holds the lock
    :type timeout: int
    :return: returns True if the lock was obtained successfully, False if timeout 
    seconds have elapsed without acquiring the lock, and None otherwise
    :rtype: bool | None
    """
    with connection.cursor() as cur:
        cur.execute("SELECT GET_LOCK(%s, %s)", [lock_name, timeout])
        acquired_row = cur.fetchone()

    if acquired_row is None:
        return None

    acquired = acquired_row[0]

    if acquired == 1:
        return True
    elif acquired == 0:
        return False

    return None

def release_named_lock(lock_name: str) -> bool | None:
    """
    Attempt to release one instance of a held named lock. Note that multiple 
    instances of the same lock can be held by a single connection, in which
    case each instance of the lock needs to be released separately.

    See https://mariadb.com/docs/server/reference/sql-functions/secondary-functions/miscellaneous-functions/release_lock
    
    :param lock_name: The name of the lock to attempt to release
    :type lock_name: str
    :return: returns True if one instance of the lock was sucessfully released, False 
    if the lock is held by another connection, and None otherwise
    :rtype: bool | None
    """
    with connection.cursor() as cur:
        cur.execute("SELECT RELEASE_LOCK(%s)", [lock_name])
        released_row = cur.fetchone()

    if released_row is None:
        return None

    released = released_row[0]
    if released == 1:
        return True
    elif released == 0:
        return False
    return None
