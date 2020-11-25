import logging

from typing import Dict, Any, NamedTuple, List, Union

from .uploadable import Row, FilterPack, Exclude, Uploadable, ScopedUploadable, BoundUploadable
from .upload_result import CellIssue, ParseFailures
from .parsing import parse_many, ParseResult

logger = logging.getLogger(__name__)

class ToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]

    def apply_scoping(self, collection) -> "ScopedToManyRecord":
        from .scoping import apply_scoping_to_tomanyrecord as apply_scoping
        return apply_scoping(self, collection)

    def to_json(self) -> Dict:
        result = dict(wbcols=self.wbcols, static=self.static, toOne=self.toOne)
        result['toOne'] = {
            key: uploadable.to_json()
            for key, uploadable in self.toOne.items()
        }
        return result


class ScopedToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, ScopedUploadable]
    scopingAttrs: Dict[str, int]

    def bind(self, collection, row: Row) -> Union["BoundToManyRecord", ParseFailures]:
        parsedFields, parseFails = parse_many(collection, self.name, self.wbcols, row)

        toOne: Dict[str, BoundUploadable] = {}
        for fieldname, uploadable in self.toOne.items():
            result = uploadable.bind(collection, row)
            if isinstance(result, ParseFailures):
                parseFails += result.failures
            else:
                toOne[fieldname] = result

        if parseFails:
            return ParseFailures(parseFails)

        return BoundToManyRecord(
            name=self.name,
            wbcols=self.wbcols,
            static=self.static,
            scopingAttrs=self.scopingAttrs,
            parsedFields=parsedFields,
            toOne=toOne,
        )

class BoundToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    parsedFields: List[ParseResult]
    toOne: Dict[str, BoundUploadable]
    scopingAttrs: Dict[str, int]


    def filter_on(self, path: str) -> FilterPack:
        filters = {
            (path + '__' + fieldname_): value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.filter_on.items()
        }

        for toOneField, toOneTable in self.toOne.items():
            fs, es = toOneTable.filter_on(path + '__' + toOneField)
            for f in fs:
                filters.update(f)

        if all(v is None for v in filters.values()):
            return FilterPack([], [Exclude(path + "__in", self.name, {**self.scopingAttrs, **self.static})])

        filters.update({
            (path + '__' + fieldname): value
            for fieldname, value in {**self.scopingAttrs, **self.static}.items()
        })

        return FilterPack([filters], [])
