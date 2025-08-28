"""
A few non-business data resource end points 
"""

import json
import mimetypes
from functools import wraps
import time
import logging
import os
from zipfile import ZipFile, BadZipFile
from tempfile import TemporaryDirectory

from django import http
from django.conf import settings
from django.db import router
from django.db.models.deletion import Collector
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_POST, require_http_methods
from specifyweb.specify.api import get_model

from specifyweb.middleware.general import require_http_methods
from . import api, models as spmodels
from .specify_jar import specify_jar, specify_jar_path
from .uiformatters import get_uiformatter_by_name

logger = logging.getLogger(__name__)

def login_maybe_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return http.HttpResponseForbidden()
        return view(request, *args, **kwargs)
    return wrapped


if settings.ANONYMOUS_USER:
    def login_maybe_required(func): return func


class HttpResponseConflict(http.HttpResponse):
    status_code = 409


def openapi(schema, components={}):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            return view(*args, **kwargs)
        setattr(wrapped, '__schema__', {
            'schema': schema,
            'components': components
        })
        return wrapped
    return decorator


def api_view(dispatch_func):
    """Create a Django view function that handles exceptions arising
    in the api logic."""
    @login_maybe_required
    @cache_control(private=True, max_age=2)
    def view(request, *args, **kwargs):
        """RESTful API endpoint for most Specify datamodel resources.
        <model> is the table from the Specify datamodel. <id> is the
        row id.
        """
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
    """This endpoint intentionally throws an error in the server for
    testing purposes.
    """
    raise Exception('This error is a test. You may now return to your regularly '
                    'scheduled hacking.')

@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=365 * 24 * 60 * 60, public=True)
def images(request, path):
    """Returns images and icons from the Specify thickclient jar file
    under edu/ku/brc/specify/images/."""
    mimetype = mimetypes.guess_type(path)[0]
    path = 'edu/ku/brc/specify/images/' + path
    try:
        image = specify_jar.read(path)
    except KeyError as e:
        raise http.Http404(e)
    return http.HttpResponse(image, content_type=mimetype)


@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=24 * 60 * 60, public=True)
def properties(request, name):
    """
    Returns the <name>.properties file from the thickclient jar.
    Retries on BadZipFile and falls back to manual extraction.
    """
    path = f"{name}.properties"
    max_retries = 2
    delay = 0.1

    for attempt in range(1, max_retries + 2):
        try:
            data = specify_jar.read(path)
            break
        except BadZipFile:
            logger.warning(
                "Attempt %d to read from %r failed with BadZipFile. Retrying…",
                attempt, path,
                exc_info=True
            )
            if attempt <= max_retries:
                time.sleep(delay * attempt)
            else:
                # Final fallback: manually extract just this one entry
                try:
                    with TemporaryDirectory() as td:
                        with ZipFile(specify_jar_path, 'r') as jar:
                            jar.extract(path, td)
                        with open(os.path.join(td, path), 'rb') as f:
                            data = f.read()
                    logger.info("Successfully extracted %r via fallback extraction.", path)
                    break
                except Exception as fallback_exc:
                    logger.error(
                        "Fallback extract also failed for %r: %s",
                        path, fallback_exc,
                        exc_info=True
                    )
                    return http.HttpResponseServerError(
                        f"Could not read {path} from JAR."
                    )
    else:
        return http.HttpResponseServerError(f"Failed to load {path}.")

    return http.HttpResponse(data, content_type='text/plain')

# check if user is new by looking the presence of institution
def is_new_user(request):
    is_new_user = len(spmodels.Institution.objects.all()) == 0
    return http.JsonResponse(is_new_user, safe=False)