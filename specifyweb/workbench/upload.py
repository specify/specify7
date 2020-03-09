from collections import namedtuple
from functools import reduce

import logging
import csv
from typing import *
logger = logging.getLogger(__name__)

from django.db import transaction

from specifyweb.specify import models

from .views import load

UploadTable = namedtuple('UploadTable', 'name wbcols static toOne toMany')
ToManyRecord = namedtuple('ToManyRecord', 'name wbcols static toOne')
Row = Dict[str, str]


class Uploaded(namedtuple('Uploaded', 'id')):
    def get_id(self):
        return self.id


class Matched(namedtuple('Matched', 'id')):
    def get_id(self):
        return self.id


class MatchedMultiple(namedtuple('MatchedMultiple', 'ids')):
    def get_id(self):
        return self.ids[0]


class NullRecord(namedtuple('NullRecord', '')):
    def get_id(self):
        return None


class UploadResult(namedtuple('UploadResult', 'record_result toOne toMany')):
    def get_id(self):
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

    to_many_filter_attrs = to_many_filters(upload_table.toMany, row)

    matched_records = reduce(lambda q, f: q.filter(**f), to_many_filter_attrs, model.objects.filter(**attrs, **upload_table.static))

    n_matched = matched_records.count()
    if n_matched == 0:
        if any(v is not None for v in attrs.values()) or to_many_filter_attrs:
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


def to_many_filters(to_manys: dict, row: Row) -> List[Dict]:
    return [
        f
        for toManyField, records in to_manys.items()
        for record in records
        for f in filter_record(toManyField, record, row)
    ]


def filter_to_many(to_manys: dict, row: Row, query):
    for toManyField, records in to_manys.items():
        for record in records:
            filters = filter_record(toManyField, record, row)
            query = query.filter(**filters)
    return query


def filter_record(path: str, record: ToManyRecord, row: Row) -> List[Dict]:
    filters = {
        (path + '__' + fieldname): parse_value(None, fieldname, row[caption])
        for caption, fieldname in record.wbcols.items()
    }

    for toOneField, toOneTable in record.toOne.items():
        for f in filter_record(path + '__' + toOneField, toOneTable, row):
            filters.update(f)

    if all(v is None for v in filters.values()):
        return []

    filters.update({
        (path + '__' + fieldname): value
        for fieldname, value in record.static.items()
    })

    return [filters]


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
