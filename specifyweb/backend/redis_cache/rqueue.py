from typing import Callable, Generator, cast

from specifyweb.backend.redis_cache.connect import RedisList


type Serializer[T] = Callable[[T], str]

def default_serializer(obj) -> str:
    return str(obj)

class RQueue[T]:
    def __init__(self, connection: RedisList, key: str,
                 serializer: Serializer[T] | None = None, key_prefix: str = "specify"):
        self.connection = connection
        self.key = key
        self.serializer = serializer or cast(Serializer[T], default_serializer)

    def push(self, *objs: T) -> int:
        return self.connection.rpush(self.key, *self._serialize_objs(*objs))

    def pop(self) -> str | bytes | None:
        return self.connection.lpop(self.key)

    def _serialize_objs(self, *objs: T) -> Generator[str, None, None]:
        return (self.serializer(obj) for obj in objs)
