from redis import Redis
from django.conf import settings

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

    def delete(self, key: str):
        return self.connection.delete(key)


class RedisDataType:
    def __init__(self, established: RedisConnection) -> None:
        self._established = established

    @property
    def connection(self):
        return self._established.connection

    def delete(self, key: str):
        return self._established.delete(key)

class RedisList(RedisDataType):
    """
    See https://redis.io/docs/latest/develop/data-types/lists/
    """

    def left_push(self, key: str, value) -> int:
        return self.connection.lpush(key, value)

    def right_push(self, key: str, value) -> int:
        return self.connection.rpush(key, value)

    def right_pop(self, key: str) -> str | bytes | None:
        return self.connection.rpop(key)

    def left_pop(self, key: str) -> str | bytes | None:
        return self.connection.lpop(key)

    def length(self, key: str) -> int:
        return self.connection.llen(key)

    def range(self, key: str, start_index: int, end_index: int) -> list[str] | list[bytes]:
        return self.connection.lrange(key, start_index, end_index)

    def trim(self, key: str, start_index: int, end_index: int) -> list[str] | list[bytes]:
        return self.connection.ltrim(key, start_index, end_index)
    
    def blocking_left_pop(self, key: str, timeout: int) -> str | bytes | None:
        response = self.connection.blpop(key, timeout=timeout)
        if response is None:
            return None
        _filled_list_key, item = response
        return item

class RedisSet(RedisDataType):
    """
    See https://redis.io/docs/latest/develop/data-types/sets/
    """
    def add(self, key: str, *values: str) -> int:
        return self.connection.sadd(key, *values)

    def is_member(self, key: str, value: str) -> bool:
        is_member = int(self.connection.sismember(key, value))
        return is_member == 1

    def remove(self, key: str, value: str):
        return self.connection.srem(key, value)

    def size(self, key: str) -> int:
        return self.connection.scard(key)

    def members(self, key: str) -> set[str]:
        return self.connection.smembers(key)

    def union(self, *keys: str) -> set[str]:
        return self.connection.sunion(*keys)

    def intersection(self, *keys: str) -> set[str]:
        return self.connection.sinter(*keys)

    def difference(self, *keys: str) -> set[str]:
        return self.connection.sdiff(*keys)

class RedisString(RedisDataType):
    """
    See https://redis.io/docs/latest/develop/data-types/strings/
    """

    def set(self, key, value, time_to_live=None, override_existing=True):
        flags = {
            "ex": time_to_live,
            "nx": not override_existing
        }
        self.connection.set(key, value, **flags)

    def get(self, key, delete_key=False) -> str | bytes | None:
        if delete_key:
            return self.connection.getdel(key)
        return self.connection.get(key)
