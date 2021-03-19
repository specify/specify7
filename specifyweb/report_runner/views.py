import requests
import json

from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.cache import cache_control
from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings

from ..specify.views import login_maybe_required
from ..specify.api import objs_to_data, toJson
from ..specify.models import Spappresource
from ..stored_queries.execution import run_ephemeral_query

class ReportException(Exception):
    pass

@require_GET
@cache_control(max_age=86400, private=True)
def get_status(request):
    "Indicates whether a report runner server is available."
    resp = {'available': settings.REPORT_RUNNER_HOST != ''}
    return HttpResponse(toJson(resp), content_type="application/json")

@require_POST
@login_maybe_required
def run(request):
    """Executes the named 'report' using the given 'query' and 'parameters' as POST parameters.
    Returns the result as a PDF.
    """
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
                            'parameters': request.POST['parameters'],
                            'data': toJson(report_data)})

    if r.status_code == 200:
        return HttpResponse(r.content, content_type="application/pdf")
    else:
        raise ReportException(r.text)

@require_GET
@login_maybe_required
def get_reports(request):
    "Returns a list of available reports and labels."
    reports = Spappresource.objects.filter(
        mimetype__startswith="jrxml",
        spappresourcedir__discipline=request.specify_collection.discipline) \
        .filter(
            Q(spappresourcedir__collection=None) |
            Q(spappresourcedir__collection=request.specify_collection)) \
        .filter(
            Q(spappresourcedir__specifyuser=request.specify_user) |
            Q(spappresourcedir__ispersonal=False))


    data = objs_to_data(reports, limit=100)
    return HttpResponse(toJson(data), content_type="application/json")

@require_GET
@login_maybe_required
def get_reports_by_tbl(request, tbl_id):
    "Returns a list of availabel reports and labels for the given table <tbl_id>."
    reports = Spappresource.objects.filter(
        mimetype__startswith="jrxml",
        spappresourcedir__discipline=request.specify_collection.discipline) \
        .filter(
            Q(spappresourcedir__collection=None) |
            Q(spappresourcedir__collection=request.specify_collection)) \
        .filter(
            Q(spappresourcedir__specifyuser=request.specify_user) |
            Q(spappresourcedir__ispersonal=False)) \
        .filter(
            Q(spreports__query__contexttableid=tbl_id))

    data = objs_to_data(reports, limit=100)
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
