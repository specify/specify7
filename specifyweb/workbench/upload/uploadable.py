from typing import Any, TypedDict, Optional, Union
from collections.abc import Callable
from typing_extensions import Protocol

from specifyweb.workbench.upload.predicates import DjangoPredicates, ToRemove

from specifyweb.workbench.upload.scope_context import ScopeContext

from .upload_result import UploadResult, ParseFailures
from .auditor import Auditor


class BatchEditSelf(TypedDict):
    id: int
    ordernumber: int | None
    version: int | None


class BatchEditJson(TypedDict):
    self: BatchEditSelf
    to_one: dict[str, Any]
    to_many: dict[str, list[Any]]


class Extra(TypedDict):
    batch_edit: BatchEditJson | None
    disambiguation: dict[str, int]


Disambiguation = Optional["DisambiguationInfo"]

NULL_RECORD = "null_record"

Progress = Callable[[int, int | None], None]

Row = dict[str, str]

Filter = dict[str, Any]


class Uploadable(Protocol):
    # also returns if the scoped table returned can be cached or not.
    # depends on whether scope depends on other columns. if any definition is found,
    # we cannot cache. well, we can make this more complicated by recursviely caching
    # static parts of even a non-entirely-cachable uploadable.
    def apply_scoping(
        self, collection, context: ScopeContext | None = None, row=None
    ) -> "ScopedUploadable": ...

    def get_cols(self) -> set[str]: ...

    def to_json(self) -> dict: ...

    def unparse(self) -> dict: ...


class DisambiguationInfo(Protocol):
    def disambiguate(self) -> int | None: ...

    def disambiguate_tree(self) -> dict[str, int]: ...

    def disambiguate_to_one(self, to_one: str) -> "Disambiguation": ...

    def disambiguate_to_many(
        self, to_many: str, record_index: int
    ) -> "Disambiguation": ...


class ScopedUploadable(Protocol):
    def disambiguate(self, disambiguation: Disambiguation) -> "ScopedUploadable": ...

    # We don't pass in collection in bind() anymore since it can cause
    # unintended behaviour in the case of collection relationship.
    # Previously, formatters used to depend on collection, but they are now
    # instead determined in apply_scoping (where the usage of collection is safer)
    def bind(
        self,
        row: Row,
        uploadingAgentId: int,
        auditor: Auditor,
        cache: dict | None = None,
    ) -> Union["BoundUploadable", ParseFailures]: ...

    def get_treedefs(self) -> set: ...

    def apply_batch_edit_pack(
        self, batch_edit_pack: BatchEditJson | None
    ) -> "ScopedUploadable": ...


class BoundUploadable(Protocol):
    def is_one_to_one(self) -> bool: ...

    def must_match(self) -> bool: ...

    def get_django_predicates(
        self,
        should_defer_match: bool,
        to_one_override: dict[str, UploadResult] = {},
        consider_dependents=False,
        #TODO: Refactor to make this always required.
        is_origin=False,
        origin_is_editable=False
    ) -> DjangoPredicates: ...

    def get_to_remove(self) -> ToRemove: ...

    def match_row(self) -> UploadResult: ...

    def process_row(self) -> UploadResult: ...

    def force_upload_row(self) -> UploadResult: ...

    def save_row(self, force=False) -> UploadResult: ...

    # I don't want to use dataset's isupdate=True, so using this. That is, the entire "batch edit" can work perfectly fine using workbench.
    def can_save(self) -> bool: ...

    def delete_row(self, parent_obj=None) -> UploadResult: ...
