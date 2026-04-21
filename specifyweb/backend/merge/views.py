
import json
from functools import wraps

from uuid import uuid4

from django import http
from specifyweb.backend.notifications.models import Message, Spmerging
from django.views.decorators.http import require_POST

from specifyweb.middleware.general import require_GET
from specifyweb.backend.permissions.permissions import PermissionTarget, \
    PermissionTargetAction, check_permission_targets, table_permissions_checker
from specifyweb.celery_tasks import app
from specifyweb.backend.merge.record_merging import record_merge_fx, record_merge_task, resolve_record_merge_response
from specifyweb.specify.views import login_maybe_required, openapi
from specifyweb.specify import models as spmodels

class ReplaceRecordPT(PermissionTarget):
    resource = "/record/merge"
    update = PermissionTargetAction()
    delete = PermissionTargetAction()


@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "Replace a list of old records with a new record.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "description": "The request body.",
                        "properties": {
                            "model_name": {
                                "type": "string",
                                "description": "The name of the table that is to be merged."
                            },
                            "new_model_id": {
                                "type": "integer",
                                "description": "The new ID value of the model that is replacing the old one."
                            },
                            "old_record_ids": {
                                "type": "array",
                                "items": {
                                    "type": "integer"
                                },
                                "description": "The old record IDs."
                            },
                            "new_record_data": {
                                "type": "object",
                                "description": "The new record data."
                            },
                            "background": {
                                "type": "boolean",
                                "description": "Determine if the merging should be done as a background task.  Default is True."
                            }
                        },
                        'required': ['model_name', 'new_model_id', 'collection_id', 'old_record_ids', 'new_record_data'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success", },
            "404": {"description": "The ID specified does not exist."},
            "405": {"description": "A database rule was broken."}
        }
    },
})
@login_maybe_required
@require_POST
def record_merge(
    request: http.HttpRequest,
    model_name: str,
    # This is actually of type str.
    # TODO: Change below to str.
    new_model_id: int
) -> http.HttpResponse | http.JsonResponse:
    """Replaces all the foreign keys referencing the old record IDs
    with the new record ID, and deletes the old records.
    """
    record_version = getattr(spmodels, model_name.title()).objects.get(
        id=new_model_id).version
    get_version = request.GET.get('version', record_version)
    version = get_version if isinstance(get_version, int) else 0

    table_permissions_checker(
        request.specify_collection, request.specify_user_agent, "read")
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [
                             ReplaceRecordPT.update, ReplaceRecordPT.delete])

    data = json.loads(request.body)
    old_model_ids = data['old_record_ids']
    new_record_data = data['new_record_data'] if 'new_record_data' in data else None

    if old_model_ids is None or len(old_model_ids) < 1:
        return http.HttpResponseBadRequest('There were no old record IDs given to be replaced by the new ID.')

    background = True
    if 'background' in data:
        background = data['background']

    if background:
        # Check if another merge is still in progress
        cur_merges = Spmerging.objects.filter(status='MERGING')
        for cur_merge in cur_merges:
            cur_task_id = cur_merge.taskid
            cur_result = record_merge_task.AsyncResult(cur_task_id)
            if cur_result is not None:
                cur_merge.status = 'FAILED'
                cur_merge.save()
            elif cur_result.state == 'MERGING':
                return http.HttpResponseNotAllowed(
                    'Another merge process is still running on the system, please try again later.')
            else:
                cur_merge.status = cur_result.state
                cur_merge.save()

        # Create task id and a Spmerging record
        task_id = str(uuid4())
        merge = Spmerging.objects.create(
            name="Merge_" + model_name + "_" + new_model_id,
            taskid=task_id,
            status="MERGING",
            table=model_name.title(),
            newrecordid=new_model_id,
            newrecordata=json.dumps(new_record_data),
            oldrecordids=json.dumps(old_model_ids),
            collection=request.specify_collection,
            specifyuser=request.specify_user,
            createdbyagent=request.specify_user_agent,
            modifiedbyagent=request.specify_user_agent,
        )
        merge.save()

        # Create a notification record of the merging process pending
        Message.objects.create(user=request.specify_user, content=json.dumps({
            'type': 'record-merge-starting',
            'name': "Merge_" + model_name + "_" + new_model_id,
            'task_id': task_id,
            'table': model_name.title(),
            'new_record_id': new_model_id,
            'old_record_ids': old_model_ids,
            'new_record_info': new_record_data,
            'collection_id': request.specify_collection.id
        }))

        new_record_info = {
            'agent_id': int(new_model_id),
            'collection_id': request.specify_collection.id,
            'specify_user_id': request.specify_user.id,
            'specify_user_agent_id': request.specify_user_agent.id,
            'version': version,
            'new_record_data': new_record_data
        }

        try:
            json.dumps(new_record_info)
        except TypeError as e:
            return http.HttpResponseNotAllowed('Error while serializing new_record_info')

        # Run the merging process in the background with celery
        async_result = record_merge_task.apply_async(
            [model_name, old_model_ids, int(
                new_model_id), merge.id, new_record_info],
            task_id=task_id)

        return http.JsonResponse(async_result.id, safe=False)
    else:
        new_record_info = {
            'agent_id': int(new_model_id),
            'collection': request.specify_collection,
            'specify_user': request.specify_user_agent,
            'version': version,
            'new_record_data': new_record_data
        }

        response = resolve_record_merge_response(
            lambda: record_merge_fx(model_name, old_model_ids, int(
                new_model_id), None, new_record_info),
            # If not doing merge in background, raise all unexpected errors
            silent=False
        )
    return response


@openapi(schema={
    'get': {
        "responses": {
            "200": {
                "description": "Data fetched successfully",
                "content": {
                    "text/plain": {
                        "schema": {
                            "oneOf": [
                                {
                                    "type": "string",
                                    "example": "null",
                                    "description": "Nothing to report"
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "taskprogress": {
                                            "type": "object",
                                            "properties": {
                                                "current": {
                                                    "type": "number",
                                                    "example": 11,
                                                },
                                                "total": {
                                                    "type": "number",
                                                    "example": 22,
                                                }
                                            }
                                        },
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": [
                                                "MERGING",
                                                "SUCCEEDED",
                                                "FAILED",
                                                "ABORTED"
                                            ]
                                        },
                                        "taskid": {
                                            "type": "string",
                                            "maxLength": 36,
                                            "example": "7d34dbb2-6e57-4c4b-9546-1fe7bec1acca"
                                        },
                                    },
                                    "description": "Status of the record merge process",
                                }
                            ]
                        }
                    }
                }
            },
            '404': {
                'description': 'The spmerging object with task id was not found',
            },
        }
    },
})
@require_GET
def merging_status(request, merge_id: int) -> http.HttpResponse:
    """Returns the merging status for the record merging celery tasks"""

    # Try to get the merge object directly
    try:
        merge = Spmerging.objects.get(taskid=merge_id)
    except Spmerging.DoesNotExist:
        return http.HttpResponseNotFound(f'The merge task id is not found: {merge_id}')

    result = record_merge_task.AsyncResult(merge.taskid)

    status = {
        'taskstatus': merge.status,
        'response': merge.response,
        'taskprogress': result.info if isinstance(result.info, dict) else repr(result.info),
        'taskid': merge.taskid
    }

    return http.JsonResponse(status)


@openapi(schema={
    'post': {
        'responses': {
            '200': {
                'description': 'The task has been successfully aborted or it is not running and cannot be aborted',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'message': {
                                    'type': 'string',
                                    'description': 'Response message about the status of the task'
                                },
                            },
                        },
                    },
                },
            },
            '404': {
                'description': 'The merge task id is not found',
            },
            '400': {
                'description': 'Invalid input, object invalid',
            },
        },
    },
})
@require_POST
def abort_merge_task(
    request,
    # The below type is of str (and not an int)
    merge_id: int
    ) -> http.HttpResponse:
    "Aborts the merge task currently running and matching the given merge/task ID"

    # BUG: This should not be a .get. It should instead be something like .filter(...).first()
    # Currently, it is a 500 error (because .get() fails when no Spmerging found)
    merge = Spmerging.objects.get(taskid=merge_id)
    if merge is None:
        return http.HttpResponseNotFound(f'The merge task id is not found: {merge_id}')

    # This condition is not possible.
    if merge.taskid is None:
        return http.JsonResponse(None, safe=False)

    task = record_merge_task.AsyncResult(merge.taskid)

    if task.state == 'PENDING' or task.state == 'MERGING':
        # Revoking and terminating the task
        app.control.revoke(merge.taskid, terminate=True)

        # Updating the merging status
        merge.status = 'ABORTED'
        merge.save()

        # Send notification the the megre task has been aborted
        Message.objects.create(user=request.specify_user, content=json.dumps({
            'type': 'record-merge-aborted',
            'name': "Merge_" + merge.table.title() + "_" + str(merge.newrecordid),
            'task_id': merge_id,
            'table': merge.table,
            'new_record_id': merge.newrecordid,
            'collection_id': request.specify_collection.id,
        }))

        return http.HttpResponse(f'Task {merge.taskid} has been aborted.')

    else:
        return http.HttpResponse(f'Task {merge.taskid} is not running and cannot be aborted.')
