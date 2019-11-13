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
    PIA_KEY = settings.ATTACHMENT_SERVERS['PIA']['KEY']
    sep = '\n'
    param_string = sep.join(params)
    to_hash = bytes(param_string).encode('latin-1')
    hmac_encoded = hmac.new(bytes(PIA_KEY).encode('latin-1'),
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

    pia_settings = settings.ATTACHMENT_SERVERS.get('PIA', None)
    if pia_settings is not None:
        # don't fail if settings for PIA are not included
        data['PIA'] = {
            'base_url':  pia_settings['URL'],
            'fileupload_url': pia_settings['URL']+'/upload',
            'caption': pia_settings['CAPTION'],
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
def post_to_pia(request):
    PIA_TOKEN = settings.ATTACHMENT_SERVERS['PIA']['TOKEN']
    file = request.FILES['file']
    timestamp = str(datetime.utcnow())
    fn = file.name
    md5 = get_md5(file)
    file.seek(0)
    specify_user = request.user._wrapped.name
    hmac_encoded = encode_hmac([fn,specify_user,timestamp,md5])

    data = {
        'filename': fn,
        'specify_user': specify_user,
        'timestamp': timestamp
        }

    r = requests.post(url=settings.ATTACHMENT_SERVERS['PIA']['URL']+'/upload',
                     verify=False,
                     files={'file': file},
                     data=data,
                     headers={'Authorization': PIA_TOKEN+':'+hmac_encoded})
                     
    # The server returns JSON which contains the stored file path as the element
    # 'file_path'
    resp_data = json.loads(r.content)
    
    attachment_location = resp_data['resource_identifier']
    if '.tif' not in attachment_location:
        raise AttachmentError('Attachment failed')

    return_data = {
        'attachmentlocation': resp_data['asset_identifier'],
        'mimetype': resp_data['mime_type'],
        'filecreateddate': resp_data['file_created_date'],
        'dateimaged': resp_data['date_imaged'],
        'copyrightholder': resp_data['copyright_holder'],
        'capturedevice': resp_data['capture_device'],
        }
    
    return HttpResponse(json.dumps(return_data), content_type='application/json')

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

def delete_attachment_file(attch_loc, original_filename, storage_config):
    if storage_config == 'DEFAULT':
        data = {
            'filename': attch_loc,
            'coll': get_collection(),
            'token': generate_token(get_timestamp(), attch_loc)
            }
        r = requests.post(server_urls["delete"], data=data)
        update_time_delta(r)
        if r.status_code not in (200, 404):
            raise AttachmentError("Deletion failed: " + r.text)
    # FIXME: should be elif storage_config == ...
    else:
        PIA_TOKEN = settings.ATTACHMENT_SERVERS['PIA']['TOKEN']
        timestamp = str(datetime.utcnow())

        hmac_encoded = encode_hmac([original_filename,timestamp])

        data = {
                'filename': original_filename,
                'timestamp': timestamp
                }
        
        sep = '/'
        
        delete_path = sep.join([settings.ATTACHMENT_SERVERS['PIA']['URL'],
                                attch_loc, 'delete'])
        
        r = requests.delete(url=delete_path,
                        verify=False,
                        data=data,
                        headers={'Authorization': PIA_TOKEN+':'+hmac_encoded})
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
