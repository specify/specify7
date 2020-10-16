from typing import List, Dict, Tuple, Any, NamedTuple, Optional, Union
from typing_extensions import Protocol

from .validation_schema import CellIssue, TableIssue, NewRow, RowValidation, NewPicklistItem

Row = Dict[str, str]
Filter = Dict[str, Any]

class Exclude(NamedTuple):
    lookup: str
    table: str
    filter: Filter


class FilterPack(NamedTuple):
    filters: List[Filter]
    excludes: List[Exclude]

class ReportInfo(NamedTuple):
    "Records the table and wb cols an upload result refers to."
    tableName: str
    columns: List[str]

class PicklistAddition(NamedTuple):
    name: str # Name of the picklist receiving the new item
    value: str # The value of the new item
    caption: str # The dataset column caption generating the addition
    id: int # The new picklistitem id

class Uploaded(NamedTuple):
    id: int
    info: ReportInfo
    picklistAdditions: List[PicklistAddition]

    def get_id(self) -> Optional[int]:
        return self.id

    def is_failure(self) -> bool:
        return False

    def validation_info(self) -> RowValidation:
        return RowValidation(
            cellIssues=[],
            tableIssues=[],
            newRows=[NewRow(
                tableName=self.info.tableName,
                columns=self.info.columns,
                id=self.id
            )],
            picklistAdditions=[NewPicklistItem(
                name=a.name,
                value=a.value,
                column=a.caption,
                id=a.id
            ) for a in self.picklistAdditions]
        )

    def to_json(self):
        return { 'Uploaded': self._asdict() }


class Matched(NamedTuple):
    id: int
    info: ReportInfo

    def get_id(self) -> Optional[int]:
        return self.id

    def is_failure(self) -> bool:
        return False

    def validation_info(self) -> RowValidation:
        return RowValidation([], [], [], [])

    def to_json(self):
        return { 'Matched': self._asdict() }


class MatchedMultiple(NamedTuple):
    ids: List[int]
    info: ReportInfo

    def get_id(self) -> Optional[int]:
        return self.ids[0]

    def is_failure(self) -> bool:
        return True

    def validation_info(self) -> RowValidation:
        return RowValidation(
            cellIssues=[],
            newRows=[],
            picklistAdditions=[],
            tableIssues=[
                TableIssue(
                    tableName=self.info.tableName,
                    columns=self.info.columns,
                    issue="Multiple records matched."
        )])

    def to_json(self):
        return { 'MatchedMultiple': self._asdict() }

class NullRecord(NamedTuple):
    info: ReportInfo

    def get_id(self) -> Optional[int]:
        return None

    def is_failure(self) -> bool:
        return False

    def validation_info(self) -> RowValidation:
        return RowValidation([], [], [], [])

    def to_json(self):
        return { 'NullRecord': self._asdict() }

class FailedBusinessRule(NamedTuple):
    message: str
    info: ReportInfo

    def get_id(self) -> Optional[int]:
        return None

    def is_failure(self) -> bool:
        return True

    def validation_info(self) -> RowValidation:
        return RowValidation(
            cellIssues=[],
            newRows=[],
            picklistAdditions=[],
            tableIssues=[
                TableIssue(
                    tableName=self.info.tableName,
                    columns=self.info.columns,
                    issue=self.message
        )])

    def to_json(self):
        return { self.__class__.__name__: self._asdict() }

class NoMatch(NamedTuple):
    info: ReportInfo

    def get_id(self) -> Optional[int]:
        return None

    def is_failure(self) -> bool:
        return True

    def validation_info(self) -> RowValidation:
        return RowValidation(
            cellIssues=[],
            newRows=[],
            picklistAdditions=[],
            tableIssues=[
                TableIssue(
                    tableName=self.info.tableName,
                    columns=self.info.columns,
                    issue="No matching record for must-match table."
        )])

    def to_json(self):
        return { self.__class__.__name__: self._asdict() }


class ParseFailures(NamedTuple):
    failures: List[CellIssue]

    def get_id(self) -> Optional[int]:
        return None

    def is_failure(self) -> bool:
        return True

    def validation_info(self) -> RowValidation:
        return RowValidation(
            cellIssues=self.failures,
            newRows=[],
            tableIssues=[],
            picklistAdditions=[],
        )

    def to_json(self):
        return { self.__class__.__name__: self._asdict() }

class UploadResult(NamedTuple):
    record_result: Union[Uploaded, NoMatch, Matched, MatchedMultiple, NullRecord, FailedBusinessRule, ParseFailures]
    toOne: Dict[str, Any]
    toMany: Dict[str, Any]

    def get_id(self) -> Optional[int]:
        return self.record_result.get_id()

    def contains_failure(self) -> bool:
        return ( self.record_result.is_failure()
                 or any(result.contains_failure() for result in self.toOne.values())
                 or any(result.contains_failure() for results in self.toMany.values() for result in results)
        )

    def validation_info(self) -> RowValidation:
        info = self.record_result.validation_info()
        toOneInfos = [r.validation_info() for r in self.toOne.values()]
        toManyInfos = [rr.validation_info() for r in self.toMany.values() for rr in r]

        return RowValidation(
            cellIssues = info.cellIssues
                + [cellIssue for info in toOneInfos for cellIssue in info.cellIssues]
                + [cellIssue for info in toManyInfos for cellIssue in info.cellIssues],

            tableIssues = info.tableIssues
                + [tableIssue for info in toOneInfos for tableIssue in info.tableIssues]
                + [tableIssue for info in toManyInfos for tableIssue in info.tableIssues],

            newRows = info.newRows
                + [newRow for info in toOneInfos for newRow in info.newRows]
                + [newRow for info in toManyInfos for newRow in info.newRows],

            picklistAdditions = info.picklistAdditions
                + [picklistAddition for info in toOneInfos for picklistAddition in info.picklistAdditions]
                + [picklistAddition for info in toManyInfos for picklistAddition in info.picklistAdditions],
        )

    def to_json(self) -> Dict:
        return { 'UploadResult': {
            'record_result': self.record_result.to_json(),
            'toOne': {k: v.to_json() for k,v in self.toOne.items()},
            'toMany': {k: [v.to_json() for v in vs] for k,vs in self.toMany.items()},
        }}

class Uploadable(Protocol):
    def bind(self, collection, row: Row) -> Union["BoundUploadable", ParseFailures]:
        ...

    def to_json(self) -> Dict:
        ...

    def is_one_to_one(self) -> bool:
        ...

class BoundUploadable(Protocol):
    def filter_on(self, path: str) -> FilterPack:
        ...

    def match_row(self) -> UploadResult:
        ...

    def upload_row(self) -> UploadResult:
        ...

    def force_upload_row(self) -> UploadResult:
        ...

    def is_one_to_one(self) -> bool:
        ...
