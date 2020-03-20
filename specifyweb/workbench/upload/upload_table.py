
from functools import reduce

import logging
from typing import List, Dict, Any, NamedTuple

from specifyweb.specify import models

from .parsing import parse_value
from .data import FilterPack, Exclude, UploadResult, Row, Uploaded, Matched, MatchedMultiple, NullRecord
from .tomany import ToManyRecord

logger = logging.getLogger(__name__)

class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Any]
    toMany: Dict[str, List[ToManyRecord]]

    def filter_on(self, path: str, row: Row) -> FilterPack:
        filters = {
            (path + '__' + fieldname_): value
            for caption, fieldname in self.wbcols.items()
            for fieldname_, value in parse_value(self.name, fieldname, row[caption]).items()
        }


        for toOneField, toOneTable in self.toOne.items():
            fs, es = toOneTable.filter_on(path + '__' + toOneField, row)
            for f in fs:
                filters.update(f)

        if all(v is None for v in filters.values()):
            return FilterPack([], [Exclude(path + "__in", self.name, self.static)])

        filters.update({
            (path + '__' + fieldname): value
            for fieldname, value in self.static.items()
        })

        return FilterPack([filters], [])

    def upload_row(self, row: Row) -> UploadResult:
        model = getattr(models, self.name)

        toOneResults = {
            fieldname: to_one_def.upload_row(row)
            for fieldname, to_one_def in self.toOne.items()
        }

        attrs = {
            fieldname_: value
            for caption, fieldname in self.wbcols.items()
            for fieldname_, value in parse_value(self.name, fieldname, row[caption]).items()
        }

        attrs.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

        to_many_filters, to_many_excludes = to_many_filters_and_excludes(self.toMany, row)

        matched_records = reduce(lambda q, e: q.exclude(**{e.lookup: getattr(models, e.table).objects.filter(**e.filter)}),
                                 to_many_excludes,
                                 reduce(lambda q, f: q.filter(**f),
                                        to_many_filters,
                                        model.objects.filter(**attrs, **self.static)))

        n_matched = matched_records.count()
        if n_matched == 0:
            if any(v is not None for v in attrs.values()) or to_many_filters:
                uploaded = model.objects.create(**attrs, **self.static)
                toManyResults = {
                    fieldname: upload_to_manys(model, uploaded.id, fieldname, records, row)
                    for fieldname, records in self.toMany.items()
                }
                return UploadResult(Uploaded(id = uploaded.id), toOneResults, toManyResults)
            else:
                return UploadResult(NullRecord(), {}, {})

        elif n_matched == 1:
            return UploadResult(Matched(id = matched_records[0].id), toOneResults, {})

        else:
            return UploadResult(MatchedMultiple(ids = [r.id for r in matched_records]), toOneResults, {})


def to_many_filters_and_excludes(to_manys: Dict[str, List[ToManyRecord]], row: Row) -> FilterPack:
    filters: List[Dict] = []
    excludes: List[Exclude] = []

    for toManyField, records in to_manys.items():
        for record in records:
            fs, es = record.filter_on(toManyField, row)
            filters += fs
            excludes += es

    return FilterPack(filters, excludes)



def upload_to_manys(parent_model, parent_id, parent_field, records, row: Row) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        UploadTable(
            name = record.name,
            wbcols = record.wbcols,
            static = {**record.static, fk_field: parent_id},
            toOne = record.toOne,
            toMany = {},
        ).upload_row(row)

        for record in records
    ]
