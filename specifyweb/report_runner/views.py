import requests

from django.views.decorators.http import require_GET
from django.http import HttpResponse
from django.conf import settings

from specifyweb.specify.views import login_required
from specifyweb.specify.api import objs_to_data, toJson
from specifyweb.specify.models import Spappresource


class ReportException(Exception):
    pass

@require_GET
def get_status(request):
    resp = {'available': settings.REPORT_RUNNER_HOST != ''}
    return HttpResponse(toJson(resp), content_type="application/json")

@require_GET
@login_required
def run(request):
    if settings.REPORT_RUNNER_HOST == '':
        raise ReportException("Report service is not configured.")

    if settings.REPORT_RUNNER_PORT == '':
        port = 80
    else:
        port = settings.REPORT_RUNNER_PORT

    options = dict(request.GET)
    options.update({
        "collectionName": request.specify_collection.collectionname,
        "userName": request.specify_user.name
    })

    r = requests.get("http://%s:%s/report" %
                     (settings.REPORT_RUNNER_HOST, port),
                     params=options)

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
