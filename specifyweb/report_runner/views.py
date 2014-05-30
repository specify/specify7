import json
import os
import requests
from uuid import uuid4

from django.views.decorators.http import require_GET
from django.http import HttpResponse
from django.conf import settings

from specifyweb.specify.views import login_required
from specifyweb.specify.api import objs_to_data, toJson
from specifyweb.specify.models import Spappresource

TEST_JSON = '''
{
    "databaseSettings": {
        "databaseName": "KU_Fish_Tissue_20131007",
        "masterUser": "Master",
        "masterPassword": "Master",
        "hostname": "localhost"
    },
    "specifySettings": {
        "collectionName": "KUFishvoucher",
        "userName": "testuser"
    },
    "reportId": 26,
    "recordSetId": null,
    "reportParameters": {},
    "queryParameters": [
        {
            "queryFieldId": 703,
            "text1": "Andy",
            "text2": "",
            "operator": 1,
            "isNegated": false
        }
    ]
}
'''

class ReportException(Exception):
    pass

@require_GET
@login_required
def run(request):
    options = {
        "collectionName": request.specify_collection.collectionname,
        "userName": request.specify_user.name,
        "reportId": int(request.GET['reportId']),
        "recordSetId": int(request.GET['recordSetId']),
        "reportParameters": {},
        "queryParameters": [
            # {
            #     "queryFieldId": 703,
            #     "text1": "Andy",
            #     "text2": "",
            #     "operator": 1,
            #     "isNegated": false
            # }
        ]
    }
    print options

    r = requests.get("http://localhost:8080/report", params=options)
    if r.status_code == 200:
        return HttpResponse(r.content, content_type="application/pdf")
    else:
        raise ReportException(r.text)

@require_GET
@login_required
def get_reports(request):
    reports = Spappresource.objects.filter(
        specifyuser=request.specify_user,
        mimetype__startswith="jrxml",
        spappresourcedir__collection=request.specify_collection)

    data = objs_to_data(reports)
    return HttpResponse(toJson(data), content_type="application/json")
