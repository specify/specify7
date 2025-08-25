import json

import requests
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.template import loader
from django.utils.translation import gettext as _
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_POST

from specifyweb.middleware.general import require_GET, require_http_methods
from specifyweb.backend.permissions.permissions import PermissionTarget, PermissionTargetAction, \
    check_permission_targets, check_table_permissions
from specifyweb.specify.api import obj_to_data, toJson, \
    HttpResponseCreated, objs_to_data_, _obj_to_data
from specifyweb.backend.datamodel.models import Spappresource, Spappresourcedir, Spreport, Spquery
from specifyweb.specify.views import login_maybe_required
from specifyweb.backend.stored_queries.execution import run_ephemeral_query, models
from specifyweb.backend.stored_queries.queryfield import QueryField


class ReportException(Exception):
    pass

class ReportsPT(PermissionTarget):
    resource = "/report"
    execute = PermissionTargetAction()

@require_http_methods(['GET', 'HEAD'])
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
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [ReportsPT.execute])

    if settings.REPORT_RUNNER_HOST == '':
        raise ReportException(_("Report service is not configured."))

    port = settings.REPORT_RUNNER_PORT
    if port == '': port = 80

    report_data = run_query(request.specify_collection, request.specify_user, request.POST['query'])
    if len(report_data['rows']) < 1:
        return HttpResponse(_("The report query returned no results."), content_type="text/plain")

    r = requests.post("http://%s:%s/report" %
                      (settings.REPORT_RUNNER_HOST, port),
                      data={'report': request.POST['report'],
                            'parameters': request.POST['parameters'],
                            'data': toJson(report_data)})

    if r.status_code == 200:
        return HttpResponse(r.content, content_type="application/pdf")
    else:
        raise ReportException(r.text)

def get_reports_view(request):
    return get_reports_by_table(request, table_id=None)

@require_GET
@login_maybe_required
def get_reports_by_table(request, table_id):
    "Returns a list of available reports and labels."
    reports = Spappresource.objects.filter(
        mimetype__icontains="jrxml/",
        spappresourcedir__discipline=request.specify_collection.discipline) \
        .prefetch_related('spreports') \
        .filter(
        Q(spappresourcedir__collection=None) |
        Q(spappresourcedir__collection=request.specify_collection)) \
        .filter(
        Q(spappresourcedir__specifyuser=request.specify_user) |
        Q(spappresourcedir__ispersonal=False))

    if table_id is not None:
        reports = reports.filter(Q(spreports__query__contexttableid=table_id))

    def map(app_resource):
        report = app_resource.spreports.first()
        return dict(
            app_resource=app_resource,
            report=report,
            query=None if report is None else report.query
        )

    response = [
        map(app_resource) for app_resource in reports
    ]

    data = objs_to_data_(
        response,
        len(response),
        lambda o: {
            key: None if value is None else _obj_to_data(value, lambda x: None)
            for key, value in o.items()
        },
        request.GET.get('offset', 0),
        request.GET.get('limit', 0)
    )

    return HttpResponse(toJson(data), content_type="application/json")

@require_POST
@login_maybe_required
def create(request):
    check_table_permissions(request.specify_collection, request.specify_user, Spreport, "create")
    report = create_report(
        request.specify_user.id,
        request.specify_collection.discipline.id,
        request.POST['queryid'],
        request.POST['mimetype'],
        request.POST['name'],
    )
    return HttpResponseCreated(toJson(obj_to_data(report)), content_type="application/json")

@transaction.atomic
def create_report(user_id, discipline_id, query_id, mimetype, name):
    if mimetype not in ("jrxml/label", "jrxml/report"): raise AssertionError(
        "Can not create report: mimetype not 'jrxml/label' or 'jrxml/report'", 
        {"localizationKey" : "invalidReportMimetype"})
    query = Spquery.objects.get(id=query_id)

    spappdirs_matched = Spappresourcedir.objects.filter(discipline_id=discipline_id, collection_id=None)
    if len(spappdirs_matched) == 0:
        spappdir = Spappresourcedir.objects.create(discipline_id=discipline_id)
    else:
        spappdir = spappdirs_matched[0]

    appresource = spappdir.sppersistedappresources.create(
        version=0,
        mimetype=mimetype,
        level=0,
        name=name,
        description=name,
        specifyuser_id=user_id,
        metadata="tableid=-1;reporttype=Report;",
        )
    appresource.spappresourcedatas.create(
        version=0,
        data=template_report_for_query(query_id, name),
    )
    return Spreport.objects.create(
        version=0,
        name=name,
        appresource=appresource,
        query_id=query_id,
        specifyuser_id=user_id,
    )

def template_report_for_query(query_id, name):
    def field_element(field):
        queryfield = QueryField.from_spqueryfield(field)
        fieldspec = queryfield.fieldspec
        fieldspec_field = fieldspec.get_field()
        field_type = fieldspec_field.type if fieldspec_field is not None else "java.lang.String"

        if field.formatName \
           or field.isRelFld \
           or fieldspec.tree_rank \
           or fieldspec.date_part \
           or field_type in ("java.sql.Timestamp", "java.util.Calendar", "java.util.Date", "text"):
            field_type = 'java.lang.String'

        return dict(stringid=field.stringId, field_type=field_type)

    with models.session_context() as session:
        sp_query = session.query(models.SpQuery).get(query_id)

        field_els = [
            field_element(field)
            for field in sorted(sp_query.fields, key=lambda field: field.position)
            if field.isDisplay
        ]

    template = loader.get_template('report_template.xml')
    return template.render({
        'name': name,
        'fields': field_els
    })


def run_query(collection, user, query_json):
    try:
        spquery = json.loads(query_json)
    except ValueError as e:
        raise ReportException(e)
    spquery['limit'] = 0

    report_fields = ['id'] + [
        field['stringid']
        for field in sorted(spquery['fields'], key=lambda f: f['position'])
        if field['isdisplay']
    ]

    query_result = run_ephemeral_query(collection, user, spquery)

    return {'fields': report_fields, 'rows': query_result['results']}
