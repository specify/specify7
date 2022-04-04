import hmac
import json
import logging
import requests
import time
from django.conf import settings
from django.http import HttpResponse
from django.utils.translation import gettext as _
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_http_methods
from os.path import splitext
from uuid import uuid4
from xml.etree import ElementTree

from specifyweb.specify.views import login_maybe_required, openapi

logger = logging.getLogger(__name__)

server_urls = None
server_time_delta = None

class AttachmentError(Exception):
    pass

def get_collection():
    "Assumes that all collections are stored together."
    if settings.WEB_ATTACHMENT_COLLECTION:
        return settings.WEB_ATTACHMENT_COLLECTION

    from specifyweb.specify.models import Collection
    return Collection.objects.all()[0].collectionname

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
        'collection': get_collection(),
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
    "get": {
        "parameters": [
            {'in': 'query', 'name': 'filename', 'required': True, 'schema': {'type': 'string', 'description': 'The name of the file to be uploaded.'}}
        ],
        "responses": {
            "200": {
                "description": "Returns the information needed to upload a file to the asset server.",
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
@require_http_methods(['GET', 'HEAD'])
def get_upload_params(request):
    "Returns information for uploading a file with GET parameter 'filename' to the asset server."
    filename = request.GET['filename']
    attch_loc = make_attachment_filename(filename)
    data = {
        'attachmentlocation': attch_loc,
        'token': generate_token(get_timestamp(), attch_loc)
    } if server_urls is not None else None
    return HttpResponse(json.dumps(data), content_type='application/json')

def make_attachment_filename(filename):
    uuid = str(uuid4())
    name, extension = splitext(filename)
    return uuid + extension

def delete_attachment_file(attch_loc):
    data = {
        'filename': attch_loc,
        'coll': get_collection(),
        'token': generate_token(get_timestamp(), attch_loc)
        }
    r = requests.post(server_urls["delete"], data=data)
    update_time_delta(r)
    if r.status_code not in (200, 404):
        raise AttachmentError(_("Deletion failed: %(reason)s") % {'reason': r.text})

def generate_token(timestamp, filename):
    """Generate the auth token for the given filename and timestamp. """
    msg = str(timestamp).encode() + filename.encode()
    mac = hmac.new(settings.WEB_ATTACHMENT_KEY.encode(), msg)
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

init()

