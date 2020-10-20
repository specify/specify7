import logging

from typing import Dict, Any, NamedTuple, List, Union

from specifyweb.specify.datamodel import datamodel

from .scoping import scoping_relationships
from .data import Row, FilterPack, Exclude, Uploadable, BoundUploadable, CellIssue, ParseFailures
from .parsing import parse_many, ParseResult

logger = logging.getLogger(__name__)

class ToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]

    def apply_scoping(self, collection) -> "ToManyRecord":
        table = datamodel.get_table_strict(self.name)
        return self._replace(
            static={**scoping_relationships(collection, table), **self.static},
            toOne={f: u.apply_scoping(collection) for f, u in self.toOne.items()},
        )

    def to_json(self) -> Dict:
        result = dict(wbcols=self.wbcols, static=self.static, toOne=self.toOne)
        result['toOne'] = {
            key: uploadable.to_json()
            for key, uploadable in self.toOne.items()
        }
        return result

    def bind(self, collection, row: Row) -> Union["BoundToManyRecord", ParseFailures]:
        parsedFields, parseFails = parse_many(collection, self.name, self.wbcols, row)

        toOne: Dict[str, BoundUploadable] = {}
        for fieldname, uploadable in self.toOne.items():
            result = uploadable.bind(collection, row)
            if isinstance(result, ParseFailures):
                parseFails += result.failures
            else:
                toOne[fieldname] = result

        return ParseFailures(parseFails) if parseFails else BoundToManyRecord(self.name, self.wbcols, self.static, parsedFields, toOne)

class BoundToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    parsedFields: List[ParseResult]
    toOne: Dict[str, BoundUploadable]


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
            return FilterPack([], [Exclude(path + "__in", self.name, self.static)])

        filters.update({
            (path + '__' + fieldname): value
            for fieldname, value in self.static.items()
        })

        return FilterPack([filters], [])
