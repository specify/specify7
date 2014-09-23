import requests

from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings

from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.api import objs_to_data, toJson
from specifyweb.specify.models import Spappresource


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

    if settings.REPORT_RUNNER_PORT == '':
        port = 80
    else:
        port = settings.REPORT_RUNNER_PORT

    options = dict(request.POST)

    r = requests.post("http://%s:%s/report" %
                     (settings.REPORT_RUNNER_HOST, port),
                     data=options)

    if r.status_code == 200:
        return HttpResponse(r.content, content_type="application/pdf")
    else:
        raise ReportException(r.text)

@require_GET
@login_maybe_required
def get_reports(request):
    reports = Spappresource.objects.filter(
        specifyuser=request.specify_user,
        mimetype__startswith="jrxml",
        spappresourcedir__discipline=request.specify_collection.discipline) \
        .filter(
            Q(spappresourcedir__collection=None) |
            Q(spappresourcedir__collection=request.specify_collection))

    data = objs_to_data(reports)
    return HttpResponse(toJson(data), content_type="application/json")
