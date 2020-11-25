from contextlib import contextmanager
import logging
import csv
import json
from jsonschema import validate # type: ignore

from typing import List, Dict, Union, Callable, Optional, Sized

from django.db import connection, transaction
from django.db.utils import OperationalError

from specifyweb.specify import models
from specifyweb.specify.tree_extras import renumber_tree, reset_fullnames

from .uploadable import ScopedUploadable, Row
from .upload_result import Uploaded, UploadResult, ParseFailures, json_to_UploadResult
from .upload_plan_schema import schema, parse_plan

Rows = Union[List[Row], csv.DictReader]
Progress = Callable[[int, Optional[int]], None]

logger = logging.getLogger(__name__)

class Rollback(Exception):
    pass

@contextmanager
def savepoint():
    try:
        with transaction.atomic():
            yield
    except Rollback:
        pass

def unupload_wb(wb, progress: Optional[Progress]=None) -> None:
    with transaction.atomic():
        for row in wb.workbenchrows.order_by('-rownumber'):
            upload_result = json_to_UploadResult(json.loads(row.biogeomancerresults))
            unupload_record(upload_result)

def unupload_record(upload_result: UploadResult) -> None:
    if isinstance(upload_result.record_result, Uploaded):
        for toMany in upload_result.toMany.values():
            for record in toMany:
                unupload_record(record)

        model = getattr(models, upload_result.record_result.info.tableName.capitalize())
        model.objects.get(id=upload_result.get_id()).delete()
        # handle picklist additions

    for record in upload_result.toOne.values():
        unupload_record(record)

def do_upload_wb(collection, wb, no_commit: bool, progress: Optional[Progress]=None) -> List[UploadResult]:
    from ..views import load

    cursor = connection.cursor()
    cursor.execute(
        "update workbenchrow set bioGeomancerResults = null where workbenchid = %s",
        (wb.id,)
    )

    logger.debug('loading rows')
    tuples = load(wb.id)

    captions = [
        wbtmi.caption for wbtmi in
        wb.workbenchtemplate.workbenchtemplatemappingitems.order_by('vieworder')
    ]

    logger.debug('row captions: %s', captions)

    rows = [dict(zip(captions, t[1:])) for t in tuples]
    upload_plan = get_wb_upload_plan(collection, wb)

    results = do_upload(collection, rows, upload_plan, no_commit, progress)

    for t, r in zip(tuples, results):
        cursor.execute(
            "update workbenchrow set bioGeomancerResults = %s where workbenchrowid = %s",
            (json.dumps(r.to_json()), t[0])
        )
    return results

def get_wb_upload_plan(collection, wb) -> ScopedUploadable:
    plan_json = wb.workbenchtemplate.remarks
    if plan_json is None or plan_json.strip() == "":
        raise Exception("no upload plan defined for dataset")

    try:
        plan = json.loads(plan_json)
        validate(plan, schema)
    except ValueError:
        raise Exception("upload plan json is invalid")

    return parse_plan(collection, plan).apply_scoping(collection)


def do_upload(collection, rows: Rows, upload_plan: ScopedUploadable, no_commit: bool=False, progress: Optional[Progress]=None) -> List[UploadResult]:
    total = len(rows) if isinstance(rows, Sized) else None
    with savepoint():
        logger.info("started main upload transaction")
        results: List[UploadResult] = []
        for row in rows:
            with savepoint():
                logger.debug("started row transaction")
                bind_result = upload_plan.bind(collection, row)
                result = UploadResult(bind_result, {}, {}) if isinstance(bind_result, ParseFailures) else bind_result.process_row()
                results.append(result)
                if progress is not None:
                    progress(len(results), total)
                if result.contains_failure():
                    logger.debug("rolling back row")
                    raise Rollback()
                logger.info(f"finished row {len(results)}")
        fixup_trees()

        if no_commit:
            logger.info("rolling back main upload transaction due to no_commit")
            raise Rollback()

    return results

do_upload_csv = do_upload

def validate_row(collection, upload_plan: ScopedUploadable, row: Row) -> UploadResult:
    retries = 3
    while True:
        try:
            with savepoint():
                bind_result = upload_plan.bind(collection, row)
                result = UploadResult(bind_result, {}, {}) if isinstance(bind_result, ParseFailures) else bind_result.process_row()
                raise Rollback()
            break

        except OperationalError as e:
            if e.args[0] == 1213 and retries > 0: #: (1213, 'Deadlock found when trying to get lock; try restarting transaction')
                retries -= 1
            else:
                raise

    return result

def fixup_trees():
    for tree in ('taxon', 'geography', 'geologictimeperiod', 'lithostrat', 'storage'):
        renumber_tree(tree)
        for treedef in getattr(models, (tree + 'treedef').capitalize()).objects.all():
            reset_fullnames(treedef)
