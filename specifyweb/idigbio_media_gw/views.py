from uuid import uuid4
import json

from django.http import HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from specifyweb.specify.views import login_maybe_required

from idigbio_ingestion_tool.dataingestion.services import api_client

api_client.init(settings.IDIGBIO_MEDIA_URL)
api_client.authenticate(settings.IDIGBIO_MEDIA_UUID, settings.IDIGBIO_MEDIA_APIKEY)

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
    result = api_client._post_stream(request.FILES['file'], str(uuid4()))
    return HttpResponse(json.dumps(result), content_type='application/json')
