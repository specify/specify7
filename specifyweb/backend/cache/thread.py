from typing import Callable, Generic, TypeVar
from contextlib import contextmanager
from contextvars import ContextVar

class MissingKey:
    # This is used so that if the missing key is returned from a .get or
    # similar operation than implicit bool evaluators like if will evaluate
    # the object as False
    # e.g.:
    # my_val = my_thread_cache.get("some_key")
    # # if the key does not exist, then my_val will evaluate to False in the if
    # condition
    # if my_val:
    #   ...
    def __bool__(self):
        return False

KEY_MISSING = MissingKey()

K = TypeVar("K")
V = TypeVar("V")

# Would much rather use the built-in syntax for declaring generics on classes
# in Python 3.12, but MyPy doesn't seem to like that currently, so going with
# the old-fashion way with TypeVar and Generic for now
class ThreadCache(Generic[K, V]):
    """
    A wrapper for ContextVar objects containg dictonaries that can act as
    caches.
    Example usage:
    ```py
    _thread_safe_collection: ContextVar[dict[int, Collection]] = ContextVar("my_ctx_var", default=None)
    collection_cache = ThreadCache(_thread_safe_collection)

    # enable/activate a new cache. Calls to set and get will store and retreive
    # values
    with collection_cache.activate():
        collection_id = 4
        fetch_collection = lambda: Collection.objects.get(id=collection_id)
        # get the collection from the cache if it's already set, otherwise fetch
        # it and set it into the cache
        cached_collection = collection_cache.get_or_set(collection_id, fetch_collection)
        ...
        # other general uses
        is_cache_active, collection = collection_cache.get(collection_id)
        if not cache_active:
            # the collection_cache is not activated, do something
            ...
        if collection is collection_cache.MISSING:
            # colleciton not in cache, do something
            ...
        collection_cache.set(1, Collection.objects.get(id=1))
        collection_cache.remove(1)

        # for this inner context manager, the cache will be reset
        with collection_cache.activate():
            ... # do stuff with "new" cache
        # when the context manager exits, the cache is reset to its prior state
    ```
    """
    MISSING = KEY_MISSING

    def __init__(self, context_var: ContextVar[dict[K, V] | None]):
        self._internal = context_var

    @contextmanager
    def activate(self):
        token = self._internal.set({})
        try:
            yield self
        finally:
            self._internal.reset(token)

    def is_active(self) -> bool:
        return self._internal.get() is not None

    def get(self, key: K, default=KEY_MISSING):
        """
        Returns a two-tuple with elements representing:
        1. A boolean indicating whether the cache is active or not
        2. The retrieved value, or the provided default value if the key is not
            present (self.MISSING by default if no other default is provided)
        """
        current_dict = self._internal.get()
        # i.e., the cache is inactive
        if current_dict is None:
            return False, None
        value_for_key = current_dict.get(key, default)
        return True, value_for_key

    def set(self, key: K, value: V, override_existing: bool = True):
        active, current_value = self.get(key)
        if not active:
            return None

        if override_existing or current_value is self.MISSING:
            current_dict = self._internal.get()
            current_dict[key] = value

    def get_or_set(self, key: K, calculate_value: Callable[[], V]) -> V:
        """
        Attempts to get the value assoicated with the given key.
        The caller provides a function that should evaluate to a value when the
        cache is not active or the key is not already set in the cache.
        """
        active, current = self.get(key)
        if not active:
            return calculate_value()
        if current is self.MISSING:
            value = calculate_value()
            self.set(key, value)
            return value
        return current
    
    def remove(self, key: K) -> None | V:
        current_dict = self._internal.get()
        if current_dict is None:
            return None
        return current_dict.pop(key, None)

    def clear_keys(self):
        current_dict = self._internal.get()
        if current_dict is None:
            return
        current_dict.clear()

    def __contains__(self, item):
        active, value = self.get(item)
        if not active:
            return False
        return value is not self.MISSING
