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

    def to_json(self):
        return { 'Uploaded': self._asdict() }


class Matched(NamedTuple):
    id: int

    def get_id(self) -> Optional[int]:
        return self.id

    def to_json(self):
        return { 'Matched': self._asdict() }


class MatchedMultiple(NamedTuple):
    ids: List[int]

    def get_id(self) -> Optional[int]:
        return self.ids[0]

    def to_json(self):
        return { 'MatchedMultiple': self._asdict() }

class NullRecord(NamedTuple):
    def get_id(self) -> Optional[int]:
        return None

    def to_json(self):
        return { 'NullRecord': self._asdict() }


class UploadResult(NamedTuple):
    record_result: Union[Uploaded, Matched, MatchedMultiple, NullRecord]
    toOne: Dict[str, Any]
    toMany: Dict[str, Any]

    def get_id(self) -> Optional[int]:
        return self.record_result.get_id()

    def to_json(self):
        return { 'UploadResult': {
            'record_result': self.record_result.to_json(),
            'toOne': {k: v.to_json() for k,v in self.toOne.items()},
            'toMany': {k: [v.to_json() for v in vs] for k,vs in self.toMany.items()},
        }}


class Uploadable(Protocol):
    def filter_on(self, collection, path: str, row: Row) -> FilterPack:
        ...

    def upload_row(self, collection, row: Row) -> UploadResult:
        ...

    def to_json(self) -> Dict:
        ...
