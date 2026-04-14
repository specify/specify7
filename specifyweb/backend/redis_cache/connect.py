from redis import Redis
from django.conf import settings

from typing import Literal

# https://redis.io/docs/latest/commands/type/
Redis_Type = Literal["string", "list", "set", "hash", "stream", "vectorset"]


class RedisConnection:
    def __init__(self,
                 host=getattr(settings, "REDIS_HOST", None),
                 port=getattr(settings, "REDIS_PORT", None),
                 db_index=getattr(settings, "REDIS_DB_INDEX", 0),
                 decode_responses=True,
                 use_formatted_key: bool = True):
        if None in (host, port, db_index):
            raise ValueError(
                "Redis is not correctly configured", host, port, db_index)
        self.host = host
        self.port = port
        self.db_index = db_index
        self.decode_responses = decode_responses
        self.use_formatted_key = use_formatted_key
        self.connection = Redis(
            host=self.host,
            port=self.port,
            db=self.db_index,
            decode_responses=self.decode_responses
        )

    def format_key(self, key: str | bytes):
        db_name = getattr(settings, "DATABASE_NAME")
        key_prefix = f"specify:{db_name}:"
        if isinstance(key, bytes):
            return key_prefix.encode() + key if self.use_formatted_key else key
        return f"{key_prefix}{key}" if self.use_formatted_key else key

    def delete(self, key: str | bytes):
        return self.connection.delete(self.format_key(key))

    def rtype(self, key: str | bytes) -> Redis_Type | None:
        return self.connection.type(self.format_key(key))
