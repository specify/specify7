
from functools import reduce

import logging
from typing import List, Dict, Any, NamedTuple

from specifyweb.specify import models
from specifyweb.businessrules.exceptions import BusinessRuleException

from .parsing import parse_value, ParseResult, ParseFailure
from .data import FilterPack, Exclude, UploadResult, Row, Uploaded, Matched, MatchedMultiple, NullRecord, Uploadable, FailedBusinessRule, FailedParsing, ReportInfo, CellIssue
from .tomany import ToManyRecord

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


    def filter_on(self, collection, path: str, row: Row) -> FilterPack:
        filters = {
            (path + '__' + fieldname_): value
            for fieldname, caption in self.wbcols.items()
            for fieldname_, value in parse_value(collection, self.name, fieldname, row[caption]).filter_on.items()
        }


        for toOneField, toOneTable in self.toOne.items():
            fs, es = toOneTable.filter_on(collection, path + '__' + toOneField, row)
            for f in fs:
                filters.update(f)

        if all(v is None for v in filters.values()):
            return FilterPack([], [Exclude(path + "__in", self.name, self.static)])

        filters.update({
            (path + '__' + fieldname): value
            for fieldname, value in self.static.items()
        })

        return FilterPack([filters], [])

    def upload_row(self, collection, row: Row) -> UploadResult:
        model = getattr(models, self.name.capitalize())
        info = ReportInfo(tableName=self.name, columns=list(self.wbcols.values()))

        toOneResults = {
            fieldname: to_one_def.upload_row(collection, row)
            for fieldname, to_one_def in self.toOne.items()
        }

        parsedFields: List[ParseResult] = []
        parseFails: List[CellIssue] = []
        for fieldname, caption in self.wbcols.items():
            try:
                parsedFields.append(parse_value(collection, self.name, fieldname, row[caption]))
            except ParseFailure as e:
                parseFails.append(CellIssue(column=caption, issue=str(e)))

        if parseFails:
            return UploadResult(FailedParsing(failures=parseFails), toOneResults, {})

        filters = {
            fieldname_: value
            for parsedField in parsedFields
            for fieldname_, value in parsedField.filter_on.items()
        }

        filters.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

        to_many_filters, to_many_excludes = to_many_filters_and_excludes(collection, self.toMany, row)

        matched_records = reduce(lambda q, e: q.exclude(**{e.lookup: getattr(models, e.table).objects.filter(**e.filter)}),
                                 to_many_excludes,
                                 reduce(lambda q, f: q.filter(**f),
                                        to_many_filters,
                                        model.objects.filter(**filters, **self.static)))

        n_matched = matched_records.count()
        if n_matched == 0:
            attrs = {
                fieldname_: value
                for parsedField in parsedFields
                for fieldname_, value in parsedField.upload.items()
            }

            attrs.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

            if any(v is not None for v in attrs.values()) or to_many_filters:
                try:
                    uploaded = model.objects.create(**attrs, **self.static)
                except BusinessRuleException as e:
                    return UploadResult(FailedBusinessRule(str(e), info), toOneResults, {})

                toManyResults = {
                    fieldname: upload_to_manys(collection, model, uploaded.id, fieldname, records, row)
                    for fieldname, records in self.toMany.items()
                }
                return UploadResult(Uploaded(id=uploaded.id, info=info), toOneResults, toManyResults)
            else:
                return UploadResult(NullRecord(info), {}, {})

        elif n_matched == 1:
            return UploadResult(Matched(id=matched_records[0].id, info=info), toOneResults, {})

        else:
            return UploadResult(MatchedMultiple(ids=[r.id for r in matched_records], info=info), toOneResults, {})


def to_many_filters_and_excludes(collection, to_manys: Dict[str, List[ToManyRecord]], row: Row) -> FilterPack:
    filters: List[Dict] = []
    excludes: List[Exclude] = []

    for toManyField, records in to_manys.items():
        for record in records:
            fs, es = record.filter_on(collection, toManyField, row)
            filters += fs
            excludes += es

    return FilterPack(filters, excludes)



def upload_to_manys(collection, parent_model, parent_id, parent_field, records, row: Row) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        UploadTable(
            name = record.name,
            wbcols = record.wbcols,
            static = {**record.static, fk_field: parent_id},
            toOne = record.toOne,
            toMany = {},
        ).upload_row(collection, row)

        for record in records
    ]
