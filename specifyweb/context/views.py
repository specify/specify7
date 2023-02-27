"""
Defines the resources that are provided by this subsystem
"""

import json
import os
import re
from typing import List

from django.conf import settings
from django.contrib.auth import authenticate, login as auth_login, \
    logout as auth_logout
from django.db import connection, transaction
from django.http import Http404, HttpResponse, HttpResponseBadRequest, \
    HttpResponseForbidden, JsonResponse
from django.urls import URLPattern
from django.utils.translation import get_language_info
from django.utils.translation import gettext as _
from django.views.decorators.cache import cache_control, never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.views.i18n import LANGUAGE_QUERY_PARAMETER

from specifyweb.permissions.permissions import PermissionTarget, \
    PermissionTargetAction, \
    check_permission_targets, skip_collection_access_check, query_pt, \
    CollectionAccessPT
from specifyweb.specify.models import Collection, Institution, \
    Specifyuser, Spprincipal, Spversion
from specifyweb.specify.schema import base_schema
from specifyweb.specify.serialize_datamodel import datamodel_to_json
from specifyweb.specify.specify_jar import specify_jar
from specifyweb.specify.views import login_maybe_required, openapi
from .app_resource import get_app_resource
from .remote_prefs import get_remote_prefs
from .schema_localization import get_schema_languages, get_schema_localization
from .viewsets import get_view


def set_collection_cookie(response, collection_id):
    response.set_cookie('collection', str(collection_id), max_age=365*24*60*60)

def users_collections_for_sp6(cursor, user_id):
    cursor.execute("""
    select distinct c.usergroupscopeid, c.collectionname from collection c
    inner join spprincipal p on p.usergroupscopeid = c.usergroupscopeid
    inner join specifyuser_spprincipal up on up.spprincipalid = p.spprincipalid
    inner join specifyuser u on u.specifyuserid = up.specifyuserid and p.grouptype is null
    where up.specifyuserid = %s
    """, [user_id])

    return list(cursor.fetchall())

def users_collections_for_sp7(userid: int) -> List:
    return [
        c
        for c in Collection.objects.all()
        if query_pt(c.id, userid, CollectionAccessPT.access).allowed
    ]

def set_users_collections_for_sp6(cursor, user, collectionids):
    with transaction.atomic():

        # Delete the principals for the user for all collections not
        # in collectionids. (I think the principal represents the
        # user's capacity wrt to a collection.)

        # First delete the mappings from the user to the principals.
        cursor.execute("delete specifyuser_spprincipal "
                       "from specifyuser_spprincipal "
                       "join spprincipal using (spprincipalid) "
                       "where specifyuserid = %s and usergroupscopeid not in %s",
                       [user.id, collectionids])

        # Next delete the joins from the principals to any permissions.
        cursor.execute("delete from spprincipal_sppermission where spprincipalid not in ("
                       "select spprincipalid from specifyuser_spprincipal)")

        # Finally delete all the principals that aren't connected to
        # any user. This should just be the ones where the mappings
        # were deleted above.
        cursor.execute("delete from spprincipal where grouptype is null and spprincipalid not in ("
                       "select spprincipalid from specifyuser_spprincipal)")

        # Now to add any new principals. Which ones alerady exist?
        cursor.execute("select usergroupscopeid from spprincipal "
                       "join specifyuser_spprincipal using (spprincipalid) "
                       "where grouptype is null and specifyuserid = %s",
                       [user.id])
        already_exist = set(r[0] for r in cursor.fetchall())

        for collectionid in set(collectionids) - already_exist:
            principal = Spprincipal.objects.create(
                groupsubclass='edu.ku.brc.af.auth.specify.principal.UserPrincipal',
                grouptype=None,
                name=user.name,
                priority=80,
            )
            cursor.execute('update spprincipal set usergroupscopeid = %s where spprincipalid = %s',
                           [collectionid, principal.id])
            cursor.execute('insert specifyuser_spprincipal(SpecifyUserID, SpPrincipalID) '
                           'values (%s, %s)', [user.id, principal.id])

class Sp6CollectionAccessPT(PermissionTarget):
    resource = '/admin/user/sp6/collection_access'
    read = PermissionTargetAction()
    update = PermissionTargetAction()

@login_maybe_required
@require_http_methods(['GET', 'PUT'])
@never_cache
def user_collection_access_for_sp6(request, userid):
    """Returns (GET) or sets (PUT) the list of collections user <userid>
    can log into. Requesting user must be an admin."""
    check_permission_targets(None, request.specify_user.id, [Sp6CollectionAccessPT.read])
    cursor = connection.cursor()

    if request.method == 'PUT':
        check_permission_targets(None, request.specify_user.id, [Sp6CollectionAccessPT.update])
        collections = json.loads(request.body)
        user = Specifyuser.objects.get(id=userid)
        set_users_collections_for_sp6(cursor, user, collections)

    collections = users_collections_for_sp6(cursor, userid)
    return HttpResponse(json.dumps([row[0] for row in collections]),
                        content_type="application/json")

@openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Template of info needed to login. Includes list of available collections.",
                "content": {"application/json": {"schema": { "$ref": "#/components/schemas/context_login_resp" }}},
            }
        }
    },
    'put': {
        "requestBody": {
            "required": True,
            "description": "Login information",
            "content": {"application/json": {"schema": { "$ref": "#/components/schemas/context_login_req" }}}
        },
        "responses": {
            "204": {"description": "Login succeeded"},
            "403": {"description": "Login was invalid"}
        }
    },
}, components={
    'schemas': {
        'context_login_resp': {
            'type': 'object',
            'description': 'Login API. The username, password, and collection properties '
            'are always null in GET responses. The collections property provides the ids '
            'of collections for loging in to.',
            'properties': {
                'collections': {
                    'type': 'object',
                    'description': 'Map of collection names to collection ids',
                    'additionalProperties': {'type': 'integer'}
                },
                'username': {'type': 'string', 'nullable': True},
                'password': {'type': 'string', 'nullable': True},
                'collection': {'type': 'integer', 'nullable': True},
            },
            'required': ['username', 'password', 'collection', 'collections'],
            'additionalProperties': False,
            "example": {
                "collections": {
                    "KUFishvoucher": 4,
                    "KUFishtissue": 32768,
                    "KUFishTeaching": 65536
                },
                "username": None,
                "password": None,
                "collection": None
            }
        },
        'context_login_req': {
            'type': 'object',
            'description': 'Use an id value from the collections '
            'property in GET respons to select the collection to log in to. '
            'PUT with any of the required properties '
            'set to null logs out. ',
            'properties': {
                'username': {'type': 'string', 'nullable': True},
                'password': {'type': 'string', 'nullable': True},
                'collection': {'type': 'integer', 'nullable': True},
            },
            'required': ['username', 'password', 'collection'],
            "example": {
                "username": "joe",
                "password": "paSswOrd",
                "collection": 4
            }
        }
    }
})
@require_http_methods(['GET', 'PUT'])
@never_cache
@ensure_csrf_cookie
@skip_collection_access_check
def api_login(request):
    """An API endpoint for logging in. GET returns the currently logged in user/collection if any.
    PUT logs into the request collection if possible.
    """
    if request.method == 'PUT':
        data = json.load(request)
        if any(data[key] is None for key in 'username password collection'.split()):
            auth_logout(request)
            return HttpResponse('', status=204)

        user = authenticate(username=data['username'],
                            password=data['password'])
        if user is None:
            return HttpResponseForbidden()
        auth_login(request, user)

        try:
            collection = Collection.objects.get(id=data['collection'])
        except Collection.DoesNotExist:
            return HttpResponseBadRequest('collection %s does not exist' % data['collection'])
        response = HttpResponse('', status=204)
        set_collection_cookie(response, collection.id)
        return response

    return HttpResponse(json.dumps(dict(
        collections={c.collectionname: c.id for c in Collection.objects.all()},
        username=None,
        password=None,
        collection=None)), content_type='application/json')

@login_maybe_required
@require_http_methods(['GET', 'POST'])
@never_cache
def collection(request):
    """Allows the frontend to query or set the logged in collection."""
    from specifyweb.specify.api import obj_to_data, toJson

    current = request.COOKIES.get('collection', None)
    available_collections = users_collections_for_sp7(request.specify_user.id)
    if request.method == 'POST':
        try:
            collection = Collection.objects.get(id=int(request.body))
        except ValueError:
            return HttpResponseBadRequest('bad collection id', content_type="text/plain")
        except Collection.DoesNotExist:
            return HttpResponseBadRequest('collection does not exist', content_type="text/plain")
        if collection.id not in [c.id for c in available_collections]:
            return HttpResponseBadRequest('access denied')
        response = HttpResponse('ok')
        set_collection_cookie(response, collection.id)
        return response
    else:
        response = dict(
            available=[obj_to_data(c) for c in available_collections],
            current=(current and int(current))
        )
        return HttpResponse(toJson(response), content_type="application/json")

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
@never_cache
@cache_control(max_age=86400, private=True)
def user(request):
    """Return json representation of the currently logged in SpecifyUser."""
    from specifyweb.specify.api import obj_to_data, toJson
    data = obj_to_data(request.specify_user)
    data['isauthenticated'] = request.user.is_authenticated
    data['available_collections'] = [
        obj_to_data(c)
        for c in users_collections_for_sp7(request.specify_user.id)
    ]
    data['agent'] = obj_to_data(request.specify_user_agent) if request.specify_user_agent != None else None

    if settings.RO_MODE or not request.user.is_authenticated:
        data['usertype'] = "readonly"
    return HttpResponse(toJson(data), content_type='application/json')

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
@never_cache
def domain(request):
    """Return the context hierarchy of the logged in collection."""
    collection = request.specify_collection
    domain = {
        'collection': collection.id,
        'discipline': collection.discipline.id,
        'division': collection.discipline.division.id,
        'institution': collection.discipline.division.institution.id,
        'embeddedCollectingEvent': collection.isembeddedcollectingevent,
        'embeddedPaleoContext': collection.discipline.ispaleocontextembedded,
        'paleoContextChildTable': collection.discipline.paleocontextchildtable,
        'catalogNumFormatName': collection.catalognumformatname,
        }

    return HttpResponse(json.dumps(domain), content_type='application/json')

@openapi(schema={
    "parameters": [
            {
                "name" : "name",
                "in":"query",
                "required" : True,
                "schema": {
                    "type": "string"
                },
                "description" : "The name of the app resource to fetch"
            },
            {
                "name" : "quiet",
                "in": "query",
                "required" : False,
                "schema": {
                    "type": "boolean",
                    "default": False,
                },
                "allowEmptyValue": True,
                "description": "Flag to indicate that if the AppResource does not exist, return response with code 204 instead of 404"
            }
        ],
    "get" : {
        "responses": {
            "404": {
                "description": "'name' parameter was not provided, or App Resource was not found"
            },
            "204": {
                "description" : "App Resource was not found but 'quiet' flag was provided"
            }
        }
    }
})
@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=86400, private=True)
def app_resource(request):
    """Return a Specify app resource by name taking into account the logged in user and collection."""
    try:
        resource_name = request.GET['name']
    except:
        raise Http404()
    quiet = "quiet" in request.GET and request.GET['quiet'].lower() != 'false'
    result = get_app_resource(request.specify_collection,
                              request.specify_user,
                              resource_name)
    if result is None and not quiet: 
          raise Http404()
    elif result is None and quiet: 
          return HttpResponse(status=204)
    resource, mimetype = result
    return HttpResponse(resource, content_type=mimetype)


@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=86400, private=True)
def available_related_searches(request):
    """Return a list of the available 'related' express searches."""
    from specifyweb.express_search import related_searches
    from specifyweb.express_search.views import get_express_search_config

    express_search_config = get_express_search_config(request.specify_collection, request.specify_user)
    active = [int(q.find('id').text)
              for q in express_search_config.findall('relatedQueries/relatedquery')
              if q.attrib.get('isactive', None) == 'true'  or q.find("[isActive='true']")]

    result = [name for name in related_searches.__all__
              if getattr(related_searches, name).id in active]

    return HttpResponse(json.dumps(result), content_type='application/json')

datamodel_json = None

@require_http_methods(['GET', 'HEAD'])
@login_maybe_required
@cache_control(max_age=86400, public=True)
def datamodel(request):
    "Returns a JSON representation of the Specify datamodel."
    from specifyweb.specify.models import datamodel
    global datamodel_json
    if datamodel_json is None:
        datamodel_json = datamodel_to_json(datamodel)

    return HttpResponse(datamodel_json, content_type='application/json')

@require_http_methods(['GET', 'HEAD'])
@login_maybe_required
@cache_control(max_age=86400, private=True)
def schema_localization(request):
    """Return the schema localization information for the logged in
    collection.  If the case-insensitive `lang` parameter is present return the
    schema localization for that language. The parameter should be of the
    form ll[-cc] where ll is a language code and cc is an optional
    country code.
    """
    lang = request.GET.get('lang', request.LANGUAGE_CODE)
    return JsonResponse(get_schema_localization(request.specify_collection, 0, lang))

@openapi(schema={
    "parameters": [
            {
                "name" : "name",
                "in":"query",
                "required" : True,
                "schema": {
                    "type": "string"
                },
                "description" : "The name of the view to fetch"
            },
            {
                "name" : "quiet",
                "in": "query",
                "required" : False,
                "schema": {
                    "type": "boolean",
                    "default": False,
                },
                "allowEmptyValue": True,
                "description": "Flag to indicate that if the view does not exist, return response with code 204 instead of 404"
            }
        ],
    "get" : {
        "responses": {
            "404": {
                "description": "'name' parameter was not provided, or view was not found"
            },
            "204": {
                "description" : "View was not found but 'quiet' flag was provided"
            }
        }
    }
})
@require_http_methods(['GET', 'HEAD'])
@login_maybe_required
@cache_control(max_age=86400, private=True)
def view(request):
    """Return a Specify view definition by name taking into account the logged in user and collection."""
    quiet = "quiet" in request.GET and request.GET['quiet'].lower() != 'false'
    if 'collectionid' in request.GET:
        # Allow a URL parameter to override the logged in collection.
        collection = Collection.objects.get(id=request.GET['collectionid'])
    else:
        collection = request.specify_collection

    try:
        view_name = request.GET['name']
    except:
        raise Http404()

    # If view can not be found, return 204 if quiet and 404 otherwise
    try:
        data = get_view(collection, request.specify_user, view_name)
    except Http404 as exception:
        if quiet: return HttpResponse(status=204)
        raise exception
    return HttpResponse(json.dumps(data), content_type="application/json")

@require_http_methods(['GET', 'HEAD'])
@login_maybe_required
@cache_control(max_age=86400, private=True)
def remote_prefs(request):
    "Return the 'remoteprefs' java properties file from the database."
    return HttpResponse(get_remote_prefs(), content_type='text/x-java-properties')

@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=86400, public=True)
@skip_collection_access_check
def system_info(request):
    "Return various information about this Specify instance."
    spversion = Spversion.objects.get()
    collection = request.specify_collection
    discipline = collection.discipline if collection is not None else None
    institution = Institution.objects.get()

    info = dict(
        version=settings.VERSION,
        specify6_version=re.findall(r'SPECIFY_VERSION=(.*)', specify_jar.read('resources_en.properties').decode('utf-8'))[0],
        database_version=spversion.appversion,
        schema_version=spversion.schemaversion,
        stats_url=settings.STATS_URL,
        database=settings.DATABASE_NAME,
        institution=institution.name,
        institution_guid=institution.guid,
        discipline=discipline and discipline.name,
        collection=collection and collection.collectionname,
        collection_guid=collection and collection.guid,
        isa_number=collection and collection.isanumber,
        )
    return HttpResponse(json.dumps(info), content_type='application/json')

PATH_GROUP_RE = re.compile(r'\(\?P<([^>]+)>[^\)]*\)')
PATH_GROUP_RE_EXTENDED = re.compile(r'<([^:]+):([^>]+)>')

def parse_pattern(pattern):
    p_str = str(pattern.pattern)
    params = []

    # Match old style django path params.
    # eg r'^properties/(?P<name>.+).properties$'
    for match in PATH_GROUP_RE.finditer(p_str):
        p_str = p_str.replace(match.group(0), "{%s}" % match.group(1), 1)
        params.append((match.group(1), "string"))

    # Match new style django path params w/ types.
    # eg 'user_policies/<int:collectionid>/<int:userid>/'
    for match in PATH_GROUP_RE_EXTENDED.finditer(p_str):
        p_str = p_str.replace(match.group(0), "{%s}" % match.group(2), 1)
        params.append((match.group(2), parse_type(match.group(1))))

    return p_str.strip('^$'), params

def parse_type(django_type):
    "Map django url param types to openAPI types."
    return {
        'int': 'integer',
        'str': 'string',
    }.get(django_type, "string")

# most tags are generated automatically based on the URL, but here are some
# exceptions:
tagMapper = {
    '/api/specify_tree/': 'specify_tree',
    '/api/workbench/': 'workbench',
}

def create_tag(path):
    for tag_filter, tag_name in tagMapper.items():
        if path.startswith(tag_filter):
            return tag_name

    path_parts = [part for part in os.path.dirname(path).split('/') if part]
    return path_parts[0] if len(path_parts) > 0 else '/'

def get_endpoint_tags(endpoint):

    methods = [key for key in endpoint.keys() if key != 'parameters']

    list = [endpoint[method]['tags'] for method in methods]
    return [item for sublist in list for item in sublist]  # flatten the list


def get_tags(endpoints):

    tag_names = [get_endpoint_tags(endpoint) for endpoint in endpoints.values()]
    flat_tag_names = [item for sublist in tag_names for item in sublist]
    unique_tag_names = sorted(list(set(flat_tag_names)))

    return [
        dict(
            name=tag_name,
        ) for tag_name in unique_tag_names
    ]

def merge_endpoint_schemas(autogenerated, hardcoded):
    """Merge autogenerated and hardcoded OpenAPI schema.

    params:
        autogenerated: OpenAPI object for an endpoint
        hardcoded: OpenAPI object for an endpoint

    returns:
        Result of merging two objects together
    """

    def merge_parameters(autogenerated, hardcoded):
        hardcoded_dict = { data['name']: data for data in hardcoded }
        return [
            *[parameter for parameter in autogenerated if
              parameter['name'] not in hardcoded_dict],
            *[parameter for parameter in hardcoded],
        ]

    merged_endpoints = { name: {
        **autogenerated['get'],
        **data
    } for name, data in hardcoded.items() if name != 'parameters' }

    if len(merged_endpoints.keys()) == 0:
        merged_endpoints['get'] = autogenerated['get']

    return {
        'parameters': merge_parameters(
            autogenerated['parameters'],
            hardcoded['parameters'] if 'parameters' in hardcoded else {}
        ),
        **merged_endpoints
    }

def merge_components(components, endpoint_components):
    """Merge components from an endpoint into a central component store.

    Params:
        components: dictionary of existing components
        endpoint_components: dictionary of components to add

    Returns:
        Merged components structure
    """
    return {
        subspace_name: {
            **(
                  components[subspace_name] if subspace_name in components else {}
            ),
            **(
                endpoint_components[subspace_name] if subspace_name in endpoint_components else {}
            ),
        } for subspace_name in set([*components.keys(), *endpoint_components.keys()])
    }

def get_endpoints(
    patterns,
    all_endpoints,
    merge_components,
    prefix="/",
    preparams=[]
):
    for p in patterns:
        path, params = parse_pattern(p)
        complete_path = prefix + path

        tag = create_tag(complete_path)

        if isinstance(p, URLPattern):
            endpoints_schema = {
                'parameters': [
                    {
                        'name': param,
                        'in': 'path',
                        'required': True,
                        'schema': {
                            'type': api_type
                        }
                    }
                    for param, api_type in preparams + params
                ],
                'get': {
                    **({
                           'summary': p.callback.__doc__[0:64] + (
                               "..." if len(p.callback.__doc__) > 64 else ""),
                           'description': p.callback.__doc__
                       } if p.callback.__doc__ else { }),
                    'tags': [tag],
                    'responses': {
                        '200': {
                            'description': 'Successful response'
                        }
                    }
                },
            }

            if hasattr(p.callback, '__schema__'):
                merge_components(p.callback.__schema__['components'])
                merged_schema = merge_endpoint_schemas(
                    endpoints_schema,
                    p.callback.__schema__['schema']
                )
                yield complete_path, merged_schema
            elif all_endpoints:
                yield complete_path, endpoints_schema
        else:
            yield from get_endpoints(
                p.url_patterns,
                all_endpoints,
                merge_components,
                prefix + path,
                preparams + params
            )


def generate_openapi_for_endpoints(all_endpoints=False):
    """Returns a JSON description of endpoints.

    Params:
        all_endpoints: whether to include endpoints that don't have OpenAPI schema
    """
    urlconf = __import__(settings.ROOT_URLCONF, {}, {}, [''])

    components = { }

    def merge_components_local(endpoint_components):
        nonlocal components
        components = merge_components(components, endpoint_components)

    endpoints = dict(get_endpoints(
        urlconf.urlpatterns,
        all_endpoints,
        merge_components_local
    ))
    tags = list(get_tags(endpoints))

    return {
        **base_schema(
            _("Specify 7 Operations API"),
            description=(
                '<a href="/documentation/api/tables/">'
                f'{_("Specify 7 APIs for database tables")}'
                '</a><br><a href="/documentation/api/operations/all/">'
                f'{_("Specify 7 APIs for system operations (all endpoints)")}'
                '</a>'
            )
        ),
        **dict(
            tags=tags,
            paths=endpoints
        ),
        'components': components,
    }


@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=86400, public=True)
def api_endpoints(request):
    """Returns a JSON description of endpoints that have schema defined."""
    return JsonResponse(generate_openapi_for_endpoints(False))


@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=86400, public=True)
def api_endpoints_all(request):
    """Returns a JSON description of all endpoints."""
    return JsonResponse(generate_openapi_for_endpoints(True))

@require_http_methods(['GET', 'POST', 'HEAD'])
@cache_control(max_age=86400, public=True)
@openapi(schema={
    "get": {
        "parameters": [
            {
                "name": "languages",
                "in": "query",
                "description": "Comma separate list of languages",
                "example": "en-us,uk-ua,ru-ru",
                "required": False,
                "schema": {
                    "type": "string",
                },
            },
        ],
        "responses": {
            "200": {
                "description": "List of available languages",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "additionalProperties": {
                                "type": "object",
                                "properties": {
                                    "bidi": {
                                        "type": "boolean",
                                    },
                                    "code": {
                                        "type": "string",
                                        "example": "uk",
                                    },
                                    "is_current": {
                                        "description": "Is currently selected language",
                                        "type": "boolean",
                                    },
                                    "name": {
                                        "type": "string",
                                        "example": "Ukrainian",
                                    },
                                    "name_local": {
                                        "type": "string",
                                        "example": "Українська",
                                    },
                                    "name_translated": {
                                        "type": "string",
                                        "example": "Ukrainian",
                                    },
                                },
                            },
                        },
                    }
                },
            }
        }
    },
    'post': {
        "requestBody": {
            "required": True,
            "description": "Login information",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "language": {
                                "type": "string",
                                "example": "uk-ua",
                            },
                        },
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "Language changed"},
        }
    },
})
def languages(request):
    """Get List of available languages OR set current language."""
    if request.method == 'POST':
        data = json.load(request)
        language = data.get(LANGUAGE_QUERY_PARAMETER, settings.LANGUAGE_CODE)
        # Based on django.views.i18n.set_language, but does not check for
        # validity of language code. This allows front-end to enable a dev-only
        # language like "underscore" or "double"
        response = HttpResponse(status=204)
        response.set_cookie(
            settings.LANGUAGE_COOKIE_NAME,
            language,
            max_age=settings.LANGUAGE_COOKIE_AGE,
            path=settings.LANGUAGE_COOKIE_PATH,
            domain=settings.LANGUAGE_COOKIE_DOMAIN,
        )
        return response
    else:  # GET or HEAD
        languages = request.GET.get('languages', None)
        if languages is None:
            languages = [code for code,name in settings.LANGUAGES]
        else:
            languages = languages.split(',')

        return JsonResponse({
            code:{
                **get_language_info(code),
                'is_current': code==request.LANGUAGE_CODE
            } for code in languages
        })

@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=86400, public=True)
def schema_language(request):
    """Get list of schema languages, countries and variants."""
    schema_languages = get_schema_languages()
    return JsonResponse([
        dict(zip(('language', 'country', 'variant'), row))
        for row in schema_languages
    ], safe=False)
