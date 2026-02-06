from django.db import connection
from django.conf import settings
from contextlib import contextmanager
from typing import Iterable
import logging
import json

logger = logging.getLogger(__name__)
LOCK_NAME_SEPARATOR = "_"


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
        raise TimeoutError(
            f"Unable to acquire named lock: '{lock_name}'. Held by other connection")
    if acquired is None:
        raise ConnectionError(
            f"Unable to acquire named lock: '{lock_name}'. The process might have run out of memory")

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


class Lock:
    def __init__(self, name: str, timeout: int):
        self.name = name
        self.timeout = timeout

    @classmethod
    def from_json_str(cls, string: str | bytes | bytearray):
        deserialized = json.loads(string)
        return cls(
            deserialized["name"],
            deserialized["timeout"]
        )

    def acquire(self):
        acquired = acquired_named_lock(self.name, self.timeout)

        if acquired == False:
            raise TimeoutError(
                f"Unable to acquire named lock: '{self.name}'. Held by other connection")
        if acquired is None:
            raise ConnectionError(
                f"Unable to acquire named lock: '{self.name}'. The process might have run out of memory")

        return acquired

    def release(self):
        released = release_named_lock(self.name)
        return released

    @staticmethod
    def serializer(lock: "Lock") -> str:
        return lock.as_json_str()

    @staticmethod
    def deserializer(lock_as_string: str | bytes | bytearray) -> "Lock":
        return Lock.from_json_str(lock_as_string)

    def as_json(self):
        return {
            "name": self.name,
            "timeout": self.timeout
        }

    def as_json_str(self) -> str:
        return json.dumps(self.as_json())

    def __eq__(self, other):
        if isinstance(other, Lock):
            return self.name == other.name and self.timeout == other.timeout
        return False


class LockDispatcher:
    def __init__(self, lock_prefix: str | None = None, case_sensitive_names=False):
        db_name = getattr(settings, "DATABASE_NAME")
        self.lock_prefix_parts: list[str] = [db_name]

        if lock_prefix is not None:
            self.lock_prefix_parts.append(lock_prefix)

        self.case_sensitive_names = case_sensitive_names
        self.locks: dict[str, Lock] = dict()
        self.in_context = False

    def close(self):
        self.release_all()

    def __enter__(self):
        self.in_context = True
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        self.in_context = False

    def lock_name(self, *name_parts: str):
        final_name = LOCK_NAME_SEPARATOR.join(
            (*self.lock_prefix_parts, *name_parts))

        return final_name.lower() if not self.case_sensitive_names else final_name

    @contextmanager
    def lock_and_release(self, name: str, timeout: int = 5):
        try:
            yield self.acquire(name, timeout)
        finally:
            self.release(name)

    def create_lock(self, name: str, timeout: int = 5):
        lock_name = self.lock_name(name)
        return Lock(lock_name, timeout)

    def acquire(self, name: str, timeout: int = 5):
        if self.locks.get(name) is not None:
            return
        lock = self.create_lock(name, timeout)
        self.locks[name] = lock
        return lock.acquire()

    def release_all(self):
        for lock_name in list(self.locks.keys()):
            self.release(lock_name)
        self.locks = dict()

    def release(self, name: str):
        lock = self.locks.pop(name, None)
        if lock is None:
            return
        lock.release()
