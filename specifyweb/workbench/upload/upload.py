import csv
import json
import logging
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import List, Dict, Union, Callable, Optional, Sized, Tuple, Any

from django.db import transaction
from django.db.utils import OperationalError, IntegrityError
from jsonschema import validate  # type: ignore

from specifyweb.specify import models
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.auditlog import auditlog
from specifyweb.specify.datamodel import Table
from specifyweb.specify.tree_extras import renumber_tree, set_fullnames
from specifyweb.workbench.upload.upload_table import DeferredScopeUploadTable, ScopedUploadTable

from . import disambiguation
from .upload_plan_schema import schema, parse_plan_with_basetable
from .upload_result import Uploaded, UploadResult, ParseFailures, \
    json_to_UploadResult
from .uploadable import ScopedUploadable, Row, Disambiguation, Auditor
from ..models import Spdataset

Rows = Union[List[Row], csv.DictReader]
Progress = Callable[[int, Optional[int]], None]

logger = logging.getLogger(__name__)

class RollbackFailure(Exception):
    pass

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
            logger.info(f"rolling back row {current} of {total}")
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
                    f"Unable to roll back {obj} because it is now referenced by another record."
                ) from e

        for addition in reversed(upload_result.record_result.picklistAdditions):
            pli_q = models.Picklistitem.objects.select_for_update().filter(id=addition.id)
            try:
                pli = pli_q[0]
            except IndexError:
                logger.debug("picklist item already deleted")
            else:
                logger.debug(f"deleting {pli}")
                auditlog.remove(pli, agent, None)
                pli_q._raw_delete(obj_q.db)  # type: ignore

    for _, record in sorted(upload_result.toOne.items(), key=lambda kv: kv[0], reverse=True):
        unupload_record(record, agent)

def do_upload_dataset(
        collection,
        uploading_agent_id: int,
        ds: Spdataset,
        no_commit: bool,
        allow_partial: bool,
        progress: Optional[Progress]=None
) -> List[UploadResult]:
    if ds.was_uploaded(): raise AssertionError("Dataset already uploaded", {"localizationKey" : "datasetAlreadyUploaded"})
    ds.rowresults = None
    ds.uploadresult = None
    ds.save(update_fields=['rowresults', 'uploadresult'])

    ncols = len(ds.columns)
    rows = [dict(zip(ds.columns, row)) for row in ds.data]
    disambiguation = [get_disambiguation_from_row(ncols, row) for row in ds.data]
    base_table, upload_plan = get_ds_upload_plan(collection, ds)

    results = do_upload(collection, rows, upload_plan, uploading_agent_id, disambiguation, no_commit, allow_partial, progress)
    success = not any(r.contains_failure() for r in results)
    if not no_commit:
        ds.uploadresult = {
            'success': success,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'recordsetid': None,
            'uploadingAgentId': uploading_agent_id,
        }
    ds.rowresults = json.dumps([r.to_json() for r in results])
    ds.save(update_fields=['rowresults', 'uploadresult'])
    return results

def clear_disambiguation(ds: Spdataset) -> None:
    with transaction.atomic():
        if ds.was_uploaded(): raise AssertionError("Dataset already uploaded!", {"localizationKey" : "datasetAlreadyUploaded"})
        ds.rowresults = None
        ds.uploadresult = None
        ds.save(update_fields=['rowresults', 'uploadresult'])

        ncols = len(ds.columns)
        for row in ds.data:
            extra = json.loads(row[ncols]) if row[ncols] else None
            if extra:
                extra['disambiguation'] = {}
            row[ncols] = extra and json.dumps(extra)
        ds.save(update_fields=['data'])

def create_recordset(ds: Spdataset, name: str):
    table, upload_plan = get_ds_upload_plan(ds.collection, ds)
    assert ds.rowresults is not None
    results = json.loads(ds.rowresults)

    rs = models.Recordset.objects.create(
        collectionmemberid=ds.collection.id,
        dbtableid=table.tableId,
        name=name,
        specifyuser=ds.specifyuser,
        type=0,
    )
    models.Recordsetitem.objects.bulk_create([
        models.Recordsetitem(order=i, recordid=record_id, recordset=rs)
        for i, r in enumerate(map(json_to_UploadResult, results))
        if isinstance(r.record_result, Uploaded) and (record_id := r.get_id()) is not None and record_id != 'Failure'
    ])
    return rs

def get_disambiguation_from_row(ncols: int, row: List) -> Disambiguation:
    extra = json.loads(row[ncols]) if row[ncols] else None
    return disambiguation.from_json(extra['disambiguation']) if extra and 'disambiguation' in extra else None

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

def apply_deferred_scopes(upload_plan: ScopedUploadable, rows: Rows) -> ScopedUploadable:

    def collection_override_function(deferred_upload_plan: DeferredScopeUploadTable, row_index: int): # -> models.Collection
        # to call this function, we always know upload_plan is either a DeferredScopeUploadTable or ScopedUploadTable
        related_uploadable: Union[ScopedUploadTable, DeferredScopeUploadTable] = upload_plan.toOne[deferred_upload_plan.related_key] # type: ignore
        related_column_name = related_uploadable.wbcols['name'][0]
        filter_value = rows[row_index][related_column_name] # type: ignore
        
        filter_search = {deferred_upload_plan.filter_field : filter_value}

        related_table = datamodel.get_table(deferred_upload_plan.related_key)
        if related_table is not None:
            related = getattr(models, related_table.django_name).objects.get(**filter_search)
            collection_id = getattr(related, deferred_upload_plan.relationship_name).id
            collection = models.Collection.objects.get(id=collection_id)
            return collection

    if hasattr(upload_plan, 'toOne'):
        # Without type ignores, MyPy throws the following error: "ScopedUploadable" has no attribute "toOne"
        # MyPy expects upload_plan to be of type ScopedUploadable (from the paramater type)
        # but within this if-statement we know that upload_plan is always an UploadTable 
        # (or more specifically, one if its derivatives: DeferredScopeUploadTable or ScopedUploadTable)

        for key, uploadable in upload_plan.toOne.items(): # type: ignore
            _uploadable = uploadable
            if hasattr(_uploadable, 'toOne'): _uploadable = apply_deferred_scopes(_uploadable, rows)
            if isinstance(_uploadable, DeferredScopeUploadTable):
                _uploadable = _uploadable.add_colleciton_override(collection_override_function)
            upload_plan.toOne[key] = _uploadable # type: ignore

    return upload_plan


def do_upload(
        collection,
        rows: Rows,
        upload_plan: ScopedUploadable,
        uploading_agent_id: int,
        disambiguations: Optional[List[Disambiguation]]=None,
        no_commit: bool=False,
        allow_partial: bool=True,
        progress: Optional[Progress]=None
) -> List[UploadResult]:
    cache: Dict = {}
    _auditor = Auditor(collection=collection, audit_log=None if no_commit else auditlog,
                       # Done to allow checking skipping write permission check
                       # during validation
                       skip_create_permission_check=no_commit)
    total = len(rows) if isinstance(rows, Sized) else None
    deffered_upload_plan = apply_deferred_scopes(upload_plan, rows)
    with savepoint("main upload"):
        tic = time.perf_counter()
        results: List[UploadResult] = []
        for i, row in enumerate(rows):
            _cache = cache.copy() if cache is not None and allow_partial else cache
            da = disambiguations[i] if disambiguations else None
            with savepoint("row upload") if allow_partial else no_savepoint():
                bind_result = deffered_upload_plan.disambiguate(da).bind(collection, row, uploading_agent_id, _auditor, cache, i)
                result = UploadResult(bind_result, {}, {}) if isinstance(bind_result, ParseFailures) else bind_result.process_row()
                results.append(result)
                if progress is not None:
                    progress(len(results), total)
                logger.info(f"finished row {len(results)}, cache size: {cache and len(cache)}")
                if result.contains_failure():
                    cache = _cache
                    raise Rollback("failed row")

        toc = time.perf_counter()
        logger.info(f"finished upload of {len(results)} rows in {toc-tic}s")

        if no_commit:
            raise Rollback("no_commit option")
        else:
            fixup_trees(deffered_upload_plan, results)

    return results

do_upload_csv = do_upload

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

def fixup_trees(upload_plan: ScopedUploadable, results: List[UploadResult]) -> None:
    treedefs = upload_plan.get_treedefs()

    to_fix = [
        tree
        for tree in ('taxon', 'geography', 'geologictimeperiod', 'lithostrat', 'storage', 'tectonicunit')
        if any(changed_tree(tree, r) for r in results)
    ]

    for tree in to_fix:
        tic = time.perf_counter()
        renumber_tree(tree)
        toc = time.perf_counter()
        logger.info(f"finished renumber of {tree} tree in {toc-tic}s")

        for treedef in treedefs:
            if treedef.specify_model.name.lower().startswith(tree):
                tic = time.perf_counter()
                set_fullnames(treedef, null_only=True)
                toc = time.perf_counter()
                logger.info(f"finished reset fullnames of {tree} tree in {toc-tic}s")

def changed_tree(tree: str, result: UploadResult) -> bool:
    return (isinstance(result.record_result, Uploaded) and result.record_result.info.tableName.lower() == tree) \
        or any(changed_tree(tree, toOne) for toOne in result.toOne.values()) \
        or any(changed_tree(tree, r) for toMany in result.toMany.values() for r in toMany)

class NopLog(object):
    def insert(self, inserted_obj: Any, agent: Union[int, Any], parent_record: Optional[Any]) -> None:
        pass
