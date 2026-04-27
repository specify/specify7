import errno
import json
import logging
import os
import traceback
from datetime import datetime
from email.utils import formatdate
from threading import Thread
from xml.etree import ElementTree as ET
from zipfile import ZipFile

from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest, Http404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST

from .dwca import make_dwca, prettify
from .extract_query import extract_query as extract
from .feed import FEED_DIR, get_feed_resource, update_feed
from specifyweb.backend.context.app_resource import get_app_resource
from specifyweb.backend.notifications.models import Message
from specifyweb.backend.permissions.permissions import PermissionTarget, PermissionTargetAction, \
    check_permission_targets
from specifyweb.specify.models import Spquery
from specifyweb.specify.views import login_maybe_required
from specifyweb.middleware.general import require_GET

logger = logging.getLogger(__name__)

@require_GET
@never_cache
def rss_feed(request):
    "Returns an RSS XML document of the DwCA exports generated on this server."
    feed_resource = get_feed_resource()
    if feed_resource is None:
        raise Http404

    def_tree = ET.fromstring(feed_resource)

    rss_node = ET.Element('rss')
    rss_node.set('xmlns:ipt', "http://ipt.gbif.org/")
    rss_node.set('version', "2.0")

    chan_node = ET.SubElement(rss_node, 'channel')
    ET.SubElement(chan_node, 'link').text = request.build_absolute_uri()

    for tag in 'title description language'.split():
        for node in def_tree.findall(tag):
            ET.SubElement(chan_node, tag).text = node.text

    for item_def in def_tree.findall('item'):
        if 'publish' not in item_def.attrib or item_def.attrib['publish'] != 'true':
            continue

        filename = item_def.attrib['filename']
        path = os.path.join(FEED_DIR, filename)
        try:
            mtime = os.path.getmtime(path)
        except OSError as e:
            if e.errno == errno.ENOENT:
                continue
            else:
                raise

        item_node = ET.SubElement(chan_node, 'item')

        for tag in 'title id guid description'.split():
            for node in item_def.findall(tag):
                ET.SubElement(item_node, tag).text = node.text

        ET.SubElement(item_node, 'link').text = request.build_absolute_uri(
            '/static/depository/export_feed/%s' % filename
        )

        ET.SubElement(item_node, 'ipt:eml').text = request.build_absolute_uri(
            '/export/extract_eml/%s' % filename
        )

        ET.SubElement(item_node, 'pubDate').text = formatdate(mtime)
        ET.SubElement(item_node, 'type').text = "DWCA"

    return HttpResponse(prettify(rss_node), content_type='text/xml')


@require_GET
@never_cache
def extract_eml(request, filename):
    """Return just the EML metadata from the DwCA <filename> hosted on this server.
    Valid file names can be found in the RSS feed.
    """
    with ZipFile(os.path.join(FEED_DIR, filename), 'r') as archive:
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

    filename = 'dwca_export_%s.zip' % datetime.now().isoformat()
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
    """List all schema mappings."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.read])
    from specifyweb.backend.export.models import SchemaMapping
    mappings = SchemaMapping.objects.all().values('id', 'name', 'mapping_type', 'is_default', 'query_id')
    return HttpResponse(json.dumps([
        {
            'id': m['id'],
            'name': m['name'],
            'mappingType': m['mapping_type'],
            'isDefault': m['is_default'],
            'queryId': m['query_id'],
        }
        for m in mappings
    ]), content_type='application/json')


@require_GET
@login_maybe_required
def list_export_datasets(request):
    """List all export datasets."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.read])
    from specifyweb.backend.export.models import ExportDataSet
    datasets = ExportDataSet.objects.all().values(
        'id', 'exportname', 'filename', 'rss', 'frequency',
        'coremapping_id', 'collection_id', 'lastexported'
    )
    return HttpResponse(json.dumps([
        {
            'id': d['id'],
            'exportName': d['exportname'],
            'fileName': d['filename'],
            'isRss': d['rss'],
            'frequency': d['frequency'],
            'coreMappingId': d['coremapping_id'],
            'collectionId': d['collection_id'],
            'lastExported': d['lastexported'].isoformat() if d['lastexported'] else None,
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
        mapping_type=original.mapping_type,
        name=f'Copy of {original.name}',
        is_default=False,
        specifyuser=request.specify_user,
        createdbyagent=request.specify_user.agents.first(),
    )

    return HttpResponse(json.dumps({
        'id': new_mapping.id,
        'name': new_mapping.name,
        'mappingType': new_mapping.mapping_type,
        'isDefault': False,
        'queryId': new_query.id,
    }), content_type='application/json')


@require_POST
@login_maybe_required
def generate_dwca(request, dataset_id):
    """Generate a DwCA from an export dataset."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.execute])
    from .models import ExportDataSet
    from .dwca_from_cache import make_dwca_from_dataset

    try:
        dataset = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    try:
        path = make_dwca_from_dataset(dataset)
        Message.objects.create(
            user=request.specify_user,
            content=json.dumps({
                'type': 'dwca-export-complete',
                'fileName': dataset.filename,
                'exportName': dataset.exportname,
            }),
        )
        return HttpResponse(json.dumps({'status': 'ok', 'path': path}),
                            content_type='application/json')
    except Exception as e:
        logger.exception('DwCA generation failed for dataset %s', dataset_id)
        return HttpResponseBadRequest(json.dumps({'error': str(e)}),
                                      content_type='application/json')


@require_POST
@login_maybe_required
def build_cache(request, dataset_id):
    """Build/rebuild cache tables for an export dataset."""
    check_permission_targets(None, request.specify_user.id, [ExportPackagePT.execute])
    from .models import ExportDataSet
    from .cache import build_cache_tables

    try:
        dataset = ExportDataSet.objects.get(id=dataset_id)
    except ExportDataSet.DoesNotExist:
        raise Http404

    try:
        build_cache_tables(dataset)
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
    """Validate occurrenceID uniqueness in a core mapping's cache table."""
    check_permission_targets(None, request.specify_user.id, [SchemaMappingPT.read])
    from .models import SchemaMapping
    from .cache import validate_occurrence_id_uniqueness

    try:
        mapping = SchemaMapping.objects.get(id=mapping_id)
    except SchemaMapping.DoesNotExist:
        raise Http404

    collection = request.specify_collection
    duplicates = validate_occurrence_id_uniqueness(mapping, collection)
    return HttpResponse(json.dumps({
        'valid': len(duplicates) == 0,
        'duplicates': duplicates[:20],
        'totalDuplicates': len(duplicates),
    }), content_type='application/json')


@require_GET
@login_maybe_required
def cache_status(request, dataset_id):
    """Get cache build status for an export dataset."""
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
