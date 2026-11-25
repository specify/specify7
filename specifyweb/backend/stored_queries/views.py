import json
import logging
from collections import defaultdict
from datetime import datetime
from threading import Thread

from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden, \
    HttpResponseRedirect, JsonResponse, HttpRequest
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods, require_POST
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from specifyweb.middleware.general import require_GET
from specifyweb.backend.stats.coordination import (
    StatisticsBusy, busy_response, run_statistics_query, statistics_result,
)
from specifyweb.backend.stored_queries.batch_edit import run_batch_edit
from specifyweb.backend.stored_queries.access import (
    ensure_query_access, ensure_query_write_access, filter_queries_for_user,
    query_is_shared,
)
from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.specify.api.serializers import toJson, uri_for_model
from specifyweb.specify.datamodel import datamodel
from . import models
from .execution import execute, run_ephemeral_query, do_export, recordset
from .queryfield import QueryField, fields_from_json
from specifyweb.backend.permissions.permissions import PermissionTarget, PermissionTargetAction, \
    check_permission_targets, check_table_permissions
from specifyweb.specify.models import Collection, Recordset, Recordsetitem, \
    Loanreturnpreparation, Loanpreparation, Loan, Spquery
from specifyweb.specify.views import login_maybe_required
from .execution import execute, run_ephemeral_query, do_export, recordset, \
    return_loan_preps as rlp, get_query_tables


logger = logging.getLogger(__name__)

class QueryBuilderPt(PermissionTarget):
    resource = "/querybuilder/query"
    execute = PermissionTargetAction()
    export_csv = PermissionTargetAction()
    export_kml = PermissionTargetAction()
    export_to_web_portal = PermissionTargetAction()
    create_recordset = PermissionTargetAction()

@require_http_methods(['GET', 'POST'])
@login_maybe_required
@never_cache
def query_folders(request: HttpRequest) -> JsonResponse | HttpResponseBadRequest:
    """List the user's folders or create one; omitted sections default to personal."""
    if request.method == 'GET':
        check_table_permissions(
            request.specify_collection, request.specify_user_agent, Spquery, 'read'
        )
        folders = models.QueryFolder.objects.filter(
            owner=request.specify_user
        ).order_by('name', 'id')
        return JsonResponse(
            {
                'folders': [
                    {
                        'id': folder.id,
                        'name': folder.name,
                        'parentId': folder.parent_id,
                        'section': folder.section,
                        **({'sharingGroup': folder.sharing_group} if folder.sharing_group else {}),
                    }
                    for folder in folders
                ]
            }
        )

    check_table_permissions(
        request.specify_collection, request.specify_user_agent, Spquery, 'create'
    )
    try:
        data = json.loads(request.body)
    except ValueError:
        return HttpResponseBadRequest('Request body must contain valid JSON.')

    if not isinstance(data, dict):
        return HttpResponseBadRequest('Request body must be a JSON object.')

    section = data.get('section', 'personal')
    if not isinstance(section, str) or section not in models.QueryFolder.Section.values:
        return HttpResponseBadRequest(
            'section must be personal, sharing, or shared.'
        )

    name = data.get('name')
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 256:
        return HttpResponseBadRequest(
            'Folder name must contain 1 to 256 characters.'
        )

    parent_id = data.get('parentId')
    if parent_id is not None and (type(parent_id) is not int or parent_id < 1):
        return HttpResponseBadRequest(
            'parentId must be a positive integer or null.'
        )

    parent = None
    if parent_id is not None:
        parent = models.QueryFolder.objects.filter(
            id=parent_id, owner=request.specify_user, section=section
        ).first()
        if parent is None:
            return HttpResponseBadRequest(
                'parentId must reference a folder belonging to the current user '
                'in the same query section.'
            )

    folder = models.QueryFolder.objects.create(
        name=name.strip(),
        parent=parent,
        owner=request.specify_user,
        section=section,
    )
    return JsonResponse(
        {
            'id': folder.id,
            'name': folder.name,
            'parentId': folder.parent_id,
            'section': folder.section,
        },
        status=201,
    )


@require_POST
@login_maybe_required
@never_cache
def move_query_to_folder(request: HttpRequest, id: int) -> HttpResponse:
    """Organize a visible query, updating inherited folder sharing as needed."""
    check_table_permissions(
        request.specify_collection, request.specify_user_agent, Spquery, 'read'
    )
    ensure_query_access(id, request.specify_user.id)
    try:
        data = json.loads(request.body)
    except ValueError:
        return HttpResponseBadRequest('Request body must contain valid JSON.')
    if not isinstance(data, dict):
        return HttpResponseBadRequest('Request body must be a JSON object.')
    folder_id = data.get('folderId')
    if type(folder_id) is not int or folder_id < 1:
        return HttpResponseBadRequest('folderId must be a positive integer.')
    folder = models.QueryFolder.objects.filter(
        pk=folder_id, owner=request.specify_user
    ).first()
    if folder is None:
        return HttpResponseBadRequest(
            'folderId must reference a folder belonging to the current user.'
        )
    query = Spquery.objects.filter(pk=id)
    if folder.section == models.QueryFolder.Section.SHARED:
        query = filter_queries_for_user(query, request.specify_user.id).exclude(
            specifyuser=request.specify_user
        )
    else:
        query = query.filter(specifyuser=request.specify_user)
    if not query.exists():
        return HttpResponseBadRequest('The query does not belong to this query section.')
    from .folder_sharing import sharing_ancestor
    from specifyweb.specify.models import Specifyuser
    from django.db.models import F

    with transaction.atomic():
        Specifyuser.objects.select_for_update().get(pk=request.specify_user.id)
        locked_query = get_object_or_404(Spquery.objects.select_for_update(), pk=id)
        membership = models.QueryFolderMembership.objects.filter(
            owner=request.specify_user, query_id=id, section=folder.section
        ).first()
        previous_sharing = membership.sharing_folder_id if membership else None
        folders = list(models.QueryFolder.objects.filter(
            owner=request.specify_user, section=folder.section
        ))
        current_folder = next((item for item in folders if item.id == folder.id), None)
        if current_folder is None:
            return HttpResponseBadRequest('The destination folder no longer exists.')
        shared_folder = sharing_ancestor(folders, current_folder)
        if folder.section == models.QueryFolder.Section.PERSONAL:
            if previous_sharing is None and query_is_shared(id):
                return HttpResponseBadRequest('Shared queries cannot be moved into Your Queries.')
            if (previous_sharing is not None or shared_folder is not None) and not request.specify_user.is_admin():
                return HttpResponseForbidden('Only a Specify Administrator can change folder sharing.')
        elif folder.section == models.QueryFolder.Section.SHARING and not query_is_shared(id):
            return HttpResponseBadRequest('The query does not belong to this query section.')
        models.QueryFolderMembership.objects.update_or_create(
            owner=request.specify_user,
            query_id=id,
            section=folder.section,
            defaults={'folder': folder, 'sharing_folder': shared_folder},
        )
        if previous_sharing != (shared_folder.id if shared_folder else None):
            Spquery.objects.filter(pk=locked_query.pk).update(version=F('version') + 1)
    return JsonResponse({'queryId': id, 'folderId': folder.id, 'section': folder.section})


@require_GET
@login_maybe_required
@never_cache
def query_favorites(request: HttpRequest) -> JsonResponse:
    """Return the current user's favorites that they can still access."""
    check_table_permissions(
        request.specify_collection, request.specify_user_agent, Spquery, 'read'
    )
    visible_queries = filter_queries_for_user(
        Spquery.objects.all(), request.specify_user.id
    )
    query_ids = models.QueryFavorite.objects.filter(
        owner=request.specify_user, query__in=visible_queries
    ).order_by('query_id').values_list('query_id', flat=True)
    return JsonResponse({'queryIds': list(query_ids)})


@require_POST
@login_maybe_required
@never_cache
def favorite_query(request: HttpRequest, id: int) -> JsonResponse | HttpResponseBadRequest:
    """Add a visible query to personal favorites without modifying the query."""
    check_table_permissions(
        request.specify_collection, request.specify_user_agent, Spquery, 'read'
    )
    ensure_query_access(id, request.specify_user.id)
    with transaction.atomic():
        query = get_object_or_404(Spquery.objects.select_for_update(), pk=id)
        if models.QueryArchive.objects.filter(
            owner=request.specify_user, query=query
        ).exists():
            return HttpResponseBadRequest('Archived queries cannot be favorited.')
        models.QueryFavorite.objects.get_or_create(
            owner=request.specify_user, query=query
        )
    return JsonResponse({'queryId': id})


@require_POST
@login_maybe_required
@never_cache
def unfavorite_query(request: HttpRequest, id: int) -> JsonResponse:
    """Remove only the current user's favorite, leaving the query unchanged."""
    check_table_permissions(
        request.specify_collection, request.specify_user_agent, Spquery, 'read'
    )
    ensure_query_access(id, request.specify_user.id)
    with transaction.atomic():
        query = get_object_or_404(Spquery.objects.select_for_update(), pk=id)
        models.QueryFavorite.objects.filter(
            owner=request.specify_user, query=query
        ).delete()
    return JsonResponse({'queryId': id})


@require_POST
@login_maybe_required
@never_cache
def archive_query(request: HttpRequest, id: int) -> JsonResponse | HttpResponseBadRequest:
    """Archive an unshared owned query and remove its personal favorite status."""
    check_table_permissions(
        request.specify_collection, request.specify_user_agent, Spquery, 'read'
    )
    ensure_query_access(id, request.specify_user.id)
    with transaction.atomic():
        query = get_object_or_404(Spquery.objects.select_for_update(), pk=id)
        ensure_query_write_access(query, request.specify_user.id)
        if query_is_shared(query.id):
            return HttpResponseBadRequest('Only queries in Your Queries can be archived.')
        models.QueryArchive.objects.get_or_create(
            owner=request.specify_user, query=query
        )
        models.QueryFavorite.objects.filter(
            owner=request.specify_user, query=query
        ).delete()
    return JsonResponse({'queryId': id})


@require_POST
@login_maybe_required
@never_cache
def restore_query(request: HttpRequest, id: int) -> JsonResponse | HttpResponseBadRequest:
    """Restore an archived personal query to the main Your Queries list."""
    check_table_permissions(
        request.specify_collection, request.specify_user_agent, Spquery, 'read'
    )
    ensure_query_access(id, request.specify_user.id)
    with transaction.atomic():
        query = get_object_or_404(Spquery.objects.select_for_update(), pk=id)
        ensure_query_write_access(query, request.specify_user.id)
        archived = models.QueryArchive.objects.filter(
            owner=request.specify_user, query=query
        )
        if not archived.exists():
            return HttpResponseBadRequest('Only archived queries can be restored.')
        if query_is_shared(query.id):
            return HttpResponseBadRequest('Stop sharing this query before restoring it to Your Queries.')
        models.QueryFolderMembership.objects.filter(
            owner=request.specify_user, query=query,
            section=models.QueryFolder.Section.PERSONAL,
        ).delete()
        archived.delete()
    return JsonResponse({'queryId': id})


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
  

def ephemeral_statistics_to_str(spquery):
    """Return a cache key based only on inputs that affect ephemeral query results."""
    execution_fields = (
        "stringid",
        "isrelfld",
        "operstart",
        "startvalue",
        "isnot",
        "isdisplay",
        "sorttype",
        "formatname",
        "isstrict",
    )
    fields = [
        {name: field.get(name) for name in execution_fields}
        for field in sorted(spquery["fields"], key=lambda field: field["position"])
    ]
    if spquery["countonly"]:
        # Include all execution inputs to break ties between repeated string IDs.
        fields.sort(key=lambda field: (field["stringid"], json.dumps(field, sort_keys=True)))
    query = {
        "contexttableid": spquery["contexttableid"],
        "selectdistinct": spquery["selectdistinct"],
        "countonly": spquery["countonly"],
        "limit": spquery.get("limit", 20),
        "offset": spquery.get("offset", 0),
        "recordsetid": spquery.get("recordsetid"),
        "smushed": spquery.get("smushed"),
        "searchsynonymy": bool(spquery.get("searchsynonymy", False)),
        "formatauditrecids": spquery.get("formatauditrecids", False),
        "fields": fields,
    }
    return json.dumps(query, sort_keys=True)


@require_GET
@login_maybe_required
@never_cache
def query(request, id):
    """Executes and returns the results of query with id <id>.
    'limit' and 'offset' may be provided as GET parameters.
    """
    ensure_query_access(id, request.specify_user.id)
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [QueryBuilderPt.execute])
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))

    with models.session_context() as session:
        sp_query = session.query(models.SpQuery).get(int(id))
        distinct = sp_query.selectDistinct
        series = sp_query.smushed
        search_synonymy = sp_query.searchSynonymy
        tableid = sp_query.contextTableId
        count_only = sp_query.countOnly

        query_fields = [QueryField.from_spqueryfield(field, value_from_request(field, request.GET))
                       for field in sorted(sp_query.fields, key=lambda field: field.position)]

        data = execute(
            session=session, 
            collection=request.specify_collection, 
            user=request.specify_user,
            tableid=tableid, 
            distinct=distinct, 
            series=series,
            search_synonymy=search_synonymy,
            count_only=count_only, 
            query_fields=query_fields,
            limit=limit, 
            offset=offset
        )

    return HttpResponse(toJson(data), content_type='application/json')

def run_statistic_query(collection, user, spquery) -> HttpResponse:
    query_fields = fields_from_json(spquery["fields"])
    tables = get_query_tables(query_fields)
    tables.add(datamodel.get_table_by_id_strict(spquery["contexttableid"]))
    # Cached results cannot recheck query grants; formatters may follow extra paths.
    needs_live_visibility = any(
        table.name.lower() in {"spquery", "spqueryfield"} for table in tables
    ) or any(
        field.fieldspec.needs_formatted() for field in query_fields
    )

    def calculate_statistics() -> str:
        data = run_ephemeral_query(collection, user, spquery)
        return json.dumps({
            "content": toJson(data),
            "tables": sorted(table.name for table in tables),
        })

    try:
        if needs_live_visibility:
            with run_statistics_query(calculate_statistics) as content:
                pass
        else:
            # Keep metadata-bearing entries separate from older body-only cache entries.
            content = statistics_result(
                collection,
                user,
                ephemeral_statistics_to_str(spquery),
                calculate_statistics,
            )
    except StatisticsBusy:
        return busy_response()
    result = json.loads(content)
    for table_name in result["tables"]:
        check_table_permissions(
            collection, user, datamodel.get_table_strict(table_name), "read"
        )
    return HttpResponse(result["content"], content_type='application/json')

@require_POST
@login_maybe_required
@never_cache
def ephemeral(request):
    """Execute the query provided as JSON in the POST body."""

    spquery, collection = get_query(request)
    if request.headers.get("Specify-Statistic") == "true":
        return run_statistic_query(collection, request.specify_user, spquery)

    data = run_ephemeral_query(collection, request.specify_user, spquery)

    return HttpResponse(toJson(data), content_type='application/json')

def get_query(request):
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
    return spquery, collection

@require_POST
@login_maybe_required
@never_cache
def batch_edit(request):
    """Executes and returns the results of the query provided as JSON in the POST body."""
    spquery, collection = get_query(request)
    ds_id, ds_name = run_batch_edit(collection, request.specify_user, spquery, request.specify_user_agent)
    return HttpResponse(toJson({"id": ds_id, "name": ds_name}), status=201, content_type='application/json')

@require_POST
@login_maybe_required
@never_cache
def export_csv(request):
    """Executes and return as CSV the results of the query provided as JSON in the POST body."""
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

    check_permission_targets(collection.id, request.specify_user.id, [
        QueryBuilderPt.execute, QueryBuilderPt.export_csv])
    
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

    check_permission_targets(collection.id, request.specify_user.id, [
        QueryBuilderPt.execute, QueryBuilderPt.export_kml])

    file_name = format_export_file_name(spquery, "kml")

    thread = Thread(target=do_export, args=(spquery, collection, request.specify_user, file_name, 'kml', the_host))
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')


@require_POST
@login_maybe_required
@never_cache
def export_to_web_portal(request):
    """Executes and returns as ZIP the web portal export package for the query provided as JSON in the POST body."""
    try:
        spquery = json.load(request)
    except ValueError:
        return HttpResponseBadRequest('Invalid query data.')

    spquery_log_preview = str(spquery)[:200] if isinstance(spquery, dict) else spquery
    spquery_log_preview = str(spquery_log_preview).replace('\r', '').replace('\n', '')
    logger.info('export web portal query: %s', spquery_log_preview)

    if 'collectionid' in spquery:
        collection = Collection.objects.get(pk=spquery['collectionid'])
        logger.debug('forcing collection to %s', collection.collectionname)
    else:
        collection = request.specify_collection

    check_permission_targets(collection.id, request.specify_user.id, [
        QueryBuilderPt.execute,
        QueryBuilderPt.export_to_web_portal,
    ])

    file_name = format_export_file_name(spquery, 'zip')

    thread = Thread(
        target=do_export,
        args=(spquery, collection, request.specify_user, file_name, 'webportal', None),
    )
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')

@require_POST
@login_maybe_required
@never_cache
def make_recordset(request): # pragma: no cover
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
    # Why does this require execute permission?
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
            # This should be HTTP error (rather than being a JSON response)
            return JsonResponse({'error': 'No valid recordsets found'}, status=404)
        
        first_recordset_name = recordsets.first().name

        # Verify that the 'tableid' field in all the recordsets is the same
        tableid = recordsets.first().dbtableid
        if not all(recordset.dbtableid == tableid for recordset in recordsets):
            return JsonResponse({'error': 'All recordsets must have the same tableid'}, status=400)

        model_name = model_names_by_table_id[tableid] if tableid in model_names_by_table_id else None
        current_date = timezone.now().strftime('%Y-%m-%d')
        if not model_name: # this check is unnecessary.
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

        # FEAT: Make it return the new recordset id.
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
