import json
import logging
from typing import List, Optional
from uuid import uuid4

from django import http
from django.conf import settings
from django.db import transaction
from django.db.utils import OperationalError
from django.views.decorators.http import require_POST
from jsonschema import validate  # type: ignore
from jsonschema.exceptions import ValidationError  # type: ignore

from specifyweb.middleware.general import require_GET, require_http_methods
from specifyweb.specify.api import get_object_or_404
from specifyweb.specify.views import login_maybe_required, openapi
from specifyweb.specify.models import Recordset, Specifyuser
from specifyweb.notifications.models import Message
from specifyweb.permissions.permissions import PermissionTarget, PermissionTargetAction, \
    check_permission_targets, check_table_permissions
from . import models, tasks
from .upload import upload as uploader, upload_plan_schema

logger = logging.getLogger(__name__)

class DataSetPT(PermissionTarget):
    resource = "/workbench/dataset"
    create = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()
    upload = PermissionTargetAction()
    unupload = PermissionTargetAction()
    validate = PermissionTargetAction()
    transfer = PermissionTargetAction()
    create_recordset = PermissionTargetAction()

def regularize_rows(ncols: int, rows: List[List]) -> List[List[str]]:
    n = ncols + 1 # extra row info such as disambiguation in hidden col at end

    def regularize(row: List) -> Optional[List]:
        data = (row + ['']*n)[:n] # pad / trim row length to match columns
        cleaned = ['' if v is None else str(v).strip() for v in data] # convert values to strings
        return None if all(v == '' for v in cleaned[0:ncols]) else cleaned # skip empty rows

    return [r for r in map(regularize, rows) if r is not None]


open_api_components = {
    'schemas': {
        'wb_uploadresult': {
            "oneOf": [
                {
                    "type": "string",
                    "example": "null"
                },
                {
                    "type": "object",
                    "properties": {
                        "success": {
                            "type": "boolean",
                        },
                        "timestamp": {
                            "type": "string",
                            "format": "datetime",
                            "example": "2021-04-28T22:28:20.033117+00:00",
                        }
                    }
                }
            ]
        },
        "wb_uploaderstatus": {
            "oneOf": [
                {
                    "type": "string",
                    "example": "null",
                    "description": "Nothing to report"
                }, {
                    "type": "object",
                    "properties": {
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
                        "taskstatus": {
                            "type": "string",
                            "enum": [
                                "PROGRESS",
                                "PENDING",
                                "FAILURE",
                            ]
                        },
                        "uploaderstatus": {
                            "type": "object",
                            "properties": {
                                "operation": {
                                    "type": "string",
                                    "enum": [
                                        'validating',
                                        'uploading',
                                        'unuploading'
                                    ]
                                },
                                "taskid": {
                                    "type": "string",
                                    "maxLength": 36,
                                    "example": "7d34dbb2-6e57-4c4b-9546-1fe7bec1acca",
                                }
                            }
                        },
                    },
                    "description": "Status of the " +
                                   "upload / un-upload / validation process",
                }
            ]
        },
        "wb_rows": {
            "type": "array",
            "items": {
                "type": "array",
                "items": {
                    "type": "string",
                    "description": "Cell's value or null"
                }
            },
            "description": "2D array of values",
        },
        "wb_visualorder": {
            "oneOf": [
                {
                    "type": "string",
                    "description": "null",
                },
                {
                    "type": "array",
                    "items": {
                        "type": "number",
                    },
                    "description": "The order to show columns in",
                }
            ]
        },
        "wb_uploadplan": {
            "type": "object",
            "properties": {
            },
            "description": "Upload Plan. Schema - " +
               "https://github.com/specify/specify7/blob/5fb51a7d25d549248505aec141ae7f7cdc83e414/specifyweb/workbench/upload/upload_plan_schema.py#L14"
        },
        "wb_validation_results": {
            "type": "object",
            "properties": {},
            "description": "Schema: " +
               "https://github.com/specify/specify7/blob/19ebde3d86ef4276799feb63acec275ebde9b2f4/specifyweb/workbench/upload/validation_schema.py",
        },
        "wb_upload_results": {
            "type": "object",
            "properties": {},
            "description": "Schema: " +
               "https://github.com/specify/specify7/blob/19ebde3d86ef4276799feb63acec275ebde9b2f4/specifyweb/workbench/upload/upload_results_schema.py",
        }
    }
}

@openapi(schema={
    "get": {
        "parameters": [
            {
                "name": "with_plan",
                "in": "query",
                "required": False,
                "schema": {
                    "type": "string"
                },
                "description": "If parameter is present, limit results to data sets with upload plans."
            }
        ],
        "responses": {
            "200": {
                "description": "Data fetched successfully",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {
                                        "type": "number",
                                        "minimum": 0,
                                        "description": "Data Set ID",
                                    },
                                    "name": {
                                        "type": "string",
                                        "description": "Data Set Name",
                                    },
                                    "uploadresult": {
                                        "$ref": "#/components/schemas/wb_uploadresult"
                                    },
                                    "uploaderstatus": {
                                        "$ref": "#/components/schemas/wb_uploaderstatus",
                                    },
                                    "timestampcreated": {
                                        "type": "string",
                                        "format": "datetime",
                                        "example": "2021-04-28T13:16:07.774"
                                    },
                                    "timestampmodified": {
                                        "type": "string",
                                        "format": "datetime",
                                        "example": "2021-04-28T13:50:41.710",
                                    }
                                },
                                'required': ['id', 'name', 'uploadresult', 'uploaderstatus', 'timestampcreated', 'timestampmodified'],
                                'additionalProperties': False
                            }
                        }
                    }
                }
            }
        }
    },
    'post': {
        "requestBody": {
            "required": True,
            "description": "A JSON representation of a new Data Set",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Data Set name",
                            },
                            "columns": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "description": "A name of the column",
                                },
                                "description": "A unique array of strings",
                            },
                            "rows": {
                                "$ref": "#/components/schemas/wb_rows",
                            },
                            "importedfilename": {
                                "type": "string",
                                "description": "The name of the original file",
                            }
                        },
                        'required': ['name', 'columns', 'rows', 'importedfilename'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Data created successfully",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "number",
                                    "description": "Data Set ID",
                                },
                                "name": {
                                    "type": "string",
                                    "description":
                                        "Data Set name (may differ from the one " +
                                        "in the request object as part of " +
                                        "ensuring names are unique)"
                                },
                            },
                            'required': ['name', 'id'],
                            'additionalProperties': False
                        }
                    }
                }
            }
        }
    }
}, components=open_api_components)
@login_maybe_required
@require_http_methods(["GET", "POST"])
@transaction.atomic
def datasets(request) -> http.HttpResponse:
    """RESTful list of user's WB datasets. POSTing will create a new dataset."""
    if request.method == "POST":
        check_permission_targets(request.specify_collection.id, request.specify_user.id, [DataSetPT.create])

        data = json.load(request)

        columns = data['columns']
        if any(not isinstance(c, str) for c in columns) or not isinstance(columns, list):
            return http.HttpResponse(f"all column headers must be strings: {columns}", status=400)

        if len(set(columns)) != len(columns):
            return http.HttpResponse(f"all column headers must be unique: {columns}", status=400)

        rows = regularize_rows(len(columns), data['rows'])

        ds = models.Spdataset.objects.create(
            specifyuser=request.specify_user,
            collection=request.specify_collection,
            name=data['name'],
            columns=columns,
            data=rows,
            importedfilename=data['importedfilename'],
            createdbyagent=request.specify_user_agent,
            modifiedbyagent=request.specify_user_agent,
        )
        return http.JsonResponse({"id": ds.id, "name": ds.name}, status=201)

    else:
        return http.JsonResponse(models.Spdataset.get_meta_fields(
            request,
            ["uploadresult"],
            {
                **({'uploadplan__isnull':False} if request.GET.get('with_plan', 0) else {}),
                # Defaults to false, to not have funny behaviour if frontend omits isupdate. 
                # That is, assume normal dataset is needed unless specifically told otherwise.
                **({'isupdate': request.GET.get('isupdate', False)}),
                **({'parent_id': None})
            }
        ), safe=False)

@openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Successful response",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "number",
                                    "description": "Data Set ID",
                                },
                                "name": {
                                    "type": "string",
                                    "description": "Data Set name",
                                },
                                "columns": {
                                    "type": "array",
                                    "items": {
                                        "type": "string",
                                        "description": "A name of the column",
                                    },
                                    "description": "A unique array of strings",
                                },
                                "visualorder": {
                                    "$ref": "#/components/schemas/wb_visualorder"
                                },
                                "rows": {
                                    "$ref": "#/components/schemas/wb_rows"
                                },
                                "uploadplan": {
                                    "$ref": "#/components/schemas/wb_uploadplan"
                                },
                                "uploadresult": {
                                    "$ref": "#/components/schemas/wb_uploadresult"
                                },
                                "uploaderstatus": {
                                    "$ref": "#/components/schemas/wb_uploaderstatus"
                                },
                                "importedfilename": {
                                    "type": "string",
                                    "description": "The name of the original file",
                                },
                                "remarks": {
                                    "type": "string",
                                },
                                "timestampcreated": {
                                    "type": "string",
                                    "format": "datetime",
                                    "example": "2021-04-28T13:16:07.774"
                                },
                                "timestampmodified": {
                                    "type": "string",
                                    "format": "datetime",
                                    "example": "2021-04-28T13:50:41.710",
                                }
                            },
                            'required': ['id', 'name', 'columns', 'visualorder', 'rows', 'uploadplan', 'uploadresult',
                                         'uploaderstatus', 'importedfilename', 'remarks', 'timestampcreated', 'timestampmodified'],
                            'additionalProperties': False
                        }
                    }
                }
            }
        }
    },
    'put': {
        "requestBody": {
            "required": True,
            "description": "A JSON representation of updates to the data set",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Data Set name",
                            },
                            "remarks": {
                                "type": "string",
                            },
                            "visualorder": {
                                "$ref": "#/components/schemas/wb_visualorder"
                            },
                            "uploadplan": {
                                "$ref": "#/components/schemas/wb_uploadplan"
                            },
                        },
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Data set updated."},
            "409": {"description": "Dataset in use by uploader."}
        }
    },
    "delete": {
        "responses": {
            "204": {"description": "Data set deleted."},
            "409": {"description": "Dataset in use by uploader"}
        }
    }
}, components=open_api_components)
@login_maybe_required
@require_http_methods(["GET", "PUT", "DELETE"])
@transaction.atomic
@models.Spdataset.validate_dataset_request(raise_404=False, lock_object=True)
def dataset(request, ds: models.Spdataset) -> http.HttpResponse:
    """RESTful endpoint for dataset <ds_id>. Supports GET PUT and DELETE."""

    if request.method == "GET":
        return http.JsonResponse(ds.get_dataset_as_dict())

    with transaction.atomic():

        if request.method == "PUT":
            check_permission_targets(request.specify_collection.id, request.specify_user.id, [DataSetPT.update])
            attrs = json.load(request)

            if 'name' in attrs:
                ds.name = attrs['name']

            if 'remarks' in attrs:
                ds.remarks = attrs['remarks']

            if 'visualorder' in attrs:
                ds.visualorder = attrs['visualorder']
                assert ds.visualorder is None or (isinstance(ds.visualorder, list) and len(ds.visualorder) == len(ds.columns))

            if 'uploadplan' in attrs:
                plan = attrs['uploadplan']

                if ds.uploaderstatus is not None:
                    return http.HttpResponse('dataset in use by uploader', status=409)
                if ds.was_uploaded():
                    return http.HttpResponse('dataset has been uploaded. changing upload plan not allowed.', status=400)

                if plan is not None:
                    try:
                        validate(plan, upload_plan_schema.schema)
                    except ValidationError as e:
                        return http.HttpResponse(f"upload plan is invalid: {e}", status=400)

                    new_cols = upload_plan_schema.parse_plan(plan).get_cols() - set(ds.columns)
                    if new_cols:
                        ncols = len(ds.columns)
                        ds.columns += list(new_cols)
                        for i, row in enumerate(ds.data):
                            ds.data[i] = row[:ncols] + [""]*len(new_cols) + row[ncols:]

                ds.uploadplan = json.dumps(plan) if plan is not None else None
                ds.rowresults = None
                ds.uploadresult = None

            ds.save()
            return http.HttpResponse(status=204)

        if request.method == "DELETE":
            check_permission_targets(request.specify_collection.id, request.specify_user.id, [DataSetPT.delete])
            if ds.uploaderstatus is not None:
                return http.HttpResponse('dataset in use by uploader', status=409)
            ds.delete()
            return http.HttpResponse(status=204)

        assert False, "Unexpected HTTP method"


@openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Successful response",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "description": "Cell value"
                                }
                            },
                            "description":
                                "2d array of cells. NOTE: last column would contain " +
                                "disambiguation results as a JSON object or be an " +
                                "empty string"
                        }
                    }
                }
            }
        }
    },
    'put': {
        "requestBody": {
            "required": True,
            "description": "A JSON representation of a spreadsheet",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "array",
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "description": "Cell value"
                            }
                        },
                        "description":
                            "2d array of cells. NOTE: last column should contain " +
                            "disambiguation results as a JSON object or be an " +
                            "empty string"
                    }
                    }
            }
        },
        "responses": {
            "204": {"description": "Data set rows updated."},
            "409": {"description": "Dataset in use by uploader"}
        }
    },
}, components=open_api_components)
@login_maybe_required
@require_http_methods(["GET", "PUT"])
@transaction.atomic
@models.Spdataset.validate_dataset_request(raise_404=False, lock_object=True)
def rows(request, ds) -> http.HttpResponse:
    """Returns (GET) or sets (PUT) the row data for dataset <ds_id>."""

    if request.method == "PUT":
        check_permission_targets(request.specify_collection.id, request.specify_user.id, [DataSetPT.update])
        if ds.uploaderstatus is not None:
            return http.HttpResponse('dataset in use by uploader.', status=409)
        if ds.was_uploaded():
            return http.HttpResponse('dataset has been uploaded. changing data not allowed.', status=400)

        rows = regularize_rows(len(ds.columns), json.load(request))

        ds.data = rows
        ds.rowresults = None
        ds.uploadresult = None
        ds.modifiedbyagent = request.specify_user_agent
        ds.save()
        return http.HttpResponse(status=204)

    else: # GET
        return http.JsonResponse(ds.data, safe=False)


@openapi(schema={
    'post': {
        "responses": {
            "200": {
                "description": "Returns a GUID (job ID)",
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
            "409": {"description": "Dataset in use by uploader"}
        }
    },
}, components=open_api_components)
@login_maybe_required
@require_POST
@transaction.atomic()
@models.Spdataset.validate_dataset_request(raise_404=True, lock_object=True)
def upload(request, ds, no_commit: bool, allow_partial: bool) -> http.HttpResponse:
    "Initiates an upload or validation of dataset <ds_id>."

    check_permission_targets(request.specify_collection.id, request.specify_user.id, [
        DataSetPT.validate if no_commit else DataSetPT.upload
    ])

    with transaction.atomic():

        if ds.uploaderstatus is not None:
            return http.HttpResponse('dataset in use by uploader.', status=409)
        if ds.collection != request.specify_collection:
            return http.HttpResponse('dataset belongs to a different collection.', status=400)
        if ds.was_uploaded():
            return http.HttpResponse('dataset has already been uploaded.', status=400)

        taskid = str(uuid4())
        async_result = tasks.upload.apply_async([
            request.specify_collection.id,
            request.specify_user_agent.id,
            ds.id,
            no_commit,
            allow_partial
        ], task_id=taskid)
        ds.uploaderstatus = {
            'operation': "validating" if no_commit else "uploading",
            'taskid': taskid
        }
        ds.save(update_fields=['uploaderstatus'])
    return http.JsonResponse(taskid, safe=False)


@openapi(schema={
    'post': {
        "responses": {
            "200": {
                "description": "Returns a GUID (job ID)",
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
            "409": {"description": "Dataset in use by uploader"}
        }
    },
}, components=open_api_components)
@login_maybe_required
@require_POST
@transaction.atomic()
@models.Spdataset.validate_dataset_request(raise_404=True, lock_object=True)
def unupload(request, ds) -> http.HttpResponse:
    "Initiates an unupload of dataset <ds_id>."

    check_permission_targets(request.specify_collection.id, request.specify_user.id, [DataSetPT.unupload])

    with transaction.atomic():

        if ds.uploaderstatus is not None:
            return http.HttpResponse('dataset in use by uploader.', status=409)
        if not ds.was_uploaded():
            return http.HttpResponse('dataset has not been uploaded.', status=400)

        taskid = str(uuid4())
        async_result = tasks.unupload.apply_async([request.specify_collection.id, ds.id, request.specify_user_agent.id], task_id=taskid)
        ds.uploaderstatus = {
            'operation': "unuploading",
            'taskid': taskid
        }
        ds.save(update_fields=['uploaderstatus'])

    return http.JsonResponse('w', safe=False)


# @login_maybe_required
@openapi(schema={
    'get': {
        "responses": {
            "200": {
                "description": "Data fetched successfully",
                "content": {
                    "text/plain": {
                        "schema": {
                            "$ref": "#/components/schemas/wb_uploaderstatus",
                        }
                    }
                }
            },
        }
    },
}, components=open_api_components)
@require_GET
def status(request, ds_id: int) -> http.HttpResponse:
    "Returns the uploader status for the dataset <ds_id>."
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    # if (wb.specifyuser != request.specify_user):
    #     return http.HttpResponseForbidden()

    if ds.uploaderstatus is None:
        return http.JsonResponse(None, safe=False)

    task = {
        'uploading': tasks.upload,
        'validating': tasks.upload,
        'unuploading': tasks.unupload,
    }[ds.uploaderstatus['operation']]
    result = task.AsyncResult(ds.uploaderstatus['taskid'])
    status = {
        'uploaderstatus': ds.uploaderstatus,
        'taskstatus': result.state,
        'taskinfo': result.info if isinstance(result.info, dict) else repr(result.info)
    }
    return http.JsonResponse(status)


@openapi(schema={
    'post': {
        "responses": {
            "200": {
                "description": "Returns either 'ok' if a task is aborted " +
                " or 'not running' if no task exists.",
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "string",
                            "enum": [
                                "ok",
                                "not running"
                            ]
                        }
                    }
                }
            },
            "503": {
                "description": "Indicates the process could not be terminated.",
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "string",
                            "enum": [
                                'timed out waiting for requested task to terminate'
                            ]
                        }
                    }
                }
            },
        }
    },
}, components=open_api_components)
@login_maybe_required
@require_POST
@models.Spdataset.validate_dataset_request(raise_404=True, lock_object=False)
def abort(request, ds) -> http.HttpResponse:
    "Aborts any ongoing uploader operation for dataset <ds_id>."

    if ds.uploaderstatus is None:
        return http.HttpResponse('not running', content_type='text/plain')

    task = {
        'uploading': tasks.upload,
        'validating': tasks.upload,
        'unuploading': tasks.unupload,
    }[ds.uploaderstatus['operation']]
    result = task.AsyncResult(ds.uploaderstatus['taskid']).revoke(terminate=True)

    try:
        models.Spdataset.objects.filter(id=ds.id).update(uploaderstatus=None)
    except OperationalError as e:
        if e.args[0] == 1205: # (1205, 'Lock wait timeout exceeded; try restarting transaction')
            return http.HttpResponse(
                'timed out waiting for requested task to terminate',
                status=503,
                content_type='text/plain'
            )
        else:
            raise

    return http.HttpResponse('ok', content_type='text/plain')

@openapi(schema={
    'get': {
        "responses": {
            "200": {
                "description": "Successful operation",
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/components/schemas/wb_upload_results",
                            }
                        }
                    }
                }
            },
        }
    },
}, components=open_api_components)
@login_maybe_required
@require_GET
@models.Spdataset.validate_dataset_request(raise_404=True, lock_object=False)
def upload_results(request, ds) -> http.HttpResponse:
    "Returns the detailed upload/validation results if any for the dataset <ds_id>."

    if ds.rowresults is None:
        return http.JsonResponse(None, safe=False)

    results = json.loads(ds.rowresults)

    if settings.DEBUG:
        from .upload.upload_results_schema import schema
        validate(results, schema)
    return http.JsonResponse(results, safe=False)

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "A row to validate",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Cell value"
                        },
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Returns upload results for a single row.",
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "results": {
                                    "$ref": "#/components/schemas/wb_upload_results"
                                },
                            },
                            'required': ['results'],
                            'additionalProperties': False
                        }
                    }
                }
            },
        }
    },
}, components=open_api_components)
@login_maybe_required
@require_POST
def validate_row(request, ds_id: str) -> http.HttpResponse:
    "Validates a single row for dataset <ds_id>. The row data is passed as POST parameters."
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [DataSetPT.validate])
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    collection = request.specify_collection
    bt, upload_plan = uploader.get_ds_upload_plan(collection, ds)
    row = json.loads(request.body)
    ncols = len(ds.columns)
    rows = regularize_rows(ncols, [row])
    if not rows:
        return http.JsonResponse(None, safe=False)
    row = rows[0]
    da = uploader.get_disambiguation_from_row(ncols, row)
    result = uploader.validate_row(collection, upload_plan, request.specify_user_agent.id, dict(zip(ds.columns, row)), da)
    return http.JsonResponse({'result': result.to_json()})

@openapi(schema={
    'get': {
        "responses": {
            "200": {
                "description": "Returns the upload plan schema, like defined here: " +
                    "https://github.com/specify/specify7/blob/19ebde3d86ef4276799feb63acec275ebde9b2f4/specifyweb/workbench/upload/upload_plan_schema.py",
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "object",
                            "properties": {},
                        }
                    }
                }
            },
        }
    },
}, components=open_api_components)
@require_GET
def up_schema(request) -> http.HttpResponse:
    "Returns the upload plan schema."
    return http.JsonResponse(upload_plan_schema.schema)

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "User ID of the new owner",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "specifyuserid": {
                                "type": "number",
                                "description": "User ID of the new owner"
                            },
                        },
                        'required': ['specifyuserid'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Dataset transfer succeeded."},
        }
    },
}, components=open_api_components)
@login_maybe_required
@require_POST
def transfer(request, ds_id: int) -> http.HttpResponse:
    """Transfer dataset's ownership to a different user."""
    if 'specifyuserid' not in request.POST:
        return http.HttpResponseBadRequest("missing parameter: specifyuserid")

    check_permission_targets(request.specify_collection.id, request.specify_user.id, [DataSetPT.transfer])

    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    try:
        ds.specifyuser = Specifyuser.objects.get(id=request.POST['specifyuserid'])
    except Specifyuser.DoesNotExist:
        return http.HttpResponseBadRequest("the user does not exist")

    Message.objects.create(user=ds.specifyuser, content=json.dumps({
        'type': 'dataset-ownership-transferred',
        'previous-owner-name': request.specify_user.name,
        'dataset-name': ds.name,
        'dataset-id': ds_id,
    }))

    ds.save()
    return http.HttpResponse(status=204)

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "The name of the record set to create.",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Name to give the new record set."
                            },
                        },
                        'required': ['name'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Record set created successfully.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "number",
                            "description": "The database id of the created record set."
                        }
                    }
                }
            },
        }
    },
}, components=open_api_components)
@login_maybe_required
@require_POST
@models.Spdataset.validate_dataset_request(raise_404=True, lock_object=False)
def create_recordset(request, ds) -> http.HttpResponse:
    if ds.uploadplan is None:
        return http.HttpResponseBadRequest("data set is missing upload plan")

    if ds.rowresults is None:
        return http.HttpResponseBadRequest("data set is missing row upload results")

    if 'name' not in request.POST:
        return http.HttpResponseBadRequest("missing parameter: name")

    name = request.POST['name']
    max_length = Recordset._meta.get_field('name').max_length
    if max_length is not None and len(name) > max_length:
        return http.HttpResponseBadRequest("name too long")

    check_permission_targets(request.specify_collection.id, request.specify_user.id, [DataSetPT.create_recordset])
    check_table_permissions(request.specify_collection, request.specify_user, Recordset, "create")

    rs = uploader.create_recordset(ds, name)
    return http.JsonResponse(rs.id, status=201, safe=False)
