import os
from zipfile import ZipFile
from threading import Thread
from datetime import datetime
from email.Utils import formatdate
import json

from xml.etree import ElementTree as ET

from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, Http404, HttpResponseForbidden
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.cache import never_cache
from django.conf import settings

from ..specify.views import login_maybe_required
from ..context.app_resource import get_app_resource
from ..notifications.models import Message
from ..specify.models import Spquery

from .dwca import make_dwca, prettify
from .extract_query import extract_query as extract
from .feed import FEED_DIR, get_feed_resource, update_feed


@require_GET
@never_cache
def rss_feed(request):
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
    with ZipFile(os.path.join(FEED_DIR, filename), 'r') as archive:
        meta = ET.fromstring(archive.open('meta.xml').read())
        eml = archive.open(meta.attrib['metadata']).read()
    return HttpResponse(eml, content_type='text/xml')


@login_maybe_required
@require_POST
@never_cache
def export(request):
    if not request.specify_user.is_admin():
        return HttpResponseForbidden()

    user = request.specify_user
    collection = request.specify_collection

    try:
        dwca_resource = request.POST['definition']
    except KeyError as e:
        return HttpResponseBadRequest(e)

    eml_resource = request.POST.get('metadata', None)

    definition, _ = get_app_resource(collection, user, dwca_resource)

    if eml_resource is not None:
        eml, _ = get_app_resource(collection, user, eml_resource)
    else:
        eml = None

    filename = 'dwca_export_%s.zip' % datetime.now().isoformat()
    path = os.path.join(settings.DEPOSITORY_DIR, filename)

    def do_export():
        make_dwca(collection, user, definition, path, eml=eml)

        Message.objects.create(user=user, content=json.dumps({
            'type': 'dwca-export-complete',
            'file': filename
        }))

    thread = Thread(target=do_export)
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')

@login_maybe_required
@require_POST
def force_update(request):
    if not request.specify_user.is_admin():
        return HttpResponseForbidden()

    thread = Thread(target=update_feed, kwargs={'force': True, 'notify_user': request.specify_user})
    thread.daemon = True
    thread.start()
    return HttpResponse('OK', content_type='text/plain')

@login_maybe_required
@require_GET
@never_cache
def extract_query(request, query_id):
    query = Spquery.objects.get(id=query_id)
    return HttpResponse(extract(query), 'text/xml')
