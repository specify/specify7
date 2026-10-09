from typing import Literal

from redis import Redis
from django.conf import settings

# https://redis.io/docs/latest/commands/type/
Redis_Type = Literal["none", "string", "list", "set", "hash", "stream", "vectorset"]

# REFACTOR: It might make more sense to move this to a setting on
# RedisConnection, rather than having it as a flag on each adapter
def _format_key(key: str):
    db_name = getattr(settings, "DATABASE_NAME")
    key_parts = ["specify", db_name, key]
    return ":".join(key_parts)

class RedisConnection:
    def __init__(self,
                 host=getattr(settings, "REDIS_HOST", None),
                 port=getattr(settings, "REDIS_PORT", None),
                 db_index=getattr(settings, "REDIS_DB_INDEX", 0),
                 decode_responses=True):
        if None in (host, port, db_index):
            raise ValueError(
                "Redis is not correctly configured", host, port, db_index)
        self.host = host
        self.port = port
        self.db_index = db_index
        self.decode_responses = decode_responses
        self.connection = Redis(
            host=self.host,
            port=self.port,
            db=self.db_index,
            decode_responses=self.decode_responses
        )

    def delete(self, key: str, format_key=True):
        if format_key:
            key = _format_key(key)
        return self.connection.delete(key)

    def key_type(self, key: str, format_key=True) -> Redis_Type:
        if format_key:
            key = _format_key(key)
        return self.connection.type(key)


class RedisDataType:
    def __init__(self, established: RedisConnection) -> None:
        self._established = established

    @property
    def connection(self):
        return self._established.connection

    def delete(self, key: str, format_key=True):
        return self._established.delete(key, format_key=format_key)

    def key_type(self, key: str, format_key=True) -> Redis_Type:
        return self._established.key_type(key, format_key=format_key)

class RedisList(RedisDataType):
    """
    See https://redis.io/docs/latest/develop/data-types/lists/
    """

    def left_push(self, key: str, value, format_key=True) -> int:
        if format_key:
            key = _format_key(key)
        return self.connection.lpush(key, value)

    def right_push(self, key: str, value, format_key=True) -> int:
        if format_key:
            key = _format_key(key)
        return self.connection.rpush(key, value)

    def right_pop(self, key: str, format_key=True) -> str | bytes | None:
        if format_key:
            key = _format_key(key)
        return self.connection.rpop(key)

    def left_pop(self, key: str, format_key=True) -> str | bytes | None:
        if format_key:
            key = _format_key(key)
        return self.connection.lpop(key)

    def length(self, key: str, format_key=True) -> int:
        if format_key:
            key = _format_key(key)
        return self.connection.llen(key)

    def range(self, key: str, start_index: int, end_index: int, format_key=True) -> list[str] | list[bytes]:
        if format_key:
            key = _format_key(key)
        return self.connection.lrange(key, start_index, end_index)

    def trim(self, key: str, start_index: int, end_index: int, format_key=True) -> list[str] | list[bytes]:
        if format_key:
            key = _format_key(key)
        return self.connection.ltrim(key, start_index, end_index)
    
    def blocking_left_pop(self, key: str, timeout: int, format_key=True) -> str | bytes | None:
        if format_key:
            key = _format_key(key)
        # This will block the thread until either an item is pushed into the
        # List or timeout seconds have passed
        # https://redis.io/docs/latest/commands/blpop/
        response = self.connection.blpop(key, timeout=timeout)
        if response is None:
            return None
        _filled_list_key, item = response
        return item

class RedisSet(RedisDataType):
    """
    See https://redis.io/docs/latest/develop/data-types/sets/
    """
    def add(self, key: str, *values: str, format_key=True) -> int:
        if format_key:
            key = _format_key(key)
        return self.connection.sadd(key, *values)

    def is_member(self, key: str, value: str, format_key=True) -> bool:
        if format_key:
            key = _format_key(key)
        is_member = int(self.connection.sismember(key, value))
        return is_member == 1

    def remove(self, key: str, *values: str, format_key=True):
        if format_key:
            key = _format_key(key)
        return self.connection.srem(key, *values)

    def size(self, key: str, format_key=True) -> int:
        if format_key:
            key = _format_key(key)
        return self.connection.scard(key)

    def members(self, key: str, format_key=True) -> set[str]:
        if format_key:
            key = _format_key(key)
        return self.connection.smembers(key)

    def union(self, *keys: str, format_keys=True) -> set[str]:
        if format_keys:
            keys = tuple((_format_key(key) for key in keys))
        return self.connection.sunion(*keys)

    def intersection(self, *keys: str, format_keys=True) -> set[str]:
        if format_keys:
            keys = tuple((_format_key(key) for key in keys))
        return self.connection.sinter(*keys)

    def difference(self, *keys: str, format_keys=True) -> set[str]:
        if format_keys:
            keys = tuple((_format_key(key) for key in keys))
        return self.connection.sdiff(*keys)

# REFACTOR: Make a dedicated RedisBytes class to make working with bytes more
# intuitive
class RedisString(RedisDataType):
    """
    See https://redis.io/docs/latest/develop/data-types/strings/
    """

    def set(self, key, value, time_to_live=None, override_existing=True, format_key=True):
        if format_key:
            key = _format_key(key)
        flags = {
            "ex": time_to_live,
            "nx": not override_existing
        }
        self.connection.set(key, value, **flags)

    def get(self, key, delete_key=False, format_key=True) -> str | bytes | None:
        if format_key:
            key = _format_key(key)
        if delete_key:
            return self.connection.getdel(key)
        return self.connection.get(key)
