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
from specifyweb.specify import models

from .upload import do_upload_csv, validate_row as vr, get_wb_upload_plan
from .upload_plan_schema import schema, parse_plan

Workbench = getattr(models, 'Workbench')

logger = logging.getLogger(__name__)


class UploadForm(forms.Form):
    upload_plan = forms.CharField(widget=forms.Textarea)
    csv_data = forms.CharField(widget=forms.Textarea)
    commit = forms.BooleanField(required=False)

@login_maybe_required
@apply_access_control
def upload(request) -> Any:
    if request.method == 'POST':
        form = UploadForm(request.POST)
        if form.is_valid():
            plan = json.loads(form.cleaned_data['upload_plan'])
            validate(plan, schema)
            reader = csv.DictReader(io.StringIO(form.cleaned_data['csv_data']))

            no_commit = not form.cleaned_data['commit']
            result = do_upload_csv(request.specify_collection, reader, parse_plan(request.specify_collection, plan), no_commit)

            return http.HttpResponse(json.dumps([r.to_json() for r in result], indent=2), content_type='application/json')
    else:
        form = UploadForm()

    return render(request, 'upload_new.html', {'form': form.as_p()})

@login_maybe_required
@apply_access_control
def validate_row(request, wb_id: str) -> http.HttpResponse:
    wb = get_object_or_404(Workbench, id=wb_id)
    collection = request.specify_collection
    upload_plan = get_wb_upload_plan(collection, wb)

    ValidationForm = type('ValidationForm', (forms.Form,), {
        wbtmi.caption: forms.CharField(required=False)
        for wbtmi in wb.workbenchtemplate.workbenchtemplatemappingitems.all()
    })

    if request.method == "POST":
        result = vr(collection, upload_plan, request.POST)
        return http.HttpResponse(json.dumps(result.validation_info().to_json(), indent=2), content_type='application/json')

    else:
        form = ValidationForm()

    return render(request, 'validate_row.html', {'form': form.as_p()})
