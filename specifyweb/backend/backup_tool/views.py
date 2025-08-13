import os
import time
from django import http
from django.conf import settings
from django.views.decorators.http import require_POST
from specifyweb.middleware.general import require_GET
from specifyweb.backend.permissions.permissions import PermissionTarget, PermissionTargetAction, check_permission_targets
from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.backup_task import backup_database_task


class BackupPT(PermissionTarget):
    resource = "/export/backup"
    execute = PermissionTargetAction()


@login_maybe_required
@require_POST
def backup_start(request):
    check_permission_targets(None, request.specify_user.id, [BackupPT.execute])
    queue_name = getattr(settings, 'DATABASE_NAME', None)
    user_id = getattr(request, 'specify_user', None).id if getattr(request, 'specify_user', None) else None
    try:
        if queue_name:
            task = backup_database_task.apply_async(kwargs={'user_id': user_id}, queue=queue_name)
        else:
            task = backup_database_task.apply_async(kwargs={'user_id': user_id})
    except Exception:
        task = backup_database_task.apply_async(kwargs={'user_id': user_id})
    return http.JsonResponse({'taskid': task.id})


@login_maybe_required
@require_GET
def backup_status(request, taskid):
    check_permission_targets(None, request.specify_user.id, [BackupPT.execute])
    from celery.result import AsyncResult
    res = AsyncResult(taskid)
    state = res.state
    meta = res.info if isinstance(res.info, dict) else {}

    status_map = {
        'PENDING': 'RUNNING',
        'RECEIVED': 'RUNNING',
        'STARTED': 'RUNNING',
        'PROGRESS': 'RUNNING',
        'SUCCESS': 'SUCCEEDED',
        'FAILURE': 'FAILED',
        'RETRY': 'FAILED',
    }

    taskstatus = status_map.get(state, 'FAILED')

    taskprogress = {
        'current': int(meta.get('current') or 0),
        'total': max(int(meta.get('total') or 0), 1)
    }

    response = res.traceback if state == 'FAILURE' and getattr(res, 'traceback', None) else ''

    return http.JsonResponse({
        'taskstatus': taskstatus,
        'taskprogress': taskprogress,
        'taskid': taskid,
        'response': response,
    })


@login_maybe_required
@require_GET
def backup_download(request, taskid):
    check_permission_targets(None, request.specify_user.id, [BackupPT.execute])
    from celery.result import AsyncResult
    res = AsyncResult(taskid)
    if res.state != 'SUCCESS' or not isinstance(res.info, dict):
        return http.HttpResponseNotFound('Not ready')
    info = res.info
    path = info.get('path')
    filename = info.get('filename') or 'backup.sql.gz'
    if not path or not os.path.exists(path):
        return http.HttpResponseNotFound('File missing')
    with open(path, 'rb') as fh:
        resp = http.HttpResponse(fh.read(), content_type='application/gzip')
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return resp


@login_maybe_required
@require_GET
def backup_previous(request):
    check_permission_targets(None, request.specify_user.id, [BackupPT.execute])
    db = settings.DATABASES.get('default', {})
    db_name = db.get('NAME') or settings.DATABASE_NAME
    deposit_dir = getattr(settings, 'DEPOSITORY_DIR', '/tmp')
    filename = f"{db_name}.sql.gz"
    path = os.path.join(deposit_dir, filename)
    if os.path.exists(path):
        try:
            mtime = os.path.getmtime(path)
        except OSError:
            mtime = None
        last_modified = None if mtime is None else time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(mtime))
        return http.JsonResponse({
            'exists': True,
            'filename': filename,
            'size': os.path.getsize(path) if os.path.exists(path) else 0,
            'url': f"/static/depository/{filename}",
            'last_modified': last_modified,
        })
    return http.JsonResponse({'exists': False})
