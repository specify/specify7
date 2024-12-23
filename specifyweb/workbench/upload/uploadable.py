from typing import Dict, Generator, Callable, Any, List, Optional, TypedDict, Union, Set
from typing_extensions import Protocol

from specifyweb.specify.load_datamodel import Table
from specifyweb.workbench.upload.predicates import DjangoPredicates, ToRemove

from django.db.models import Model

from .upload_result import UploadResult, ParseFailures
from .auditor import Auditor


class BatchEditSelf(TypedDict):
    id: int
    ordernumber: Optional[int]
    version: Optional[int]


class BatchEditJson(TypedDict):
    self: BatchEditSelf
    to_one: Dict[str, Any]
    to_many: Dict[str, List[Any]]


class Extra(TypedDict):
    batch_edit: Optional[BatchEditJson]
    disambiguation: Dict[str, int]


Disambiguation = Optional["DisambiguationInfo"]

NULL_RECORD = "null_record"

ScopeGenerator = Optional[Generator[int, None, None]]

Progress = Callable[[int, Optional[int]], None]

Row = Dict[str, str]

Filter = Dict[str, Any]


class Uploadable(Protocol):
    # also returns if the scoped table returned can be cached or not.
    # depends on whether scope depends on other columns. if any definition is found,
    # we cannot cache. well, we can make this more complicated by recursviely caching
    # static parts of even a non-entirely-cachable uploadable.
    def apply_scoping(
        self, collection, generator: ScopeGenerator = None, row=None
    ) -> "ScopedUploadable": ...

    def get_cols(self) -> Set[str]: ...

    def to_json(self) -> Dict: ...

    def unparse(self) -> Dict: ...


class DisambiguationInfo(Protocol):
    def disambiguate(self) -> Optional[int]: ...

    def disambiguate_tree(self) -> Dict[str, int]: ...

    def disambiguate_to_one(self, to_one: str) -> "Disambiguation": ...

    def disambiguate_to_many(
        self, to_many: str, record_index: int
    ) -> "Disambiguation": ...


class ScopedUploadable(Protocol):
    def disambiguate(self, disambiguation: Disambiguation) -> "ScopedUploadable": ...

    def bind(
        self,
        row: Row,
        uploadingAgentId: int,
        auditor: Auditor,
        cache: Optional[Dict] = None,
    ) -> Union["BoundUploadable", ParseFailures]: ...

    def get_treedefs(self) -> Set: ...

    def apply_batch_edit_pack(
        self, batch_edit_pack: Optional[BatchEditJson]
    ) -> "ScopedUploadable": ...


class BoundUploadable(Protocol):
    def is_one_to_one(self) -> bool: ...

    def must_match(self) -> bool: ...

    def get_django_predicates(
        self,
        should_defer_match: bool,
        to_one_override: Dict[str, UploadResult] = {},
        consider_dependents=False,
    ) -> DjangoPredicates: ...

    def get_to_remove(self) -> ToRemove: ...

    def match_row(self) -> UploadResult: ...

    def process_row(self) -> UploadResult: ...

    def force_upload_row(self) -> UploadResult: ...

    def save_row(self, force=False) -> UploadResult: ...

    # I don't want to use dataset's isupdate=True, so using this. That is, the entire "batch edit" can work perfectly fine using workbench.
    def can_save(self) -> bool: ...

    def delete_row(self, parent_obj=None) -> UploadResult: ...
