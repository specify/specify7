import json
import logging
from typing import Any
import csv
import io
from jsonschema import validate # type: ignore

from django import http
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.db import connection, transaction
from django.conf import settings
from django import forms
from django.shortcuts import render

from specifyweb.specify.api import toJson, get_object_or_404, create_obj, obj_to_data
from specifyweb.specify.views import login_maybe_required, apply_access_control

from .upload import do_upload_csv, validate_row as vr, get_ds_upload_plan
from .upload_plan_schema import schema, parse_plan
from ..models import Spdataset


logger = logging.getLogger(__name__)


class UploadForm(forms.Form):
    upload_plan = forms.CharField(widget=forms.Textarea)
    csv_data = forms.CharField(widget=forms.Textarea)
    commit = forms.BooleanField(required=False)

@login_maybe_required
@apply_access_control
def upload(request) -> Any:
    collection = request.specify_collection
    if request.method == 'POST':
        form = UploadForm(request.POST)
        if form.is_valid():
            plan = json.loads(form.cleaned_data['upload_plan'])
            validate(plan, schema)
            reader = csv.DictReader(io.StringIO(form.cleaned_data['csv_data']))

            no_commit = not form.cleaned_data['commit']
            result = do_upload_csv(request.specify_collection, reader, parse_plan(collection, plan).apply_scoping(collection), no_commit)

            return http.HttpResponse(json.dumps([r.to_json() for r in result], indent=2), content_type='application/json')
    else:
        form = UploadForm()

    return render(request, 'upload_new.html', {'form': form.as_p()})

@login_maybe_required
@apply_access_control
def validate_row(request, ds_id: str) -> http.HttpResponse:
    ds = get_object_or_404(Spdataset, id=ds_id)
    collection = request.specify_collection
    upload_plan = get_ds_upload_plan(collection, ds)

    ValidationForm = type('ValidationForm', (forms.Form,), {
        column: forms.CharField(required=False)
        for column in ds.columns
    })

    if request.method == "POST":
        result = vr(collection, upload_plan, request.POST)
        return http.JsonResponse(result.validation_info().to_json())

    else:
        form = ValidationForm()

    return render(request, 'validate_row.html', {'form': form.as_p()})
