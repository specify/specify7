import hashlib
import json
import logging
from collections.abc import Callable
from typing import cast
from contextlib import contextmanager

from django.http import JsonResponse
from redis.exceptions import RedisError

from specifyweb.backend.cache.redis.connect import RedisString, RedisConnection
from specifyweb.backend.permissions.permissions import check_table_permissions
from specifyweb.specify.models_utils.lock_tables import LockDispatcher

logger = logging.getLogger(__name__)

STATISTICS_CACHE_SECONDS = 300
STATISTICS_RETRY_SECONDS = 2


class StatisticsBusy(Exception):
    pass


def busy_response() -> JsonResponse:
    response = JsonResponse(
        {"message": "Statistics are already being calculated. Please retry."},
        status=409,
    )
    response["X-Specify-Retry-After"] = str(STATISTICS_RETRY_SECONDS)
    return response


def statistics_result(
    collection,
    user,
    query_key: str,
    calculate: Callable[[], str],
) -> str:
    """Reuse cached statistics without handling query validity.

    Callers must enforce current permissions before returning the result to the
    user because a cache hit skips calculate. On a miss, calculate is responsible
    for normal query construction and execution; exceptions propagate and failed
    calculations are not cached.
    """
    try:
        redis_cache = RedisString(RedisConnection())
    except (ValueError, RedisError):
        logger.warning("Statistics cache unavailable; calculating without caching.", exc_info=True)
        with run_statistics_query(calculate) as result:
            return result

    digest = hashlib.sha256(query_key.encode()).hexdigest()
    redis_cache_key = f"statistics:{collection.id}:{user.id}:{digest}"

    skip_caching = False
    try:
        cached_value = redis_cache.get(redis_cache_key)
    except RedisError:
        logger.warning("Statistics cache read failed; calculating without caching.", exc_info=True)
        cached_value = None
        skip_caching = True

    if cached_value is not None:
        # We know this should be a string because the RedisConnection has
        # decode_responses=True and we should only be setting strings to this
        # key
        return cast(str, cached_value)

    with run_statistics_query(calculate) as result:
        if skip_caching:
            return result
        try:
            redis_cache.set(redis_cache_key, result, time_to_live=STATISTICS_CACHE_SECONDS)
        except RedisError:
            logger.warning("Statistics cache write failed; returning uncached result.", exc_info=True)
        return result

@contextmanager
def run_statistics_query(calculate: Callable[[], str]):
    """
    This context manager will hold statistics locks until your code completely
    exits.
    If statistics locks are already being held, this will instead raise a
    StatisticsBusy exception.

    Example:
    ```py
    with run_statistics_query(calculate) as result:
        # if the locks are already being held, StatisticsBusy is raised
        # otherwise, statistics locks are acquired and calculate is ran
        # do something with the final result here
    print("out of block, statistics locks are released")
    # once the with block is exited, the statistics locks will be released
    ```
    """
    # A database advisory lock has no lease that could expire during a slow query.
    # Keep the lock database-scoped while letting the dispatcher bound its name.
    with LockDispatcher(lock_name_separator=":") as locks:
        try:
            locks.acquire("statistics", timeout=0)
        except TimeoutError as error:
            logger.debug("Deferring statistics calculation: %s", error)
            raise StatisticsBusy from error

        result = calculate()
        yield result

def statistics_content(request, tables, calculate: Callable[[], str]) -> str:
    for table in tables:
        check_table_permissions(
            request.specify_collection, request.specify_user, table, "read"
        )
    return statistics_result(
        request.specify_collection,
        request.specify_user,
        json.dumps([request.path, sorted(request.GET.items())]),
        calculate,
    )
