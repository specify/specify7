from functools import reduce
from typing import Callable, Dict, List, Optional, Tuple, TypeVar
from collections.abc import Generator
from django.db.models import Q

# made as a class to encapsulate type variables and prevent pollution of export


class Func:
    I = TypeVar("I")
    O = TypeVar("O")

    @staticmethod
    def maybe(value: Optional[I], callback: Callable[[I], O]):
        if value is None:
            return None
        return callback(value)

    @staticmethod
    def sort_by_key(to_sort: dict[I, O], reverse=False) -> list[tuple[I, O]]:
        return sorted(to_sort.items(), key=lambda t: t[0], reverse=reverse)
    
    @staticmethod
    def obj_to_list(obj: Dict[I, O]) -> List[Tuple[I, O]]:
        return [(key, val) for key, val in obj.items()]

    @staticmethod
    def make_ors(eprns: list[Q]) -> Q:
        assert len(eprns) > 0
        return reduce(lambda accum, curr: accum | curr, eprns)

    @staticmethod
    def make_generator(step=1):
        def _generator(step=step):
            i = 0
            while True:
                yield i
                i += step

        return _generator(step)

    @staticmethod
    def remove_keys(source: dict[I, O], callback: Callable[[O], bool]) -> dict[I, O]:
        return {key: value for key, value in source.items() if callback(key, value)}

    @staticmethod
    def is_not_empty(key, val) -> bool:
        return bool(val)

    @staticmethod
    def first(source: list[tuple[I, O]]) -> list[I]:
        return [first for (first, _) in source]

    @staticmethod
    def second(source: list[tuple[I, O]]) -> list[O]:
        return [second for (_, second) in source]
    
    @staticmethod
    def filter_list(source: List[Optional[I]]) -> List[I]:
        return [item for item in source if item is not None]

class CustomRepr:
    def __init__(self, func, new_repr):
        self.new_repr = new_repr
        self.func = func

    def __call__(self, *args, **kwargs):
        return None if self.func is None else self.func(*args, **kwargs)

    def __repr__(self):
        return self.new_repr
