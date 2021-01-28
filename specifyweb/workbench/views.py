import re
import json
import logging
from uuid import uuid4
from typing import Sequence, Tuple
from jsonschema import validate # type: ignore

from django import http
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.db import connection, transaction
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

from specifyweb.specify.api import toJson, get_object_or_404, create_obj, obj_to_data
from specifyweb.specify.views import login_maybe_required, apply_access_control

from . import tasks
from . import models
from .upload.upload_results_schema import schema

logger = logging.getLogger(__name__)

@login_maybe_required
@apply_access_control
@require_http_methods(["GET", "POST"])
@transaction.atomic
def datasets(request):
    if request.method == "POST":
        data = json.load(request)
        ds = models.Spdataset.objects.create(
            specifyuser=request.specify_user,
            collection=request.specify_collection,
            name=data['name'],
            columns=data['columns'],
            data=data['rows'],
        )
        return http.JsonResponse({"id": ds.id, "name": ds.name}, status=201)
    else:
        dss = models.Spdataset.objects.filter(specifyuser=request.specify_user, collection=request.specify_collection).only('name')
        return http.JsonResponse([{'id': ds.id, 'name': ds.name, 'uploadresult': ds.uploadresult} for ds in dss], safe=False)

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
        assert ds.uploaderstatus == None
        attrs = json.load(request)
        for attr in ('name', 'uploadplan'):
            if attr in attrs:
                setattr(ds, attr, attrs[attr])

        if 'uploadplan' in attrs:
            ds.rowresults = None

        ds.save()
        return http.HttpResponse(status=204)

    if request.method == "DELETE":
        assert ds.uploaderstatus == None
        ds.delete()
        return http.HttpResponse(status=204)

    else: # GET
        return http.JsonResponse(dict(
            id=ds.id,
            name=ds.name,
            columns=ds.columns,
            rows=ds.data,
            uploadplan=ds.uploadplan,
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
        assert ds.uploaderstatus == None
        ds.data = json.load(request)
        ds.uploadresult = None
        ds.save()
        return http.HttpResponse(status=204)

    else: # GET
        return http.JsonResponse(ds.data, safe=False)

@login_maybe_required
@apply_access_control
@require_POST
def upload(request, ds_id, no_commit: bool) -> http.HttpResponse:
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    with transaction.atomic():
        ds = models.Spdataset.objects.select_for_update().get(id=ds_id)
        assert ds.uploaderstatus is None
        assert ds.collection == request.specify_collection

        taskid = str(uuid4())
        async_result = tasks.upload.apply_async([request.specify_collection.id, ds_id, no_commit], task_id=taskid)
        ds.uploaderstatus = {
            'operation': "validating" if no_commit else "uploading",
            'taskid': taskid
        }
        ds.save()

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
        for result in ds.rowresults
    ]
    return http.JsonResponse(results, safe=False)

@login_maybe_required
@apply_access_control
@require_GET
def upload_results(request, ds_id: int) -> http.HttpResponse:
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    results = ds.rowresults
    if settings.DEBUG:
        validate(results, schema)

    return http.JsonResponse(results, safe=False)

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
@require_POST
def unupload(request, ds_id: int) -> http.HttpResponse:
    ds = get_object_or_404(models.Spdataset, id=ds_id)
    if ds.specifyuser != request.specify_user:
        return http.HttpResponseForbidden()

    with transaction.atomic():
        ds = models.Spdataset.objects.select_for_update().get(id=ds_id)
        assert ds.uploaderstatus is None

        taskid = str(uuid4())
        async_result = tasks.unupload.apply_async([ds.id], task_id=taskid)
        ds.uploaderstatus = {
            'operation': "unuploading",
            'taskid': taskid
        }
        ds.save()

    return http.JsonResponse(async_result.id, safe=False)
