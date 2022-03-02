import logging

from typing import Dict, Any, NamedTuple, List, Union, Set, Optional

from .uploadable import Row, FilterPack, Exclude, Uploadable, ScopedUploadable, BoundUploadable, Disambiguation, Auditor
from .upload_result import ParseFailures
from .parsing import parse_many, ParseResult
from .column_options import ColumnOptions, ExtendedColumnOptions

logger = logging.getLogger(__name__)

class ToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, ColumnOptions]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]

    def apply_scoping(self, collection) -> "ScopedToManyRecord":
        from .scoping import apply_scoping_to_tomanyrecord as apply_scoping
        return apply_scoping(self, collection)

    def get_cols(self) -> Set[str]:
        return set(cd.column for cd in self.wbcols.values()) \
            | set(col for u in self.toOne.values() for col in u.get_cols())

    def to_json(self) -> Dict:
        result = dict(
            wbcols={k: v.to_json() for k,v in self.wbcols.items()},
            static=self.static,
        )

        result['toOne'] = {
            key: uploadable.to_json()
            for key, uploadable in self.toOne.items()
        }
        return result


class ScopedToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, ExtendedColumnOptions]
    static: Dict[str, Any]
    toOne: Dict[str, ScopedUploadable]
    scopingAttrs: Dict[str, int]

    def disambiguate(self, disambiguation: Disambiguation) -> "ScopedToManyRecord":
        if disambiguation is None:
            return self
        return self._replace(
            toOne={
                fieldname: uploadable.disambiguate(disambiguation.disambiguate_to_one(fieldname))
                for fieldname, uploadable in self.toOne.items()
            }
        )

    def get_treedefs(self) -> Set:
        return set(td for toOne in self.toOne.values() for td in toOne.get_treedefs())

    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]) -> Union["BoundToManyRecord", ParseFailures]:
        parsedFields, parseFails = parse_many(collection, self.name, self.wbcols, row)

        toOne: Dict[str, BoundUploadable] = {}
        for fieldname, uploadable in self.toOne.items():
            result = uploadable.bind(collection, row, uploadingAgentId, auditor, cache)
            if isinstance(result, ParseFailures):
                parseFails += result.failures
            else:
                toOne[fieldname] = result

        if parseFails:
            return ParseFailures(parseFails)

        return BoundToManyRecord(
            name=self.name,
            static=self.static,
            scopingAttrs=self.scopingAttrs,
            parsedFields=parsedFields,
            toOne=toOne,
            uploadingAgentId=uploadingAgentId,
        )

class BoundToManyRecord(NamedTuple):
    name: str
    static: Dict[str, Any]
    parsedFields: List[ParseResult]
    toOne: Dict[str, BoundUploadable]
    scopingAttrs: Dict[str, int]
    uploadingAgentId: Optional[int]


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
