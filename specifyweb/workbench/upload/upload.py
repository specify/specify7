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
from specifyweb.specify.auditlog import auditlog
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

def unupload_dataset(ds: Spdataset, agent, progress: Optional[Progress]=None) -> None:
    if ds.rowresults is None:
        return
    results = json.loads(ds.rowresults)
    total = len(results)
    current = 0
    with transaction.atomic():
        for row in reversed(results):
            upload_result = json_to_UploadResult(row)
            if not upload_result.contains_failure():
                unupload_record(upload_result, agent)

            current += 1
            if progress is not None:
                progress(current, total)
        ds.uploadresult = None
        ds.save(update_fields=['uploadresult'])

def unupload_record(upload_result: UploadResult, agent) -> None:
    if isinstance(upload_result.record_result, Uploaded):
        for toMany in upload_result.toMany.values():
            for record in toMany:
                unupload_record(record, agent)

        model = getattr(models, upload_result.record_result.info.tableName.capitalize())
        obj = model.objects.get(id=upload_result.get_id())
        auditlog.remove(obj, agent, None)
        obj.delete()

        for addition in upload_result.record_result.picklistAdditions:
            pli = getattr(models, 'Picklistitem').objects.get(id=addition.id)
            auditlog.remove(pli, agent, None)
            pli.delete()

    for record in upload_result.toOne.values():
        unupload_record(record, agent)

def do_upload_dataset(
        collection,
        uploading_agent_id: int,
        ds: Spdataset,
        no_commit: bool,
        allow_partial: bool,
        progress: Optional[Progress]=None
) -> List[UploadResult]:
    assert not ds.was_uploaded(), "Already uploaded!"
    ds.rowresults = None
    ds.uploadresult = None
    ds.save(update_fields=['rowresults', 'uploadresult'])

    rows = [dict(zip(ds.columns, row)) for row in ds.data]
    upload_plan = get_ds_upload_plan(collection, ds)

    results = do_upload(collection, rows, upload_plan, uploading_agent_id, no_commit, allow_partial, progress)
    if not no_commit:
        ds.uploadresult = {
            'success': not any(r.contains_failure() for r in results),
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
    ds.rowresults = json.dumps([r.to_json() for r in results])
    ds.save(update_fields=['rowresults', 'uploadresult'])
    return results

def get_ds_upload_plan(collection, ds: Spdataset) -> ScopedUploadable:
    if ds.uploadplan is None:
        raise Exception("no upload plan defined for dataset")

    try:
        plan = json.loads(ds.uploadplan)
    except ValueError:
        raise Exception("upload plan json is invalid")

    validate(plan, schema)
    return parse_plan(collection, plan).apply_scoping(collection)


def do_upload(
        collection,
        rows: Rows,
        upload_plan: ScopedUploadable,
        uploading_agent_id: int,
        no_commit: bool=False,
        allow_partial: bool=True,
        progress: Optional[Progress]=None
) -> List[UploadResult]:
    total = len(rows) if isinstance(rows, Sized) else None
    with savepoint("main upload"):
        results: List[UploadResult] = []
        for row in rows:
            with savepoint("row upload") if allow_partial else no_savepoint():
                bind_result = upload_plan.bind(collection, row, uploading_agent_id)
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
            fixup_trees(results)

    return results

do_upload_csv = do_upload

def validate_row(collection, upload_plan: ScopedUploadable, uploading_agent_id: int, row: Row) -> UploadResult:
    retries = 3
    while True:
        try:
            with savepoint("row validation"):
                bind_result = upload_plan.bind(collection, row, uploading_agent_id)
                result = UploadResult(bind_result, {}, {}) if isinstance(bind_result, ParseFailures) else bind_result.process_row()
                raise Rollback("validating only")
            break

        except OperationalError as e:
            if e.args[0] == 1213 and retries > 0: #: (1213, 'Deadlock found when trying to get lock; try restarting transaction')
                retries -= 1
            else:
                raise

    return result

def fixup_trees(results: List[UploadResult]) -> None:
    to_fix = [
        tree
        for tree in ('taxon', 'geography', 'geologictimeperiod', 'lithostrat', 'storage')
        if any(changed_tree(tree, r) for r in results)
    ]

    for tree in to_fix:
        renumber_tree(tree)
        for treedef in getattr(models, (tree + 'treedef').capitalize()).objects.all():
            reset_fullnames(treedef)

def changed_tree(tree: str, result: UploadResult) -> bool:
    return (isinstance(result.record_result, Uploaded) and result.record_result.info.tableName.lower() == tree) \
        or any(changed_tree(tree, toOne) for toOne in result.toOne.values()) \
        or any(changed_tree(tree, r) for toMany in result.toMany.values() for r in toMany)
