import json

from django import http
from django.views.decorators.http import require_POST

from specifyweb.backend.bulk_copy import bulk_copy
from specifyweb.backend.bulk_copy.bulk_delete_task import bulk_delete_task
from specifyweb.middleware.general import require_GET
from specifyweb.specify.views import api_view, login_maybe_required

collection_bulk_copy = api_view(bulk_copy.collection_dispatch_bulk_copy)
collection_bulk = api_view(bulk_copy.collection_dispatch_bulk)


@login_maybe_required
@require_POST
def bulk_delete_background(request, model: str) -> http.JsonResponse:
    """Dispatch a Celery task to bulk-delete records in the background.

    Accepts a JSON body with ``ids`` (list of int) and an optional
    ``query`` (dict representation of a :class:`SpQuery`).  Returns the
    Celery task ID so the frontend can poll for progress.
    """
    data = json.loads(request.body)
    ids = data.get('ids', [])
    spquery = data.get('query')

    async_result = bulk_delete_task.apply_async([
        request.specify_collection.id,
        request.specify_user.id,
        request.specify_user_agent.id,
        model,
        ids,
        spquery,
    ])

    return http.JsonResponse({'task_id': async_result.id})


@login_maybe_required
@require_GET
def bulk_delete_status(request, task_id: str) -> http.JsonResponse:
    """Return the Celery task state for a background bulk-delete."""
    result = bulk_delete_task.AsyncResult(task_id)
    status = {
        'taskstatus': result.state,
        'taskprogress': (
            result.info if isinstance(result.info, dict) else repr(result.info)
        ),
        'taskid': task_id,
    }
    return http.JsonResponse(status)