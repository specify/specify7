import hashlib
import json
import logging
from collections.abc import Callable
from functools import wraps

from django.conf import settings
from django.http import HttpResponse, JsonResponse
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
    validate_cached: Callable[[], None],
) -> str:
    """Reuse cached statistics when Redis is available; always gate calculations."""
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
        if result is not None:
            validate_cached()
        return result

    result = cached_result()
    if result is not None:
        return result

    # A database advisory lock has no lease that could expire during a slow query.
    lock_name = hashlib.sha256(settings.DATABASE_NAME.encode()).hexdigest()[:48]
    # Keep the bounded lock name while letting the dispatcher own cleanup.
    with LockDispatcher(
        lock_namespace="statistics", lock_name_separator=":"
    ) as locks:
        try:
            locks.acquire(lock_name, timeout=0)
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


def statistics_response(*tables):
    def decorate(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            def validate() -> None:
                for table in tables:
                    check_table_permissions(
                        request.specify_collection, request.specify_user, table, "read"
                    )

            validate()
            try:
                content = statistics_result(
                    request.specify_collection,
                    request.specify_user,
                    json.dumps([request.path, sorted(request.GET.items())]),
                    lambda: view(request, *args, **kwargs).content.decode(),
                    validate,
                )
            except StatisticsBusy:
                return busy_response()
            return HttpResponse(content, content_type="application/json")

        return wrapped

    return decorate
