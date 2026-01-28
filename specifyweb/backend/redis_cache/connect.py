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


class RedisDataType(RedisConnection):

    @classmethod
    def from_connection(cls, connection: RedisConnection):
        return cls(
            host=connection.host,
            port=connection.port,
            db_index=connection.db_index,
            decode_responses=connection.decode_responses
        )

class RedisList(RedisDataType):
    """
    See https://redis.io/docs/latest/develop/data-types/lists/
    """

    def lpush(self, key: str, value) -> int:
        return self.connection.lpush(key, value)

    def rpush(self, key: str, value) -> int:
        return self.connection.rpush(key, value)

    def rpop(self, key: str) -> str | bytes | None:
        return self.connection.rpop(key)

    def lpop(self, key: str) -> str | bytes | None:
        return self.connection.lpop(key)

    def llen(self, key: str) -> int:
        return self.connection.llen(key)

    def lrange(self, key: str, start_index: int, end_index: int) -> list[str] | list[bytes]:
        return self.connection.lrange(key, start_index, end_index)

    def ltrim(self, key: str, start_index: int, end_index: int) -> list[str] | list[bytes]:
        return self.connection.ltrim(key, start_index, end_index)


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
