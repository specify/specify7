
from functools import reduce

import logging
from typing import List, Dict, Any, NamedTuple, Union

from specifyweb.specify import models
from specifyweb.businessrules.exceptions import BusinessRuleException

from .parsing import parse_many, ParseResult, ParseFailure
from .data import FilterPack, Exclude, UploadResult, Row, Uploaded, NoMatch, Matched, MatchedMultiple, NullRecord, Uploadable, BoundUploadable, FailedBusinessRule, ReportInfo, PicklistAddition, CellIssue, ParseFailures
from .tomany import ToManyRecord, BoundToManyRecord

logger = logging.getLogger(__name__)


class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]
    toMany: Dict[str, List[ToManyRecord]]

    def _to_json(self) -> Dict:
        result = self._asdict()
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

        return BoundUploadTable(self.name, self.wbcols, self.static, parsedFields, toOne, toMany)

class OneToOneTable(UploadTable):
    def to_json(self) -> Dict:
        return { 'oneToOneTable': self._to_json() }

    def bind(self, collection, row: Row) -> Union["BoundOneToOneTable", ParseFailures]:
        b = super().bind(collection, row)
        return b if isinstance(b, ParseFailures) else BoundOneToOneTable(*b)

class MustMatchTable(UploadTable):
    def to_json(self) -> Dict:
        return { 'mustMatchTable': self._to_json() }

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

    def process_row(self) -> UploadResult:
        return self._handle_row(force_upload=False)

    def force_upload_row(self) -> UploadResult:
        return self._handle_row(force_upload=True)

    def match_row(self) -> UploadResult:
        return BoundMustMatchTable(*self).process_row()

    def _handle_row(self, force_upload: bool) -> UploadResult:
        model = getattr(models, self.name.capitalize())
        info = ReportInfo(tableName=self.name, columns=list(self.wbcols.values()))

        toOneResults = self._process_to_ones()

        toManyFilters = _to_many_filters_and_excludes(self.toMany)

        attrs = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.upload.items()
        }

        attrs.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

        to_many_filters, to_many_excludes = toManyFilters

        if all(v is None for v in attrs.values()) and not to_many_filters:
            # nothing to upload
            return UploadResult(NullRecord(info), {}, {})

        if not force_upload:
            match = self._match(model, toOneResults, toManyFilters, info)
            if match:
                return UploadResult(match, toOneResults, {})

        return self._do_upload(model, toOneResults, attrs, info)

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.process_row()
            for fieldname, to_one_def in self.toOne.items()
        }

    def _match(self, model, toOneResults: Dict[str, UploadResult], toManyFilters: FilterPack, info: ReportInfo) -> Union[Matched, MatchedMultiple, None]:
        filters = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.filter_on.items()
        }

        filters.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

        to_many_filters, to_many_excludes = toManyFilters

        matched_records = reduce(lambda q, e: q.exclude(**{e.lookup: getattr(models, e.table).objects.filter(**e.filter)}),
                                 to_many_excludes,
                                 reduce(lambda q, f: q.filter(**f),
                                        to_many_filters,
                                        model.objects.filter(**filters, **self.static)))

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
            if isinstance(to_one_def, BoundOneToOneTable)
            for result in [toOneResults[fieldname].record_result]
            if isinstance(result, Matched) or isinstance(result, MatchedMultiple)
        })
        attrs.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

        try:
            uploaded = model.objects.create(**attrs, **self.static)
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
    pass

class BoundMustMatchTable(BoundUploadTable):
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
            name = record.name,
            wbcols = record.wbcols,
            static = {**record.static, fk_field: parent_id},
            parsedFields = record.parsedFields,
            toOne = record.toOne,
            toMany = {},
        ).force_upload_row()

        for record in records
    ]
