import re
import os
import errno
import json
import logging
import subprocess
from glob import glob
from uuid import uuid4

from django import http
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import connection, transaction
from django.conf import settings

from specifyweb.specify.api import toJson, get_object_or_404, create_obj, obj_to_data
from specifyweb.specify.views import login_maybe_required, apply_access_control
from specifyweb.specify import models

from uploader_classpath import CLASSPATH

logger = logging.getLogger(__name__)

@csrf_exempt
@login_maybe_required
@apply_access_control
@require_http_methods(["GET", "PUT"])
@transaction.commit_on_success
def rows(request, wb_id):
    wb = get_object_or_404(models.Workbench, id=wb_id)
    if (wb.specifyuser != request.specify_user):
        return http.HttpResponseForbidden()
    if request.method == "GET":
        return load(wb_id)
    elif request.method == "PUT":
        data = json.load(request)
        return save(wb_id, data)

def load(wb_id):
    wb = get_object_or_404(models.Workbench, id=wb_id)
    wbtmis = models.Workbenchtemplatemappingitem.objects.filter(
        workbenchtemplate=wb.workbenchtemplate).order_by('vieworder')

    if wbtmis.count() > 60:
        # mysql won't join more than 61 tables.
        # but the following is slower so only use in that case.
        return load_gt_61_cols(wb_id)

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

def load_gt_61_cols(wb_id):
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
    return load(wb_id)

def shellquote(s):
    # this can be replaced with shlex.quote in Python 3.3
    return "'" + s.replace("'", "'\\''") + "'"

@csrf_exempt
@login_maybe_required
@apply_access_control
@require_POST
def upload(request, wb_id, no_commit):
    wb = get_object_or_404(models.Workbench, id=wb_id)
    if (wb.specifyuser != request.specify_user):
        return http.HttpResponseForbidden()
    args = [
        settings.JAVA_PATH,
        "-Dfile.encoding=UTF-8",
        "-classpath", shellquote(
            ":".join((os.path.join(settings.SPECIFY_THICK_CLIENT, jar) for jar in CLASSPATH))
        ),
        "edu.ku.brc.specify.tasks.subpane.wb.wbuploader.UploadCmdLine",
        "-u", shellquote(request.specify_user.name),
        "-U", shellquote(settings.MASTER_NAME),
        "-P", shellquote(settings.MASTER_PASSWORD),
        "-d", shellquote(settings.DATABASE_NAME),
        "-b", wb_id,
        "-c", shellquote(request.specify_collection.collectionname),
        "-w", shellquote(settings.SPECIFY_THICK_CLIENT),
        "-x", "true" if no_commit else "false",
    ]

    if settings.DATABASE_HOST != '':
        args.extend(["-h", shellquote(settings.DATABASE_HOST)])

    output_file = "%s_%s_%s" % (settings.DATABASE_NAME, wb_id, uuid4())
    with open(os.path.join(settings.WB_UPLOAD_LOG_DIR, output_file), "w") as f:
        # we use the shell to start the uploader process to achieve a double
        # fork so that we don't have to wait() on the child process
        cmdline = ' '.join(args) + ' 2> >(egrep "(ERROR)|(UploaderException)|(UploaderMatchSkipException)" >&1) &'
        logger.debug('starting upload w/ cmdline: %s', cmdline)
        subprocess.call(['/bin/bash', '-c', cmdline], stdout=f)

    log_fnames = glob(os.path.join(settings.WB_UPLOAD_LOG_DIR, '%s_%s_*' % (settings.DATABASE_NAME, wb_id,)))
    for fname in log_fnames:
        if os.path.join(settings.WB_UPLOAD_LOG_DIR, output_file) != fname:
            try:
                os.remove(fname)
            except:
                pass
    return http.HttpResponse(output_file, content_type="text_plain")


TIMESTAMP_RE = '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z'
STARTING_RE = re.compile(r'^(%s): starting' % TIMESTAMP_RE, re.MULTILINE)
ENDING_RE = re.compile(r'^(%s): \.{3}exiting (.*)$' % TIMESTAMP_RE, re.MULTILINE)
ROW_RE = re.compile(r'uploading row (\d*)[^\d]')
PID_RE = re.compile(r'pid = (\d*)')
NO_COMMIT_RE = re.compile(r'Validating only. Will not commit.')
SKIPPED_RE = re.compile('^edu.ku.brc.specify.tasks.subpane.wb.wbuploader.UploaderMatchSkipException')

def status_from_log(fname):
    pid_match    = None
    start_match  = None
    ending_match = None
    no_commit = False
    last_row = None
    skipped_count = 0

    with open(fname, 'r') as f:
        for line in f:
            if not no_commit and NO_COMMIT_RE.search(line):
                no_commit = True
            if pid_match is None:
                pid_match = PID_RE.match(line)
            if start_match is None:
                start_match = STARTING_RE.match(line)
            if ending_match is None:
                ending_match = ENDING_RE.match(line)

            row_match = ROW_RE.match(line)
            if row_match: last_row = int(row_match.group(1))

            if SKIPPED_RE.match(line): skipped_count += 1

    return {
        'log_name': os.path.basename(fname),
        'pid': pid_match and pid_match.group(1),
        'start_time': start_match and start_match.group(1),
        'last_row': last_row,
        'end_time': ending_match and ending_match.group(1),
        'success': ending_match and ending_match.group(2) == 'successfully.',
        'is_running': pid_match and is_uploader_running(fname, pid_match.group(1)),
        'no_commit': no_commit,
        'skipped_rows': skipped_count
    }

def is_uploader_running(log_fname, uploader_pid):
    try:
        return log_fname == os.readlink(os.path.join('/proc', uploader_pid, 'fd/1'))
    except OSError as e:
        if e.errno == errno.ENOENT: return False
        raise e

@login_maybe_required
@require_GET
def upload_log(request, upload_id):
    assert upload_id.startswith(settings.DATABASE_NAME)
    fname = os.path.join(settings.WB_UPLOAD_LOG_DIR, upload_id)
    try:
        return http.HttpResponse(open(fname, "r"), content_type='text/plain')
    except IOError as e:
        if e.errno == errno.ENOENT:
            raise http.Http404()
        else:
            raise

@login_maybe_required
@require_GET
def upload_status(request, wb_id):
    log_fnames = glob(os.path.join(settings.WB_UPLOAD_LOG_DIR, '%s_%s_*' % (settings.DATABASE_NAME, wb_id,)))
    status = status_from_log(log_fnames[0]) if len(log_fnames) > 0 else None
    return http.HttpResponse(toJson(status), content_type='application/json')

