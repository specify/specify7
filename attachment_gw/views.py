from uuid import uuid4
from xml.etree import ElementTree
from os.path import splitext
import requests, time, hmac, json

from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.conf import settings

server_urls = None
server_time_delta = None

class AttachmentError(Exception):
    pass

@login_required
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
        'coll': settings.WEB_ATTACHMENT_COLLECTION,
        'token': generate_token(get_timestamp(), attch_loc)
        }
    r = requests.post(server_urls["delete"], data=data)
    update_time_delta(r)
    if r.status_code not in (200, 404):
        raise AttachmentError("Deletion failed: " + r.text)

def generate_token(timestamp, filename):
    """Generate the auth token for the given filename and timestamp. """
    timestamp = str(timestamp)
    mac = hmac.new(settings.WEB_ATTACHMENT_KEY,
                   timestamp + filename)
    return ':'.join((mac.hexdigest(), timestamp))

def get_timestamp():
    """Return an integer timestamp with one second resolution for
    the current moment.
    """
    return int(time.time()) + server_time_delta

def update_time_delta(response):
    timestamp = response.headers['X-Timestamp']
    global server_time_delta
    server_time_delta = int(timestamp) - int(time.time())

def init():
    r = requests.get(settings.WEB_ATTACHMENT_URL)
    update_time_delta(r)

    urls_xml = ElementTree.fromstring(r.text)
    global server_urls
    server_urls = {url.attrib['type']: url.text
                   for url in urls_xml.findall('url')}
    test_key()

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

