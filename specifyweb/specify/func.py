
from functools import reduce
from typing import  Callable, Dict, Generator, List, Optional, Tuple, TypeVar
from django.db.models import Q

# made as a class to encapsulate type variables and prevent pollution of export
class Func:
    I = TypeVar('I')
    O = TypeVar('O')

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
    def tap_call(callback: Callable[[], O], generator: Generator[int, None, None]) -> Tuple[bool, O]:
        init_1 = next(generator)
        init_2 = next(generator)
        step = init_2 - init_1
        to_return = callback()
        post = next(generator)
        called = (post - init_2) != step
        assert (post - init_2) % step == 0, "(sanity check failed): made irregular generator"
        return called, to_return

        
    @staticmethod
    def remove_keys(source: Dict[I, O], callback: Callable[[O], bool]) -> Dict[I, O]:
        return {
            key: value
            for key, value in source.items()
            if callback(value)
        }