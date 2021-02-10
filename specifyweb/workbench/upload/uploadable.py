from typing import List, Dict, Tuple, Any, NamedTuple, Optional, Union, Set
from typing_extensions import Protocol

from .upload_result import UploadResult, ParseFailures

class Uploadable(Protocol):
    def apply_scoping(self, collection) -> "ScopedUploadable":
        ...

    def get_cols(self) -> Set[str]:
        ...

    def to_json(self) -> Dict:
        ...

    def unparse(self) -> Dict:
        ...

Row = Dict[str, str]

class ScopedUploadable(Protocol):
    def bind(self, collection, row: Row) -> Union["BoundUploadable", ParseFailures]:
        ...

Filter = Dict[str, Any]

class Exclude(NamedTuple):
    lookup: str
    table: str
    filter: Filter


class FilterPack(NamedTuple):
    filters: List[Filter]
    excludes: List[Exclude]


class BoundUploadable(Protocol):
    def is_one_to_one(self) -> bool:
        ...

    def must_match(self) -> bool:
        ...

    def filter_on(self, path: str) -> FilterPack:
        ...

    def match_row(self) -> UploadResult:
        ...

    def process_row(self) -> UploadResult:
        ...

    def force_upload_row(self) -> UploadResult:
        ...

