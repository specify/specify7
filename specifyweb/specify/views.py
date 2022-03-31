import mimetypes
import json
from functools import wraps

from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.cache import cache_control
from django.conf import settings
from django import http
from django.db.models.deletion import Collector
from django.db import router, transaction, connection

from specifyweb.permissions.permissions import PermissionTarget, PermissionTargetAction, PermissionsException, check_permission_targets

from .specify_jar import specify_jar
from . import api, models


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
@require_GET
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
@require_GET
def rows(request, model):
    "Returns tuples from the table for <model>."
    return api.rows(request, model)

@require_GET
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
@require_GET
@cache_control(max_age=24*60*60, public=True)
def properties(request, name):
    """Returns the <name>.properities file from the thickclient jar file."""
    path = name + '.properties'
    return http.HttpResponse(specify_jar.read(path), content_type='text/plain')

class SetPasswordPT(PermissionTarget):
    resource = '/admin/user/password'
    update = PermissionTargetAction()

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
    check_permission_targets(None, request.specify_user.id, [SetPasswordPT.update])
    user = models.Specifyuser.objects.get(pk=userid)
    user.set_password(request.POST['password'])
    user.save()
    return http.HttpResponse('', status=204)

class SetAgentsException(PermissionsException):
    http_status = 400

    def to_json(self):
        return {self.__class__.__name__: self.args[0]}

class AgentInUseException(SetAgentsException):
    "One of the agents being assigned is already assigned to another user."
    pass

class MultipleAgentsException(SetAgentsException):
    "Attempting to assign more than one agent per division to the user."
    pass

class MissingAgentForAccessibleCollection(SetAgentsException):
    "The user has access to a collection in a division that is not represented by any agent."
    pass

class SetUserAgentsPT(PermissionTarget):
    resource = '/admin/user/agents'
    update = PermissionTargetAction()

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "The list of agents to assign to the user represented by their ids.",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "The agent ids."
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Success",},
            "400": {
                "description": "The request was rejected.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "description": "The error.",
                            "properties": {
                                AgentInUseException.__name__: {
                                    'type': 'array',
                                    'description': AgentInUseException.__doc__
                                },
                                MultipleAgentsException.__name__: {
                                    'type': 'array',
                                    'description': MultipleAgentsException.__doc__
                                },
                                MissingAgentForAccessibleCollection.__name__: {
                                    'type': 'object',
                                    'description': MissingAgentForAccessibleCollection.__doc__
                                }
                            }
                        }
                    }
                }
            }
        }
    },
})
@login_maybe_required
@require_POST
def set_user_agents(request, userid: int):
    "Sets the agents to represent the user in different disciplines."
    from specifyweb.context.views import users_collections_for_sp6, users_collections_for_sp7

    user = models.Specifyuser.objects.get(pk=userid)
    new_agentids = json.loads(request.body)
    cursor = connection.cursor()

    with transaction.atomic():
        # clear user's existing agents
        models.Agent.objects.filter(specifyuser_id=userid).update(specifyuser_id=None)

        # check if any of the agents to be assigned are used by other users
        in_use = models.Agent.objects.select_for_update().filter(pk__in=new_agentids, specifyuser_id__isnull=False)
        if in_use:
            raise AgentInUseException([a.id for a in in_use])

        # assign the new agents
        models.Agent.objects.filter(pk__in=new_agentids).update(specifyuser_id=userid)

        # check for multiple agents assigned to the user
        cursor.execute(
            """select divisionid, a1.agentid, a2.agentid
            from agent a1 join agent a2 using (specifyuserid, divisionid)
            where a1.agentid < a2.agentid and specifyuserid = %s
            """, [userid]
        )

        multiple = [
            {'divisonid': divisonid, 'agentid1': agentid1, 'agentid2': agentid2}
            for divisonid, agentid1, agentid2 in cursor.fetchall()
        ]
        if multiple:
            raise MultipleAgentsException(multiple)

        # get the list of collections the agents belong to.
        collections = models.Collection.objects.filter(discipline__division__members__specifyuser_id=userid).values_list('id', flat=True)

        # check permissions for setting user agents in those collections.
        for collectionid in collections:
            check_permission_targets(collectionid, request.specify_user.id, [SetUserAgentsPT.update])

        # make sure every collection the user is permitted to access has an assigned user.
        missing_for_6 = [
            collectionid
            for collectionid, _ in users_collections_for_sp6(cursor, userid)
            if collectionid not in collections
        ]
        missing_for_7 = [
            collectionid
            for collectionid, _ in users_collections_for_sp7(userid)
            if collectionid not in collections
        ]
        if missing_for_6 or missing_for_7:
            raise MissingAgentForAccessibleCollection({'missing_for_6': missing_for_6, 'missing_for_7': missing_for_7})

    return http.HttpResponse('', status=204)


class Sp6AdminPT(PermissionTarget):
    resource = '/admin/user/sp6/is_admin'
    update = PermissionTargetAction()

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
    check_permission_targets(None, request.specify_user.id, [Sp6AdminPT.update])
    user = models.Specifyuser.objects.get(pk=userid)
    if request.POST['admin_status'] == 'true':
        user.set_admin()
        return http.HttpResponse('true', content_type='text/plain')
    else:
        user.clear_admin()
        return http.HttpResponse('false', content_type='text/plain')

@require_GET
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
