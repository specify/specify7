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
from ..context.app_resource import get_app_resource
from ..notifications.models import Message
from ..backend.permissions.permissions import PermissionTarget, PermissionTargetAction, \
    check_permission_targets
from ..specify.models import Spquery
from ..specify.views import login_maybe_required
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
