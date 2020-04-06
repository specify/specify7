from typing import List, Dict, Tuple, Any, NamedTuple, Optional, Union
from typing_extensions import Protocol

Row = Dict[str, str]
Filter = Dict[str, Any]

class Exclude(NamedTuple):
    lookup: str
    table: str
    filter: Filter


class FilterPack(NamedTuple):
    filters: List[Filter]
    excludes: List[Exclude]


class Uploaded(NamedTuple):
    id: int

    def get_id(self) -> Optional[int]:
        return self.id


class Matched(NamedTuple):
    id: int

    def get_id(self) -> Optional[int]:
        return self.id


class MatchedMultiple(NamedTuple):
    ids: List[int]

    def get_id(self) -> Optional[int]:
        return self.ids[0]


class NullRecord(object):
    def get_id(self) -> Optional[int]:
        return None


class UploadResult(NamedTuple):
    record_result: Union[Uploaded, Matched, MatchedMultiple, NullRecord]
    toOne: Dict[str, Any]
    toMany: Dict[str, Any]

    def get_id(self) -> Optional[int]:
        return self.record_result.get_id()

class Uploadable(Protocol):
    def filter_on(self, collection, path: str, row: Row) -> FilterPack:
        ...

    def upload_row(self, collection, row: Row) -> UploadResult:
        ...

