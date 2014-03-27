import json
import os
from uuid import uuid4
from subprocess import Popen, PIPE, call, check_call, check_output

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


@require_GET
@login_required
def run(request):
    options = {
        "databaseSettings": {
            "databaseName": "KU_Fish_Tissue_20131007",
            "masterUser": "Master",
            "masterPassword": "Master",
            "hostname": "localhost"
        },
        "specifySettings": {
            "collectionName": request.specify_collection.collectionname,
            "userName": request.specify_user.name
        },
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
    result_file = call_java(options)
    return HttpResponse(open(result_file, "rb"), content_type="application/pdf")

def call_java(options):

    options['outputFile'] = os.path.join('/tmp/', str(uuid4()) + '.pdf')

    report_runner = Popen(["/usr/bin/java", "-jar", "specify.jar"],
                          stdin=PIPE, cwd=settings.SPECIFY_THICK_CLIENT)

    json.dump(options, report_runner.stdin)
    report_runner.stdin.close()
    report_runner.wait()
    return options['outputFile']

@require_GET
@login_required
def get_reports(request):
    reports = Spappresource.objects.filter(
        specifyuser=request.specify_user,
        mimetype__startswith="jrxml",
        spappresourcedir__collection=request.specify_collection)

    data = objs_to_data(reports)
    return HttpResponse(toJson(data), content_type="application/json")
