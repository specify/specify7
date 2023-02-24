from typing import List, Dict, Any, NamedTuple, Optional, Union

from typing_extensions import Literal

from .parsing import ParseFailure

Failure = Literal["Failure"]

class TreeInfo(NamedTuple):
    rank: str
    name: str

class ReportInfo(NamedTuple):
    "Records the table and wb cols an upload result refers to."
    tableName: str
    columns: List[str]
    treeInfo: Optional[TreeInfo]

    def to_json(self) -> Dict:
        return {**self._asdict(), **{'treeInfo': self.treeInfo._asdict() if self.treeInfo else None}}


def json_to_ReportInfo(json: Dict) -> ReportInfo:
    return ReportInfo(
        tableName=json['tableName'],
        columns=json['columns'],
        treeInfo=TreeInfo(**json['treeInfo']) if 'treeInfo' in json and json['treeInfo'] else None
    )

class PicklistAddition(NamedTuple):
    name: str # Name of the picklist receiving the new item
    value: str # The value of the new item
    caption: str # The dataset column caption generating the addition
    id: int # The new picklistitem id

    def to_json(self) -> Dict:
        return self._asdict()

def json_to_PicklistAddition(json: Dict) -> PicklistAddition:
    return PicklistAddition(**json)

class Uploaded(NamedTuple):
    id: int
    info: ReportInfo
    picklistAdditions: List[PicklistAddition]

    def get_id(self) -> int:
        return self.id

    def to_json(self) -> Dict:
        return { 'Uploaded': dict(
            id=self.id,
            info=self.info.to_json(),
            picklistAdditions=[a.to_json() for a in self.picklistAdditions]
        )}

def json_to_Uploaded(json: Dict) -> Uploaded:
    uploaded = json['Uploaded']
    return Uploaded(
        id=uploaded['id'],
        info=json_to_ReportInfo(uploaded['info']),
        picklistAdditions=[json_to_PicklistAddition(i) for i in uploaded['picklistAdditions']]
    )


class Matched(NamedTuple):
    id: int
    info: ReportInfo

    def get_id(self) -> int:
        return self.id

    def to_json(self) -> Dict:
        return { 'Matched':  dict(
            id=self.id,
            info=self.info.to_json()
        )}

def json_to_Matched(json: Dict) -> Matched:
    matched = json['Matched']
    return Matched(
        id=matched['id'],
        info=json_to_ReportInfo(matched['info'])
    )


class MatchedMultiple(NamedTuple):
    ids: List[int]
    key: str
    info: ReportInfo

    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return { 'MatchedMultiple': dict(
            ids=self.ids,
            key=self.key,
            info=self.info.to_json()
        )}

def json_to_MatchedMultiple(json: Dict) -> MatchedMultiple:
    matchedMultiple = json['MatchedMultiple']
    return MatchedMultiple(
        ids=matchedMultiple['ids'],
        key=matchedMultiple.get('key', ''),
        info=json_to_ReportInfo(matchedMultiple['info'])
    )

class NullRecord(NamedTuple):
    info: ReportInfo

    def get_id(self) -> None:
        return None

    def to_json(self):
        return { 'NullRecord': dict(info=self.info.to_json()) }

def json_to_NullRecord(json: Dict) -> NullRecord:
    nullRecord = json['NullRecord']
    return NullRecord(info=json_to_ReportInfo(nullRecord['info']))

class FailedBusinessRule(NamedTuple):
    message: str
    payload: Dict[str, Union[str, int, List[str], List[int]]]
    info: ReportInfo

    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return { self.__class__.__name__: dict(message=self.message, payload=self.payload, info=self.info.to_json()) }

def json_to_FailedBusinessRule(json: Dict) -> FailedBusinessRule:
    r = json['FailedBusinessRule']
    return FailedBusinessRule(
        message=r['message'],
        payload=r['payload'],
        info=json_to_ReportInfo(r['info'])
    )

class NoMatch(NamedTuple):
    info: ReportInfo

    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return { self.__class__.__name__: dict(info=self.info.to_json()) }

def json_to_NoMatch(json: Dict) -> NoMatch:
    r = json['NoMatch']
    return NoMatch(info=json_to_ReportInfo(r['info']))

class ParseFailures(NamedTuple):
    failures: List[ParseFailure]

    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return { self.__class__.__name__: dict(failures=[f.to_json() for f in self.failures]) }

def json_to_ParseFailures(json: Dict) -> ParseFailures:
    r = json['ParseFailures']
    return ParseFailures(failures=[ParseFailure(*i) for i in r['failures']])

class PropagatedFailure(NamedTuple):
    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return { 'PropagatedFailure': {} }

def json_to_PropagatedFailure(json: Dict) -> PropagatedFailure:
    return PropagatedFailure()

RecordResult = Union[Uploaded, NoMatch, Matched, MatchedMultiple, NullRecord, FailedBusinessRule, ParseFailures, PropagatedFailure]


class UploadResult(NamedTuple):
    record_result: RecordResult
    toOne: Dict[str, Any]
    toMany: Dict[str, List[Any]]

    def get_id(self) -> Union[int, None, Failure]:
        return self.record_result.get_id()

    def contains_failure(self) -> bool:
        return ( self.record_result.get_id() == "Failure"
                 or any(result.contains_failure() for result in self.toOne.values())
                 or any(result.contains_failure() for results in self.toMany.values() for result in results)
        )

    def to_json(self) -> Dict:
        return { 'UploadResult': {
            'record_result': self.record_result.to_json(),
            'toOne': {k: v.to_json() for k,v in self.toOne.items()},
            'toMany': {k: [v.to_json() for v in vs] for k,vs in self.toMany.items()},
        }}

def json_to_UploadResult(json: Dict) -> UploadResult:
    return UploadResult(
        record_result=json_to_record_result(json['UploadResult']['record_result']),
        toOne={k: json_to_UploadResult(v) for k,v in json['UploadResult']['toOne'].items()},
        toMany={k: [json_to_UploadResult(v) for v in vs] for k,vs in json['UploadResult']['toMany'].items()}
    )

def json_to_record_result(json: Dict) -> RecordResult:
    for record_type in json:
        if record_type == "Uploaded":
            return json_to_Uploaded(json)
        elif record_type == "NoMatch":
            return json_to_NoMatch(json)
        elif record_type == "Matched":
            return json_to_Matched(json)
        elif record_type == "MatchedMultiple":
            return json_to_MatchedMultiple(json)
        elif record_type == "NullRecord":
            return json_to_NullRecord(json)
        elif record_type == "FailedBusinessRule":
            return json_to_FailedBusinessRule(json)
        elif record_type == "ParseFailures":
            return json_to_ParseFailures(json)
        elif record_type == "PropagatedFailure":
            return json_to_PropagatedFailure(json)
        assert False, f"record_result is unknown type: {record_type}"
    assert False, f"record_result contains no data: {json}"
