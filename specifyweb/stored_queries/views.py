import json
import logging
from collections import defaultdict
from datetime import datetime
from threading import Thread

from django.http import HttpResponse, HttpResponseBadRequest, \
    HttpResponseRedirect, JsonResponse, HttpRequest
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST
from django.db import transaction
from django.utils import timezone

from specifyweb.middleware.general import require_GET
from specifyweb.specify.models_by_table_id import model_names_by_table_id
from . import models
from .execution import execute, run_ephemeral_query, do_export, recordset, \
    return_loan_preps as rlp
from .queryfield import QueryField
from ..permissions.permissions import PermissionTarget, PermissionTargetAction, \
    check_permission_targets, check_table_permissions
from ..specify.api import toJson, uri_for_model
from ..specify.models import Collection, Recordset, Recordsetitem, \
    Loanreturnpreparation, Loanpreparation, Loan
from ..specify.views import login_maybe_required

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

"""Determines how the date part of Query Export file names should be formatted
View the Python documentation for a comprehensive list of Format Codes:
    https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes

The frontend manually downloads the file when query rows are selected
Preferably, this format should remain consistent with the front-end export name


Current Format Example: 
    Wed Jun 07 2023
"""
QUERY_EXPORT_DATE_FORMAT = r"%a %b %d %Y"

def format_export_file_name(spquery, file_extension = ''):
    """Prepares and returns a file name for a given <query_name>
    
    Returns the date in the following fomrat: '<query_name> - {date_as_formatted_string}'
        Example: New Query - Wed Jun 07 2023 
    If a <file_extension> is given, concatenate the extension to the string with a '.'
    """
    query_name = spquery['name']
    is_new = 'id' not in spquery.keys()
    query_base_table = spquery['contextname']

    date_as_string = datetime.now().strftime(QUERY_EXPORT_DATE_FORMAT)
    non_extension = f"{query_name}{' ' if is_new else ''}{query_base_table if is_new else ''} - {date_as_string}"
    return non_extension if not file_extension else non_extension + ".%s" % file_extension
  

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
        series = sp_query.selectSeries
        tableid = sp_query.contextTableId
        count_only = sp_query.countOnly

        field_specs = [QueryField.from_spqueryfield(field, value_from_request(field, request.GET))
                       for field in sorted(sp_query.fields, key=lambda field: field.position)]

        data = execute(session, request.specify_collection, request.specify_user,
                       tableid, distinct, series, count_only, field_specs, limit, offset)

    return HttpResponse(toJson(data), content_type='application/json')


@require_POST
@login_maybe_required
@never_cache
def ephemeral(request):
    """Executes and returns the results of the query provided as JSON in the POST body."""
    try:
        spquery = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)


    if 'collectionid' in spquery:
        collection = Collection.objects.get(pk=spquery['collectionid'])
        logger.debug('forcing collection to %s', collection.collectionname)
    else:
        collection = request.specify_collection

    check_permission_targets(collection.id, request.specify_user.id, [QueryBuilderPt.execute])
    data = run_ephemeral_query(collection, request.specify_user, spquery)
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
    
    file_name = format_export_file_name(spquery, "csv")

    thread = Thread(target=do_export, args=(spquery, collection, request.specify_user, file_name, 'csv', None))
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

    file_name = format_export_file_name(spquery, "kml")

    thread = Thread(target=do_export, args=(spquery, collection, request.specify_user, file_name, 'kml', the_host))
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')

@require_POST
@login_maybe_required
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

@login_maybe_required
@require_POST
def merge_recordsets(request: HttpRequest) -> JsonResponse:
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [QueryBuilderPt.execute])
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [QueryBuilderPt.create_recordset])
    check_table_permissions(request.specify_collection, request.specify_user, Recordset, "create")
    
    try:
        # The request body should be a JSON object with a 'recordsetids' key, that has a list of recordset IDs to merge
        request_data = json.loads(request.body)
        recordset_ids = request_data.get('recordsetids', [])

        if not recordset_ids:
            return JsonResponse({'error': 'No recordset IDs provided'}, status=400)

        # Get the recordset records for the given IDs from the RecordSet table
        recordsets = Recordset.objects.filter(id__in=recordset_ids)

        if not recordsets.exists():
            return JsonResponse({'error': 'No valid recordsets found'}, status=404)
        
        first_recordset_name = recordsets.first().name

        # Verify that the 'tableid' field in all the recordsets is the same
        tableid = recordsets.first().dbtableid
        if not all(recordset.dbtableid == tableid for recordset in recordsets):
            return JsonResponse({'error': 'All recordsets must have the same tableid'}, status=400)

        model_name = model_names_by_table_id[tableid] if tableid in model_names_by_table_id else None
        current_date = timezone.now().strftime('%Y-%m-%d')
        if not model_name:
            return JsonResponse({'error': 'Model not found for tableid'}, status=400)

        # Get all the recordsetitems for the given recordsets
        recordsetitems = Recordsetitem.objects.filter(recordset__in=recordsets)

        # Get a list of record IDs from the recordsetitems
        records_ids = recordsetitems.values_list('recordid', flat=True).distinct()

        with transaction.atomic():
            # Create a new recordsset record
            new_recordset = Recordset.objects.create(
                dbtableid=tableid,
                name=first_recordset_name,
                type=0,
                collectionmemberid=request.specify_collection.id,
                specifyuser=request.specify_user,
                createdbyagent=request.specify_user_agent,
                modifiedbyagent=request.specify_user_agent,
            )

            # Create a new recordsetitem record for each record ID in the list
            Recordsetitem.objects.bulk_create([
                Recordsetitem(
                    recordset=new_recordset,
                    recordid=record_id,
                ) for record_id in records_ids
            ])

            # Delete the old recordsetitem and recordset records
            recordsetitems.delete()
            recordsets.delete()

        return JsonResponse({'message': 'Recordset merge successful'}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_POST
@login_maybe_required
@never_cache
def return_loan_preps(request):
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [QueryBuilderPt.execute])
    check_table_permissions(request.specify_collection, request.specify_user, Loanreturnpreparation, "create")
    check_table_permissions(request.specify_collection, request.specify_user, Loanpreparation, "read")
    check_table_permissions(request.specify_collection, request.specify_user, Loan, "update")
    try:
        data = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)

    to_return = rlp(request.specify_collection, request.specify_user, request.specify_user_agent, data)

    resp = defaultdict(lambda: {'loanpreparations': list()})
    for lp_id, quantity, loan_id, loan_no in to_return:
        item = resp[loan_id]
        item['loannumber'] = loan_no
        item['loanpreparations'].append({'loanpreparationid': lp_id, 'quantity': int(quantity)})

    return JsonResponse(resp, safe=False)

