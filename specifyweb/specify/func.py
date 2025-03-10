from functools import reduce
from typing import Callable, Dict, Generator, List, Optional, Tuple, TypeVar
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
    def sort_by_key(to_sort: Dict[I, O], reverse=False) -> List[Tuple[I, O]]:
        return sorted(to_sort.items(), key=lambda t: t[0], reverse=reverse)

    @staticmethod
    def make_ors(eprns: List[Q]) -> Q:
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
    def remove_keys(source: Dict[I, O], callback: Callable[[O], bool]) -> Dict[I, O]:
        return {key: value for key, value in source.items() if callback(key, value)}

    @staticmethod
    def is_not_empty(key, val) -> bool:
        return bool(val)

    @staticmethod
    def first(source: List[Tuple[I, O]]) -> List[I]:
        return [first for (first, _) in source]

    @staticmethod
    def second(source: List[Tuple[I, O]]) -> List[O]:
        return [second for (_, second) in source]

class CustomRepr:
    def __init__(self, func, new_repr):
        self.new_repr = new_repr
        self.func = func

    def __call__(self, *args, **kwargs):
        return None if self.func is None else self.func(*args, **kwargs)

    def __repr__(self):
        return self.new_repr
