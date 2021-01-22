
from functools import reduce

import logging
from typing import List, Dict, Any, NamedTuple, Union, Optional

from specifyweb.specify import models
from specifyweb.businessrules.exceptions import BusinessRuleException

from .parsing import parse_many, ParseResult, ParseFailure
from .uploadable import FilterPack, Exclude, Row, Uploadable, ScopedUploadable, BoundUploadable
from .upload_result import UploadResult, Uploaded, NoMatch, Matched, MatchedMultiple, NullRecord, FailedBusinessRule, ReportInfo, PicklistAddition, CellIssue, ParseFailures, PropagatedFailure
from .tomany import ToManyRecord, ScopedToManyRecord, BoundToManyRecord

logger = logging.getLogger(__name__)


class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]
    toMany: Dict[str, List[ToManyRecord]]

    def apply_scoping(self, collection) -> "ScopedUploadTable":
        from .scoping import apply_scoping_to_uploadtable as apply_scoping
        return apply_scoping(self, collection)

    def _to_json(self) -> Dict:
        result = dict(wbcols=self.wbcols, static=self.static)
        result['toOne'] = {
            key: uploadable.to_json()
            for key, uploadable in self.toOne.items()
        }
        result['toMany'] = {
            key: [to_many.to_json() for to_many in to_manys]
            for key, to_manys in self.toMany.items()
        }
        return result

    def to_json(self) -> Dict:
        return { 'uploadTable': self._to_json() }

    def unparse(self) -> Dict:
        return { 'baseTableName': self.name, 'uploadable': self.to_json() }

class ScopedUploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, ScopedUploadable]
    toMany: Dict[str, List[ScopedToManyRecord]]
    scopingAttrs: Dict[str, int]

    def bind(self, collection, row: Row) -> Union["BoundUploadTable", ParseFailures]:
        parsedFields, parseFails = parse_many(collection, self.name, self.wbcols, row)

        toOne: Dict[str, BoundUploadable] = {}
        for fieldname, uploadable in self.toOne.items():
            result = uploadable.bind(collection, row)
            if isinstance(result, ParseFailures):
                parseFails += result.failures
            else:
                toOne[fieldname] = result

        toMany: Dict[str, List[BoundToManyRecord]] = {}
        for fieldname, records in self.toMany.items():
            boundRecords: List[BoundToManyRecord] = []
            for record in records:
                result_ = record.bind(collection, row)
                if isinstance(result_, ParseFailures):
                    parseFails += result_.failures
                else:
                    boundRecords.append(result_)
            toMany[fieldname] = boundRecords

        if parseFails:
            return ParseFailures(parseFails)

        return BoundUploadTable(
            name=self.name,
            wbcols=self.wbcols,
            static=self.static,
            scopingAttrs=self.scopingAttrs,
            parsedFields=parsedFields,
            toOne=toOne,
            toMany=toMany,
        )

class OneToOneTable(UploadTable):
    def apply_scoping(self, collection) -> "ScopedOneToOneTable":
        s = super().apply_scoping(collection)
        return ScopedOneToOneTable(*s)

    def to_json(self) -> Dict:
        return { 'oneToOneTable': self._to_json() }

class ScopedOneToOneTable(ScopedUploadTable):
    def bind(self, collection, row: Row) -> Union["BoundOneToOneTable", ParseFailures]:
        b = super().bind(collection, row)
        return b if isinstance(b, ParseFailures) else BoundOneToOneTable(*b)

class MustMatchTable(UploadTable):
    def apply_scoping(self, collection) -> "ScopedMustMatchTable":
        s = super().apply_scoping(collection)
        return ScopedMustMatchTable(*s)

    def to_json(self) -> Dict:
        return { 'mustMatchTable': self._to_json() }

class ScopedMustMatchTable(ScopedUploadTable):
    def bind(self, collection, row: Row) -> Union["BoundMustMatchTable", ParseFailures]:
        b = super().bind(collection, row)
        return b if isinstance(b, ParseFailures) else BoundMustMatchTable(*b)


class BoundUploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    parsedFields: List[ParseResult]
    toOne: Dict[str, BoundUploadable]
    toMany: Dict[str, List[BoundToManyRecord]]
    scopingAttrs: Dict[str, int]

    def is_one_to_one(self) -> bool:
        return False

    def must_match(self) -> bool:
        return False

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

    def process_row(self) -> UploadResult:
        return self._handle_row(force_upload=False)

    def force_upload_row(self) -> UploadResult:
        return self._handle_row(force_upload=True)

    def match_row(self) -> UploadResult:
        return BoundMustMatchTable(*self).process_row()

    def _handle_row(self, force_upload: bool) -> UploadResult:
        model = getattr(models, self.name.capitalize())
        info = ReportInfo(tableName=self.name, columns=list(self.wbcols.values()), treeInfo=None)

        toOneResults = self._process_to_ones()
        toOneIds: Dict[str, Optional[int]] = {}
        for field, result in toOneResults.items():
            id = result.get_id()
            if id == "Failure":
                return UploadResult(PropagatedFailure(), toOneResults, {})
            toOneIds[field] = id

        toManyFilters = _to_many_filters_and_excludes(self.toMany)

        attrs = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.upload.items()
        }

        attrs.update({ model._meta.get_field(fieldname).attname: id for fieldname, id in toOneIds.items() })

        to_many_filters, to_many_excludes = toManyFilters

        if all(v is None for v in attrs.values()) and not to_many_filters:
            # nothing to upload
            return UploadResult(NullRecord(info), toOneResults, {})

        if not force_upload:
            match = self._match(model, toOneIds, toManyFilters, info)
            if match:
                return UploadResult(match, toOneResults, {})

        return self._do_upload(model, toOneResults, attrs, info)

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.process_row()
            for fieldname, to_one_def in self.toOne.items()
        }

    def _match(self, model, toOneIds: Dict[str, Optional[int]], toManyFilters: FilterPack, info: ReportInfo) -> Union[Matched, MatchedMultiple, None]:
        filters = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.filter_on.items()
        }

        filters.update({ model._meta.get_field(fieldname).attname: id for fieldname, id in toOneIds.items() })

        to_many_filters, to_many_excludes = toManyFilters

        matched_records = reduce(lambda q, e: q.exclude(**{e.lookup: getattr(models, e.table).objects.filter(**e.filter)}),
                                 to_many_excludes,
                                 reduce(lambda q, f: q.filter(**f),
                                        to_many_filters,
                                        model.objects.filter(**filters, **self.scopingAttrs, **self.static)))

        n_matched = matched_records.count()
        if n_matched > 1:
            return MatchedMultiple(ids=[r.id for r in matched_records], info=info)
        elif n_matched == 1:
            return Matched(id=matched_records[0].id, info=info)
        else:
            return None

    def _do_upload(self, model, toOneResults: Dict[str, UploadResult], attrs: Dict[str, Any], info: ReportInfo) -> UploadResult:

        # replace any one-to-one records that matched with forced uploads
        toOneResults.update({
            fieldname: to_one_def.force_upload_row()
            for fieldname, to_one_def in self.toOne.items()
            if to_one_def.is_one_to_one()
            for result in [toOneResults[fieldname].record_result]
            if isinstance(result, Matched) or isinstance(result, MatchedMultiple)
        })

        toOneIds: Dict[str, Optional[int]] = {}
        for field, result in toOneResults.items():
            id = result.get_id()
            if id == "Failure":
                return UploadResult(PropagatedFailure(), toOneResults, {})
            toOneIds[field] = id

        attrs.update({ model._meta.get_field(fieldname).attname: id for fieldname, id in toOneIds.items() })

        try:
            uploaded = model.objects.create(**attrs, **self.scopingAttrs, **self.static)
            picklist_additions = self._do_picklist_additions()
        except BusinessRuleException as e:
            return UploadResult(FailedBusinessRule(str(e), info), toOneResults, {})

        toManyResults = {
            fieldname: _upload_to_manys(model, uploaded.id, fieldname, records)
            for fieldname, records in self.toMany.items()
        }
        return UploadResult(Uploaded(uploaded.id, info, picklist_additions), toOneResults, toManyResults)

    def _do_picklist_additions(self) -> List[PicklistAddition]:
        added_picklist_items = []
        for parsedField in self.parsedFields:
            if parsedField.add_to_picklist is not None:
                a = parsedField.add_to_picklist
                pli = a.picklist.picklistitems.create(value=a.value, title=a.value)
                added_picklist_items.append(PicklistAddition(name=a.picklist.name, caption=a.caption, value=a.value, id=pli.id))
        return added_picklist_items

class BoundOneToOneTable(BoundUploadTable):
    def is_one_to_one(self) -> bool:
        return True

class BoundMustMatchTable(BoundUploadTable):
    def must_match(self) -> bool:
        return True

    def force_upload_row(self) -> UploadResult:
        raise Exception('trying to force upload of must-match table')

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.match_row()
            for fieldname, to_one_def in self.toOne.items()
        }

    def _do_upload(self, model, toOneResults: Dict[str, UploadResult], atrs: Dict[str, Any], info: ReportInfo) -> UploadResult:
        return UploadResult(NoMatch(info), toOneResults, {})


def _to_many_filters_and_excludes(to_manys: Dict[str, List[BoundToManyRecord]]) -> FilterPack:
    filters: List[Dict] = []
    excludes: List[Exclude] = []

    for toManyField, records in to_manys.items():
        for record in records:
            fs, es = record.filter_on(toManyField)
            filters += fs
            excludes += es

    return FilterPack(filters, excludes)


def _upload_to_manys(parent_model, parent_id, parent_field, records) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        BoundUploadTable(
            name=record.name,
            wbcols=record.wbcols,
            scopingAttrs=record.scopingAttrs,
            parsedFields=record.parsedFields,
            toOne=record.toOne,
            static={**record.static, fk_field: parent_id},
            toMany={},
        ).force_upload_row()
        for record in records
    ]
