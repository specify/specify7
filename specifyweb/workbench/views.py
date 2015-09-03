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
    wb = models.Workbench.objects.get(id=wb_id)
    wbtmis = models.Workbenchtemplatemappingitem.objects.filter(
        workbenchtemplate=wb.workbenchtemplate).order_by('vieworder')

    select_fields = ["r.workbenchrowid"]
    for wbtmi in wbtmis:
        select_fields.append("cell%d.celldata" % wbtmi.vieworder)
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
    rows = cursor.fetchall()
    return http.HttpResponse(toJson(rows), content_type='application/json')

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
