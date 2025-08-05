import os
import hmac
import json
import logging
import time
from tempfile import mkdtemp
from os.path import splitext
from uuid import uuid4
from xml.etree import ElementTree
from datetime import datetime
from django.apps import apps
from stream_zip import ZIP_32, stream_zip
from stat import S_IFREG

import requests
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest, \
    StreamingHttpResponse
from django.db import transaction
from django.utils.translation import gettext as _
from django.views.decorators.cache import cache_control, never_cache
from django.views.decorators.http import require_POST
from django.utils.text import get_valid_filename

from specifyweb.middleware.general import require_http_methods
from specifyweb.specify.views import login_maybe_required, openapi
from specifyweb.specify import models
from specifyweb.specify.models import Recordsetitem
from specifyweb.specify.models_by_table_id import get_model_by_table_id

from .dataset_views import dataset_view, datasets_view
logger = logging.getLogger(__name__)

server_urls = None
server_time_delta = None

from .models import Spattachmentdataset


class AttachmentError(Exception):
    pass

def get_collection(request=None):
    """Return the collection name to pass to the asset server.

    The asset server has an anti-feature that allows it to save assets
    for different collections in different directories. The idea is
    unsound, however, because some assets may be attached to records
    which are shared by objects in different collections. For
    instance, Localities may have attachments, but the same Locality
    may be used by multiple collections. If we save a locality
    attachment into a directory associated with the currently logged
    in collection, it will be unavailable to other collections.

    For this reason it is recommend to store all assets for a database
    in the same directory. This can be accomplished for Sp6 by
    configuring the asset server to map all collections to the same
    folder. For Sp7 we often override the collection using the
    WEB_ATTACHMENT_COLLECTION setting to use the database name. This
    allows a single asset server to service multiple Sp7 instances.
    """

    if settings.WEB_ATTACHMENT_COLLECTION:
        # A specific collection name is defined in the settings.
        return settings.WEB_ATTACHMENT_COLLECTION

    if request is not None \
        and hasattr(settings, 'SEPARATE_WEB_ATTACHMENT_FOLDERS') \
        and settings.SEPARATE_WEB_ATTACHMENT_FOLDERS:
        # We use the client's logged in collection.
        # This will work OK for saving and retrieving assets
        # attached to records scoped to the collection level.
        return request.specify_collection.collectionname

    # If there's no request object to tell us which
    # collection the client is logged into, we can't
    # do any better than using the first collection
    # and hoping that all the assets are in the same
    # folder.
    # from specifyweb.specify.models import Collection
    # return Collection.objects.all()[0].collectionname

    # The default coll parameter to assets is the database name
    return settings.DATABASE_NAME

@openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Information required for interacting with the asset server.",
                "content": {"application/json": {"schema": {
                    'type': 'object',
                    'nullable': True,
                    'properties': {
                        'collection': {'type': 'string', 'description': 'The collection name to use.'},
                        'token_required_for_get': {'type': 'boolean', 'description': 'Whether a token is required for retrieving assets.'},
                    },
                    'additionalProperties': {'type': 'string', 'description': 'URL for accessing the asset server.'},
                    'required': ['collection', 'token_required_for_get']
                    }
                }}},
        }
    }
})
@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=86400, private=True)
def get_settings(request):
    "Returns settings needed to access the asset server for this Specify instance."
    if server_urls is None:
        return HttpResponse("{}", content_type='application/json')

    data = {
        'collection': get_collection(request),
        'token_required_for_get': settings.WEB_ATTACHMENT_REQUIRES_KEY_FOR_GET
        }
    data.update(server_urls)
    return HttpResponse(json.dumps(data), content_type='application/json')

@openapi(schema={
    "get": {
        "parameters": [
            {'in': 'query', 'name': 'filename', 'required': True, 'schema': {'type': 'string', 'description': 'The attachmentlocation filename.'}}
        ],
        "responses": {
            "200": {
                "description": "Returns a token for accessing a file from the asset server. This is needed if the asset server is "
                + "configure to require a token for GET requests.",
                "content": {"text/plain": {"schema": {
                    'type': 'string',
                    'nullable': True,
                }}},
            }
        }
    }
})
@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def get_token(request):
    "Returns an asset server access token. Must be supplied 'filename' GET parameter."
    filename = request.GET['filename']
    token = generate_token(get_timestamp(), filename) if server_urls is not None else ""
    return HttpResponse(token, content_type='text/plain')

@openapi(schema={
    "post": {
        "parameters": [
            {'in': 'query', 'name': 'filename', 'required': True, 'schema': {'type': 'string', 'description': 'The name of the file to be uploaded.'}}
        ],
        "responses": {
            "200": {
                "description": "Returns the information needed to upload the files to the asset server.",
                "content": {"application/json": {"schema": {
                    'type': 'object',
                    'nullable': True,
                    'properties': {
                        'attachmentlocation': {'type': 'string', 'description': 'The filename to use for uploading to the asset server.'},
                        'token': {'type': 'string', 'description': 'The token allows the asset server to accept the request.'},
                    },
                    'required': ['attachmentlocation', 'token']
                    }
                }}},
        }
    }
})
@login_maybe_required
@require_http_methods(['POST', 'HEAD'])
def get_upload_params(request):
    "Returns information for uploading a file with GET parameter 'filename' to the asset server."
    filenames = json.loads(request.body)['filenames']
    data = list(map(make_attachment_location_token, filenames))
    return HttpResponse(json.dumps(data), content_type='application/json')

def make_attachment_location_token(filename):
    attch_loc = make_attachment_filename(filename)
    return {
        'attachmentLocation': attch_loc,
        'token': generate_token(get_timestamp(), attch_loc),
    }

def make_attachment_filename(filename):
    uuid = str(uuid4())
    name, extension = splitext(filename)
    return uuid + extension

def delete_attachment_file(attch_loc):
    data = {
        'filename': attch_loc,
        # Here we have no reference to the client's logged collection,
        # if any.  Even if we did there would be no guarantee the
        # asset was originally saved in that collection. The best we
        # can do is hope all the assets are going to the same
        # directory. Another option would be just to disable deletion
        # and use some sort of asynchronous garbage collection.
        'coll': get_collection(),
        'token': generate_token(get_timestamp(), attch_loc)
        }
    r = requests.post(server_urls["delete"], data=data)
    update_time_delta(r)
    if r.status_code not in (200, 404):
        # TODO: make back-end return localization keys that are resolved on the
        #   front-end
        raise AttachmentError(_("Deletion failed: %(reason)s") % {'reason': r.text})

def generate_token(timestamp, filename):
    """Generate the auth token for the given filename and timestamp. """
    msg = str(timestamp).encode() + filename.encode()
    mac = hmac.new(settings.WEB_ATTACHMENT_KEY.encode(), msg, 'md5')
    return ':'.join((mac.hexdigest(), str(timestamp)))

def get_timestamp():
    """Return an integer timestamp with one second resolution for
    the current moment.
    """
    return int(time.time()) + server_time_delta

def update_time_delta(response):
    try:
        timestamp = response.headers['X-Timestamp']
    except KeyError:
        return
    global server_time_delta
    server_time_delta = int(timestamp) - int(time.time())

def init():
    global server_urls

    if settings.WEB_ATTACHMENT_URL in (None, ''):
        logger.info('Asset server is not configured')
        return

    r = requests.get(settings.WEB_ATTACHMENT_URL)
    if r.status_code != 200:
        logger.error('Failed fetching asset server configuration')
        return

    update_time_delta(r)

    try:
        urls_xml = ElementTree.fromstring(r.text)
    except:
        logger.error('Failed parsing the response')
        return

    server_urls = {url.attrib['type']: url.text
                   for url in urls_xml.findall('url')}

    try:
        test_key()
    except AttachmentError as error:
        logger.error('%s', str(error))
        server_urls = None

def test_key():
    random = str(uuid4())
    token = generate_token(get_timestamp(), random)
    r = requests.get(server_urls["testkey"],
                     params={'random': random, 'token': token})

    if r.status_code == 200:
        return
    elif r.status_code == 403:
        raise AttachmentError("Bad attachment key.")
    else:
        raise AttachmentError("Attachment key test failed.")

@openapi(schema={
    "get": {
        "parameters": [
            {'in': 'query', 'name': 'filename', 'required': True,
             'schema': {'type': 'string',
                        'description': 'The name of the file to be uploaded.'}},
            {'in': 'query', 'name': 'coll', 'required': True,
             'schema': {'type': 'string',
                        'description': 'Collection Name'}},
            {'in': 'query', 'name': 'coll', 'required': True,
             'schema': {'type': 'string',
                        'description': 'Attachment Type. For now, it\'s always "O"'}},
            {'in': 'query', 'name': 'token', 'required': False,
             'schema': {'type': 'string',
                        'description': 'Access Token'}},
            {'in': 'query', 'name': 'filename', 'required': False,
             'schema': {'type': 'string',
                        'description': 'File Name'}},
            {'in': 'query', 'name': 'downloadname', 'required': False,
             'schema': {'type': 'string',
                        'description': 'Download file name'}},
        ],
        "responses": {
            "200": {
                "description": "Proxy asset server requests. This is needed to allow downloading files",
                "content": {"application/octet-stream": {"schema": {
                    'type': 'string',
                    'format': 'binary',
                }}}},
        }
    }
})
@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def proxy(request):
    """
    Proxy asset server requests. This is needed to allow downloading files
    (browsers don't allow <a download> for cross-origin urls)
    """
    if server_urls is None:
        return HttpResponseBadRequest({'error':'Asset server is not configured'}, content_type='application/json')
    response = requests.get(server_urls['read'] + '?' + request.META['QUERY_STRING'])
    return StreamingHttpResponse(
        (chunk for chunk in response.iter_content(512 * 1024)),
        content_type=response.headers['Content-Type'])

@require_POST
@login_maybe_required
@never_cache
def download_all(request):
    """
    Download all attachments from a list of attachment locations and put them into a zip file.
    """
    try:
        r = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)

    attachment_locations = r['attachmentlocations']
    orig_filenames = r['origfilenames']

    # Optional record set parameter
    # Fetches all the attachment locations instead of using the ones provided by the frontend
    recordSetId = r.get('recordsetid', None)
    if recordSetId is not None:
        attachment_locations = []
        orig_filenames = []
        recordset = models.Recordset.objects.get(id=recordSetId)
        table = get_model_by_table_id(recordset.dbtableid)
        join_table = apps.get_model(table._meta.app_label, table.__name__ + 'attachment')

        # Reach all attachments (record set -> record set item -> record -> record_attachment -> attachment)
        recordsetitems = models.Recordsetitem.objects.filter(recordset__id=recordSetId).values_list('recordid', flat=True)
        join_records = join_table.objects.filter(**{table.__name__.lower() + '_id__in': list(recordsetitems)}).select_related('attachment')
        
        for join_record in join_records:
            attachment = join_record.attachment
            if attachment.attachmentlocation is not None:
                attachment_locations.append(attachment.attachmentlocation)
                orig_filenames.append(os.path.basename(attachment.origfilename or attachment.attachmentlocation))

    filename = 'attachments_%s.zip' % datetime.now().isoformat()

    response = StreamingHttpResponse(
        stream_attachment_zip(attachment_locations, orig_filenames, get_collection(request)),
        content_type='application/octet-stream')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

def stream_attachment_zip(attachment_locations, orig_filenames, collection):
    "Streams attachment zip file to the frontend as its being created"
    session = requests.Session()
    filename_appearances = {}
    def file_iterator():
        modified_at = datetime.now()
        mode = S_IFREG | 0o600 # default file permissions
        for i, attachment_location in enumerate(attachment_locations):
            data = {
                'filename': attachment_location,
                'coll': collection,
                'type': 'O',
                'token': generate_token(get_timestamp(), attachment_location)
            }
            response = session.get(server_urls['read'], params=data, stream=True)
            if response.status_code == 200:
                download_filename = get_valid_filename(orig_filenames[i] if i < len(orig_filenames) else attachment_location)
                filename_appearances[download_filename] = filename_appearances.get(download_filename, 0) + 1
                if filename_appearances[download_filename] > 1:
                    # De-duplicate filename
                    name, extension = os.path.splitext(download_filename)
                    download_filename = f'{name}_{filename_appearances[download_filename]-1}{extension}'
                def data_iterator():
                    for chunk in response.iter_content(512 * 1024):
                        yield chunk
                yield (download_filename, modified_at, mode, ZIP_32, data_iterator())
    return stream_zip(file_iterator())

@transaction.atomic()
@login_maybe_required
@require_http_methods(['GET', 'POST', 'HEAD'])
def datasets(request):
    return datasets_view(request)

@transaction.atomic()
@login_maybe_required
@require_http_methods(['GET', 'PUT', 'DELETE', 'HEAD'])
@Spattachmentdataset.validate_dataset_request(raise_404=False, lock_object=True)
def dataset(request, ds: Spattachmentdataset):
    return dataset_view(request, ds)


init()

