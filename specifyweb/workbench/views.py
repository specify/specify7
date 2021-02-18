import re
import json
import logging
from uuid import uuid4
from typing import Sequence, Tuple, List
from jsonschema import validate # type: ignore
from jsonschema.exceptions import ValidationError # type: ignore

from django import http
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django import forms
from django.shortcuts import render
from django.db import connection, transaction
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

from specifyweb.specify.api import toJson, get_object_or_404, create_obj, obj_to_data
from specifyweb.specify.views import login_maybe_required, apply_access_control

from . import tasks
from . import models
from .upload import upload as uploader, upload_plan_schema

logger = logging.getLogger(__name__)

def regularize_rows(columns: List[str], rows: List[List]) -> List[List[str]]:
    width = len(columns)
    return [
        (row + ['']*width)[:width] # pad / trim row length to match columns
        for row in (['' if v is None else str(v).strip() for v in r] for r in rows) # convert values to strings
        if not all(v == '' for v in row) # skip empty rows
    ]


@login_maybe_required
@apply_access_control
@require_http_methods(["GET", "POST"])
@transaction.atomic
def datasets(request) -> http.HttpResponse:
    if request.method == "POST":
        data = json.load(request)

        columns = data['columns']
        if any(not isinstance(c, str) for c in columns) or not isinstance(columns, list):
            return http.HttpResponse(f"all column headers must be strings: {columns}", status=400)

        if len(set(columns)) != len(columns):
            return http.HttpResponse(f"all column headers must be unique: {columns}", status=400)

        rows = regularize_rows(columns, data['rows'])

        ds = models.Spdataset.objects.create(
            specifyuser=request.specify_user,
            collection=request.specify_collection,
            name=data['name'],
            columns=columns,
            data=rows,
        )
        return http.JsonResponse({"id": ds.id, "name": ds.name}, status=201)

    else:
        attrs = ('name', 'uploadresult', 'uploaderstatus')
        dss = models.Spdataset.objects.filter(specifyuser=request.specify_user, collection=request.specify_collection).only(*attrs)
        return http.JsonResponse([{'id': ds.id, **{attr: getattr(ds, attr) for attr in attrs}} for ds in dss], safe=False)

@login_maybe_required
@apply_access_control
@require_http_methods(["GET", "PUT", "DELETE"])
@transaction.atomic
def dataset(request, ds_id: str) -> http.HttpResponse:
    try:
        ds = models.Spdataset.objects.select_for_update().get(id=ds_id)
    except ObjectDoesNotExist:
        return http.HttpResponseNotFound()

    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    if request.method == "PUT":
        attrs = json.load(request)

        if 'name' in attrs:
            ds.name = attrs['name']

        if 'visualorder' in attrs:
            ds.visualorder = attrs['visualorder']
            assert ds.visualorder is None or (isinstance(ds.visualorder, list) and len(ds.visualorder) == len(ds.columns))

        if 'uploadplan' in attrs:
            plan = attrs['uploadplan']
            try:
                validate(plan, upload_plan_schema.schema)
            except ValidationError as e:
                return http.HttpResponse(f"upload plan is invalid: {e}", status=400)

            if ds.uploaderstatus != None:
                return http.HttpResponse('dataset in use by uploader', status=409)
            if ds.was_uploaded():
                return http.HttpResponse('dataset has been uploaded. changing upload plan not allowed.', status=400)

            new_cols = upload_plan_schema.parse_plan(request.specify_collection, plan).get_cols() - set(ds.columns)
            if new_cols:
                ds.columns += list(new_cols)
                for row in ds.data:
                    row += [""]*len(new_cols)

            ds.uploadplan = json.dumps(plan)
            ds.rowresults = None
            ds.uploadresult = None

        ds.save()
        return http.HttpResponse(status=204)

    if request.method == "DELETE":
        if ds.uploaderstatus != None:
            return http.HttpResponse('dataset in use by uploader', status=409)
        ds.delete()
        return http.HttpResponse(status=204)

    else: # GET
        return http.JsonResponse(dict(
            id=ds.id,
            name=ds.name,
            columns=ds.columns,
            visualorder=ds.visualorder,
            rows=ds.data,
            uploadplan=ds.uploadplan and json.loads(ds.uploadplan),
            uploaderstatus=ds.uploaderstatus,
            uploadresult=ds.uploadresult,
        ), safe=False)

@login_maybe_required
@apply_access_control
@require_http_methods(["GET", "PUT"])
@transaction.atomic
def rows(request, ds_id: str) -> http.HttpResponse:
    try:
        ds = models.Spdataset.objects.select_for_update().get(id=ds_id)
    except ObjectDoesNotExist:
        return http.HttpResponseNotFound()

    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    if request.method == "PUT":
        if ds.uploaderstatus is not None:
            return http.HttpResponse('dataset in use by uploader.', status=409)
        if ds.was_uploaded():
            return http.HttpResponse('dataset has been uploaded. changing data not allowed.', status=400)

        rows = regularize_rows(ds.columns, json.load(request))

        ds.data = rows
        ds.rowresults = None
        ds.uploadresult = None
        ds.save()
        return http.HttpResponse(status=204)

    else: # GET
        return http.JsonResponse(ds.data, safe=False)

@login_maybe_required
@apply_access_control
@require_POST
def upload(request, ds_id, no_commit: bool, allow_partial: bool) -> http.HttpResponse:
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    with transaction.atomic():
        ds = models.Spdataset.objects.select_for_update().get(id=ds_id)
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
            ds_id,
            no_commit,
            allow_partial
        ], task_id=taskid)
        ds.uploaderstatus = {
            'operation': "validating" if no_commit else "uploading",
            'taskid': taskid
        }
        ds.save(update_fields=['uploaderstatus'])

    return http.JsonResponse(async_result.id, safe=False)

@login_maybe_required
@apply_access_control
@require_POST
def unupload(request, ds_id: int) -> http.HttpResponse:
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    with transaction.atomic():
        ds = models.Spdataset.objects.select_for_update().get(id=ds_id)
        if ds.uploaderstatus is not None:
            return http.HttpResponse('dataset in use by uploader.', status=409)
        if not ds.was_uploaded():
            return http.HttpResponse('dataset has not been uploaded.', status=400)

        taskid = str(uuid4())
        async_result = tasks.unupload.apply_async([ds.id], task_id=taskid)
        ds.uploaderstatus = {
            'operation': "unuploading",
            'taskid': taskid
        }
        ds.save(update_fields=['uploaderstatus'])

    return http.JsonResponse(async_result.id, safe=False)

# @login_maybe_required
@require_GET
def status(request, ds_id: int) -> http.HttpResponse:
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

@login_maybe_required
@apply_access_control
@require_POST
def abort(request, ds_id: int) -> http.HttpResponse:
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    if ds.uploaderstatus is None:
        return http.HttpResponse('not running', content_type='text/plain')

    task = {
        'uploading': tasks.upload,
        'validating': tasks.upload,
        'unuploading': tasks.unupload,
    }[ds.uploaderstatus['operation']]
    result = task.AsyncResult(ds.uploaderstatus['taskid']).revoke(terminate=True)

    models.Spdataset.objects.filter(id=ds_id).update(uploaderstatus=None)
    return http.HttpResponse('ok', content_type='text/plain')

@login_maybe_required
@apply_access_control
@require_GET
def validation_results(request, ds_id: int) -> http.HttpResponse:
    from .upload.upload_result import json_to_UploadResult

    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    if ds.rowresults is None:
        return http.JsonResponse(None, safe=False)

    results = [
        json_to_UploadResult(result).validation_info().to_json()
        for result in json.loads(ds.rowresults)
    ]
    return http.JsonResponse(results, safe=False)

@login_maybe_required
@apply_access_control
@require_GET
def upload_results(request, ds_id: int) -> http.HttpResponse:
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    if ds.rowresults is None:
        return http.JsonResponse(None, safe=False)

    results = json.loads(ds.rowresults)

    if settings.DEBUG:
        from .upload.upload_results_schema import schema
        validate(results, schema)
    return http.JsonResponse(results, safe=False)

@login_maybe_required
@apply_access_control
@require_http_methods(["GET", "POST"])
def validate_row(request, ds_id: str) -> http.HttpResponse:
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    collection = request.specify_collection
    upload_plan = uploader.get_ds_upload_plan(collection, ds)

    ValidationForm = type('ValidationForm', (forms.Form,), {
        column: forms.CharField(required=False)
        for column in ds.columns
    })

    if request.method == "POST":
        result = uploader.validate_row(collection, upload_plan, request.specify_user_agent.id, request.POST)
        return http.JsonResponse(result.validation_info().to_json())

    else:
        form = ValidationForm()

    return render(request, 'validate_row.html', {'form': form.as_p()})

@require_GET
def up_schema(request) -> http.HttpResponse:
    return http.JsonResponse(upload_plan_schema.schema)
