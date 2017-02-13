import re
import json

from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, Http404, HttpResponseForbidden
from django.utils.http import is_safe_url
from django.views.decorators.http import require_http_methods, require_GET
from django.views.decorators.cache import cache_control
from django.template.response import TemplateResponse
from django.contrib.auth import authenticate, views as auth_views, logout as auth_logout, login as auth_login
from django.contrib.auth.forms import AuthenticationForm
from django.conf import settings
from django import forms
from django.db import connection, transaction

from specifyweb.specify.models import Collection, Spappresourcedata, Spversion,Agent, Institution, Specifyuser, Spprincipal
from specifyweb.specify.serialize_datamodel import datamodel_to_json
from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.specify_jar import specify_jar

from .app_resource import get_app_resource
from .viewsets import get_view
from .schema_localization import get_schema_localization


def set_collection_cookie(response, collection_id):
    response.set_cookie('collection', str(collection_id), max_age=365*24*60*60)

def users_collections(cursor, user_id):
    cursor.execute("""
    select distinct c.usergroupscopeid, c.collectionname from collection c
    inner join spprincipal p on p.usergroupscopeid = c.usergroupscopeid
    inner join specifyuser_spprincipal up on up.spprincipalid = p.spprincipalid
    inner join specifyuser u on u.specifyuserid = up.specifyuserid and p.grouptype is null
    where up.specifyuserid = %s
    """, [user_id])

    return list(cursor.fetchall())

@login_maybe_required
@require_http_methods(['GET', 'PUT'])
def user_collection_access(request, userid):
    if not request.specify_user.is_admin():
        return HttpResponseForbidden()
    cursor = connection.cursor()

    if request.method == 'PUT':
        collections = json.loads(request.body)
        user = Specifyuser.objects.get(id=userid)
        with transaction.commit_on_success():
            cursor.execute("delete from specifyuser_spprincipal where specifyuserid = %s", [userid])
            cursor.execute('delete from spprincipal where grouptype is null and spprincipalid not in ('
                           'select spprincipalid from specifyuser_spprincipal)')
            for collectionid in collections:
                principal = Spprincipal.objects.create(
                    groupsubclass='edu.ku.brc.af.auth.specify.principal.UserPrincipal',
                    grouptype=None,
                    name=user.name,
                    priority=80,
                )
                cursor.execute('update spprincipal set usergroupscopeid = %s where spprincipalid = %s',
                               [collectionid, principal.id])
                cursor.execute('insert specifyuser_spprincipal(SpecifyUserID, SpPrincipalID) '
                               'values (%s, %s)', [userid, principal.id])

    collections = users_collections(cursor, userid)
    return HttpResponse(json.dumps([row[0] for row in collections]),
                        content_type="application/json")

class CollectionChoiceField(forms.ChoiceField):
    widget = forms.RadioSelect
    def label_from_instance(self, obj):
        return obj.collectionname

@login_maybe_required
@require_http_methods(['GET', 'POST'])
def choose_collection(request):
    redirect_to = (request.POST if request.method == "POST" else request.GET).get('next', '')
    redirect_resp = HttpResponseRedirect(
        redirect_to if is_safe_url(url=redirect_to, host=request.get_host())
        else settings.LOGIN_REDIRECT_URL
    )

    available_collections = users_collections(connection.cursor(), request.specify_user.id)

    if len(available_collections) < 1:
        auth_logout(request)
        return TemplateResponse(request, 'choose_collection.html', context={'next': redirect_to})

    if len(available_collections) == 1:
        set_collection_cookie(redirect_resp, available_collections[0][0])
        return redirect_resp

    class Form(forms.Form):
        collection = CollectionChoiceField(
            choices=available_collections,
            initial=request.COOKIES.get('collection', None))

    if request.method == 'POST':
        form = Form(data=request.POST)
        if form.is_valid():
            set_collection_cookie(redirect_resp, form.cleaned_data['collection'])
            return redirect_resp
    else:
        form = Form()

    context = {'form': form, 'next': redirect_to}
    return TemplateResponse(request, 'choose_collection.html', context)

@require_http_methods(['GET', 'PUT'])
def api_login(request):
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
def collection(request):
    """Allows the frontend to query or set the logged in collection."""
    current = request.COOKIES.get('collection', None)
    available_collections = users_collections(connection.cursor(), request.specify_user.id)
    if request.method == 'POST':
        try:
            collection = Collection.objects.get(id=int(request.body))
        except ValueError:
            return HttpResponseBadRequest('bad collection id', content_type="text/plain")
        except Collection.DoesNotExist:
            return HttpResponseBadRequest('collection does not exist', content_type="text/plain")
        if collection.id not in [c[0] for c in available_collections]:
            return HttpResponseBadRequest('access denied')
        response = HttpResponse('ok')
        set_collection_cookie(response, collection.id)
        return response
    else:
        response = dict(available=available_collections, current=(current and int(current)))
        return HttpResponse(json.dumps(response), content_type="application/json")

@login_maybe_required
@require_GET
@cache_control(max_age=86400, private=True)
def user(request):
    """Return json representation of the currently logged in SpecifyUser."""
    from specifyweb.specify.api import obj_to_data, toJson
    data = obj_to_data(request.specify_user)
    data['isauthenticated'] = request.user.is_authenticated
    data['available_collections'] = users_collections(connection.cursor(), request.specify_user.id)
    data['agent'] = obj_to_data(request.specify_user_agent)
    if settings.RO_MODE or not request.user.is_authenticated:
        data['usertype'] = "readonly"
    return HttpResponse(toJson(data), content_type='application/json')

@login_maybe_required
@require_GET
@cache_control(max_age=86400, private=True)
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
        }

    return HttpResponse(json.dumps(domain), content_type='application/json')

@login_maybe_required
@require_GET
@cache_control(max_age=86400, private=True)
def app_resource(request):
    """Return a Specify app resource by name taking into account the logged in user and collection."""
    try:
        resource_name = request.GET['name']
    except:
        raise Http404()
    result = get_app_resource(request.specify_collection,
                              request.specify_user,
                              resource_name)
    if result is None: raise Http404()
    resource, mimetype = result
    return HttpResponse(resource, content_type=mimetype)


@login_maybe_required
@require_GET
@cache_control(max_age=86400, private=True)
def available_related_searches(request):
    """Return a list of the available 'related' express searches."""
    from specifyweb.express_search import related_searches
    from specifyweb.express_search.views import get_express_search_config

    express_search_config = get_express_search_config(request.specify_collection, request.specify_user)
    active = [int(q.find('id').text)
              for q in express_search_config.findall('relatedQueries/relatedquery[@isactive="true"]')]

    result = [name for name in related_searches.__all__
              if getattr(related_searches, name).id in active]

    return HttpResponse(json.dumps(result), content_type='application/json')

datamodel_json = None

@require_GET
@login_maybe_required
@cache_control(max_age=86400, public=True)
def datamodel(request):
    from specifyweb.specify.models import datamodel
    global datamodel_json
    if datamodel_json is None:
        datamodel_json = datamodel_to_json(datamodel)

    return HttpResponse(datamodel_json, content_type='application/json')

@require_GET
@login_maybe_required
@cache_control(max_age=86400, private=True)
def schema_localization(request):
    """Return the schema localization information for the logged in collection."""
    sl = get_schema_localization(request.specify_collection, 0)
    return HttpResponse(sl, content_type='application/json')

@require_GET
@login_maybe_required
@cache_control(max_age=86400, private=True)
def wb_schema_localization(request):
    """Return the WB schema localization information for the logged in collection."""
    sl = get_schema_localization(request.specify_collection, 1)
    return HttpResponse(sl, content_type='application/json')

@require_GET
@login_maybe_required
@cache_control(max_age=86400, private=True)
def view(request):
    """Return a Specify view definition by name taking into account the logged in user and collection."""
    if 'collectionid' in request.GET:
        # Allow a URL parameter to override the logged in collection.
        collection = Collection.objects.get(id=request.GET['collectionid'])
    else:
        collection = request.specify_collection

    try:
        view_name = request.GET['name']
    except:
        raise Http404()
    data = get_view(collection, request.specify_user, view_name)

    return HttpResponse(json.dumps(data), content_type="application/json")

@require_GET
@login_maybe_required
@cache_control(max_age=86400, private=True)
def remote_prefs(request):
    res = Spappresourcedata.objects.filter(
        spappresource__name='preferences',
        spappresource__spappresourcedir__usertype='Prefs')

    data = '\n'.join(r.data for r in res)
    return HttpResponse(data, content_type='text/x-java-properties')

@require_GET
@cache_control(max_age=86400, public=True)
def system_info(request):
    spversion = Spversion.objects.get()
    collection = request.specify_collection
    discipline = collection.discipline if collection is not None else None
    institution = Institution.objects.get()

    info = dict(
        version=settings.VERSION,
        specify6_version=re.findall(r'SPECIFY_VERSION=(.*)', specify_jar.read('resources_en.properties'))[0],
        database_version=spversion.appversion,
        schema_version=spversion.schemaversion,
        stats_url=settings.STATS_URL,
        database=settings.DATABASE_NAME,
        institution=institution.name,
        discipline=discipline and discipline.name,
        collection=collection and collection.collectionname,
        isa_number=collection and collection.isanumber,
        )
    return HttpResponse(json.dumps(info), content_type='application/json')
