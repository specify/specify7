from collections import namedtuple
import logging
logger = logging.getLogger(__name__)

from django.db import transaction

from specifyweb.specify import models

from .views import load

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
def do_upload(wbid, upload_plan):
    logger.info('do_upload')
    wb = models.Workbench.objects.get(id=wbid)
    logger.debug('loading rows')
    rows = load(wbid)
    logger.debug('%d rows to upload', len(rows))
    wbtmis = models.Workbenchtemplatemappingitem.objects.filter(
        workbenchtemplate=wb.workbenchtemplate
    )
    return [
        upload_row_table(upload_plan, row, wbtmis)
        for row in rows
    ]


def upload_row_table(upload_table, row, wbtmis):
    model = getattr(models, upload_table.name)

    toOneResults = {
        fieldname: upload_row_table(fk_table, row, wbtmis)
        for fieldname, fk_table in upload_table.toOne.items()
    }

    filters = {
        fieldname: parse_value(model, fieldname, row[caption_to_index(wbtmis, caption)])
        for caption, fieldname in upload_table.wbcols.items()
    }

    filters.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

    if all(v is None for v in filters.values()):
        return UploadResult(NullRecord(), {}, {})

    filters.update(upload_table.static)

    matched_records = filter_to_many(upload_table.toMnay, model.objects.filter(**filters))
    nmatched = matched_records.count()

    if nmatched == 0:
        uploaded = model.objects.create(**filters)
        toManyResults = {
            fieldname: upload_to_manys(model, uploaded.id, fieldname, records, row, wbtmis)
            for fieldname, records in upload_table.toMany.items()
        }

        return UploadResult(Uploaded(id = uploaded.id), toOneResults, toManyResults)
    elif nmatched == 1:
        return UploadResult(Matched(id = matched_records[0].id), toOneResults, {})
    else:
        return UploadResult(MatchedMultiple(ids = [r.id for r in matched_records]), toOneResults, {})


def filter_to_many(to_manys, query):
    for toManyField, records in to_manys.items():
        for record in records:
            filters = filter_record(toManyField, record)
            query = query.filter(**filters)
    return query


def filter_record(path, record):
    filters = {
        (path + '__' + fieldname): value
        for fieldname, value in record.static.items()
    }

    filters.update({
        (path + '__' + fieldname): parse_value(None, fieldname, row[caption_to_index(wbtmis, caption)])
        for caption, fieldname in record.wbcols.items()
    })

    for toOneField, toOneTable in record.toOne.items():
        filters.update(filter_record(path + '__' + toOneField, toOneTable))

    return filters


def upload_to_manys(parent_model, parent_id, parent_field, records, row, wbtmis):
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        upload_row_table(UploadTable(
            name = record.name,
            wbcols = record.wbcols,
            static = merge_dict(record.static, {fk_field: parent_id}),
            toOne = record.toOne,
            toMany = {},
        ), row, wbtmis)

        for record in records
    ]


def merge_dict(a, b):
    c = a.copy()
    c.update(b)
    return c

def parse_value(model, fieldname, value):
    if value is not None:
        value = value.strip()
        if value == "":
            value = None
    return value

def caption_to_index(wbtmis, caption):
    for wbtmi in wbtmis:
        if wbtmi.caption == caption:
            return wbtmi.vieworder + 1
    raise Exception('no wb column named {}'.format(caption))

UploadTable = namedtuple('UploadTable', 'name wbcols static toOne toMany')
ToManyRecord = namedtuple('ToManyRecord', 'name wbcols static toOne')
