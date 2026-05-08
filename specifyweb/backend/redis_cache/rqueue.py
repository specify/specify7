import json

from typing import Callable, Generator, Iterable, cast

from specifyweb.backend.redis_cache.connect import RedisConnection, RedisList, RedisSet

type Serialized = str | bytes | bytearray

type Serializer[T] = Callable[[T], str]
type Deserializer[T] = Callable[[Serialized], T]

def default_serializer(obj) -> str:
    return str(obj)

def default_deserializer(serialized: Serialized):
    return serialized

class RedisQueue[T]:
    def __init__(self, connection: RedisConnection, key: str,
                 serializer: Serializer[T] | None = None,
                 deserializer: Deserializer[T] | None = None):
        self.connection = RedisList(connection)
        self.key = key
        self.serializer = serializer or cast(Serializer[T], default_serializer)
        self.deserializer = deserializer or cast(Deserializer[T], default_deserializer)

    def key_name(self, *name_parts: str | None):
        key_name = "_".join([self.key, *(part for part in name_parts if part is not None)])
        return key_name

    def push(self, *objs: T, sub_key: str | None = None) -> int:
        key_name = self.key_name(sub_key)
        return self.connection.right_push(key_name, *self._serialize_objs(*objs))

    def pop(self, sub_key: str | None = None) -> T | None:
        key_name = self.key_name(sub_key)
        popped = self.connection.left_pop(key_name)
        if popped is None:
            return None
        return self.deserializer(popped)
    
    def wait_and_pop(self, timeout: int = 0, sub_key: str | None = None) -> T:
        key_name = self.key_name(sub_key)
        popped = self.connection.blocking_left_pop(key_name, timeout)
        if popped is None:
            raise TimeoutError("No items in queue after timeout")
        return self.deserializer(popped)

    def peek(self, sub_key: str | None = None) -> T | None:
        key_name = self.key_name(sub_key)
        top_value = self._deserialize_objs(*self.connection.range(key_name, 0, 0))
        if len(top_value) == 0:
            return None
        return top_value[0]

    def _serialize_objs(self, *objs: T) -> Generator[str, None, None]:
        return (self.serializer(obj) for obj in objs)
    
    def _deserialize_objs(self, *serialized: Serialized):
        return tuple(self.deserializer(obj) for obj in serialized)

