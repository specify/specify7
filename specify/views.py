import mimetypes

from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django import http

from specify_jar import specify_jar
import api

class HttpResponseConflict(http.HttpResponse):
    status_code = 409

def api_view(dispatch_func):
    """Create a Django view function that handles exceptions arising
    in the api logic."""
    @login_required
    @csrf_exempt
    def view(*args, **kwargs):
        try:
            return dispatch_func(*args, **kwargs)
        except api.StaleObjectException as e:
            return HttpResponseConflict(e)
        except api.MissingVersionException as e:
            return http.HttpResponseBadRequest(e)
        except http.Http404 as e:
            return http.HttpResponseNotFound(e)
    return view

resource = api_view(api.resource_dispatch)
collection = api_view(api.collection_dispatch)


@login_required
@require_GET
def images(request, path):
    """A Django view that serves images and icons from the Specify thickclient jar file."""
    mimetype = mimetypes.guess_type(path)[0]
    path = 'edu/ku/brc/specify/images/' + path
    return http.HttpResponse(specify_jar.read(path), content_type=mimetype)

@login_required
@require_GET
def properties(request, name):
    """A Django view that serves .properities files from the thickclient jar file."""
    path = name + '.properties'
    return http.HttpResponse(specify_jar.read(path), content_type='text/plain')
