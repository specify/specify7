from uuid import uuid4
from os.path import join as join_path, dirname, abspath, splitext
import requests, time, hmac, json

from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt

ATTACHMENT_SERVER = "http://dhwd99p1.nhm.ku.edu:3088/"
ATTACHMENT_KEY = "test_attachment_key"

server_time_delta = None

@login_required
@require_GET
def get_upload_params(request):
    filename = request.GET['filename']
    attch_loc = make_attachment_filename(filename)
    data = {'attachmentlocation': attch_loc,
            'token': generate_token(get_timestamp(), attch_loc)}
    return HttpResponse(json.dumps(data), content_type='application/json')

def make_attachment_filename(filename):
    uuid = str(uuid4())
    name, extension = splitext(filename)
    return uuid + extension

def generate_token(timestamp, filename):
    """Generate the auth token for the given filename and timestamp. """
    timestamp = str(timestamp)
    mac = hmac.new(ATTACHMENT_KEY, timestamp + filename)
    return ':'.join((mac.hexdigest(), timestamp))

def get_timestamp():
    """Return an integer timestamp with one second resolution for
    the current moment.
    """
    return int(time.time()) + server_time_delta

def test_key():
    r = requests.get(ATTACHMENT_SERVER + "web_asset_store.xml")
    timestamp = r.headers['X-Timestamp']
    global server_time_delta
    server_time_delta = int(timestamp) - int(time.time())

    random = str(uuid4())
    token = generate_token(get_timestamp(), random)
    r = requests.get(ATTACHMENT_SERVER + "testkey",
                     params={'random': random, 'token': token})

    if r.status_code == 200:
        return
    elif r.status_code == 403:
        raise Exception("Bad attachment key.")
    else:
        raise Exception("Attachment key test failed.")

test_key()

