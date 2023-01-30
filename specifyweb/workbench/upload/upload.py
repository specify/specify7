import csv
import json
import logging
import time
from itertools import islice
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import List, Dict, Union, Callable, Optional, Sized, Tuple, Any, Set, \
    Type, TypeVar, Iterable, Sequence

from django.db import connection, transaction
from django.db.models import Model as ModelBase
from django.db.utils import OperationalError, IntegrityError
from jsonschema import validate  # type: ignore

from specifyweb.specify import models
from specifyweb.specify.auditlog import auditlog
from specifyweb.specify.datamodel import Table
from specifyweb.specify.tree_extras import renumber_tree, reset_fullnames

from .uploadable import ScopedUploadable, Row, Disambiguation, Auditor
from .upload_result import Uploaded, UploadResult, ParseFailures, json_to_UploadResult
from .upload_plan_schema import schema, parse_plan_with_basetable

from . import disambiguation
from ..models import Spdataset, Spdatasetrowresult, Spdatasetrow

Progress = Callable[[UploadResult], None]

logger = logging.getLogger(__name__)

class RollbackFailure(Exception):
    pass

class Rollback(Exception):
    def __init__(self, reason: str):
        self.reason = reason

@contextmanager
def create_connection():
    from django.db import connections
    from django.db.utils import DEFAULT_DB_ALIAS, load_backend
    # TODO: The following can be replaced with connections.create_connection(...)
    # after updating Django to a version with https://github.com/django/django/pull/9272
    alias = DEFAULT_DB_ALIAS
    connections.ensure_defaults(alias)
    connections.prepare_test_settings(alias)
    db = connections.databases[alias]
    backend = load_backend(db['ENGINE'])
    conn = backend.DatabaseWrapper(db, alias)
    try:
        yield conn
    finally:
        conn.close()

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
    results = list(ds.rowresults.values_list('result', flat=True))
    total = len(results)
    with transaction.atomic():
        if ds.uploadresult is not None:
            rsid = ds.uploadresult.get('recordsetid', None)
            if rsid is not None:
                getattr(models, 'Recordset').objects.filter(id=rsid).delete()

        for i, row in enumerate(reversed(results)):
            logger.info(f"rolling back row {i+1} of {total}")
            upload_result = json_to_UploadResult(json.loads(row))
            if not upload_result.contains_failure():
                unupload_record(upload_result, agent)

            if progress is not None:
                progress(upload_result)
        ds.uploadresult = None
        ds.save(update_fields=['uploadresult'])

def unupload_record(upload_result: UploadResult, agent) -> None:
    if isinstance(upload_result.record_result, Uploaded):
        for _, toMany in sorted(upload_result.toMany.items(), key=lambda kv: kv[0], reverse=True):
            for record in reversed(toMany):
                unupload_record(record, agent)

        model = getattr(models, upload_result.record_result.info.tableName.capitalize())
        obj_q = model.objects.select_for_update().filter(id=upload_result.get_id())
        try:
            obj = obj_q[0]
        except IndexError:
            logger.debug("already deleted")
        else:
            logger.debug(f"deleting {obj}")
            auditlog.remove(obj, agent, None)
            try:
                obj_q._raw_delete(obj_q.db)
            except IntegrityError as e:
                raise RollbackFailure(
                    f"Unable to roll back {obj} because it is now refereneced by another record."
                ) from e

        for addition in reversed(upload_result.record_result.picklistAdditions):
            pli_q = getattr(models, 'Picklistitem').objects.select_for_update().filter(id=addition.id)
            try:
                pli = pli_q[0]
            except IndexError:
                logger.debug("picklist item already deleted")
            else:
                logger.debug(f"deleting {pli}")
                auditlog.remove(pli, agent, None)
                pli_q._raw_delete(pli_q.db)

    for _, record in sorted(upload_result.toOne.items(), key=lambda kv: kv[0], reverse=True):
        unupload_record(record, agent)

def do_upload_dataset(
        collection,
        uploading_agent_id: int,
        ds: Spdataset,
        no_commit: bool,
        allow_partial: bool,
        progress: Optional[Progress]=None
) -> None:
    if ds.was_uploaded(): raise AssertionError("Dataset already uploaded", {"localizationKey" : "datasetAlreadyUploaded"})
    base_table, upload_plan = get_ds_upload_plan(collection, ds)

    def rows():
        last_rownumber = -1
        while True:
            rs = ds.rows.filter(rownumber__gt=last_rownumber)[:1000]
            if not rs:
                break
            for r in rs:
                last_rownumber = r.rownumber
                yield r.data

    with create_connection() as result_conn:
        result_conn.set_autocommit(False)
        cursor = result_conn.cursor()
        cursor.execute("delete from spdatasetrowresult where spdataset_id = %s", [ds.id])

        success = True
        rowcount = 0
        batch: List[Tuple[int, int, str]] = []
        insert_batch = lambda: cursor.executemany("insert into spdatasetrowresult (spdataset_id, rownumber, result) values (%s, %s, %s)", batch)
        def _progress(result: UploadResult) -> None:
            nonlocal success, rowcount, batch
            success = success and not result.contains_failure()
            batch.append((ds.id, rowcount, json.dumps(result.to_json())))
            if len(batch) >= 1000:
                insert_batch()
                batch = []
            rowcount += 1
            if progress is not None:
                progress(result)

        _do_upload(collection, ds.columns, rows(), upload_plan, uploading_agent_id, _progress, no_commit, allow_partial)
        insert_batch()
        result_conn.commit()

    if not no_commit:
        rs = create_record_set(ds, base_table) if success else None
        ds.uploadresult = {
            'success': success,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'recordsetid': None,
            'uploadingAgentId': uploading_agent_id,
        }
        ds.save(update_fields=['uploadresult'])

T = TypeVar('T', bound=ModelBase)
def batch_create(Model: Type[T], iterable: Iterable[T]) -> None:
    batch_size = 1000
    while True:
        batch = list(islice(iterable, batch_size))
        if not batch:
            break
        Model.objects.bulk_create(batch, batch_size)

def clear_disambiguation(ds: Spdataset) -> None:
    with transaction.atomic():
        if ds.was_uploaded(): raise AssertionError("Dataset already uploaded!", {"localizationKey" : "datasetAlreadyUploaded"})
        ds.uploadresult = None
        ds.save(update_fields=['uploadresult'])

        dsr_queryset = Spdatasetrow.objects.filter(spdataset=ds.pk)
        ncols = len(ds.columns)
        for dsr in dsr_queryset:
            row = dsr.data
            extra = json.loads(row[ncols]) if row[ncols] else None
            if extra:
                extra['disambiguation'] = {}
            row[ncols] = extra and json.dumps(extra)
            dsr.save(update_fields=['data'])

def create_record_set(ds: Spdataset, table: Table):
    rs = getattr(models, 'Recordset').objects.create(
        collectionmemberid=ds.collection.id,
        dbtableid=table.tableId,
        name=ds.name,
        specifyuser=ds.specifyuser,
        type=0,
    )
    connection.cursor().execute("""
    insert into recordsetitem (recordsetid, ordernumber, recordid)
    select %s, rownumber, json_extract(result, "$.UploadResult.record_result.Uploaded.id") as recordid
    from spdatasetrowresult where spdataset_id = %s having recordid is not null
    """, [rs.id, ds.id])
    return rs

def get_disambiguation_from_row(ncols: int, row: Sequence[str]) -> Disambiguation:
    if len(row) > ncols:
        extra = json.loads(row[ncols]) if row[ncols] else None
        return disambiguation.from_json(extra['disambiguation']) if extra and 'disambiguation' in extra else None
    else:
        return None

def get_ds_upload_plan(collection, ds: Spdataset) -> Tuple[Table, ScopedUploadable]:
    if ds.uploadplan is None:
        raise Exception("no upload plan defined for dataset")

    try:
        plan = json.loads(ds.uploadplan)
    except ValueError:
        raise Exception("upload plan json is invalid")

    validate(plan, schema)
    base_table, plan = parse_plan_with_basetable(collection, plan)
    return base_table, plan.apply_scoping(collection)


def do_upload(
        collection,
        cols: Sequence[str],
        rows: Iterable[Sequence[str]],
        upload_plan: ScopedUploadable,
        uploading_agent_id: int,
        no_commit: bool=False,
        allow_partial: bool=True,
        progress: Optional[Progress]=None
) -> List[UploadResult]:
    results: List[UploadResult] = []

    def _progress(result: UploadResult) -> None:
        results.append(result)
        if progress is not None:
            progress(result)

    _do_upload(collection, cols, rows, upload_plan, uploading_agent_id, _progress, no_commit, allow_partial)
    return results

def _do_upload(
        collection,
        cols: Sequence[str],
        rows: Iterable[Sequence[str]],
        upload_plan: ScopedUploadable,
        uploading_agent_id: int,
        progress: Progress,
        no_commit: bool,
        allow_partial: bool,
) -> None:
    cache: Dict = {}
    _auditor = Auditor(collection=collection, audit_log=None if no_commit else auditlog)
    with savepoint("main upload"):
        tic = time.perf_counter()
        changed_trees: Set[str] = set()

        for i, row in enumerate(rows):
            _cache = cache.copy() if cache is not None and allow_partial else cache
            da = get_disambiguation_from_row(len(cols), row)
            with savepoint("row upload") if allow_partial else no_savepoint():
                bind_result = upload_plan.disambiguate(da).bind(collection, dict(zip(cols, row)), uploading_agent_id, _auditor, cache)
                result = UploadResult(bind_result, {}, {}) if isinstance(bind_result, ParseFailures) else bind_result.process_row()
                if progress is not None:
                    progress(result)
                if result.contains_failure():
                    cache = _cache
                    raise Rollback("failed row")
                
                changed_trees = changed_trees.union(
                    tree for tree in ('taxon', 'geography', 'geologictimeperiod', 'lithostrat', 'storage')
                    if changed_tree(tree, result)
                )
                logger.info(f"finished row {i}")

        toc = time.perf_counter()
        logger.info(f"finished upload of {i+1} rows in {toc-tic}s")

        if no_commit:
            raise Rollback("no_commit option")
        else:
            fixup_trees(upload_plan, changed_trees)

def validate_row(collection, upload_plan: ScopedUploadable, uploading_agent_id: int, row: Row, da: Disambiguation) -> UploadResult:
    retries = 3
    while True:
        try:
            with savepoint("row validation"):
                bind_result = upload_plan.disambiguate(da).bind(collection, row, uploading_agent_id, Auditor(collection, None))
                result = UploadResult(bind_result, {}, {}) if isinstance(bind_result, ParseFailures) else bind_result.process_row()
                raise Rollback("validating only")
            break

        except OperationalError as e:
            if e.args[0] == 1213 and retries > 0: #: (1213, 'Deadlock found when trying to get lock; try restarting transaction')
                retries -= 1
            else:
                raise

    return result

def fixup_trees(upload_plan: ScopedUploadable, to_fix: Iterable[str]) -> None:
    treedefs = upload_plan.get_treedefs()

    for tree in to_fix:
        tic = time.perf_counter()
        renumber_tree(tree)
        toc = time.perf_counter()
        logger.info(f"finished renumber of {tree} tree in {toc-tic}s")

        for treedef in treedefs:
            if treedef.specify_model.name.lower().startswith(tree):
                tic = time.perf_counter()
                reset_fullnames(treedef, null_only=True)
                toc = time.perf_counter()
                logger.info(f"finished reset fullnames of {tree} tree in {toc-tic}s")

def changed_tree(tree: str, result: UploadResult) -> bool:
    return (isinstance(result.record_result, Uploaded) and result.record_result.info.tableName.lower() == tree) \
        or any(changed_tree(tree, toOne) for toOne in result.toOne.values()) \
        or any(changed_tree(tree, r) for toMany in result.toMany.values() for r in toMany)

class NopLog(object):
    def insert(self, inserted_obj: Any, agent: Union[int, Any], parent_record: Optional[Any]) -> None:
        pass
