import hashlib
import json
import logging
from collections.abc import Callable

from django.http import JsonResponse
from redis.exceptions import RedisError

from specifyweb.backend.cache.redis.utils import format_key, redis_connection
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
    digest = hashlib.sha256(query_key.encode()).hexdigest()
    cache_key = format_key(
        f"specify:{{database}}:statistics:{collection.id}:{user.id}:{digest}"
    )
    try:
        cache = redis_connection()
    except (ValueError, RedisError):
        logger.warning("Statistics cache unavailable; calculating without caching.", exc_info=True)
        cache = None

    def cached_result() -> str | None:
        nonlocal cache
        if cache is None:
            return None
        try:
            result = cache.get(cache_key)
        except RedisError:
            logger.warning("Statistics cache read failed; calculating without caching.", exc_info=True)
            cache = None
            return None
        return result

    result = cached_result()
    if result is not None:
        return result

    # A database advisory lock has no lease that could expire during a slow query.
    # Keep the lock database-scoped while letting the dispatcher bound its name.
    with LockDispatcher(lock_name_separator=":") as locks:
        try:
            locks.acquire("statistics", timeout=0)
        except TimeoutError as error:
            logger.debug("Deferring statistics calculation: %s", error)
            raise StatisticsBusy from error

        result = cached_result()
        if result is None:
            result = calculate()
            if cache is not None:
                try:
                    cache.set(cache_key, result, ex=STATISTICS_CACHE_SECONDS)
                except RedisError:
                    logger.warning("Statistics cache write failed; returning uncached result.", exc_info=True)
        return result


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
