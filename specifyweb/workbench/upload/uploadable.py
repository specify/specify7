from contextlib import contextmanager
import re
from typing import Dict, Generator, Callable, Literal, NamedTuple, Tuple, Any, Optional, TypedDict, Union, Set
from typing_extensions import Protocol


from specifyweb.context.remote_prefs import get_remote_prefs
from specifyweb.workbench.upload.predicates import DjangoPredicates, ToRemove

from .upload_result import UploadResult, ParseFailures
from .auditor import Auditor

NULL_RECORD = 'null_record'

ScopeGenerator = Optional[Generator[int, None, None]]

Progress = Callable[[int, Optional[int]], None]

Row = Dict[str, str]

Filter = Dict[str, Any]

class Uploadable(Protocol):
    # also returns if the scoped table returned can be cached or not.
    # depends on whether scope depends on other columns. if any definition is found,
    # we cannot cache. well, we can make this more complicated by recursviely caching
    # static parts of even a non-entirely-cachable uploadable.
    def apply_scoping(self, collection, generator: ScopeGenerator = None, row=None) -> "ScopedUploadable":
        ...

    def get_cols(self) -> Set[str]:
        ...

    def to_json(self) -> Dict:
        ...

    def unparse(self) -> Dict:
        ...

class DisambiguationInfo(Protocol):
    def disambiguate(self) -> Optional[int]:
        ...

    def disambiguate_tree(self) -> Dict[str, int]:
        ...

    def disambiguate_to_one(self, to_one: str) -> "Disambiguation":
        ...

    def disambiguate_to_many(self, to_many: str, record_index: int) -> "Disambiguation":
        ...

Disambiguation = Optional[DisambiguationInfo]


class ScopedUploadable(Protocol):
    def disambiguate(self, disambiguation: Disambiguation) -> "ScopedUploadable":
        ...

    def bind(self, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundUploadable", ParseFailures]:
        ...

    def get_treedefs(self) -> Set:
        ...
    
    def apply_batch_edit_pack(self, batch_edit_pack: Optional[Dict[str, Any]]) -> "ScopedUploadable":
        ...

class BoundUploadable(Protocol):
    def is_one_to_one(self) -> bool:
        ...

    def must_match(self) -> bool:
        ...
    
    def get_django_predicates(self, should_defer_match: bool, to_one_override: Dict[str, UploadResult] = {}) -> DjangoPredicates:
        ...

    def get_to_remove(self) -> ToRemove:
        ...

    def match_row(self) -> UploadResult:
        ...

    def process_row(self) -> UploadResult:
        ...

    def force_upload_row(self) -> UploadResult:
        ...
    
    def save_row(self, force=False) -> UploadResult:
        ...

    # I don't want to use dataset's isupdate=True, so using this. That is, the entire "batch edit" can work perfectly fine using workbench.
    def can_save(self) -> bool:
        ...

    def delete_row(self, info, parent_obj=None) -> UploadResult:
        ...