import mimetypes
import re
from functools import wraps

from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_control
from django.conf import settings
from django import http

from .specify_jar import specify_jar
from .models import Spversion
from . import api

if settings.ANONYMOUS_USER:
    login_maybe_required = lambda func: func
else:
    def login_maybe_required(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated():
                return http.HttpResponseForbidden()
            return view(request, *args, **kwargs)
        return wrapped

class HttpResponseConflict(http.HttpResponse):
    status_code = 409

def api_view(dispatch_func):
    """Create a Django view function that handles exceptions arising
    in the api logic."""
    @login_maybe_required
    @csrf_exempt
    @cache_control(private=True, max_age=0)
    def view(request, *args, **kwargs):
        if request.method != "GET" and (
            settings.RO_MODE or
            request.specify_user.usertype not in ('Manager', 'FullAccess')
        ):
            return http.HttpResponseForbidden()
        try:
            return dispatch_func(request, *args, **kwargs)
        except api.StaleObjectException as e:
            return HttpResponseConflict(e)
        except api.MissingVersionException as e:
            return http.HttpResponseBadRequest(e)
        except http.Http404 as e:
            return http.HttpResponseNotFound(e)
    return view

resource = api_view(api.resource_dispatch)
collection = api_view(api.collection_dispatch)

def raise_error(request):
    raise Exception('This error is a test. You may now return to your regularly '
                    'scheduled hacking.')

@login_maybe_required
@require_GET
def rows(request, model):
    return api.rows(request, model)

@require_GET
def images(request, path):
    """A Django view that serves images and icons from the Specify thickclient jar file."""
    mimetype = mimetypes.guess_type(path)[0]
    path = 'edu/ku/brc/specify/images/' + path
    try:
        image = specify_jar.read(path)
    except KeyError as e:
        raise http.Http404(e)
    return http.HttpResponse(image, content_type=mimetype)

@login_maybe_required
@require_GET
def properties(request, name):
    """A Django view that serves .properities files from the thickclient jar file."""
    path = name + '.properties'
    return http.HttpResponse(specify_jar.read(path), content_type='text/plain')

@require_GET
def system_info(request):
    spversion = Spversion.objects.get()

    info = dict(
        version=settings.VERSION,
        specify6_version=re.findall(r'SPECIFY_VERSION=(.*)', specify_jar.read('resources_en.properties'))[0],
        database_version=spversion.appversion,
        schema_version=spversion.schemaversion,
        )
    return http.HttpResponse(api.toJson(info), content_type='application/json')
