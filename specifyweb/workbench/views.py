import json
import logging

from django import http
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.db import connection, transaction

from specifyweb.specify.api import toJson
from specifyweb.specify.views import login_maybe_required
from specifyweb.specify import models

logger = logging.getLogger(__name__)

@csrf_exempt
@login_maybe_required
@transaction.commit_on_success
def rows(request, wb_id):
    if request.method == "GET":
        return load(wb_id)
    elif request.method == "PUT":
        data = json.load(request)
        return save(wb_id, data)

def load(wb_id):
    cursor = connection.cursor()
    cursor.execute("""
    select workbenchtemplateid
    from workbench
    where workbenchid = %s
    """, [wb_id])

    wbtm = cursor.fetchone()[0]

    sql = """
    select r.workbenchrowid, celldata
    from workbenchrow r
    join workbenchtemplatemappingitem mi on mi.workbenchtemplateid = %s
    left outer join workbenchdataitem i on i.workbenchrowid = r.workbenchrowid
      and mi.workbenchtemplatemappingitemid = i.workbenchtemplatemappingitemid
    where workbenchid = %s order by r.rownumber, vieworder
    """
    cursor = connection.cursor()
    cursor.execute(sql, [wbtm, wb_id])
    rows = list(group_rows(cursor.fetchall()))

    return http.HttpResponse(toJson(rows), content_type='application/json')

def group_rows(rows):
    i = iter(rows)
    row = next(i)
    current_row = list(row)
    while True:
        row = next(i)
        if row[0] == current_row[0]:
            current_row.append(row[1])
        else:
            yield current_row
            current_row = list(row)


def save(wb_id, data):
    wb_id = int(wb_id)
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

    logger.debug("inserting new wb values")
    cursor.executemany("""
    insert workbenchdataitem
    (celldata, workbenchtemplatemappingitemid, workbenchrowid)
    values (%s, %s, %s)
    """, [
        (celldata, wbtmi, row[0])
        for row in data
        for wbtmi, celldata in zip(wbtmis, row[1:])
        if row[0] is not None
    ])
    return http.HttpResponse('', status=204)
