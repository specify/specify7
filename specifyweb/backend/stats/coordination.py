import hashlib
import json
import logging
from collections.abc import Callable
from functools import wraps

from django.conf import settings
from django.http import HttpResponse, JsonResponse

from specifyweb.backend.cache.redis.utils import format_key, redis_connection
from specifyweb.backend.permissions.permissions import check_table_permissions
from specifyweb.specify.models_utils.lock_tables import Lock

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
    response["Retry-After"] = str(STATISTICS_RETRY_SECONDS)
    return response


def statistics_result(
    collection,
    user,
    query_key: str,
    calculate: Callable[[], str],
    validate_cached: Callable[[], None],
) -> str:
    digest = hashlib.sha256(query_key.encode()).hexdigest()
    cache_key = format_key(
        f"specify:{{database}}:statistics:{collection.id}:{user.id}:{digest}"
    )
    cache = redis_connection()

    def cached_result() -> str | None:
        result = cache.get(cache_key)
        if result is not None:
            validate_cached()
        return result

    result = cached_result()
    if result is not None:
        return result

    # A database advisory lock has no lease that could expire during a slow query.
    lock_name = hashlib.sha256(settings.DATABASE_NAME.encode()).hexdigest()[:48]
    lock = Lock(f"statistics:{lock_name}", timeout=0)
    try:
        lock.acquire()
    except TimeoutError as error:
        logger.debug("Deferring statistics calculation: %s", error)
        raise StatisticsBusy from error

    try:
        result = cached_result()
        if result is None:
            result = calculate()
            cache.set(cache_key, result, ex=STATISTICS_CACHE_SECONDS)
        return result
    finally:
        lock.release()


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
