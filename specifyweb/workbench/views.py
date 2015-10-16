import re
import os
import json
import logging
import subprocess
from glob import glob
from uuid import uuid4

from django import http
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.db import connection, transaction
from django.conf import settings

from specifyweb.specify.api import toJson, get_object_or_404
from specifyweb.specify.views import login_maybe_required
from specifyweb.specify import models

from uploader_classpath import CLASSPATH

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
    wb = get_object_or_404(models.Workbench, id=wb_id)
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

    logger.debug("clearing row numbers")
    cursor.execute("update workbenchrow set rownumber = null where workbenchid = %s",
                   [wb_id])

    new_rows = [(i, wb_id) for i, row in enumerate(data) if row[0] is None]
    logger.debug("inserting %d new rows", len(new_rows))
    cursor.executemany("insert workbenchrow(rownumber, workbenchid) values (%s, %s)",
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
    (celldata, workbenchtemplatemappingitemid, workbenchrowid)
    values (%s, %s, %s)
    """, [
        (celldata, wbtmi, new_row_id[i] if row[0] is None else row[0])
        for i, row in enumerate(data)
        for wbtmi, celldata in zip(wbtmis, row[1:])
        if celldata is not None
    ])
    return load(wb_id)

@csrf_exempt
@login_maybe_required
@require_POST
def upload(request, wb_id):
    args = [
        "/usr/lib/jvm/java-8-oracle/bin/java", #settings.JAVA,
        "-Dfile.encoding=UTF-8",
        "-classpath",
        ":".join((os.path.join(settings.SPECIFY_THICK_CLIENT, jar) for jar in CLASSPATH)),
        "edu.ku.brc.specify.tasks.subpane.wb.wbuploader.UploadCmdLine",
        "-u", request.specify_user.name,
        "-U", settings.MASTER_NAME,
        "-P", settings.MASTER_PASSWORD,
        "-d", settings.DATABASE_NAME,
        "-b", wb_id,
        "-c", request.specify_collection.collectionname,
        "-w", settings.SPECIFY_THICK_CLIENT,
    ]

    if settings.DATABASE_HOST != '':
        args.extend(["-h", settings.DATABASE_HOST])

    output_file = "%s_%s_%s" % (settings.DATABASE_NAME, wb_id, uuid4())
    with open(os.path.join(settings.WB_UPLOAD_LOG_DIR, output_file), "w") as f:
        subprocess.Popen(args, stdout=f, bufsize=1024)

    return http.HttpResponse(output_file, content_type="text_plain")

TIMESTAMP_RE = '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z'
STARTING_RE = re.compile(r'^(%s): starting' % TIMESTAMP_RE)
ENDING_RE = re.compile(r'^(%s): \.{3}exiting (.*)$' % TIMESTAMP_RE, re.MULTILINE)
ROW_RE = re.compile(r'row (\d*)[^\d]')

def status_from_log(fname):
    with open(fname, 'r') as f:
        first_line = f.readline()
        try:
            f.seek(-512, os.SEEK_END)
        except IOError:
            # the file size is less than 512
            pass
        tail = f.read(512)

    start_match = STARTING_RE.match(first_line)
    ending_match = ENDING_RE.search(tail)
    row_match = ROW_RE.findall(tail)
    return {
        'log_name': os.path.basename(fname),
        'start_time': start_match and start_match.group(1),
        'last_row': row_match[-1] if len(row_match) > 0 else None,
        'end_time': ending_match and ending_match.group(1),
        'success': ending_match and ending_match.group(2) == 'successfully.',
    }

@login_maybe_required
@require_GET
def upload_status(request, upload_id):
    assert upload_id.startswith(settings.DATABASE_NAME)
    fname = os.path.join(settings.WB_UPLOAD_LOG_DIR, upload_id)
    status = status_from_log(fname)
    return http.HttpResponse(toJson(status), content_type='application/json')

@login_maybe_required
@require_GET
def upload_status_list(request, wb_id):
    log_fnames = glob(os.path.join(settings.WB_UPLOAD_LOG_DIR, '%s_%s_*' % (settings.DATABASE_NAME, wb_id,)))
    statuses = [status_from_log(log) for log in log_fnames]
    return http.HttpResponse(toJson(statuses), content_type='application/json')
