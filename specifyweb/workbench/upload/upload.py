import csv
import json
import logging
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import (
    List,
    Dict,
    NamedTuple,
    Union,
    Callable,
    Optional,
    Sized,
    Tuple,
)

from django.db import transaction
from django.db.utils import OperationalError, IntegrityError
from jsonschema import validate  # type: ignore

from specifyweb.permissions.permissions import has_target_permission
from specifyweb.specify import models
from specifyweb.specify.auditlog import auditlog
from specifyweb.specify.datamodel import Table
from specifyweb.specify.func import Func
from specifyweb.specify.tree_extras import renumber_tree, set_fullnames
from specifyweb.workbench.permissions import BatchEditDataSetPT
from specifyweb.workbench.upload.auditor import (
    DEFAULT_AUDITOR_PROPS,
    AuditorProps,
    BatchEditPrefs,
)
from . import disambiguation
from .upload_plan_schema import schema, parse_plan_with_basetable
from .upload_result import (
    Deleted,
    MatchedAndChanged,
    RecordResult,
    Updated,
    Uploaded,
    UploadResult,
    ParseFailures,
)
from .uploadable import (
    BatchEditSelf,
    Extra,
    ScopedUploadable,
    Row,
    Disambiguation,
    Auditor,
    Uploadable,
    BatchEditJson,
)
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
        logger.info(
            f"rolling back save point: {repr(description)} due to: {repr(r.reason)}"
        )


@contextmanager
def no_savepoint():
    yield


def unupload_dataset(ds: Spdataset, agent, progress: Optional[Progress] = None) -> None:
    if ds.rowresults is None:
        return
    results = json.loads(ds.rowresults)
    total = len(results)
    current = 0
    with transaction.atomic():
        for row in reversed(results):
            logger.info(f"rolling back row {current} of {total}")
            upload_result = UploadResult.from_json(row)
            if not upload_result.contains_failure():
                unupload_record(upload_result, agent)

            current += 1
            if progress is not None:
                progress(current, total)
        ds.uploadresult = None
        ds.save(update_fields=["uploadresult"])


def unupload_record(upload_result: UploadResult, agent) -> None:
    if isinstance(upload_result.record_result, Uploaded):
        for _, toMany in sorted(
            upload_result.toMany.items(), key=lambda kv: kv[0], reverse=True
        ):
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
            pli_q = models.Picklistitem.objects.select_for_update().filter(
                id=addition.id
            )
            try:
                pli = pli_q[0]
            except IndexError:
                logger.debug("picklist item already deleted")
            else:
                logger.debug(f"deleting {pli}")
                auditlog.remove(pli, agent, None)
                pli_q._raw_delete(obj_q.db)  # type: ignore

    for _, record in sorted(
        upload_result.toOne.items(), key=lambda kv: kv[0], reverse=True
    ):
        unupload_record(record, agent)


def do_upload_dataset(
    collection,
    uploading_agent_id: int,
    ds: Spdataset,
    no_commit: bool,
    allow_partial: bool,
    progress: Optional[Progress] = None,
) -> List[UploadResult]:
    if ds.was_uploaded():
        raise AssertionError(
            "Dataset already uploaded", {"localizationKey": "datasetAlreadyUploaded"}
        )
    ds.rowresults = None
    ds.uploadresult = None
    ds.save(update_fields=["rowresults", "uploadresult"])

    ncols = len(ds.columns)
    rows = [dict(zip(ds.columns, row)) for row in ds.data]

    disambiguation = [get_disambiguation_from_row(ncols, row) for row in ds.data]
    batch_edit_packs = [get_batch_edit_pack_from_row(ncols, row) for row in ds.data]
    base_table, upload_plan, batchEditPrefs = get_raw_ds_upload_plan(ds)

    results = do_upload(
        collection,
        rows,
        upload_plan,
        uploading_agent_id,
        disambiguation,
        no_commit,
        allow_partial,
        progress,
        batch_edit_packs=batch_edit_packs,
        auditor_props=AuditorProps(
            allow_delete_dependents=has_target_permission(
                collection.id,
                ds.specifyuser_id,
                [BatchEditDataSetPT.delete_dependents],
            ),
            batch_edit_prefs=batchEditPrefs,
        ),
    )
    success = not any(r.contains_failure() for r in results)
    if not no_commit:
        ds.uploadresult = {
            "success": success,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recordsetid": None,
            "uploadingAgentId": uploading_agent_id,
        }
    ds.rowresults = json.dumps([r.to_json() for r in results])
    ds.save(update_fields=["rowresults", "uploadresult"])
    return results


def clear_disambiguation(ds: Spdataset) -> None:
    with transaction.atomic():
        if ds.was_uploaded():
            raise AssertionError(
                "Dataset already uploaded!",
                {"localizationKey": "datasetAlreadyUploaded"},
            )
        ds.rowresults = None
        ds.uploadresult = None
        ds.save(update_fields=["rowresults", "uploadresult"])

        ncols = len(ds.columns)
        for row in ds.data:
            extra = json.loads(row[ncols]) if row[ncols] else None
            if extra:
                extra["disambiguation"] = {}
            row[ncols] = extra and json.dumps(extra)
        ds.save(update_fields=["data"])


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

    models.Recordsetitem.objects.bulk_create(
        [
            models.Recordsetitem(order=i, recordid=record_id, recordset=rs)
            for i, r in enumerate(map(UploadResult.from_json, results))
            if (
                isinstance(r.record_result, Uploaded)
                or (ds.isupdate and r.contains_success())
            )
            and (record_id := r.get_id()) is not None
            and record_id != "Failure"
        ]
    )
    return rs


def get_disambiguation_from_row(ncols: int, row: List) -> Disambiguation:
    extra: Optional[Extra] = json.loads(row[ncols]) if row[ncols] else None
    return (
        disambiguation.from_json(extra["disambiguation"])
        if extra and "disambiguation" in extra
        else None
    )


def get_batch_edit_pack_from_row(ncols: int, row: List) -> Optional[BatchEditJson]:
    extra: Optional[Extra] = json.loads(row[ncols]) if row[ncols] else None
    return extra.get("batch_edit") if extra is not None else None


def get_raw_ds_upload_plan(ds: Spdataset) -> Tuple[Table, Uploadable, BatchEditPrefs]:
    if ds.uploadplan is None:
        raise Exception("no upload plan defined for dataset")

    try:
        plan = json.loads(ds.uploadplan)
    except ValueError:
        raise Exception("upload plan json is invalid")

    validate(plan, schema)
    base_table, plan, batchEditPrefs = parse_plan_with_basetable(plan)
    return base_table, plan, batchEditPrefs


def get_ds_upload_plan(collection, ds: Spdataset) -> Tuple[Table, ScopedUploadable]:
    base_table, plan, _ = get_raw_ds_upload_plan(ds)
    return base_table, plan.apply_scoping(collection)


def do_upload(
    collection,
    rows: Rows,
    upload_plan: Uploadable,
    uploading_agent_id: int,
    disambiguations: Optional[List[Disambiguation]] = None,
    no_commit: bool = False,
    allow_partial: bool = True,
    progress: Optional[Progress] = None,
    batch_edit_packs: Optional[List[Optional[BatchEditJson]]] = None,
    auditor_props: Optional[AuditorProps] = None,
) -> List[UploadResult]:
    cache: Dict = {}
    _auditor = Auditor(
        collection=collection,
        props=auditor_props or DEFAULT_AUDITOR_PROPS,
        audit_log=None if no_commit else auditlog,
        # Done to allow checking skipping write permission check
        # during validations
        skip_create_permission_check=no_commit,
        agent=models.Agent.objects.get(id=uploading_agent_id),
    )
    total = len(rows) if isinstance(rows, Sized) else None
    cached_scope_table = None

    # I'd make this a generator (so "global" variable is internal, rather than a rogue callback setting a global variable)
    gen = Func.make_generator()

    with savepoint("main upload"):
        tic = time.perf_counter()
        results: List[UploadResult] = []
        for i, row in enumerate(rows):
            _cache = cache.copy() if cache is not None and allow_partial else cache
            da = disambiguations[i] if disambiguations else None
            batch_edit_pack = batch_edit_packs[i] if batch_edit_packs else None
            with savepoint("row upload") if allow_partial else no_savepoint():
                # the fact that upload plan is cachable, is invariant across rows.
                # so, we just apply scoping once. Honestly, see if it causes enough overhead to even warrant caching
                if cached_scope_table is None:
                    cannot_cache, scoped_table = Func.tap_call(
                        lambda: upload_plan.apply_scoping(collection, gen, row), gen
                    )
                    can_cache = not cannot_cache
                    if can_cache:
                        cached_scope_table = scoped_table
                else:
                    scoped_table = cached_scope_table

                bind_result = (
                    scoped_table.disambiguate(da)
                    .apply_batch_edit_pack(batch_edit_pack)
                    .bind(row, uploading_agent_id, _auditor, cache)
                )
                if isinstance(bind_result, ParseFailures):
                    result = UploadResult(bind_result, {}, {})
                else:
                    can_save = bind_result.can_save()
                    # We need to have additional context on whether we can save or not. This could, hackily, be taken from ds's isupdate field.
                    # But, that seeems very hacky. Instead, we can easily check if the base table can be saved. Legacy ones will simply return false,
                    # so we'll be able to proceed fine.
                    result = (
                        bind_result.save_row(force=True)
                        if can_save
                        else bind_result.process_row()
                    )

                results.append(result)
                if progress is not None:
                    progress(len(results), total)
                logger.info(
                    f"finished row {len(results)}, cache size: {cache and len(cache)}"
                )
                if result.contains_failure():
                    cache = _cache
                    raise Rollback("failed row")

        toc = time.perf_counter()
        logger.info(f"finished upload of {len(results)} rows in {toc-tic}s")

        if no_commit:
            raise Rollback("no_commit option")
        else:
            fixup_trees(scoped_table, results)

    return results


do_upload_csv = do_upload


def validate_row(
    collection,
    upload_plan: ScopedUploadable,
    uploading_agent_id: int,
    row: Row,
    da: Disambiguation,
) -> UploadResult:
    retries = 3
    while True:
        try:
            with savepoint("row validation"):
                bind_result = upload_plan.disambiguate(da).bind(
                    # TODO: Handle auditor props better
                    row,
                    uploading_agent_id,
                    Auditor(collection, props=DEFAULT_AUDITOR_PROPS, audit_log=None),
                )
                result = (
                    UploadResult(bind_result, {}, {})
                    if isinstance(bind_result, ParseFailures)
                    else bind_result.process_row()
                )
                raise Rollback("validating only")
            break

        except OperationalError as e:
            if (
                e.args[0] == 1213 and retries > 0
            ):  #: (1213, 'Deadlock found when trying to get lock; try restarting transaction')
                retries -= 1
            else:
                raise

    return result


def fixup_trees(upload_plan: ScopedUploadable, results: List[UploadResult]) -> None:
    treedefs = upload_plan.get_treedefs()

    to_fix = [
        tree
        for tree in (
            "taxon",
            "geography",
            "geologictimeperiod",
            "lithostrat",
            "storage",
        )
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
    return (
        (
            (
                isinstance(result.record_result, Uploaded)
                or isinstance(result.record_result, Updated)
                or isinstance(result.record_result, Deleted)
                or isinstance(result.record_result, MatchedAndChanged)
            )
            and result.record_result.info.tableName.lower() == tree
        )
        or any(changed_tree(tree, toOne) for toOne in result.toOne.values())
        or any(
            changed_tree(tree, r) for toMany in result.toMany.values() for r in toMany
        )
    )


def adjust_pack(
    pack: Optional[BatchEditJson],
    upload_result: UploadResult,
    commit_uploader: Callable[[RecordResult], None],
):
    if isinstance(upload_result.record_result, Uploaded):
        commit_uploader(upload_result.record_result)
    if pack is None:
        return None
    current_result = upload_result.record_result
    self: BatchEditSelf = pack["self"]
    self_pack = (
        None
        if isinstance(current_result, Deleted)
        else {
            "ordernumber": self["ordernumber"],
            "version": None,
            "id": self["id"],
        }
    )
    to_ones = Func.maybe(
        pack.get("to_one"),
        lambda to_one: {
            key: (
                adjust_pack(value, upload_result.toOne[key], commit_uploader)
                if key in upload_result.toOne
                else value
            )
            for key, value in to_one.items()
        },
    )
    to_many = Func.maybe(
        pack.get("to_many"),
        lambda to_many: {
            key: (
                [
                    adjust_pack(record, upload_result.toMany[key][_id], commit_uploader)
                    for _id, record in enumerate(records)
                ]
                if key in upload_result.toMany
                else records
            )
            for (key, records) in to_many.items()
        },
    )  # type: ignore
    return {"self": self_pack, "to_one": to_ones, "to_many": to_many}


def rollback_batch_edit(
    parent: Spdataset, collection, agent, progress: Optional[Progress] = None
) -> None:
    assert parent.isupdate, "What are you trying to do here?"

    backer: Spdataset = parent.backer

    assert backer is not None, "Backer isn't there, what did you do?"

    # Need to do a couple of things before we go do stuff.
    # 1. Remove all version info (duh)
    # 2. Check if corresponding was a deleted cell. If it was, replace the main with null id.

    ncols = len(parent.columns)
    current = [get_batch_edit_pack_from_row(ncols, row) for row in parent.data]

    assert len(backer.columns) == ncols  # C'mon, we handle so much. they deserve it.

    inserted_records = []

    assert parent.rowresults is not None
    row_results = json.loads(parent.rowresults)

    def look_up_in_backer(_id):
        row = parent.data[_id]
        pack = get_batch_edit_pack_from_row(ncols, row)
        # Could have added a new row. This handles future use cases.
        # we could literally crash here right now, bc this won't happen currently.
        if pack is None:
            return None
        result = row_results[_id]
        upload_result = UploadResult.from_json(result)
        # impossible to get stop iteration.
        is_match = lambda _backer_pack: (_backer_pack is not None) and (
            _backer_pack["self"]["id"] == pack["self"]["id"]
        )
        _filter = filter(
            lambda row: Func.maybe(get_batch_edit_pack_from_row(ncols, row), is_match),
            backer.data,
        )
        gen = next(_filter)
        return gen, adjust_pack(
            get_batch_edit_pack_from_row(ncols, row), upload_result, _commit_uploader
        )

    def _commit_uploader(result):
        inserted_records.append(result)

    rows_to_backup = []
    packs = []
    # Yes, we don't care about reverse here.
    for row in range(len(parent.data)):
        r, be = look_up_in_backer(row)
        rows_to_backup.append(dict(zip(parent.columns, r)))
        packs.append(be)

    # Don't use parent's plan...
    base_table, upload_plan, previous_prefs = get_raw_ds_upload_plan(backer)
    results = do_upload(
        collection,
        rows_to_backup,
        upload_plan,
        agent.id,
        None,
        False,
        False,
        progress,
        packs,
        auditor_props=AuditorProps(
            allow_delete_dependents=False, batch_edit_prefs=previous_prefs
        ),
    )

    success = not any(r.contains_failure() for r in results)

    if not success:
        raise RollbackFailure("Unable to roll back")

    unupload_dataset(parent, agent, progress)

    # parent.rowresults = json.dumps([r.to_json() for r in results])
    # parent.save(update_fields=['rowresults'])

    parent.rowresults = None
    parent.save(update_fields=["rowresults"])
