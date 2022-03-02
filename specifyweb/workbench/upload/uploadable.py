from typing import List, Dict, Tuple, Any, NamedTuple, Optional, Union, Set
from typing_extensions import Protocol, Literal

from .upload_result import UploadResult, ParseFailures
from .auditor import Auditor

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

    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundUploadable", ParseFailures]:
        ...

    def get_treedefs(self) -> Set:
        ...

Filter = Dict[str, Any]

def filter_match_key(f: Filter) -> str:
    return repr(sorted(f.items()))

class Exclude(NamedTuple):
    lookup: str
    table: str
    filter: Filter

    def match_key(self) -> str:
        return repr((self.lookup, self.table, filter_match_key(self.filter)))

class FilterPack(NamedTuple):
    filters: List[Filter]
    excludes: List[Exclude]

    def match_key(self) -> str:
        return repr((sorted(filter_match_key(f) for f in self.filters), sorted(e.match_key() for e in self.excludes)))


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

