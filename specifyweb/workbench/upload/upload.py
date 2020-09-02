
import logging
import csv
import json
from jsonschema import validate # type: ignore


from typing import List, Dict, Iterable, Union

from django.db import transaction

from specifyweb.specify import models
from specifyweb.specify.tree_extras import renumber_tree, reset_fullnames

from ..views import load
from .data import UploadResult, Uploadable, Row
from .upload_plan_schema import schema, parse_plan

Rows = Union[Iterable[Row], csv.DictReader]

logger = logging.getLogger(__name__)


class NoCommit(Exception):
    pass

def do_upload_wb(collection, wb, no_commit: bool) -> List[UploadResult]:
    logger.debug('loading rows')
    tuples = load(wb.id)
    logger.debug('%d rows to upload', len(tuples))

    captions = [
        wbtmi.caption for wbtmi in
        wb.workbenchtemplate.workbenchtemplatemappingitems.order_by('vieworder')
    ]

    logger.debug('row captions: %s', captions)

    rows = (dict(zip(captions, t[1:])) for t in tuples)

    plan = json.loads(wb.workbenchtemplate.remarks)
    validate(plan, schema)
    upload_plan = parse_plan(collection, plan)

    no_commit = True
    return do_upload(collection, rows, upload_plan, no_commit)


def do_upload(collection, rows: Rows, upload_plan: Uploadable, no_commit: bool=False) -> List[UploadResult]:
    try:
        with transaction.atomic():
            result = [
                upload_plan.upload_row(collection, row)
                for row in rows
            ]
            fixup_trees()

        if no_commit:
            raise NoCommit()

    except NoCommit:
        pass

    return result

do_upload_csv = do_upload

def fixup_trees():
    for tree in ('taxon', 'geography', 'geologictimeperiod', 'lithostrat', 'storage'):
        renumber_tree(tree)
        for treedef in getattr(models, (tree + 'treedef').capitalize()).objects.all():
            reset_fullnames(treedef)
