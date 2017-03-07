import os
from threading import Thread
from datetime import datetime
import json

from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, Http404, HttpResponseForbidden
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.cache import never_cache
from django.conf import settings

from ..specify.views import login_maybe_required
from ..context.app_resource import get_app_resource
from ..notifications.models import Message
from ..specify.models import Spquery

from .dwca import make_dwca
from .extract_query import extract_query as extract


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
@require_GET
@never_cache
def extract_query(request, query_id):
    query = Spquery.objects.get(id=query_id)
    return HttpResponse(extract(query), 'text/xml')
