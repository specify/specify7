import requests
import json

from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings

from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.api import objs_to_data, toJson
from specifyweb.specify.models import Spappresource
from specifyweb.stored_queries.views import run_ephemeral_query

class ReportException(Exception):
    pass

@require_GET
def get_status(request):
    resp = {'available': settings.REPORT_RUNNER_HOST != ''}
    return HttpResponse(toJson(resp), content_type="application/json")

@require_POST
@csrf_exempt
@login_maybe_required
def run(request):
    if settings.REPORT_RUNNER_HOST == '':
        raise ReportException("Report service is not configured.")

    port = settings.REPORT_RUNNER_PORT
    if port == '': port = 80

    report_data = run_query(request.specify_collection, request.specify_user, request.POST['query'])
    if len(report_data['rows']) < 1:
        return HttpResponse("The report query returned no results.", content_type="text/plain")

    r = requests.post("http://%s:%s/report" %
                      (settings.REPORT_RUNNER_HOST, port),
                      data={'report': request.POST['report'],
                            'data': toJson(report_data)})

    if r.status_code == 200:
        return HttpResponse(r.content, content_type="application/pdf")
    else:
        raise ReportException(r.text)

@require_GET
@login_maybe_required
def get_reports(request):
    reports = Spappresource.objects.filter(
        mimetype__startswith="jrxml",
        spappresourcedir__discipline=request.specify_collection.discipline) \
        .filter(
            Q(spappresourcedir__collection=None) |
            Q(spappresourcedir__collection=request.specify_collection)) \
        .filter(
            Q(spappresourcedir__specifyuser=request.specify_user) |
            Q(spappresourcedir__ispersonal=False))


    data = objs_to_data(reports)
    return HttpResponse(toJson(data), content_type="application/json")

def run_query(collection, user, query_json):
    try:
        spquery = json.loads(query_json)
    except ValueError as e:
        raise ReportException(e)
    spquery['limit'] = 0

    report_fields = ['id'] + [field['stringid']
                              for field in sorted(spquery['fields'],
                                                  key=lambda f: f['position'])]

    query_result = run_ephemeral_query(collection, user, spquery)

    return {'fields': report_fields, 'rows': query_result['results']}
