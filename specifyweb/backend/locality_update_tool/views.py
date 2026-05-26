
import json
from functools import wraps
from typing import Any
from uuid import uuid4

from django import http
from specifyweb.backend.merge.record_merging import record_merge_task
from specifyweb.backend.notifications.models import Message, LocalityUpdate
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_POST

from specifyweb.middleware.general import require_GET
from specifyweb.celery_tasks import app, CELERY_TASK_STATE
from specifyweb.backend.locality_update_tool.update_locality import localityupdate_parse_success, localityupdate_parse_error, parse_locality_set as _parse_locality_set, upload_locality_set as _upload_locality_set, create_localityupdate_recordset, update_locality_task, parse_locality_task, LocalityUpdateStatus
from specifyweb.specify.views import login_maybe_required, openapi

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "columnHeaders": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },
                            "data": {
                                "type": "array",
                                "items": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            },
                            "createRecordSet": {
                                "type": "boolean",
                                "description": "When True, creates a recordset in the logged-in collection for the logged-in user with the matched/updated localities if the upload succeeds",
                                "default": True
                            },
                            "runInBackground": {
                                "type": "boolean",
                                "description": "Whether the task should be ran in the background. Defaults to True",
                                "default": False
                            }
                        },
                        "required": ["columnHeaders", "data"],
                        "additionalProperties": False
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Task finished synchronously",
                "content": {
                    "application/json": {
                        "schema": {
                            "oneOf": [
                                {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "string",
                                            "enum": ["ParseError"]
                                        },
                                        "errors": localityupdate_parse_error
                                    },
                                    "required": ["type", "errors"],
                                    "additionalProperties": False
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "string",
                                            "enum": ["Uploaded"]
                                        },
                                        "recordsetid": {
                                            "oneOf": [
                                                {
                                                    "type": "string"
                                                },
                                                {
                                                    "type": "null"
                                                }
                                            ]
                                        },
                                        "localities": {
                                            "type": "array",
                                            "description": "An array of matched/updated Locality IDs",
                                            "items": {
                                                "type": "number"
                                            }
                                        },
                                        "geocoorddetails": {
                                            "type": "array",
                                            "description": "An array of created GeoCoordDetail IDs",
                                            "items": {
                                                "type": "number"
                                            }
                                        }
                                    },
                                    "required": ["type", "recordsetid", "localities", "geocoorddetails"],
                                    "additionalProperties": False
                                }
                            ]
                        }
                    }
                }
            },
            "201": {
                "description": "Task started by the worker. Returns the newly created ID of the task",
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "string",
                            "maxLength": 36,
                            "example": "7d34dbb2-6e57-4c4b-9546-1fe7bec1acca",
                        }
                    }
                }
            },
            "403": {
                "description": "Insufficient rights to upload the Locality Data Set. Loggin in User must be an admin"
            }
        }
    },
})
@login_maybe_required
@require_POST
def upload_locality_set(request: http.HttpRequest):

    if not request.specify_user.is_admin():
        return http.HttpResponseForbidden('Specifyuser must be an instituion admin')

    request_data = json.loads(request.body)

    column_headers = request_data["columnHeaders"]
    data = request_data["data"]
    create_recordset = request_data.get("createRecordSet", True)
    run_in_background = request_data.get("runInBackground", False)

    resolved_upload_function = start_locality_set_background if run_in_background else upload_locality_set_foreground

    result = resolved_upload_function(request.specify_collection, request.specify_user,
                                      request.specify_user_agent, column_headers, data, create_recordset)

    return http.JsonResponse(result, status=201 if run_in_background else 200, safe=False)


def start_locality_set_background(collection, specify_user, agent, column_headers: list[str], data: list[list[str]], create_recordset: bool = False, parse_only: bool = False) -> str:
    task_id = str(uuid4())
    args = [collection.id, column_headers, data]
    if not parse_only:
        args.append(create_recordset)
    task_function = parse_locality_task.apply_async if parse_only else update_locality_task.apply_async

    task = task_function(args, task_id=task_id)

    lu = LocalityUpdate.objects.create(
        taskid=task.id,
        status=LocalityUpdateStatus.PENDING,
        collection=collection,
        specifyuser=specify_user,
        createdbyagent=agent,
        modifiedbyagent=agent,
    )

    Message.objects.create(user=specify_user, content=json.dumps({
        'type': 'localityupdate-starting',
        'taskid': task.id
    }))

    return task.id


def upload_locality_set_foreground(collection, specify_user, agent, column_headers: list[str], data: list[list[str]], create_recordset: bool):
    result = _upload_locality_set(collection, column_headers, data)

    if result["type"] == 'ParseError':
        return result

    localities = [row["locality"] for row in result["results"]]

    recordset = create_localityupdate_recordset(
        collection, specify_user, localities) if create_recordset else None

    result["recordsetid"] = None if recordset is None else recordset.pk

    return result


@openapi(schema={
    'get': {
        "responses": {
            "200": {
                "description": "Data fetched successfully",
                "content": {
                    "application/json": {
                        "schema": {
                            "oneOf": [
                                {
                                    "type": "object",
                                    "properties": {
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": [LocalityUpdateStatus.PENDING, LocalityUpdateStatus.ABORTED]
                                        },
                                        "taskinfo": {
                                            "type": "string",
                                        },
                                    },
                                    "required": ["taskstatus", "taskinfo"],
                                    "additionalProperties": False
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": [LocalityUpdateStatus.PROGRESS, LocalityUpdateStatus.PARSING]
                                        },
                                        "taskinfo": {
                                            "type": "object",
                                            "properties": {
                                                "current": {
                                                    "type": "number",
                                                    "example": 4,
                                                },
                                                "total": {
                                                    "type": "number",
                                                    "example": 20,
                                                }
                                            }
                                        },
                                    },
                                    "required": ["taskstatus", "taskinfo"],
                                    "additionalProperties": False
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": [LocalityUpdateStatus.PARSED]
                                        },
                                        "taskinfo": {
                                            "type": "object",
                                            "properties": {
                                                "rows": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "locality": {
                                                                "type": "object"
                                                            },
                                                            "geocoorddetail": {
                                                                "oneOf": [
                                                                    {
                                                                        "type": "null"
                                                                    },
                                                                    {
                                                                        "type": "object"
                                                                    }
                                                                ]
                                                            },
                                                            "locality_id": {
                                                                "description": "The ID of the matched Locality",
                                                                "type": "number"
                                                            },
                                                            "row_number": {
                                                                "type": "number"
                                                            }
                                                        },
                                                        "required": ["locality", "geocoorddetail"]
                                                    }
                                                }
                                            }
                                        },
                                    },
                                    "required": ["taskstatus", "taskinfo"],
                                    "additionalProperties": False
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": [LocalityUpdateStatus.SUCCEEDED]
                                        },
                                        "taskinfo": {
                                            "type": "object",
                                            "properties": {
                                                "recordsetid": {
                                                    "oneOf": [
                                                        {
                                                            "type": "number"
                                                        },
                                                        {
                                                            "type": "null"
                                                        }
                                                    ]
                                                },
                                                "localities": {
                                                    "type": "array",
                                                    "description": "An array of matched/updated Locality IDs",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "geocoorddetails": {
                                                    "type": "array",
                                                    "description": "An array of created GeoCoordDetail IDs",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                }
                                            },
                                            "required": ["recordsetid", "localities", "geocoorddetails"],
                                            "additionalProperties": False
                                        }
                                    },
                                    "required": ["taskstatus", "taskinfo"],
                                    "additionalProperties": False
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": [LocalityUpdateStatus.PARSE_FAILED]
                                        },
                                        "taskinfo": {
                                            "type": "object",
                                            "properties": {
                                                "errors": localityupdate_parse_error
                                            }
                                        }
                                    },
                                    "required": ["taskstatus", "taskinfo"],
                                    "additionalProperties": False
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "taskstatus": {
                                            "type": "string",
                                            "enum": [LocalityUpdateStatus.FAILED]
                                        },
                                        "taskinfo": {
                                            "type": "object",
                                            "properties": {
                                                "error": {
                                                    "type": "string"
                                                },
                                                "traceback": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "required": ["taskstatus", "taskinfo"],
                                    "additionalProperties": False
                                }
                            ]
                        }
                    }
                }
            },
            "404": {
                "description": 'The localityupdate object with task id was not found',
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "string",
                            "example": "The localityupdate with task id '7d34dbb2-6e57-4c4b-9546-1fe7bec1acca' was not found"
                        }
                    }
                }
            }
        }
    },
})
@require_GET
def localityupdate_status(request: http.HttpRequest, taskid: str):
    try:
        locality_update = LocalityUpdate.objects.get(taskid=taskid)
    except LocalityUpdate.DoesNotExist:
        return http.HttpResponseNotFound(f"The localityupdate with task id '{taskid}' was not found")

    result = update_locality_task.AsyncResult(locality_update.taskid)

    resolved_state = LocalityUpdateStatus.ABORTED if result.state == CELERY_TASK_STATE.REVOKED else LocalityUpdateStatus.FAILED if result.state == CELERY_TASK_STATE.FAILURE else result.state

    status = {
        'taskstatus': resolved_state,
        'taskinfo': result.info if isinstance(result.info, dict) else repr(result.info)
    }

    if resolved_state == LocalityUpdateStatus.FAILED:
        status["taskinfo"] = {
            'error': str(result.result),
            'traceback': str(result.traceback)
        }

    elif locality_update.status == LocalityUpdateStatus.PARSE_FAILED:

        status["taskstatus"] = LocalityUpdateStatus.PARSE_FAILED

        if isinstance(result.info, dict) and 'errors' in result.info.keys():
            errors = result.info["errors"]
        else:
            results = locality_update.results.all()
            errors = [json.loads(error.result) for error in results]

        status["taskinfo"] = {"errors": errors}

    elif locality_update.status == LocalityUpdateStatus.PARSED:
        status["taskstatus"] = LocalityUpdateStatus.PARSED

        results = locality_update.results.all()
        rows = [json.loads(row.result) for row in results]

        status["taskinfo"] = {
            "rows": rows
        }

    elif locality_update.status == LocalityUpdateStatus.SUCCEEDED:
        status["taskstatus"] = LocalityUpdateStatus.SUCCEEDED
        recordset_id = locality_update.recordset.id if locality_update.recordset is not None else None
        if isinstance(result.info, dict) and resolved_state == LocalityUpdateStatus.SUCCEEDED:
            result = {
                "recordsetid": recordset_id,
                "localities": result.info["localities"],
                "geocoorddetails": result.info["geocoorddetails"]
            }
        else:
            results = locality_update.results.all()
            localitites = []
            geocoorddetails = []
            for row in results:
                parsed = json.loads(row.result)
                localitites.append(parsed["locality"])
                if parsed["geocoorddetail"] is not None:
                    geocoorddetails.append(parsed["geocoorddetail"])
            result = {
                "recordsetid": recordset_id,
                "localities": localitites,
                "geocoorddetails": geocoorddetails
            }

        status["taskinfo"] = result

    return http.JsonResponse(status, safe=False)


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
                                'type': {
                                    'type': 'string',
                                    "enum": ["ABORTED", "NOT_RUNNING"]
                                },
                                'message': {
                                    'type': 'string',
                                    'description': 'Response message about the status of the task'
                                },
                            },
                            "required": ["type", "message"],
                            "additionalProperties": False
                        },
                    },
                },
            },
            "404": {
                "description": 'The localityupdate object with task id was not found',
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "string",
                            "example": "The localityupdate with task id '7d34dbb2-6e57-4c4b-9546-1fe7bec1acca' was not found"
                        }
                    }
                }
            }
        },
    },
})
@require_POST
@login_maybe_required
def abort_localityupdate_task(request: http.HttpRequest, taskid: str):
    "Aborts the merge task currently running and matching the given merge/task ID"

    try:
        locality_update = LocalityUpdate.objects.get(taskid=taskid)
    except LocalityUpdate.DoesNotExist:
        return http.HttpResponseNotFound(f"The localityupdate with taskid: {taskid} is not found")

    task = record_merge_task.AsyncResult(locality_update.taskid)

    result = {
        "type": None,
        "message": None
    }

    if task.state in [LocalityUpdateStatus.PENDING, LocalityUpdateStatus.PARSING, LocalityUpdateStatus.PROGRESS]:
        app.control.revoke(locality_update.taskid, terminate=True)

        locality_update.status = LocalityUpdateStatus.ABORTED
        locality_update.save()

        Message.objects.create(user=request.specify_user, content=json.dumps({
            'type': 'localityupdate-aborted',
            'taskid': taskid
        }))
        result["type"] = "ABORTED"
        result["message"] = f'Task {locality_update.taskid} has been aborted.'

    else:
        result["type"] = "NOT_RUNNING"
        result["message"] = 'Task %s is not running and cannot be aborted' % locality_update.taskid

    return http.JsonResponse(result, safe=False)


@openapi(schema={
    "post": {
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "columnHeaders": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },
                            "data": {
                                "type": "array",
                                "items": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            },
                            "runInBackground": {
                                "type": "boolean",
                                "description": "Whether the task should be ran in the background. Defaults to True",
                                "default": False
                            }
                        },
                        "required": ["columnHeaders", "data"],
                        "additionalProperties": False
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Successful response returned by worker",
                "content": {
                    "application/json": {
                        "schema": localityupdate_parse_success
                    }
                }
            },
            "201": {
                "description": "Task started by the worker. Returns the newly created ID of the task",
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "string",
                            "maxLength": 36,
                            "example": "7d34dbb2-6e57-4c4b-9546-1fe7bec1acca",
                        }
                    }
                }
            },
            "422": {
                "description": "Locality Import Set not parsed successfully",
                "content": {
                    "application/json": {
                        "schema": localityupdate_parse_error
                    }
                }
            }
        }
    }
})
@login_maybe_required
@require_POST
def parse_locality_set(request: http.HttpRequest):
    """Parse a locality set without making any database changes and return the results 
    """
    request_data = json.loads(request.body)

    column_headers = request_data["columnHeaders"]
    data = request_data["data"]
    run_in_background = request_data.get("runInBackground", False)
    if not run_in_background:
        # BUG?: The result could be list of named tuples. Need to serialize them.
        status, result = parse_locality_set_foreground(
            request.specify_collection, column_headers, data)
    else:
        status, result = 201, start_locality_set_background(
            request.specify_collection, request.specify_user, request.specify_user_agent, column_headers, data, False, True)

    return http.JsonResponse(result, status=status, safe=False)


def parse_locality_set_foreground(collection, column_headers: list[str], data: list[list[str]]) -> tuple[int, dict[str, Any]]:
    parsed, errors = _parse_locality_set(
        collection, column_headers, data)

    if len(errors) > 0:
        return 422, errors

    return 200, parsed

