from typing import List, Dict, Any, NamedTuple, Optional, Union

from typing_extensions import Literal

from .parsing import WorkBenchParseFailure

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
        return {
            **self._asdict(),
            **{"treeInfo": self.treeInfo._asdict() if self.treeInfo else None},
        }


def json_to_ReportInfo(json: Dict) -> ReportInfo:
    return ReportInfo(
        tableName=json["tableName"],
        columns=json["columns"],
        treeInfo=(
            TreeInfo(**json["treeInfo"])
            if "treeInfo" in json and json["treeInfo"]
            else None
        ),
    )


class PicklistAddition(NamedTuple):
    name: str  # Name of the picklist receiving the new item
    value: str  # The value of the new item
    caption: str  # The dataset column caption generating the addition
    id: int  # The new picklistitem id

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
        return {
            "Uploaded": dict(
                id=self.id,
                info=self.info.to_json(),
                picklistAdditions=[a.to_json() for a in self.picklistAdditions],
            )
        }

    @staticmethod
    def from_json(json: Dict) -> "Uploaded":
        uploaded = json["Uploaded"]
        return Uploaded(
            id=uploaded["id"],
            info=json_to_ReportInfo(uploaded["info"]),
            picklistAdditions=[
                json_to_PicklistAddition(i) for i in uploaded["picklistAdditions"]
            ],
        )


class Updated(NamedTuple):
    id: int
    info: ReportInfo
    picklistAdditions: List[PicklistAddition]

    def get_id(self) -> int:
        return self.id

    def to_json(self) -> Dict:
        return {
            "Updated": dict(
                id=self.id,
                info=self.info.to_json(),
                picklistAdditions=[a.to_json() for a in self.picklistAdditions],
            )
        }

    @staticmethod
    def from_json(json: Dict) -> "Updated":
        uploaded = json["Updated"]
        return Updated(
            id=uploaded["id"],
            info=json_to_ReportInfo(uploaded["info"]),
            picklistAdditions=[
                json_to_PicklistAddition(i) for i in uploaded["picklistAdditions"]
            ],
        )


class Matched(NamedTuple):
    id: int
    info: ReportInfo

    def get_id(self) -> int:
        return self.id

    def to_json(self) -> Dict:
        return {"Matched": dict(id=self.id, info=self.info.to_json())}

    @staticmethod
    def from_json(json: Dict) -> "Matched":
        matched = json["Matched"]
        return Matched(id=matched["id"], info=json_to_ReportInfo(matched["info"]))


class MatchedAndChanged(Matched):
    def to_json(self) -> Dict:
        return {"MatchedAndChanged": super().to_json()["Matched"]}

    @staticmethod
    def from_json(json: Dict) -> Matched:
        matchedAndChanged = json["MatchedAndChanged"]
        return MatchedAndChanged(
            id=matchedAndChanged["id"],
            info=json_to_ReportInfo(matchedAndChanged["info"]),
        )


class MatchedMultiple(NamedTuple):
    ids: List[int]
    key: str
    info: ReportInfo

    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return {
            "MatchedMultiple": dict(
                ids=self.ids, key=self.key, info=self.info.to_json()
            )
        }

    @staticmethod
    def from_json(json: Dict) -> "MatchedMultiple":
        matchedMultiple = json["MatchedMultiple"]
        return MatchedMultiple(
            ids=matchedMultiple["ids"],
            key=matchedMultiple.get("key", ""),
            info=json_to_ReportInfo(matchedMultiple["info"]),
        )


class NullRecord(NamedTuple):
    info: ReportInfo

    def get_id(self) -> None:
        return None

    def to_json(self):
        return {"NullRecord": dict(info=self.info.to_json())}

    @staticmethod
    def from_json(json: Dict) -> "NullRecord":
        nullRecord = json["NullRecord"]
        return NullRecord(info=json_to_ReportInfo(nullRecord["info"]))


class NoChange(NamedTuple):
    id: int
    info: ReportInfo

    def get_id(self) -> int:
        return self.id

    def to_json(self):
        return {"NoChange": dict(id=self.id, info=self.info.to_json())}

    @staticmethod
    def from_json(json: Dict) -> "NoChange":
        noChange = json["NoChange"]
        return NoChange(id=noChange["id"], info=json_to_ReportInfo(noChange["info"]))


class Deleted(NamedTuple):
    id: int
    info: ReportInfo

    def get_id(self) -> None:
        return None

    def to_json(self):
        assert self.id is not None
        return {"Deleted": dict(id=self.id, info=self.info.to_json())}

    @staticmethod
    def from_json(json: Dict) -> "Deleted":
        deleted = json["Deleted"]
        return Deleted(id=deleted["id"], info=json_to_ReportInfo(deleted["info"]))


class FailedBusinessRule(NamedTuple):
    message: str
    payload: Dict[str, Union[str, int, List[str], List[int]]]
    info: ReportInfo

    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return {
            "FailedBusinessRule": dict(
                message=self.message, payload=self.payload, info=self.info.to_json()
            )
        }

    @staticmethod
    def from_json(json: Dict) -> "FailedBusinessRule":
        r = json["FailedBusinessRule"]
        return FailedBusinessRule(
            message=r["message"],
            payload=r["payload"],
            info=json_to_ReportInfo(r["info"]),
        )


class NoMatch(NamedTuple):
    info: ReportInfo

    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return {"NoMatch": dict(info=self.info.to_json())}

    @staticmethod
    def from_json(json: Dict) -> "NoMatch":
        r = json["NoMatch"]
        return NoMatch(info=json_to_ReportInfo(r["info"]))


class ParseFailures(NamedTuple):
    failures: List[WorkBenchParseFailure]

    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return {
            self.__class__.__name__: dict(failures=[f.to_json() for f in self.failures])
        }

    @staticmethod
    def from_json(json: Dict) -> "ParseFailures":
        r = json["ParseFailures"]
        return ParseFailures(
            failures=[WorkBenchParseFailure(*i) for i in r["failures"]]
        )


class PropagatedFailure(NamedTuple):
    def get_id(self) -> Failure:
        return "Failure"

    def to_json(self):
        return {"PropagatedFailure": {}}

    @staticmethod
    def from_json(json: Dict) -> "PropagatedFailure":
        return PropagatedFailure()


RecordResult = Union[
    Uploaded,
    NoMatch,
    Matched,
    MatchedMultiple,
    NullRecord,
    FailedBusinessRule,
    ParseFailures,
    PropagatedFailure,
    NoChange,
    Updated,
    Deleted,
    MatchedAndChanged,
]


class UploadResult(NamedTuple):
    record_result: RecordResult
    toOne: Dict[str, Any]
    toMany: Dict[str, List[Any]]

    def get_id(self) -> Union[int, None, Failure]:
        return self.record_result.get_id()

    def contains_failure(self) -> bool:
        return (
            self.record_result.get_id() == "Failure"
            or any(result.contains_failure() for result in self.toOne.values())
            or any(
                result.contains_failure()
                for results in self.toMany.values()
                for result in results
            )
        )

    def contains_success(
        self, success=[Uploaded, Matched, MatchedAndChanged, Updated, Deleted]
    ) -> bool:
        return (
            any(isinstance(self.record_result, _success) for _success in success)
            or any(result.contains_success() for result in self.toOne.values())
            or any(
                result.contains_success()
                for results in self.toMany.values()
                for result in results
            )
        )

    def to_json(self) -> Dict:
        return {
            "UploadResult": {
                "record_result": self.record_result.to_json(),
                "toOne": {k: v.to_json() for k, v in self.toOne.items()},
                "toMany": {
                    k: [v.to_json() for v in vs] for k, vs in self.toMany.items()
                },
            }
        }

    @staticmethod
    def from_json(json: Dict) -> "UploadResult":
        return UploadResult(
            record_result=json_to_record_result(json["UploadResult"]["record_result"]),
            toOne={
                k: UploadResult.from_json(v)
                for k, v in json["UploadResult"]["toOne"].items()
            },
            toMany={
                k: [UploadResult.from_json(v) for v in vs]
                for k, vs in json["UploadResult"]["toMany"].items()
            },
        )


def json_to_record_result(json: Dict) -> RecordResult:
    for record_type in json:
        if record_type == "Uploaded":
            return Uploaded.from_json(json)
        elif record_type == "NoMatch":
            return NoMatch.from_json(json)
        elif record_type == "Matched":
            return Matched.from_json(json)
        elif record_type == "MatchedMultiple":
            return MatchedMultiple.from_json(json)
        elif record_type == "NullRecord":
            return NullRecord.from_json(json)
        elif record_type == "FailedBusinessRule":
            return FailedBusinessRule.from_json(json)
        elif record_type == "ParseFailures":
            return ParseFailures.from_json(json)
        elif record_type == "PropagatedFailure":
            return PropagatedFailure.from_json(json)
        elif record_type == "NoChange":
            return NoChange.from_json(json)
        elif record_type == "Updated":
            return Updated.from_json(json)
        elif record_type == "Deleted":
            return Deleted.from_json(json)
        elif record_type == "MatchedAndChanged":
            return MatchedAndChanged.from_json(json)
        assert False, f"record_result is unknown type: {record_type}"
    assert False, f"record_result contains no data: {json}"
