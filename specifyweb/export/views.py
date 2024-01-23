import os
import errno
import logging
import traceback
from zipfile import ZipFile
from email.utils import formatdate

from xml.etree import ElementTree as ET

from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, Http404, HttpResponseForbidden
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.cache import never_cache
from django.conf import settings

from ..specify.views import login_maybe_required
from ..context.app_resource import get_app_resource
from ..notifications.models import Message
from ..specify.models import Spquery
from ..permissions.permissions import PermissionTarget, PermissionTargetAction, check_permission_targets

from .dwca import prettify
from .extract_query import extract_query as extract
from .feed import FEED_DIR, get_feed_resource
from . import tasks

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

    try:
        dwca_resource = request.POST['definition']
    except KeyError as e:
        return HttpResponseBadRequest(e)

    eml_resource = request.POST.get('metadata', None)

    tasks.make_dwca.apply_async([
        request.specify_collection.id,
        request.specify_user.id,
        dwca_resource,
        eml_resource,
    ])
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

    tasks.update_feed.apply_async([request.specify_user.id, True])
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
