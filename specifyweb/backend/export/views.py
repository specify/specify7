import errno
import json
import logging
import os
import traceback
from email.utils import formatdate
from threading import Thread
from xml.etree import ElementTree as ET
from zipfile import ZipFile

from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest, Http404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST
from django.utils import timezone

from .dwca import make_dwca, prettify
from .extract_query import extract_query as extract
from .feed import FEED_DIR, get_feed_resource, update_feed
from specifyweb.backend.context.app_resource import get_app_resource
from specifyweb.backend.notifications.models import Message
from specifyweb.backend.permissions.permissions import PermissionTarget, PermissionTargetAction, \
    check_permission_targets
from specifyweb.specify.models import Spquery, Spqueryfield
from specifyweb.specify.views import login_maybe_required
from specifyweb.middleware.general import require_GET, require_http_methods

logger = logging.getLogger(__name__)

@require_GET
@never_cache
def rss_feed(request):
    """Returns an RSS XML document listing all RSS-enabled DwC archives."""
    from .models import ExportDataSet

    datasets = ExportDataSet.objects.filter(isrss=True)

    rss_node = ET.Element('rss')
    rss_node.set('xmlns:ipt', 'http://ipt.gbif.org/')
    rss_node.set('version', '2.0')

    chan_node = ET.SubElement(rss_node, 'channel')
    ET.SubElement(chan_node, 'title').text = 'Specify DwC Archive Feed'
    ET.SubElement(chan_node, 'link').text = request.build_absolute_uri()
    ET.SubElement(chan_node, 'description').text = 'Darwin Core Archive exports from Specify'
    ET.SubElement(chan_node, 'language').text = 'en'

    for dataset in datasets:
        path = os.path.join(FEED_DIR, dataset.filename)
        try:
            mtime = os.path.getmtime(path)
        except OSError:
            # Archive file doesn't exist yet — skip
            continue

        item_node = ET.SubElement(chan_node, 'item')
        ET.SubElement(item_node, 'title').text = dataset.exportname
        ET.SubElement(item_node, 'guid').text = str(dataset.id)
        ET.SubElement(item_node, 'description').text = (
            f'Darwin Core Archive: {dataset.exportname}'
        )
        ET.SubElement(item_node, 'link').text = request.build_absolute_uri(
            f'/export/download_feed/{dataset.filename}'
        )
        ET.SubElement(item_node, 'ipt:eml').text = request.build_absolute_uri(
            f'/export/extract_eml/{dataset.filename}'
        )
        ET.SubElement(item_node, 'pubDate').text = formatdate(mtime)
        ET.SubElement(item_node, 'type').text = 'DWCA'

    return HttpResponse(prettify(rss_node), content_type='text/xml')


@require_GET
@never_cache
def download_feed(request, filename):
    """Serve a DwCA file from the export feed directory."""
    safe_filename = os.path.basename(filename)
    path = os.path.join(FEED_DIR, safe_filename)
    if not os.path.exists(path):
        raise Http404
    with open(path, 'rb') as f:
        response = HttpResponse(f.read(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{safe_filename}"'
        return response


@require_GET
@never_cache
def extract_eml(request, filename):
    """Return just the EML metadata from the DwCA <filename> hosted on this server.
    Valid file names can be found in the RSS feed.
    """
    safe_filename = os.path.basename(filename)
    path = os.path.join(FEED_DIR, safe_filename)
    if not os.path.exists(path):
        raise Http404
    with ZipFile(path, 'r') as archive:
        meta = ET.fromstring(archive.open('meta.xml').read())
        eml = archive.open(meta.attrib['metadata']).read()
    return HttpResponse(eml, content_type='text/xml')

class DwCAPT(PermissionTarget):
    resource = "/export/dwca"
    execute = PermissionTargetAction()

@login_maybe_required
@require_POST
@never_cache
def export(request):
    """Generate a DwCA export based on the 'definition' and 'metadata'
    POST parameters.  Requesting user must be an admin. A notification
    will be generated for the requesting user when the export
    completes.
    """
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [DwCAPT.execute])

    user = request.specify_user
    collection = request.specify_collection

    try:
        dwca_resource = request.POST['definition']
    except KeyError as e:
        return HttpResponseBadRequest(e)

    eml_resource = request.POST.get('metadata', None)

    definition, _, __ = get_app_resource(collection, user, dwca_resource)

    if eml_resource is not None:
        eml, _, __ = get_app_resource(collection, user, eml_resource)
    else:
        eml = None

    filename = 'dwca_export_%s.zip' % timezone.now().isoformat()
    path = os.path.join(settings.DEPOSITORY_DIR, filename)

    def do_export():
        try:
            make_dwca(collection, user, definition, path, eml=eml)
        except Exception as e:
            tb = traceback.format_exc()
            logger.error('make_dwca failed: %s', tb)
            Message.objects.create(user=user, content=json.dumps({
                'type': 'dwca-export-failed',
                'exception': str(e),
                'traceback': tb if settings.DEBUG else None,
            }))
        else:
            Message.objects.create(user=user, content=json.dumps({
                'type': 'dwca-export-complete',
                'file': filename
            }))

    thread = Thread(target=do_export)
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')

class ExportFeedPT(PermissionTarget):
    resource = "/export/feed"
    force_update = PermissionTargetAction()

@login_maybe_required
@require_POST
def force_update(request):
    """Immediately update all exports defined in the export feed of this
    server.  Requesting user must be an admin and will receive
    notification as the process complete.
    """
    check_permission_targets(None, request.specify_user.id, [ExportFeedPT.force_update])

    user = request.specify_user # I don't want to close over the entire request.
    def try_update_feed():
        try:
            update_feed(force=True, notify_user=user)
        except Exception as e:
            tb = traceback.format_exc()
            logger.error('update_feed failed: %s', tb)
            Message.objects.create(user=user, content=json.dumps({
                'type': 'update-feed-failed',
                'exception': str(e),
                'traceback': tb if settings.DEBUG else None,
            }))

    thread = Thread(target=try_update_feed)
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')

@require_POST
@login_maybe_required
def force_update_packages(request):
    """Rebuild all Export Packages with RSS enabled."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.execute])
    from .models import ExportDataSet
    from .dwca_from_mapping import make_dwca_from_dataset

    user = request.specify_user
    packages = list(ExportDataSet.objects.filter(isrss=True))
    results = []

    def rebuild_all():
        for pkg in packages:
            try:
                make_dwca_from_dataset(pkg, user=user)
                results.append({'id': pkg.id, 'name': pkg.exportname, 'status': 'ok'})
            except Exception as e:
                logger.exception('Failed to rebuild package %s', pkg.id)
                results.append({'id': pkg.id, 'name': pkg.exportname, 'status': 'error', 'error': str(e)})
        Message.objects.create(user=user, content=json.dumps({
            'type': 'rss-update-complete',
            'results': results,
        }))

    thread = Thread(target=rebuild_all)
    thread.daemon = True
    thread.start()
    return HttpResponse(json.dumps({'status': 'started', 'count': len(packages)}),
                        content_type='application/json')


@login_maybe_required
@require_GET
@never_cache
def extract_query(request, query_id):
    """Return an XML snippet for creating a DwCA definition based on the
    query <query_id>.
    """
    query = Spquery.objects.get(id=query_id)
    return HttpResponse(extract(query), 'text/xml')

class SchemaMappingPT(PermissionTarget):
    resource = "/export/schema_mapping"
    create = PermissionTargetAction()
    read = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()

class ExportPackagePT(PermissionTarget):
    resource = "/export/export_package"
    create = PermissionTargetAction()
    read = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()
    execute = PermissionTargetAction()

@require_GET
@login_maybe_required
def get_schema_terms(request):
    """Serve the DwC schema terms vocabulary as JSON."""
    terms_path = os.path.join(os.path.dirname(__file__), 'schema_terms.json')
    with open(terms_path) as f:
        return HttpResponse(f.read(), content_type='application/json')


@require_GET
@login_maybe_required
def list_mappings(request):
    """List all schema mappings. Auto-creates default Core mapping if none exist."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.read])
    from specifyweb.backend.export.models import SchemaMapping
    from .default_mappings import create_default_core_mapping

    # Auto-create default Core mapping if none exist
    if not SchemaMapping.objects.filter(isdefault=True, mappingtype='Core').exists():
        try:
            create_default_core_mapping(
                request.specify_collection, request.specify_user)
        except Exception:
            logger.exception('Failed to create default mappings')

    mappings = SchemaMapping.objects.all().select_related('query')
    result = []
    for m in mappings:
        total = m.query.fields.filter(isdisplay=True).count()
        mapped = m.query.fields.filter(isdisplay=True).exclude(
            term__isnull=True
        ).exclude(term='').count()
        result.append({
            'id': m.id,
            'name': m.name,
            'mappingType': m.mappingtype,
            'isDefault': m.isdefault,
            'queryId': m.query_id,
            'vocabulary': m.vocabulary or 'dwc',
            'totalFields': total,
            'unmappedFields': total - mapped,
        })
    return HttpResponse(json.dumps(result), content_type='application/json')


@require_GET
@login_maybe_required
def list_export_datasets(request):
    """List all export datasets."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.read])
    from specifyweb.backend.export.models import ExportDataSet
    datasets = ExportDataSet.objects.all().values(
        'id', 'exportname', 'filename', 'isrss', 'frequency',
        'coremapping_id', 'collection_id', 'lastexported', 'metadata_id'
    )
    return HttpResponse(json.dumps([
        {
            'id': d['id'],
            'exportName': d['exportname'],
            'fileName': d['filename'],
            'isRss': d['isrss'],
            'frequency': d['frequency'],
            'coreMappingId': d['coremapping_id'],
            'collectionId': d['collection_id'],
            'lastExported': d['lastexported'].isoformat() if d['lastexported'] else None,
            'hasMetadata': d['metadata_id'] is not None,
        }
        for d in datasets
    ]), content_type='application/json')


@require_POST
@login_maybe_required
def clone_mapping(request, mapping_id):
    """Deep-copy a SchemaMapping: creates new SpQuery with all SpQueryFields,
    creates new SchemaMapping pointing to the new query."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.create])

    from specifyweb.backend.export.models import SchemaMapping
    from specifyweb.specify.models import Spqueryfield

    try:
        original = SchemaMapping.objects.select_related('query').get(id=mapping_id)
    except SchemaMapping.DoesNotExist:
        raise Http404

    # Clone the SpQuery
    old_query = original.query
    new_query = Spquery.objects.create(
        name=f'Copy of {old_query.name}',
        contextname=old_query.contextname,
        contexttableid=old_query.contexttableid,
        specifyuser=request.specify_user,
        isfavorite=False,
        ordinal=old_query.ordinal,
        searchsynonymy=old_query.searchsynonymy,
        selectdistinct=old_query.selectdistinct,
        smushed=old_query.smushed,
        countonly=old_query.countonly,
    )

    # Clone all query fields
    for field in old_query.fields.all():
        Spqueryfield.objects.create(
            query=new_query,
            fieldname=field.fieldname,
            stringid=field.stringid,
            tablelist=field.tablelist,
            operstart=field.operstart,
            startvalue=field.startvalue,
            position=field.position,
            sorttype=field.sorttype,
            isdisplay=field.isdisplay,
            isnot=field.isnot,
            isrelfld=field.isrelfld,
            formatname=field.formatname,
            term=field.term,
            isstatic=field.isstatic,
            staticvalue=field.staticvalue,
        )

    # Clone the SchemaMapping
    new_mapping = SchemaMapping.objects.create(
        query=new_query,
        mappingtype=original.mappingtype,
        name=f'Copy of {original.name}',
        isdefault=False,
    )

    return HttpResponse(json.dumps({
        'id': new_mapping.id,
        'name': new_mapping.name,
        'mappingType': new_mapping.mappingtype,
        'isDefault': False,
        'queryId': new_query.id,
    }), content_type='application/json')


@require_POST
@login_maybe_required
def generate_dwca(request, dataset_id):
    """Generate a DwCA from an export dataset and return it as a download.

    Prefers cache tables if available and fresh. Falls back to direct
    query execution if no cache exists.
    """
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.execute])
    from .models import ExportDataSet, CacheTableMeta

    try:
        dataset = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    # Ensure Core mappings have an occurrenceID field
    if dataset.coremapping.mappingtype == 'Core':
        _ensure_occurrence_id_field(dataset.coremapping.query)

    # Validate: all display fields must have a DwC term assigned
    unmapped = []
    for f in dataset.coremapping.query.fields.filter(isdisplay=True).order_by('position'):
        term = getattr(f, 'term', None)
        if not term:
            unmapped.append(f.fieldname or f.stringid or '(unnamed)')
    if unmapped:
        return HttpResponseBadRequest(json.dumps({
            'error': f'Cannot export: {len(unmapped)} field(s) have no DwC term assigned: {", ".join(unmapped)}. '
                     f'Open the mapping in DwC Mapping and assign a term to every field, or remove unmapped fields from the query.'
        }), content_type='application/json')

    try:
        # Try cache-based export first
        cache_meta = CacheTableMeta.objects.filter(
            schemamapping=dataset.coremapping
        ).first()

        if (cache_meta is not None
                and cache_meta.buildstatus == 'idle'
                and cache_meta.lastbuilt is not None
                and cache_meta.rowcount > 0):
            from .dwca_from_cache import make_dwca_from_dataset as make_from_cache
            logger.info('Using cache for dataset %s', dataset_id)
            path = make_from_cache(dataset)
        else:
            from .dwca_from_mapping import make_dwca_from_dataset as make_from_query
            logger.info('Using direct query for dataset %s (no fresh cache)', dataset_id)
            path = make_from_query(dataset, user=request.specify_user)

        with open(path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/zip')
            response['Content-Disposition'] = f'attachment; filename="{dataset.filename}"'
            return response
    except Exception as e:
        logger.exception('DwCA generation failed for dataset %s', dataset_id)
        return HttpResponseBadRequest(json.dumps({'error': str(e)}),
                                      content_type='application/json')


@require_POST
@login_maybe_required
def build_cache(request, dataset_id):
    """Build/rebuild cache tables for an export dataset.

    Dispatches a Celery task for async building. Falls back to synchronous
    if Celery worker is not available.
    """
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.execute])
    from .models import ExportDataSet

    try:
        dataset = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    try:
        from .tasks import build_export_cache
        from specifyweb.celery_tasks import is_worker_alive
        if is_worker_alive():
            result = build_export_cache.delay(dataset_id, request.specify_user.id)
            return HttpResponse(json.dumps({
                'status': 'started',
                'taskId': result.id,
                'datasetId': dataset.id,
            }), content_type='application/json')
    except Exception:
        logger.warning('Celery not available, falling back to synchronous build')

    # Synchronous fallback
    try:
        from .cache import build_cache_tables
        build_cache_tables(dataset, user=request.specify_user)
        return HttpResponse(json.dumps({
            'status': 'ok', 'datasetId': dataset.id,
            'exportName': dataset.exportname,
        }), content_type='application/json')
    except Exception as e:
        logger.exception('Cache build failed for dataset %s', dataset_id)
        return HttpResponseBadRequest(json.dumps({'error': str(e)}),
                                      content_type='application/json')


@require_GET
@login_maybe_required
def validate_occurrence_ids(request, mapping_id):
    """Validate occurrenceID uniqueness for a core mapping's query results."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.read])
    from .models import SchemaMapping
    from django.db import connection

    try:
        mapping = SchemaMapping.objects.get(id=mapping_id)
    except SchemaMapping.DoesNotExist:
        raise Http404

    # Check for duplicate GUIDs in the collection
    # occurrenceID = CollectionObject.guid, which should be unique
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT guid, COUNT(*) as cnt FROM collectionobject '
            'WHERE CollectionMemberID = %s AND guid IS NOT NULL '
            'GROUP BY guid HAVING cnt > 1 LIMIT 20',
            [request.specify_collection.id]
        )
        duplicates = [row[0] for row in cursor.fetchall()]

    return HttpResponse(json.dumps({
        'valid': len(duplicates) == 0,
        'duplicates': duplicates,
        'totalDuplicates': len(duplicates),
    }), content_type='application/json')


@require_GET
@login_maybe_required
def cache_status(request, dataset_id):
    """Get cache build status for an export dataset."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.read])
    from .models import ExportDataSet, CacheTableMeta

    try:
        dataset = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    meta = CacheTableMeta.objects.filter(schemamapping=dataset.coremapping).first()
    return HttpResponse(json.dumps({
        'status': meta.buildstatus if meta else 'idle',
        'lastBuilt': meta.lastbuilt.isoformat() if meta and meta.lastbuilt else None,
        'rowCount': meta.rowcount if meta else None,
    }), content_type='application/json')


def _mapping_to_json(mapping):
    """Serialize a SchemaMapping to a JSON-compatible dict."""
    return {
        'id': mapping.id,
        'name': mapping.name,
        'mappingType': mapping.mappingtype,
        'isDefault': mapping.isdefault,
        'queryId': mapping.query_id,
    }


def _dataset_to_json(dataset):
    """Serialize an ExportDataSet to a JSON-compatible dict."""
    extensions = list(
        dataset.extensions.values_list('schemamapping_id', flat=True)
    )
    return {
        'id': dataset.id,
        'exportName': dataset.exportname,
        'fileName': dataset.filename,
        'isRss': dataset.isrss,
        'frequency': dataset.frequency,
        'coreMappingId': dataset.coremapping_id,
        'collectionId': dataset.collection_id,
        'lastExported': dataset.lastexported.isoformat() if dataset.lastexported else None,
        'extensionIds': extensions,
    }


@require_POST
@login_maybe_required
def create_mapping(request):
    """Create a new SchemaMapping with a backing SpQuery."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.create])
    from .models import SchemaMapping

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return HttpResponseBadRequest(json.dumps({'error': 'Invalid JSON'}),
                                      content_type='application/json')

    name = data.get('name')
    mappingtype = data.get('mappingtype')
    context_table_id = data.get('query_context_table_id')

    if not name or not mappingtype or context_table_id is None:
        return HttpResponseBadRequest(json.dumps({
            'error': 'name, mappingtype, and query_context_table_id are required'
        }), content_type='application/json')

    if mappingtype not in ('Core', 'Extension'):
        return HttpResponseBadRequest(json.dumps({
            'error': 'mappingtype must be Core or Extension'
        }), content_type='application/json')

    # Create a new SpQuery for this mapping
    query = Spquery.objects.create(
        name=name,
        contextname='',
        contexttableid=context_table_id,
        specifyuser=request.specify_user,
        isfavorite=False,
        ordinal=0,
        searchsynonymy=False,
        selectdistinct=False,
        smushed=False,
        countonly=False,
    )

    mapping = SchemaMapping.objects.create(
        query=query,
        mappingtype=mappingtype,
        name=name,
        isdefault=False,
        vocabulary=data.get('vocabulary', 'dwc'),
    )

    if mappingtype == 'Core':
        _ensure_occurrence_id_field(query)

    return HttpResponse(json.dumps(_mapping_to_json(mapping)),
                        content_type='application/json')


def _ensure_occurrence_id_field(query):
    """Ensure a Core mapping's query has a GUID field mapped to occurrenceID.

    If no SpQueryField with the occurrenceID term exists, create one
    at position 0 (shifting others down).
    """
    OCCURRENCE_ID_IRI = 'http://rs.tdwg.org/dwc/terms/occurrenceID'
    GUID_STRINGID = '1.collectionobject.guid'

    existing = Spqueryfield.objects.filter(
        query=query, term=OCCURRENCE_ID_IRI
    ).first()
    if existing is not None:
        return

    # Shift existing fields down by 1
    from django.db.models import F
    query.fields.update(position=F('position') + 1)

    Spqueryfield.objects.create(
        query=query,
        position=0,
        stringid=GUID_STRINGID,
        fieldname='guid',
        isdisplay=False,
        isrelfld=False,
        isnot=False,
        isprompt=False,
        allownulls=True,
        alwaysfilter=False,
        sorttype=0,
        operstart=0,
        startvalue='',
        term=OCCURRENCE_ID_IRI,
    )


@require_GET
@login_maybe_required
def list_queries(request):
    """List SpQuery objects available for mapping to a DwC export.

    Returns queries owned by the current user that are rooted on
    CollectionObject (table id 1) — the standard base table for
    occurrence-based DwC exports.  Queries already backing a
    SchemaMapping are excluded to prevent accidental sharing.
    """
    from .models import SchemaMapping
    used_query_ids = set(
        SchemaMapping.objects.values_list('query_id', flat=True)
    )
    queries = (
        Spquery.objects
        .filter(specifyuser=request.specify_user, contexttableid=1)
        .order_by('-id')
        .values('id', 'name', 'contexttableid')
    )
    result = [
        {'id': q['id'], 'name': q['name'] or f"Query #{q['id']}",
         'contextTableId': q['contexttableid']}
        for q in queries
        if q['id'] not in used_query_ids
    ]
    return HttpResponse(json.dumps(result), content_type='application/json')


@require_POST
@login_maybe_required
def create_mapping_from_query(request):
    """Create a SchemaMapping backed by an existing SpQuery."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.create])
    from .models import SchemaMapping

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return HttpResponseBadRequest(json.dumps({'error': 'Invalid JSON'}),
                                      content_type='application/json')

    name = data.get('name')
    mappingtype = data.get('mappingtype')
    query_id = data.get('query_id')

    if not name or not mappingtype or query_id is None:
        return HttpResponseBadRequest(json.dumps({
            'error': 'name, mappingtype, and query_id are required'
        }), content_type='application/json')

    if mappingtype not in ('Core', 'Extension'):
        return HttpResponseBadRequest(json.dumps({
            'error': 'mappingtype must be Core or Extension'
        }), content_type='application/json')

    try:
        query = Spquery.objects.get(id=query_id)
    except Spquery.DoesNotExist:
        return HttpResponseBadRequest(json.dumps({
            'error': f'Query {query_id} not found'
        }), content_type='application/json')

    # Prevent reusing a query already backing another mapping
    if SchemaMapping.objects.filter(query=query).exists():
        return HttpResponseBadRequest(json.dumps({
            'error': 'This query is already used by another mapping'
        }), content_type='application/json')

    mapping = SchemaMapping.objects.create(
        query=query,
        mappingtype=mappingtype,
        name=name,
        isdefault=False,
        vocabulary=data.get('vocabulary', 'dwc'),
    )

    if mappingtype == 'Core':
        _ensure_occurrence_id_field(query)

    return HttpResponse(json.dumps(_mapping_to_json(mapping)),
                        content_type='application/json')


@require_http_methods(['PUT'])
@login_maybe_required
def update_mapping(request, mapping_id):
    """Update a SchemaMapping's name and/or isdefault."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.update])
    from .models import SchemaMapping

    try:
        mapping = SchemaMapping.objects.get(id=mapping_id)
    except SchemaMapping.DoesNotExist:
        raise Http404

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return HttpResponseBadRequest(json.dumps({'error': 'Invalid JSON'}),
                                      content_type='application/json')

    if 'name' in data:
        mapping.name = data['name']
    if 'isdefault' in data:
        mapping.isdefault = data['isdefault']

    mapping.timestampmodified = timezone.now()
    mapping.save()

    return HttpResponse(json.dumps(_mapping_to_json(mapping)),
                        content_type='application/json')


@require_http_methods(['DELETE'])
@login_maybe_required
def delete_mapping(request, mapping_id):
    """Delete a SchemaMapping and its backing SpQuery."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.delete])
    from .models import ExportDataSet, SchemaMapping

    try:
        mapping = SchemaMapping.objects.select_related('query').get(id=mapping_id)
    except SchemaMapping.DoesNotExist:
        raise Http404

    if mapping.isdefault:
        return HttpResponseBadRequest(json.dumps({
            'error': 'Default mappings cannot be deleted. Clone it to create your own version.'
        }), content_type='application/json')

    # Check if any export packages reference this mapping
    referencing = ExportDataSet.objects.filter(coremapping=mapping)
    if referencing.exists():
        names = list(referencing.values_list('exportname', flat=True)[:10])
        return HttpResponseBadRequest(json.dumps({
            'error': 'in_use',
            'message': f'This mapping is used by {referencing.count()} export package(s) and cannot be deleted.',
            'packages': names,
        }), content_type='application/json')

    query = mapping.query
    mapping.delete()
    query.delete()

    return HttpResponse(json.dumps({'status': 'ok'}),
                        content_type='application/json')


@require_POST
@login_maybe_required
def save_mapping_fields(request, mapping_id):
    """Save DwC term assignments for all fields in a mapping's query."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.update])
    from .models import SchemaMapping

    try:
        mapping = SchemaMapping.objects.get(id=mapping_id)
    except SchemaMapping.DoesNotExist:
        raise Http404

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return HttpResponseBadRequest(json.dumps({'error': 'Invalid JSON'}),
                                      content_type='application/json')

    fields = data.get('fields')
    if not isinstance(fields, list):
        return HttpResponseBadRequest(json.dumps({'error': 'fields must be a list'}),
                                      content_type='application/json')

    query_field_ids = set(
        mapping.query.fields.values_list('id', flat=True)
    )

    updated = 0
    for field_spec in fields:
        field_id = field_spec.get('fieldid')
        if field_id is None or field_id not in query_field_ids:
            continue

        update_kwargs = {}
        if 'term' in field_spec:
            update_kwargs['term'] = field_spec['term']
        if 'isstatic' in field_spec:
            update_kwargs['isstatic'] = field_spec['isstatic']
        if 'staticvalue' in field_spec:
            update_kwargs['staticvalue'] = field_spec['staticvalue']

        if update_kwargs:
            update_kwargs['timestampmodified'] = timezone.now()
            Spqueryfield.objects.filter(id=field_id).update(**update_kwargs)
            updated += 1

    return HttpResponse(json.dumps({'status': 'ok', 'updated': updated}),
                        content_type='application/json')


@require_POST
@login_maybe_required
def create_dataset(request):
    """Create a new ExportDataSet."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.create])
    from .models import ExportDataSet, ExportDataSetExtension, SchemaMapping

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return HttpResponseBadRequest(json.dumps({'error': 'Invalid JSON'}),
                                      content_type='application/json')

    exportname = data.get('exportname')
    filename = data.get('filename')
    coremapping_id = data.get('coremapping_id')

    if not exportname or not filename or coremapping_id is None:
        return HttpResponseBadRequest(json.dumps({
            'error': 'exportname, filename, and coremapping_id are required'
        }), content_type='application/json')

    try:
        coremapping = SchemaMapping.objects.get(id=coremapping_id)
    except SchemaMapping.DoesNotExist:
        return HttpResponseBadRequest(json.dumps({
            'error': f'SchemaMapping {coremapping_id} not found'
        }), content_type='application/json')

    # Handle EML upload if provided
    metadata_resource = None
    eml_xml = data.get('eml_xml')
    if eml_xml:
        from specifyweb.specify.models import Spappresource, Spappresourcedata, Spappresourcedir
        app_dir = Spappresourcedir.objects.filter(
            specifyuser=request.specify_user,
            collection=request.specify_collection,
        ).first()
        if app_dir is None:
            app_dir = Spappresourcedir.objects.filter(
                collection=request.specify_collection,
            ).first()
        if app_dir is None:
            app_dir = Spappresourcedir.objects.first()
        resource = Spappresource.objects.create(
            name=f'eml_{exportname}',
            mimetype='text/xml',
            level=0,
            specifyuser=request.specify_user,
            spappresourcedir=app_dir,
        )
        Spappresourcedata.objects.create(
            spappresource=resource,
            data=eml_xml,
        )
        metadata_resource = resource

    dataset = ExportDataSet.objects.create(
        exportname=exportname,
        filename=filename,
        coremapping=coremapping,
        collection=request.specify_collection,
        isrss=data.get('isrss', False),
        frequency=data.get('frequency'),
        metadata=metadata_resource,
    )

    # Create extension associations
    extension_ids = data.get('extension_ids', [])
    for i, ext_id in enumerate(extension_ids):
        try:
            ext_mapping = SchemaMapping.objects.get(id=ext_id)
            ExportDataSetExtension.objects.create(
                exportdataset=dataset,
                schemamapping=ext_mapping,
                sortorder=i,
            )
        except SchemaMapping.DoesNotExist:
            pass

    return HttpResponse(json.dumps(_dataset_to_json(dataset)),
                        content_type='application/json')


@require_http_methods(['PUT'])
@login_maybe_required
def update_dataset(request, dataset_id):
    """Update an ExportDataSet."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.update])
    from .models import ExportDataSet, ExportDataSetExtension, SchemaMapping

    try:
        dataset = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return HttpResponseBadRequest(json.dumps({'error': 'Invalid JSON'}),
                                      content_type='application/json')

    if 'exportname' in data:
        dataset.exportname = data['exportname']
    if 'filename' in data:
        dataset.filename = data['filename']
    if 'isrss' in data:
        dataset.isrss = data['isrss']
    if 'frequency' in data:
        dataset.frequency = data['frequency']
    if 'coremapping_id' in data:
        try:
            coremapping = SchemaMapping.objects.get(id=data['coremapping_id'])
            dataset.coremapping = coremapping
        except SchemaMapping.DoesNotExist:
            return HttpResponseBadRequest(json.dumps({
                'error': f'SchemaMapping {data["coremapping_id"]} not found'
            }), content_type='application/json')

    # Handle EML upload/replace
    eml_xml = data.get('eml_xml')
    if eml_xml:
        from specifyweb.specify.models import Spappresource, Spappresourcedata, Spappresourcedir
        # Delete old metadata resource if it exists
        if dataset.metadata is not None:
            Spappresourcedata.objects.filter(spappresource=dataset.metadata).delete()
            dataset.metadata.delete()
        # Find a valid app resource dir for this user
        app_dir = Spappresourcedir.objects.filter(
            specifyuser=request.specify_user,
            collection=request.specify_collection,
        ).first()
        if app_dir is None:
            app_dir = Spappresourcedir.objects.filter(
                collection=request.specify_collection,
            ).first()
        if app_dir is None:
            app_dir = Spappresourcedir.objects.first()
        resource = Spappresource.objects.create(
            name=f'eml_{dataset.exportname}',
            mimetype='text/xml',
            level=0,
            specifyuser=request.specify_user,
            spappresourcedir=app_dir,
        )
        Spappresourcedata.objects.create(
            spappresource=resource,
            data=eml_xml,
        )
        dataset.metadata = resource

    dataset.timestampmodified = timezone.now()
    dataset.save()

    # Update extensions if provided
    if 'extension_ids' in data:
        dataset.extensions.all().delete()
        for i, ext_id in enumerate(data['extension_ids']):
            try:
                ext_mapping = SchemaMapping.objects.get(id=ext_id)
                ExportDataSetExtension.objects.create(
                    exportdataset=dataset,
                    schemamapping=ext_mapping,
                    sortorder=i,
                )
            except SchemaMapping.DoesNotExist:
                pass

    return HttpResponse(json.dumps(_dataset_to_json(dataset)),
                        content_type='application/json')


@require_POST
@login_maybe_required
def clone_dataset(request, dataset_id):
    """Clone an ExportDataSet."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.create])
    from .models import ExportDataSet, ExportDataSetExtension

    try:
        source = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    clone = ExportDataSet.objects.create(
        exportname=f'Copy of {source.exportname}',
        filename=f'copy_{source.filename}',
        coremapping=source.coremapping,
        collection=source.collection,
        isrss=source.isrss,
        frequency=source.frequency,
    )

    for ext in source.extensions.all():
        ExportDataSetExtension.objects.create(
            exportdataset=clone,
            schemamapping=ext.schemamapping,
            sortorder=ext.sortorder,
        )

    return HttpResponse(json.dumps(_dataset_to_json(clone)),
                        content_type='application/json')


@require_http_methods(['DELETE'])
@login_maybe_required
def delete_dataset(request, dataset_id):
    """Delete an ExportDataSet."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.delete])
    from .models import ExportDataSet

    try:
        dataset = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    dataset.delete()

    return HttpResponse(json.dumps({'status': 'ok'}),
                        content_type='application/json')


@require_GET
@login_maybe_required
def preview_eml(request, dataset_id):
    """Return the EML metadata for an export dataset as JSON summary."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.read])
    from .models import ExportDataSet

    try:
        dataset = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    if dataset.metadata is None:
        return HttpResponse(json.dumps({'hasMetadata': False}),
                            content_type='application/json')

    from specifyweb.specify.models import Spappresourcedata
    data = Spappresourcedata.objects.filter(
        spappresource=dataset.metadata
    ).first()
    if data is None or not data.data:
        return HttpResponse(json.dumps({'hasMetadata': False}),
                            content_type='application/json')

    content = data.data
    if isinstance(content, bytes):
        content = content.decode('utf-8')

    # Parse key fields for preview
    from xml.etree import ElementTree as ET
    preview = {'hasMetadata': True, 'raw': content}
    try:
        ns = {'eml': 'eml://ecoinformatics.org/eml-2.1.1'}
        root = ET.fromstring(content)
        ds = root.find('dataset', ns) or root.find('dataset')
        if ds is not None:
            title_el = ds.find('title', ns) or ds.find('title')
            preview['title'] = title_el.text if title_el is not None else None

            abstract_el = ds.find('.//abstract/para', ns) or ds.find('.//abstract/para')
            preview['abstract'] = abstract_el.text if abstract_el is not None else None

            creator = ds.find('creator', ns) or ds.find('creator')
            if creator is not None:
                org = creator.find('organizationName', ns) or creator.find('organizationName')
                given = creator.find('.//givenName', ns) or creator.find('.//givenName')
                sur = creator.find('.//surName', ns) or creator.find('.//surName')
                parts = []
                if given is not None and given.text:
                    parts.append(given.text)
                if sur is not None and sur.text:
                    parts.append(sur.text)
                preview['creator'] = ' '.join(parts) if parts else None
                preview['organization'] = org.text if org is not None else None

            license_el = ds.find('.//intellectualRights//citetitle', ns) or ds.find('.//intellectualRights//citetitle')
            preview['license'] = license_el.text if license_el is not None else None
    except Exception:
        pass

    return HttpResponse(json.dumps(preview), content_type='application/json')
