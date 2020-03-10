from functools import reduce

import logging
import csv
from typing import List, Dict, Tuple, Any, NamedTuple, Optional, Union

from django.db import transaction

from specifyweb.specify import models

from .views import load

logger = logging.getLogger(__name__)


class ToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Any]

class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Any]
    toMany: Dict[str, List[ToManyRecord]]


Row = Dict[str, str]


class Uploaded(NamedTuple):
    id: int

    def get_id(self) -> Optional[int]:
        return self.id


class Matched(NamedTuple):
    id: int

    def get_id(self) -> Optional[int]:
        return self.id


class MatchedMultiple(NamedTuple):
    ids: List[int]

    def get_id(self) -> Optional[int]:
        return self.ids[0]


class NullRecord(object):
    def get_id(self) -> Optional[int]:
        return None


class UploadResult(NamedTuple):
    record_result: Union[Uploaded, Matched, MatchedMultiple, NullRecord]
    toOne: Dict[str, Any]
    toMany: Dict[str, Any]

    def get_id(self) -> Optional[int]:
        return self.record_result.get_id()


@transaction.atomic
def do_upload(wbid: int, upload_plan: UploadTable):
    logger.info('do_upload')
    wb = models.Workbench.objects.get(id=wbid)
    logger.debug('loading rows')
    rows = load(wbid)
    logger.debug('%d rows to upload', len(rows))
    wbtmis = models.Workbenchtemplatemappingitem.objects.filter(
        workbenchtemplate=wb.workbenchtemplate
    )
    return [
        upload_row_table(upload_plan, row)
        for row in rows
    ]


def do_upload_csv(csv_reader: csv.DictReader, upload_plan: UploadTable) -> List[UploadResult]:
    return [
        upload_row_table(upload_plan, row)
        for row in csv_reader
    ]


class Exclude(NamedTuple):
    lookup: str
    table: str
    filters: Dict[str, Any]


def upload_row_table(upload_table: UploadTable, row: Row) -> UploadResult:
    model = getattr(models, upload_table.name)

    toOneResults = {
        fieldname: upload_row_table(fk_table, row)
        for fieldname, fk_table in upload_table.toOne.items()
    }

    attrs = {
        fieldname: parse_value(model, fieldname, row[caption])
        for caption, fieldname in upload_table.wbcols.items()
    }

    attrs.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

    to_many_filters, to_many_excludes = to_many_filters_and_excludes(upload_table.toMany, row)

    matched_records = reduce(lambda q, e: q.exclude(**{e.lookup: getattr(models, e.table).objects.filter(**e.filters)}),
                             to_many_excludes,
                             reduce(lambda q, f: q.filter(**f),
                                    to_many_filters,
                                    model.objects.filter(**attrs, **upload_table.static)))

    n_matched = matched_records.count()
    if n_matched == 0:
        if any(v is not None for v in attrs.values()) or to_many_filters:
            uploaded = model.objects.create(**attrs, **upload_table.static)
            toManyResults = {
                fieldname: upload_to_manys(model, uploaded.id, fieldname, records, row)
                for fieldname, records in upload_table.toMany.items()
            }
            return UploadResult(Uploaded(id = uploaded.id), toOneResults, toManyResults)
        else:
            return UploadResult(NullRecord(), {}, {})

    elif n_matched == 1:
        return UploadResult(Matched(id = matched_records[0].id), toOneResults, {})

    else:
        return UploadResult(MatchedMultiple(ids = [r.id for r in matched_records]), toOneResults, {})


def to_many_filters_and_excludes(to_manys: Dict[str, List[ToManyRecord]], row: Row) -> Tuple[List[Dict[str, Any]], List[Exclude]]:
    filters: List[Dict] = []
    excludes: List[Exclude] = []

    for toManyField, records in to_manys.items():
        for record in records:
            fs, es = filter_record(toManyField, record, row)
            filters += fs
            excludes += es

    return (filters, excludes)


def filter_record(path: str, record: ToManyRecord, row: Row) -> Tuple[List[Dict[str, Any]], List[Exclude]]:
    filters = {
        (path + '__' + fieldname): parse_value(None, fieldname, row[caption])
        for caption, fieldname in record.wbcols.items()
    }

    for toOneField, toOneTable in record.toOne.items():
        fs, es = filter_record(path + '__' + toOneField, toOneTable, row)
        for f in fs:
            filters.update(f)

    if all(v is None for v in filters.values()):
        return ([], [Exclude(path + "__in", record.name, record.static)])

    filters.update({
        (path + '__' + fieldname): value
        for fieldname, value in record.static.items()
    })

    return ([filters], [])


def upload_to_manys(parent_model, parent_id, parent_field, records, row: Row) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        upload_row_table(UploadTable(
            name = record.name,
            wbcols = record.wbcols,
            static = {**record.static, fk_field: parent_id},
            toOne = record.toOne,
            toMany = {},
        ), row)

        for record in records
    ]


def parse_value(model, fieldname: str, value: str) -> Any:
    result: Any

    if value is not None:
        result = value.strip()
        if result == "":
            result = None
    return result

def caption_to_index(wbtmis, caption):
    for wbtmi in wbtmis:
        if wbtmi.caption == caption:
            return wbtmi.vieworder + 1
    raise Exception('no wb column named {}'.format(caption))
