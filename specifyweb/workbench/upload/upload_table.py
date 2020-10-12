
from functools import reduce

import logging
from typing import List, Dict, Any, NamedTuple, Union

from specifyweb.specify import models
from specifyweb.businessrules.exceptions import BusinessRuleException

from .parsing import parse_many, ParseResult, ParseFailure
from .data import FilterPack, Exclude, UploadResult, Row, Uploaded, Matched, MatchedMultiple, NullRecord, Uploadable, BoundUploadable, FailedBusinessRule, ReportInfo, CellIssue, ParseFailures
from .tomany import ToManyRecord, BoundToManyRecord

logger = logging.getLogger(__name__)


class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]
    toMany: Dict[str, List[ToManyRecord]]

    def to_json(self) -> Dict:
        result = self._asdict()
        result['toOne'] = {
            key: uploadable.to_json()
            for key, uploadable in self.toOne.items()
        }
        result['toMany'] = {
            key: [to_many.to_json() for to_many in to_manys]
            for key, to_manys in self.toMany.items()
        }
        return { 'uploadTable': result }

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

        return ParseFailures(parseFails) if parseFails else BoundUploadTable(self.name, self.wbcols, self.static, parsedFields, toOne, toMany)

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

    def upload_row(self) -> UploadResult:
        model = getattr(models, self.name.capitalize())
        info = ReportInfo(tableName=self.name, columns=list(self.wbcols.values()))

        toOneResults = {
            fieldname: to_one_def.upload_row()
            for fieldname, to_one_def in self.toOne.items()
        }

        filters = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.filter_on.items()
        }

        filters.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

        to_many_filters, to_many_excludes = to_many_filters_and_excludes(self.toMany)

        matched_records = reduce(lambda q, e: q.exclude(**{e.lookup: getattr(models, e.table).objects.filter(**e.filter)}),
                                 to_many_excludes,
                                 reduce(lambda q, f: q.filter(**f),
                                        to_many_filters,
                                        model.objects.filter(**filters, **self.static)))

        n_matched = matched_records.count()
        if n_matched == 0:
            attrs = {
                fieldname_: value
                for parsedField in self.parsedFields
                for fieldname_, value in parsedField.upload.items()
            }

            attrs.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

            if any(v is not None for v in attrs.values()) or to_many_filters:
                try:
                    uploaded = model.objects.create(**attrs, **self.static)
                    picklist_additions = self.do_picklist_additions()
                except BusinessRuleException as e:
                    return UploadResult(FailedBusinessRule(str(e), info), toOneResults, {})

                toManyResults = {
                    fieldname: upload_to_manys(model, uploaded.id, fieldname, records)
                    for fieldname, records in self.toMany.items()
                }
                return UploadResult(Uploaded(uploaded.id, info, picklist_additions), toOneResults, toManyResults)
            else:
                return UploadResult(NullRecord(info), {}, {})

        elif n_matched == 1:
            return UploadResult(Matched(id=matched_records[0].id, info=info), toOneResults, {})

        else:
            return UploadResult(MatchedMultiple(ids=[r.id for r in matched_records], info=info), toOneResults, {})

    def do_picklist_additions(self) -> Dict[str, int]:
        added_picklist_items = {}
        for parsedField in self.parsedFields:
            if parsedField.add_to_picklist is not None:
                addition = parsedField.add_to_picklist
                pli = addition.picklist.picklistitems.create(value=addition.value, title=addition.value)
                added_picklist_items[addition.caption] = pli.id
        return added_picklist_items


def to_many_filters_and_excludes(to_manys: Dict[str, List[BoundToManyRecord]]) -> FilterPack:
    filters: List[Dict] = []
    excludes: List[Exclude] = []

    for toManyField, records in to_manys.items():
        for record in records:
            fs, es = record.filter_on(toManyField)
            filters += fs
            excludes += es

    return FilterPack(filters, excludes)



def upload_to_manys(parent_model, parent_id, parent_field, records) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        BoundUploadTable(
            name = record.name,
            wbcols = record.wbcols,
            static = {**record.static, fk_field: parent_id},
            parsedFields = record.parsedFields,
            toOne = record.toOne,
            toMany = {},
        ).upload_row()

        for record in records
    ]
