import mimetypes
from django import http
from django.conf import settings
from django.db import router
from django.db.models.deletion import Collector
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_http_methods, require_POST
from functools import wraps

from specifyweb import permissions
from . import api, models
from .specify_jar import specify_jar


def login_maybe_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return http.HttpResponseForbidden()
        return view(request, *args, **kwargs)
    return wrapped

if settings.ANONYMOUS_USER:
    login_maybe_required = lambda func: func


def apply_access_control(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if request.method != "GET" and request.specify_readonly:
            return http.HttpResponseForbidden()
        return view(request, *args, **kwargs)
    return wrapped

def check_for_permissions_violation(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        try:
            return view(request, *args, **kwargs)
        except permissions.AccessDeniedException as e:
            raise
            #return http.HttpResponseBadRequest(e)
    return wrapped

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
    @apply_access_control
    @check_for_permissions_violation
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

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def delete_blockers(request, model, id):
    """Returns a JSON list of fields on <model> that point to related
    resources which prevent the resource <id> of that model from being
    deleted.
    """
    obj = api.get_object_or_404(model, id=int(id))
    using = router.db_for_write(obj.__class__, instance=obj)
    collector = Collector(using=using)
    collector.delete_blockers = []
    collector.collect([obj])
    result = ["%s.%s" % (sub_objs[0].__class__.__name__, field.name)
              for field, sub_objs in collector.delete_blockers]
    return http.HttpResponse(api.toJson(result), content_type='application/json')

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def rows(request, model):
    "Returns tuples from the table for <model>."
    return api.rows(request, model)

@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=365*24*60*60, public=True)
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
@cache_control(max_age=24*60*60, public=True)
def properties(request, name):
    """Returns the <name>.properities file from the thickclient jar file."""
    path = name + '.properties'
    return http.HttpResponse(specify_jar.read(path), content_type='text/plain')


@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "New user's password",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "password": {
                                "type": "string",
                                "description": "New user's password",
                            },
                        },
                        'required': ['password'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success",},
            "403": {"description": "Logged in user is not an admin."}
        }
    },
})
@login_maybe_required
@require_POST
def set_password(request, userid):
    """Set <userid> specify user's password to the value in the 'password'
    POST parameter. Must be logged in as an admin, otherwise HTTP 403
    is returned.
    """
    if not request.specify_user.is_admin():
        return http.HttpResponseForbidden()

    user = models.Specifyuser.objects.get(pk=userid)
    user.set_password(request.POST['password'])
    user.save()
    return http.HttpResponse('', status=204)


@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "Set or clear the admin status for a user.",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "admin_status": {
                                "type": "string",
                                'enum': ['true', 'false'],
                                "description": "Whether the user should be given admin status.",
                            },
                        },
                        'required': ['admin_status'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success",},
            "403": {"description": "Logged in user is not an admin."}
        }
    },
})
@login_maybe_required
@require_POST
def set_admin_status(request, userid):
    """Sets <userid> specify user's is-admin status to 'true' or 'false'
    according to the 'admin_status' POST parameter. Must be logged in
    as an admin, otherwise HTTP 403 is returned.
    """
    if not request.specify_user.is_admin():
        return http.HttpResponseForbidden()

    user = models.Specifyuser.objects.get(pk=userid)
    if request.POST['admin_status'] == 'true':
        user.set_admin()
        return http.HttpResponse('true', content_type='text/plain')
    else:
        user.clear_admin()
        return http.HttpResponse('false', content_type='text/plain')

@require_http_methods(['GET', 'HEAD'])
def support_login(request):
    """If the ALLOW_SUPPORT_LOGIN setting is True, requesting this
    endpoint with a valid 'token' GET parameter will log in without a
    password according to the data encoded in the token. Tokens are
    generated by using the 'python manage.py support_login' command
    line tool on the server.
    """
    if not settings.ALLOW_SUPPORT_LOGIN:
        return http.HttpResponseForbidden()

    from django.contrib.auth import login, authenticate

    user = authenticate(token=request.GET['token'])
    if user is not None:
        login(request, user)
        return http.HttpResponseRedirect('/')
    else:
        return http.HttpResponseForbidden()
