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

from .upload import do_upload_csv
from .upload_plan_schema import schema, parse_plan


logger = logging.getLogger(__name__)


class UploadForm(forms.Form):
    upload_plan = forms.CharField(widget=forms.Textarea)
    csv_data = forms.CharField(widget=forms.Textarea)
    commit = forms.BooleanField(required=False)


class NoCommit(Exception):
    pass

@login_maybe_required
@apply_access_control
def upload(request) -> Any:
    if request.method == 'POST':
        form = UploadForm(request.POST)
        if form.is_valid():
            plan = json.loads(form.cleaned_data['upload_plan'])
            validate(plan, schema)
            reader = csv.DictReader(io.StringIO(form.cleaned_data['csv_data']))

            try:
                with transaction.atomic():
                    result = do_upload_csv(request.specify_collection, reader, parse_plan(request.specify_collection, plan))
                    if not form.cleaned_data['commit']:
                        raise NoCommit()

            except NoCommit:
                pass

            return http.HttpResponse(json.dumps(result), content_type='application/json')
    else:
        form = UploadForm()

    return render(request, 'upload_new.html', {'form': form.as_p()})

