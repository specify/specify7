"""
Task Manager — API endpoints for listing and managing active Celery tasks.

These endpoints power the Task Manager UI (User Tools → Administrative Tools
→ Task Manager) which displays all active Celery tasks across workers and
allows administrators to stop individual tasks.

## Endpoints
- `GET  /api/workbench/tasks/` — list all active tasks
- `POST /api/workbench/revoke/<taskid>/` — stop any Celery task
"""

from django import http
from django.db.utils import OperationalError
from django.views.decorators.http import require_POST

from specifyweb.middleware.general import require_GET
from specifyweb.celery_tasks import CELERY_TASK_STATE, app as celery_app
from specifyweb.specify.views import login_maybe_required, openapi
from . import models, tasks


# Map of fully-qualified Celery task names → human-readable labels for the UI.
# When a task is not found in the Spdataset table (i.e. it's not a WB task),
# we look up its Celery name here. If still not found, fall back to
# title-casing the last component of the dotted name.
CELERY_TASK_LABELS = {
    'specifyweb.backend.workbench.tasks.upload': 'WorkBench Upload',
    'specifyweb.backend.workbench.tasks.unupload': 'WorkBench Rollback',
    'specifyweb.backend.backup_tool.backup_task.backup_database_task': 'Database Backup',
    'specifyweb.backend.merge.record_merging.record_merge_task': 'Record Merge',
    'specifyweb.backend.trees.defaults.create_default_tree_task': 'Tree Creation',
    'specifyweb.backend.locality_update_tool.update_locality.parse_locality_task': 'Locality Parsing',
    'specifyweb.backend.locality_update_tool.update_locality.update_locality_task': 'Locality Update',
    'specifyweb.backend.setup_tool.schema_defaults.apply_schema_defaults_task': 'Schema Defaults',
    'specifyweb.backend.setup_tool.setup_tasks.fix_schema_config_task': 'Schema Config Fix',
    'specifyweb.backend.setup_tool.setup_tasks.setup_database_task': 'Database Setup',
}

# Re-use the OpenAPI components from views for the `@openapi` decorator
from .views import open_api_components


@openapi(
    schema={
        "post": {
            "responses": {
                "200": {
                    "description": "Returns 'ok' if task was revoked",
                    "content": {
                        "text/plain": {
                            "schema": {"type": "string", "enum": ["ok"]}
                        }
                    },
                },
            }
        },
    },
    components=open_api_components,
)
@login_maybe_required
@require_POST
def revoke_task(request, task_id: str) -> http.HttpResponse:
    """
    Revoke any Celery task by its ID and clear associated WB dataset status.

    ## Background
    The existing `/api/workbench/abort/<ds_id>/` endpoint works only for
    WorkBench datasets and requires the requesting user to be the dataset
    owner (via validate_dataset_request). This endpoint is more general:
    it accepts a Celery task ID directly and works for any task type.

    ## Strategy
    Two-phase revoke with different mechanisms for reliability:

    1. **WorkBench tasks** — Look up the Spdataset row by matching
       `uploaderstatus.taskid`. Use `task_fn.AsyncResult(task_id).revoke()`
       which targets the specific task queue (same approach as the original
       `abort` endpoint). Also clear `uploaderstatus` so the dataset is
       immediately reopenable without "dataset in use by uploader" errors.

    2. **Non-WorkBench tasks** (backups, merges, trees, etc.) — Fall back to
       `celery_app.control.revoke(task_id, terminate=True)`, a broadcast
       that reaches all workers.

    CSRF protection is handled automatically by the frontend's `ajax` utility
    which injects `X-CSRFToken` headers on all non-GET requests.
    Authentication is enforced by `@login_maybe_required`.
    """
    ds_revoked = False
    for ds in models.Spdataset.objects.filter(
        collection=request.specify_collection,
        uploaderstatus__isnull=False,
    ):
        if ds.uploaderstatus and ds.uploaderstatus.get('taskid') == task_id:
            operation = ds.uploaderstatus.get('operation', '')
            # Look up the registered Celery task for this operation
            task_fn = {
                'uploading': tasks.upload,
                'validating': tasks.upload,
                'unuploading': tasks.unupload,
            }.get(operation)
            if task_fn is not None:
                # Targeted revoke — reaches the specific worker/queue
                task_fn.AsyncResult(task_id).revoke(terminate=True)
            try:
                # Clear uploaderstatus so the dataset can be reopened immediately
                models.Spdataset.objects.filter(id=ds.id).update(
                    uploaderstatus=None
                )
            except OperationalError:
                pass
            ds_revoked = True
            break
    if not ds_revoked:
        # Broadcast revoke for non-WB tasks
        celery_app.control.revoke(task_id, terminate=True)
    return http.HttpResponse("ok", content_type="text/plain")


def _get_active_tasks_from_celery():
    """
    Collect active and reserved tasks from all Celery workers in order.

    Uses Celery's `inspect` API to query the worker cluster. Active tasks
    are currently being executed; reserved tasks are waiting in the queue.
    Tasks already present in `active_ids` are excluded from reserved to
    avoid duplicates.

    Returns:
        (active_tasks, reserved_tasks) — ordered lists preserving Celery's
        internal task order.
    """
    active_tasks = []
    reserved_tasks = []
    active_ids = set()
    inspect = celery_app.control.inspect()
    active = inspect.active() or {}
    reserved = inspect.reserved() or {}
    for worker, task_list in active.items():
        for task in task_list:
            task_id = task.get('id', '')
            if task_id and task_id not in active_ids:
                active_ids.add(task_id)
                active_tasks.append(task)
    for worker, task_list in reserved.items():
        for task in task_list:
            task_id = task.get('id', '')
            if task_id and task_id not in active_ids:
                active_ids.add(task_id)
                reserved_tasks.append(task)
    return active_tasks, reserved_tasks


@openapi(
    schema={
        "get": {
            "responses": {
                "200": {
                    "description": "Returns a list of all active tasks in the collection.",
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "number",
                                            "description": "DataSet ID",
                                        },
                                        "name": {
                                            "type": "string",
                                            "description": "DataSet name",
                                        },
                                        "operation": {
                                            "type": "string",
                                            "enum": ["validating", "uploading", "unuploading"],
                                        },
                                        "taskid": {
                                            "type": "string",
                                        },
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": ["PROGRESS", "PENDING", "FAILURE"],
                                        },
                                        "taskinfo": {
                                            "type": "object",
                                            "properties": {
                                                "current": {"type": "number"},
                                                "total": {"type": "number"},
                                            },
                                        },
                                        "owner": {
                                            "type": "string",
                                            "description": "Name of the user who owns the dataset",
                                        },
                                        "isupdate": {
                                            "type": "boolean",
                                        },
                                    },
                                    "required": [
                                        "id",
                                        "name",
                                        "operation",
                                        "taskid",
                                        "taskstatus",
                                        "taskinfo",
                                        "owner",
                                        "isupdate",
                                    ],
                                },
                            },
                        }
                    },
                }
            }
        },
    },
    components=open_api_components,
)
@login_maybe_required
@require_GET
def list_tasks(request) -> http.HttpResponse:
    """
    List all active Celery tasks enriched with WorkBench dataset metadata.

    ## How it works
    1. Query the Spdataset table for all datasets in the current collection
       that have an active `uploaderstatus` (WB tasks in progress).
    2. Use Celery's `inspect` API to discover all active/reserved tasks
       across all workers (this catches non-WB tasks like backups, merges,
       tree repairs, etc.).
    3. Cross-reference the two: WB tasks get their dataset name, operation
       type, and owner from the database; non-WB tasks get human-readable
       labels from `CELERY_TASK_LABELS`.
    4. Order: active tasks first, then queued (reserved) tasks — preserving
       Celery's internal execution order.

    The response includes a `queued` boolean flag so the frontend can render
    queued tasks with reduced opacity.
    """
    # Gather WB datasets with active uploaderstatus, indexed by taskid
    dss = models.Spdataset.objects.filter(
        collection=request.specify_collection,
        uploaderstatus__isnull=False,
    ).select_related('specifyuser').only(
        'id', 'name', 'uploaderstatus', 'isupdate', 'specifyuser__name'
    )
    wb_by_taskid = {}
    for ds in dss:
        uploaderstatus = ds.uploaderstatus
        if uploaderstatus and uploaderstatus.get('taskid'):
            wb_by_taskid[uploaderstatus['taskid']] = ds

    active_tasks, reserved_tasks = _get_active_tasks_from_celery()

    def build_result(task, queued):
        """
        Build a single task result dict from Celery task data.

        For WB tasks, enrich with dataset metadata. For non-WB tasks, use
        CELERY_TASK_LABELS for human-readable names and operations.
        """
        task_id = task.get('id', '')
        celery_name = task.get('name', '')
        ds = wb_by_taskid.get(task_id)
        if ds is not None:
            name = ds.name
            operation = ds.uploaderstatus.get('operation', 'unknown') if ds.uploaderstatus else 'unknown'
            owner = ds.specifyuser.name if ds.specifyuser else ''
            isupdate = ds.isupdate == True
            ds_id = ds.id
        else:
            name = CELERY_TASK_LABELS.get(celery_name, celery_name.rsplit('.', 1)[-1].replace('_', ' ').title())
            operation = CELERY_TASK_LABELS.get(celery_name, celery_name)
            owner = ''
            isupdate = False
            ds_id = 0
        result = celery_app.AsyncResult(task_id)
        taskinfo = result.info if isinstance(result.info, dict) else None
        task_status_map = {
            CELERY_TASK_STATE.RECEIVED: "PENDING",
            CELERY_TASK_STATE.STARTED: "PENDING",
            CELERY_TASK_STATE.SUCCESS: "PENDING",
            CELERY_TASK_STATE.RETRY: "FAILURE",
            CELERY_TASK_STATE.REVOKED: "FAILURE",
        }
        return {
            'id': ds_id,
            'name': name,
            'operation': operation,
            'taskid': task_id,
            'taskstatus': task_status_map.get(result.state, result.state),
            'taskinfo': taskinfo,
            'owner': owner,
            'isupdate': isupdate,
            'status': taskinfo.get('status') if isinstance(taskinfo, dict) else None,
            'queued': queued,
        }

    # Active tasks first, then queued — preserves Celery's internal order
    results = [build_result(t, False) for t in active_tasks]
    results += [build_result(t, True) for t in reserved_tasks]

    return http.JsonResponse(results, safe=False)