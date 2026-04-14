from specifyweb.backend.redis_cache.connect import RedisConnection


class RedisDataType:
    def __init__(self, established: RedisConnection | None = None) -> None:
        self._established = RedisConnection() if established is None else established

    @property
    def connection(self):
        return self._established.connection

    def format_key(self, key: str | bytes):
        return self._established.format_key(key)

    def delete(self, key: str | bytes):
        return self._established.delete(key)
    
    # FEATURE: Expose the "Redis Type" rtype method from RedisConnection here


class RedisDefaultKeyable(RedisDataType):
    def __init__(self, default_key: str | bytes | None = None, established = None):
        super().__init__(established)
        self.default_key = default_key
    
    def format_key(self, key: str | bytes | None):
        resolved_key = self.default_key if key is None else key
        if resolved_key is None:
            raise ValueError(f"Redis Key could not be resolved")
        return super().format_key(resolved_key)

class RedisList(RedisDefaultKeyable):
    """
    See https://redis.io/docs/latest/develop/data-types/lists/
    """

    def left_push(self, *values, key: str | bytes | None = None,) -> int:
        redis_key = self.format_key(key)
        return self.connection.lpush(redis_key, *values)

    def right_push(self, *values, key: str | bytes | None = None) -> int:
        redis_key = self.format_key(key)
        return self.connection.rpush(redis_key, *values)

    def right_pop(self, key: str | bytes | None = None) -> str | bytes | None:
        redis_key = self.format_key(key)
        return self.connection.rpop(redis_key)

    def left_pop(self, key: str | bytes | None = None) -> str | bytes | None:
        redis_key = self.format_key(key)
        return self.connection.lpop(redis_key)

    def length(self, key: str | bytes | None = None) -> int:
        redis_key = self.format_key(key)
        return self.connection.llen(redis_key)

    def range(self, start_index: int, end_index: int, key: str | bytes | None = None) -> list[str] | list[bytes]:
        redis_key = self.format_key(key)
        return self.connection.lrange(redis_key, start_index, end_index)

    def trim(self, start_index: int, end_index: int, key: str | bytes | None = None) -> list[str] | list[bytes]:
        redis_key = self.format_key(key)
        return self.connection.ltrim(redis_key, start_index, end_index)

    def blocking_left_pop(self, timeout: int, key: str | bytes | None = None) -> str | bytes | None:
        redis_key = self.format_key(key)
        response = self.connection.blpop(redis_key, timeout=timeout)
        if response is None:
            return None
        _filled_list_key, item = response
        return item


class RedisSet(RedisDefaultKeyable):
    """
    See https://redis.io/docs/latest/develop/data-types/sets/
    """

    def add(self, *values: str, key: str | bytes | None = None) -> int:
        redis_key = self.format_key(key)
        return self.connection.sadd(redis_key, *values)

    def is_member(self, value: str, key: str | bytes | None = None) -> bool:
        redis_key = self.format_key(key)
        is_member = int(self.connection.sismember(redis_key, value))
        return is_member == 1

    def remove(self, *values: str, key: str | bytes | None = None):
        redis_key = self.format_key(key)
        return self.connection.srem(redis_key, values)

    def size(self, key: str | bytes | None = None) -> int:
        redis_key = self.format_key(key)
        return self.connection.scard(redis_key)

    def members(self, key: str | bytes | None = None) -> set[str]:
        redis_key = self.format_key(key)
        return self.connection.smembers(redis_key)

    def union(self, *keys: str) -> set[str]:
        redis_keys = (self.format_key(key) for key in keys)
        return self.connection.sunion(*redis_keys)

    def intersection(self, *keys: str) -> set[str]:
        redis_keys = (self.format_key(key) for key in keys)
        return self.connection.sinter(*redis_keys)

    def difference(self, *keys: str) -> set[str]:
        redis_keys = (self.format_key(key) for key in keys)
        return self.connection.sdiff(*redis_keys)


class RedisDict(RedisDataType):
    def set(self, key: str | bytes, value: str | bytes, time_to_live: int | float | None = None, override_existing=True):
        flags = {
            "ex": time_to_live,
            "nx": not override_existing
        }
        redis_key = self.format_key(key)
        self.connection.set(redis_key, value, **flags)

    def get(self, key: str | bytes, delete_key=False) -> str | bytes | None:
        redis_key = self.format_key(key)
        if delete_key:
            return self.connection.getdel(redis_key)
        return self.connection.get(redis_key)


class RedisString(RedisDict):
    """
    See https://redis.io/docs/latest/develop/data-types/strings/
    """

    def __init__(self, established=None):
        super().__init__(established)
        if not self._established.decode_responses:
            raise ValueError(
                "Connection should decode responses for string connection")

    def set(self, key: str | bytes, value: str, time_to_live: int | float | None = None, override_existing=True):
        ...

    def get(self, key: str | bytes, delete_key=False) -> str | None:
        ...


class RedisBytes(RedisDict):
    """
    See https://redis.io/docs/latest/develop/data-types/strings/
    """

    def __init__(self, established=None):
        super().__init__(established)
        if self._established.decode_responses:
            raise ValueError(
                "Connection should not decode responses for bytes connection")

    def set(self, key: str | bytes, value: bytes, time_to_live: int | float | None = None, override_existing=True):
        ...

    def get(self, key: str | bytes, delete_key=False) -> bytes | None:
        ...
