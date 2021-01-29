from contextlib import contextmanager
import logging
import csv
from datetime import datetime, timezone
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
from ..models import Spdataset

Rows = Union[List[Row], csv.DictReader]
Progress = Callable[[int, Optional[int]], None]

logger = logging.getLogger(__name__)

class Rollback(Exception):
    def __init__(self, reason: str):
        self.reason = reason

@contextmanager
def savepoint(description: str):
    try:
        with transaction.atomic():
            logger.info(f"entering save point: {repr(description)}")
            yield
            logger.info(f"leaving save point: {repr(description)}")

    except Rollback as r:
        logger.info(f"rolling back save point: {repr(description)} due to: {repr(r.reason)}")


@contextmanager
def no_savepoint():
    yield

def unupload_dataset(ds: Spdataset, progress: Optional[Progress]=None) -> None:
    total = len(ds.rowresults)
    current = 0
    with transaction.atomic():
        for row in reversed(ds.rowresults):
            upload_result = json_to_UploadResult(row)
            if not upload_result.contains_failure():
                unupload_record(upload_result)

            current += 1
            if progress is not None:
                progress(current, total)
        ds.uploadresult = None
        ds.save()

def unupload_record(upload_result: UploadResult) -> None:
    if isinstance(upload_result.record_result, Uploaded):
        for toMany in upload_result.toMany.values():
            for record in toMany:
                unupload_record(record)

        model = getattr(models, upload_result.record_result.info.tableName.capitalize())
        model.objects.get(id=upload_result.get_id()).delete()

        for addition in upload_result.record_result.picklistAdditions:
            getattr(models, 'Picklistitem').objects.get(id=addition.id).delete()

    for record in upload_result.toOne.values():
        unupload_record(record)

def do_upload_dataset(collection, ds: Spdataset, no_commit: bool, allow_partial: bool, progress: Optional[Progress]=None) -> List[UploadResult]:
    assert not ds.was_uploaded(), "Already uploaded!"
    ds.rowresults = None
    ds.uploadresult = None
    ds.save()

    rows = [dict(zip(ds.columns, row)) for row in ds.data]
    upload_plan = get_ds_upload_plan(collection, ds)

    results = do_upload(collection, rows, upload_plan, no_commit, allow_partial, progress)
    if not no_commit:
        ds.uploadresult = {
            'success': not any(r.contains_failure() for r in results),
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
    ds.rowresults = [r.to_json() for r in results]
    ds.save()
    return results

def get_ds_upload_plan(collection, ds: Spdataset) -> ScopedUploadable:
    if ds.uploadplan is None:
        raise Exception("no upload plan defined for dataset")

    try:
        validate(ds.uploadplan, schema)
    except ValueError:
        raise Exception("upload plan json is invalid")

    return parse_plan(collection, ds.uploadplan).apply_scoping(collection)


def do_upload(collection, rows: Rows, upload_plan: ScopedUploadable, no_commit: bool=False, allow_partial: bool=True, progress: Optional[Progress]=None) -> List[UploadResult]:
    total = len(rows) if isinstance(rows, Sized) else None
    with savepoint("main upload"):
        results: List[UploadResult] = []
        for row in rows:
            with savepoint("row upload") if allow_partial else no_savepoint():
                bind_result = upload_plan.bind(collection, row)
                result = UploadResult(bind_result, {}, {}) if isinstance(bind_result, ParseFailures) else bind_result.process_row()
                results.append(result)
                if progress is not None:
                    progress(len(results), total)
                if result.contains_failure():
                    raise Rollback("failed row")
                logger.info(f"finished row {len(results)}")

        if no_commit:
            raise Rollback("no_commit option")
        else:
            fixup_trees()

    return results

do_upload_csv = do_upload

def validate_row(collection, upload_plan: ScopedUploadable, row: Row) -> UploadResult:
    retries = 3
    while True:
        try:
            with savepoint("row validation"):
                bind_result = upload_plan.bind(collection, row)
                result = UploadResult(bind_result, {}, {}) if isinstance(bind_result, ParseFailures) else bind_result.process_row()
                raise Rollback("validating only")
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
