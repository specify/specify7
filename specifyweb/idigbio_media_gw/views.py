from uuid import uuid4
import requests, json, base64

from django.http import HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from specifyweb.specify.views import login_maybe_required

AUTH_STRING = base64.encodestring(':'.join((
    settings.IDIGBIO_MEDIA_UUID,
    settings.IDIGBIO_MEDIA_APIKEY
))).replace('\n', '')

@require_GET
def get_settings(request):
    resp = {
        'module': 'idigbio',
        'idigbioURL': settings.IDIGBIO_MEDIA_URL
        }
    return HttpResponse(json.dumps(resp), content_type='application/json')

@require_POST
@login_maybe_required
@csrf_exempt
def upload(request):
    request = requests.post(settings.IDIGBIO_MEDIA_URL + '/upload/images',
                            headers={"Authorization": "Basic " + AUTH_STRING},
                            data={"filereference": str(uuid4())},
                            files={"file": request.FILES['file']})
    request.raise_for_status()
    return HttpResponse(request.content, content_type='application/json')
