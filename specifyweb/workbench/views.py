import re
import json
import logging
from uuid import uuid4
from typing import Sequence, Tuple

from django import http
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.db import connection, transaction
from django.conf import settings

from specifyweb.specify.api import toJson, get_object_or_404, create_obj, obj_to_data
from specifyweb.specify.views import login_maybe_required, apply_access_control
from specifyweb.specify import models

Workbench = getattr(models, 'Workbench')
Workbenchrow = getattr(models, 'Workbenchrow')
Workbenchtemplatemappingitem = getattr(models, 'Workbenchtemplatemappingitem')

logger = logging.getLogger(__name__)

@login_maybe_required
@apply_access_control
@require_http_methods(["GET", "PUT"])
@transaction.atomic
def rows(request, wb_id):
    wb = get_object_or_404(models.Workbench, id=wb_id)
    if (wb.specifyuser != request.specify_user):
        return http.HttpResponseForbidden()
    if request.method == "PUT":
        data = json.load(request)
        save(wb_id, data)
    rows = load(wb_id)
    return http.HttpResponse(toJson(rows), content_type='application/json')

def load(wb_id: int) -> Sequence[Tuple]:
    wb = get_object_or_404(Workbench, id=wb_id)
    wbtmis = Workbenchtemplatemappingitem.objects.filter(
        workbenchtemplate=wb.workbenchtemplate).order_by('vieworder')

    if wbtmis.count() > 60:
        # mysql won't join more than 61 tables.
        # but the following is slower so only use in that case.
        return load_gt_61_cols(wb_id)

    select_fields = ["r.workbenchrowid"]
    for wbtmi in wbtmis:
        select_fields.append("ifnull(cell%d.celldata, '')" % wbtmi.vieworder)
    from_clause = ["workbenchrow r"]
    for wbtmi in wbtmis:
        from_clause.append("left join workbenchdataitem cell%(vieworder)d "
                           "on cell%(vieworder)d.workbenchrowid = r.workbenchrowid "
                           "and cell%(vieworder)d.workbenchtemplatemappingitemid = %(wbtmi_id)d"
                           % {'vieworder': wbtmi.vieworder, 'wbtmi_id': wbtmi.id})
    sql = '\n'.join([
        "select",
        ",\n".join(select_fields),
        "from",
        "\n".join(from_clause),
        "where workbenchid = %s",
        "order by r.rownumber",
    ])
    cursor = connection.cursor()
    cursor.execute(sql, [wb_id])
    return list(cursor.fetchall())

def load_gt_61_cols(wb_id):
    logger.info("load_gt_61_cols")
    cursor = connection.cursor()
    cursor.execute("""
    select workbenchtemplateid
    from workbench
    where workbenchid = %s
    """, [wb_id])

    wbtm = cursor.fetchone()[0]

    sql = """
    select r.workbenchrowid, ifnull(celldata, '')
    from workbenchrow r
    join workbenchtemplatemappingitem mi on mi.workbenchtemplateid = %s
    left outer join workbenchdataitem i on i.workbenchrowid = r.workbenchrowid
      and mi.workbenchtemplatemappingitemid = i.workbenchtemplatemappingitemid
    where workbenchid = %s order by r.rownumber, vieworder
    """
    cursor = connection.cursor()
    cursor.execute(sql, [wbtm, wb_id])
    return list(group_rows(cursor.fetchall()))

def group_rows(rows):
    i = iter(rows)
    row = next(i)
    current_row = list(row)
    while True:
        row = next(i, None)
        if row is None:
            yield current_row
            break

        if row[0] == current_row[0]:
            current_row.append(row[1])
        else:
            yield current_row
            current_row = list(row)

def save(wb_id, data):
    logger.info(f"saving dataset {wb_id}")
    wb_id = int(wb_id)

    wb = Workbench.objects.select_for_update().get(id=wb_id)
    assert wb.lockedbyusername is None, "dataset is locked"

    cursor = connection.cursor()

    logger.debug("truncating wb %d", wb_id)
    cursor.execute("""
    delete wbdi from workbenchdataitem wbdi, workbenchrow wbr
    where wbr.workbenchrowid = wbdi.workbenchrowid
    and wbr.workbenchid = %s
    """, [wb_id])

    logger.debug("getting wb mapping items")
    cursor.execute("""
    select workbenchtemplatemappingitemid
    from workbenchtemplatemappingitem i
    join workbench wb on
        wb.workbenchtemplateid = i.workbenchtemplateid
      and wb.workbenchid = %s
    order by vieworder
    """, [wb_id])

    wbtmis = [r[0] for r in cursor.fetchall()]
    assert len(wbtmis) + 1 == len(data[0]), (wbtmis, data[0])

    logger.debug("clearing row numbers")
    cursor.execute("update workbenchrow set rownumber = null where workbenchid = %s",
                   [wb_id])

    new_rows = [(i, wb_id) for i, row in enumerate(data) if row[0] is None]

    logger.debug("inserting %d new rows", len(new_rows))
    cursor.executemany("insert workbenchrow(rownumber, workbenchid, uploadstatus) values (%s, %s, 0)",
                       new_rows)

    logger.debug("get new row ids")
    cursor.execute("""
    select rownumber, workbenchrowid from workbenchrow
    where workbenchid = %s and rownumber is not null
    """, [wb_id])
    new_row_id = dict(cursor.fetchall())

    logger.debug("updating row numbers")
    cursor.executemany("""
    update workbenchrow set rownumber = %s
    where workbenchrowid = %s
    """, [
        (i, row[0]) for i, row in enumerate(data)
        if row[0] is not None
    ])

    logger.debug("removing deleted rows")
    cursor.execute("""
    delete from workbenchrow
    where workbenchid = %s
    and rownumber is null
    """, [wb_id])
    logger.debug("deleted %d rows", cursor.rowcount)

    logger.debug("inserting new wb values")
    cursor.executemany("""
    insert workbenchdataitem
    (validationstatus, celldata, workbenchtemplatemappingitemid, workbenchrowid)
    values (0, %s, %s, %s)
    """, [
        (celldata, wbtmi, new_row_id[i] if row[0] is None else row[0])
        for i, row in enumerate(data)
        for wbtmi, celldata in zip(wbtmis, row[1:])
        if celldata is not None
    ])

    logger.debug("clearing validation results")
    cursor.execute("""
    update workbenchrow set biogeomancerresults = null
    where workbenchid = %s
    """, [wb_id])

@login_maybe_required
@apply_access_control
@require_POST
def upload(request, wb_id, no_commit: bool) -> http.HttpResponse:
    from .tasks import upload
    wb = get_object_or_404(Workbench, id=wb_id)
    if (wb.specifyuser != request.specify_user):
        return http.HttpResponseForbidden()

    with transaction.atomic():
        wb = Workbench.objects.select_for_update().get(id=wb_id)
        assert wb.lockedbyusername is None

        taskid = str(uuid4())
        async_result = upload.apply_async([request.specify_collection.id, wb.id, no_commit], task_id=taskid)
        wb.lockedbyusername = taskid + ";" + ("validating" if no_commit else "uploading")
        wb.save()

    return http.HttpResponse(json.dumps(async_result.id, indent=2), content_type='application/json')

# @login_maybe_required
@require_GET
def upload_status(request, wb_id: int) -> http.HttpResponse:
    from . import tasks
    wb = get_object_or_404(Workbench, id=wb_id)
    # if (wb.specifyuser != request.specify_user):
    #     return http.HttpResponseForbidden()

    if wb.lockedbyusername is None:
        return http.HttpResponse(json.dumps(None), content_type='application/json')

    task_id, op = wb.lockedbyusername.split(';')
    result = tasks.upload.AsyncResult(task_id)
    if result.state == "FAILURE":
            return http.HttpResponse(json.dumps([op, result.state, str(result.info)]), content_type='application/json')

    return http.HttpResponse(json.dumps([op, result.state, result.info]), content_type='application/json')

@login_maybe_required
@apply_access_control
@require_GET
def upload_results(request, wb_id: int) -> http.HttpResponse:
    from .upload.upload_result import json_to_UploadResult

    wb = get_object_or_404(Workbench, id=wb_id)
    if (wb.specifyuser != request.specify_user):
        return http.HttpResponseForbidden()

    results = [
        json_to_UploadResult(json.loads(result)).validation_info().to_json() if result else None
        for result in wb.workbenchrows.order_by('rownumber').values_list('biogeomancerresults', flat=True)
    ]
    return http.HttpResponse(json.dumps(results), content_type='application/json')

@login_maybe_required
@apply_access_control
@require_POST
def upload_abort(request, wb_id) -> http.HttpResponse:
    from . import tasks
    wb = get_object_or_404(Workbench, id=wb_id)
    if (wb.specifyuser != request.specify_user):
        return http.HttpResponseForbidden()

    if wb.lockedbyusername is None:
        return http.HttpResponse('not running', content_type='text/plain')

    task_id, op = wb.lockedbyusername.split(';')
    tasks.upload.AsyncResult(task_id).revoke(terminate=True)

    Workbench.objects.filter(id=wb_id).update(lockedbyusername=None)
    return http.HttpResponse('ok', content_type='text/plain')
