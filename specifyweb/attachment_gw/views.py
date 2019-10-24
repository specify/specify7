import logging
from uuid import uuid4
from xml.etree import ElementTree
from os.path import splitext
from datetime import datetime
import requests, time, hmac, json, hashlib

from django.http import HttpResponse
from django.views.decorators.http import require_GET,require_POST
from django.views.decorators.cache import cache_control
from django.conf import settings

from specifyweb.specify.views import login_maybe_required

logger = logging.getLogger(__name__)

server_urls = None
server_time_delta = 0

class AttachmentError(Exception):
    pass

def get_md5(file):
    md5 = hashlib.md5(file.read()).hexdigest()
    file.seek(0)
    return md5

def encode_hmac(params):
    IIP_KEY = settings.ATTACHMENT_SERVERS['IIP']['KEY']
    sep = '\n'
    param_string = sep.join(params)
    to_hash = bytes(param_string).encode('latin-1')
    hmac_encoded = hmac.new(bytes(IIP_KEY).encode('latin-1'),
                            to_hash,
                            hashlib.sha512).hexdigest().encode('latin-1')
                            
    return hmac_encoded

def get_collection():
    "Assumes that all collections are stored together."
    if get_default_settings('COLLECTION'):
        return get_default_settings('COLLECTION')

    from specifyweb.specify.models import Collection
    return Collection.objects.all()[0].collectionname

@login_maybe_required
@require_GET
@cache_control(max_age=86400, private=True)
def get_settings(request):
    if server_urls is None:
        return HttpResponse("{}", content_type='application/json')

    default_server_settings = {
        'collection': get_collection(),
        'token_required_for_get': get_default_settings('REQUIRES_KEY_FOR_GET'),
        'caption': get_default_settings('CAPTION'),
    }

    default_server_settings.update(server_urls)

    data = {'DEFAULT': default_server_settings}

    loris_settings = settings.ATTACHMENT_SERVERS.get('LORIS', None)
    if loris_settings is not None:
        # don't fail if settings for LORIS are not included
        data['LORIS'] = {
            'base_url':  loris_settings['URL'],
            'fileupload_url': loris_settings['FILEUPLOAD_URL'],
            'caption': loris_settings['CAPTION'],
        }

    iip_settings = settings.ATTACHMENT_SERVERS.get('IIP', None)
    if iip_settings is not None:
        # don't fail if settings for IIP are not included
        data['IIP'] = {
            'base_url':  iip_settings['URL'],
            'fileupload_url': iip_settings['FILEUPLOAD_URL'],
            'caption': iip_settings['CAPTION'],
        }
    return HttpResponse(json.dumps(data), content_type='application/json')

@login_maybe_required
@require_GET
def get_token(request):
    filename = request.GET['filename']
    token = generate_token(get_timestamp(), filename)
    return HttpResponse(token, content_type='text/plain')


@login_maybe_required
@require_POST
def post_to_iip(request):
    IIP_TOKEN = settings.ATTACHMENT_SERVERS['IIP']['TOKEN']
    file = request.FILES['file']
    timestamp = str(datetime.utcnow())
    fn = file.name
    md5 = get_md5(file)
    file.seek(0)
    specify_user = request.user._wrapped.name
    hmac_encoded = encode_hmac([fn,specify_user,timestamp,md5])

    data = {'filename':fn,
         'specify_user':specify_user,
         'timestamp':timestamp}

    r = requests.request("POST",
                     url=settings.ATTACHMENT_SERVERS['IIP']['FILEUPLOAD_URL'],
                     verify=False,
                     files={'file': file},
                     data=data,
                     headers={'Authorization': IIP_TOKEN+':'+hmac_encoded}) 
    if '.tif' not in r.content:
        raise AttachmentError('Attachment failed')
    new_filename = r.content.split('"')[1]
    return HttpResponse(new_filename, content_type='text/plain')

@login_maybe_required
@require_GET
def get_upload_params(request):
    filename = request.GET['filename']
    attch_loc = make_attachment_filename(filename)
    data = {
        'attachmentlocation': attch_loc,
        'token': generate_token(get_timestamp(), attch_loc)
        }
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
        raise AttachmentError("Deletion failed: " + r.text)

def generate_token(timestamp, filename):
    """Generate the auth token for the given filename and timestamp. """
    timestamp = str(timestamp)
    mac = hmac.new(get_default_settings('KEY'),
                   timestamp + filename)
    return ':'.join((mac.hexdigest(), timestamp))

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

def get_default_settings(key):
    if 'DEFAULT' in settings.ATTACHMENT_SERVERS:
        return settings.ATTACHMENT_SERVERS['DEFAULT'][key]

    if key == 'CAPTION':
        return 'Default'

    return getattr(settings, 'WEB_ATTACHMENT_' + key, None)

def init():
    global server_urls

    if get_default_settings('URL') in (None, ''):
        logger.info("no default attachment server set")
        return

    r = requests.get(get_default_settings('URL'))
    if r.status_code != 200:
        logger.warning("couldn't get settings from attachment server %s", get_default_settings('URL'))
        return

    update_time_delta(r)

    try:
        urls_xml = ElementTree.fromstring(r.text)
    except:
        return

    server_urls = {url.attrib['type']: url.text
                   for url in urls_xml.findall('url')}

    try:
        test_key()
    except AttachmentError:
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
