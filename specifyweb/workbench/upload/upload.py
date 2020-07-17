
import logging
import csv
from typing import List

from django.db import transaction

from specifyweb.specify import models

from ..views import load
from .data import UploadResult, Uploadable

logger = logging.getLogger(__name__)

# @transaction.atomic
# def do_upload(wbid: int, upload_plan: UploadTable):
#     logger.info('do_upload')
#     wb = models.Workbench.objects.get(id=wbid)
#     logger.debug('loading rows')
#     rows = load(wbid)
#     logger.debug('%d rows to upload', len(rows))
#     wbtmis = models.Workbenchtemplatemappingitem.objects.filter(
#         workbenchtemplate=wb.workbenchtemplate
#     )
#     return [
#         upload_plan.upload_row(row)
#         for row in rows
#     ]


def do_upload_csv(collection, csv_reader: csv.DictReader, upload_plan: Uploadable) -> List[UploadResult]:
    return [
        upload_plan.upload_row(collection, row)
        for row in csv_reader
    ]


def caption_to_index(wbtmis, caption):
    for wbtmi in wbtmis:
        if wbtmi.caption == caption:
            return wbtmi.vieworder + 1
    raise Exception('no wb column named {}'.format(caption))
