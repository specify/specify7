import logging
import json
from threading import Thread
from datetime import datetime

from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseRedirect, HttpResponseForbidden
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.cache import never_cache

from ..specify.models import Collection, Recordset
from ..specify.api import toJson, uri_for_model
from ..specify.views import login_maybe_required, apply_access_control
from ..permissions.permissions import PermissionTarget, PermissionTargetAction, check_permission_targets, check_table_permissions

from . import models
from .queryfield import QueryField
from .execution import execute, run_ephemeral_query, do_export, recordset

logger = logging.getLogger(__name__)

class QueryBuilderPt(PermissionTarget):
    resource = "/querybuilder/query"
    execute = PermissionTargetAction()
    export_csv = PermissionTargetAction()
    export_kml = PermissionTargetAction()
    create_recordset = PermissionTargetAction()

def value_from_request(field, get):
    try:
        return get['f%s' % field.spQueryFieldId]
    except KeyError:
        return None

@require_GET
@login_maybe_required
@never_cache
def query(request, id):
    """Executes and returns the results of query with id <id>.
    'limit' and 'offset' may be provided as GET parameters.
    """
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [QueryBuilderPt.execute])
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))

    with models.session_context() as session:
        sp_query = session.query(models.SpQuery).get(int(id))
        distinct = sp_query.selectDistinct
        tableid = sp_query.contextTableId
        count_only = sp_query.countOnly

        field_specs = [QueryField.from_spqueryfield(field, value_from_request(field, request.GET))
                       for field in sorted(sp_query.fields, key=lambda field: field.position)]

        data = execute(session, request.specify_collection, request.specify_user,
                       tableid, distinct, count_only, field_specs, limit, offset)

    return HttpResponse(toJson(data), content_type='application/json')


@require_POST
@login_maybe_required
@never_cache
def ephemeral(request):
    """Executes and returns the results of the query provided as JSON in the POST body."""
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [QueryBuilderPt.execute])
    try:
        spquery = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)
    data = run_ephemeral_query(request.specify_collection, request.specify_user, spquery)
    return HttpResponse(toJson(data), content_type='application/json')


@require_POST
@login_maybe_required
@never_cache
def export_csv(request):
    """Executes and return as CSV the results of the query provided as JSON in the POST body."""
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [
        QueryBuilderPt.execute, QueryBuilderPt.export_csv])
    try:
        spquery = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)

    logger.info('export query: %s', spquery)

    if 'collectionid' in spquery:
        collection = Collection.objects.get(pk=spquery['collectionid'])
        logger.debug('forcing collection to %s', collection.collectionname)
    else:
        collection = request.specify_collection

    filename = 'query_results_%s.csv' % datetime.now().isoformat()

    thread = Thread(target=do_export, args=(spquery, collection, request.specify_user, filename, 'csv', None))
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')

@require_POST
@login_maybe_required
@never_cache
def export_kml(request):
    """Executes and return as KML the results of the query provided as JSON in the POST body."""
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [
        QueryBuilderPt.execute, QueryBuilderPt.export_kml])
    try:
        spquery = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)

    logger.info('export query: %s', spquery)

    abs_uri = request.build_absolute_uri('')
    the_host = abs_uri.replace(request.path_info,'')

    if 'collectionid' in spquery:
        collection = Collection.objects.get(pk=spquery['collectionid'])
        logger.debug('forcing collection to %s', collection.collectionname)
    else:
        collection = request.specify_collection

    filename = 'query_results_%s.kml' % datetime.now().isoformat()

    thread = Thread(target=do_export, args=(spquery, collection, request.specify_user, filename, 'kml', the_host))
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')

@require_POST
@login_maybe_required
@apply_access_control
@never_cache
def make_recordset(request):
    """Executes the query provided as JSON in the POST body and creates a
    recordset of the result. Redirects to the URL of the created recordset.
    """
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [QueryBuilderPt.execute])
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [QueryBuilderPt.create_recordset])
    check_table_permissions(request.specify_collection, request.specify_user, Recordset, "create")
    try:
        recordset_info = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)

    new_rs_id = recordset(request.specify_collection, request.specify_user,
                          request.specify_user_agent, recordset_info)

    return HttpResponseRedirect(uri_for_model('recordset', new_rs_id))

