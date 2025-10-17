from typing import overload

from redis import Redis
from django.conf import settings


def redis_connection(decode_responses=True):
    redis_host = getattr(settings, "REDIS_HOST", None)
    redis_port = getattr(settings, "REDIS_PORT", None)
    redis_db_index = getattr(settings, "REDIS_DB_INDEX", 0)
    if None in (redis_host, redis_port, redis_db_index):
        raise ValueError("Redis is not correctly configured", redis_host, redis_port)
    return Redis(host=redis_host, port=redis_port, db=redis_db_index, decode_responses=decode_responses)


def _set_string(key: str, value: str, time_to_live=None, override_existing=True, decode_responses=True):
    host = redis_connection(decode_responses=decode_responses)
    # See https://redis.readthedocs.io/en/stable/commands.html#redis.commands.core.CoreCommands.set
    flags = {
        "ex": time_to_live,
        "nx": not override_existing
    }
    host.set(key, value, **flags)


@overload
def _get_string(key: str, delete_key: bool, decode_responses: True) -> str | None: ...


@overload
def _get_string(key: str, delete_key: bool, decode_responses: False) -> bytes | None: ...


def _get_string(key: str, delete_key: bool=False, decode_responses=True) -> str | bytes | None:
    host = redis_connection(decode_responses=decode_responses)
    if delete_key: 
        return host.getdel(key)
    
    return host.get(key)
