import re

from django.http import HttpResponse, HttpResponseBadRequest, Http404, HttpResponseForbidden
from django.views.decorators.http import require_http_methods, require_GET
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_control
from django.contrib.auth import authenticate, views as auth_views, logout as auth_logout, login as auth_login
from django.contrib.auth.forms import AuthenticationForm
from django.utils import simplejson
from django.conf import settings
from django import forms

from specifyweb.specify.models import Collection, Spappresourcedata, Spversion, Agent
from specifyweb.specify.serialize_datamodel import datamodel_to_json
from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.specify_jar import specify_jar

from .app_resource import get_app_resource
from .viewsets import get_view
from .schema_localization import get_schema_localization

class CollectionChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        return obj.collectionname


def set_collection_cookie(response, collection_id):
    response.set_cookie('collection', str(collection_id), max_age=365*24*60*60)

def login(request):
    """A Django view to log users into the system.
    Supplements the stock Django login with a collection selection.
    """
    collection_cell = [] # use a closure to tunnel the collection field out of the auth mechanism
    class LoginForm(AuthenticationForm):
        collection = CollectionChoiceField(queryset=Collection.objects.all(), empty_label=None)

        def clean(self):
            AuthenticationForm.clean(self)
            collection = self.cleaned_data.get('collection')
            if self.user_cache is not None:
                try:
                    Agent.objects.get(division=collection.discipline.division,
                                      specifyuser=self.user_cache)
                except Agent.DoesNotExist:
                    raise forms.ValidationError("The user has no agent for the chosen collection.")
            collection_cell.append(collection.id)
            return self.cleaned_data

    response = auth_views.login(request,
                                template_name='login.html',
                                authentication_form=LoginForm)
    if len(collection_cell) > 0:
        set_collection_cookie(response, collection_cell[0])
    return response

def logout(request):
    """A Django view to log users out."""
    return auth_views.logout(request, template_name='logged_out.html')

@require_http_methods(['GET', 'PUT'])
@csrf_exempt
def api_login(request):
    if request.method == 'PUT':
        data = simplejson.load(request)
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

    return HttpResponse(simplejson.dumps(dict(
        collections={c.collectionname: c.id for c in Collection.objects.all()},
        username=None,
        password=None,
        collection=None)), content_type='application/json')

@login_maybe_required
@csrf_exempt
@require_http_methods(['GET', 'POST'])
def collection(request):
    """Allows the frontend to query or set the logged in collection."""
    if request.method == 'POST':
        try:
            collection = Collection.objects.get(id=int(request.raw_post_data))
        except ValueError:
            return HttpResponseBadRequest('bad collection id', content_type="text/plain")
        except Collection.DoesNotExist:
            return HttpResponseBadRequest('collection does not exist', content_type="text/plain")
        response = HttpResponse('ok')
        set_collection_cookie(response, collection.id)
        return response
    else:
        collection = request.COOKIES.get('collection', '')
        return HttpResponse(collection, content_type="text/plain")

@login_maybe_required
@require_GET
@cache_control(max_age=86400, private=True)
def user(request):
    """Return json representation of the currently logged in SpecifyUser."""
    from specifyweb.specify.api import obj_to_data, toJson
    data = obj_to_data(request.specify_user)
    data['isauthenticated'] = request.user.is_authenticated()
    if settings.RO_MODE or not request.user.is_authenticated():
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

    return HttpResponse(simplejson.dumps(domain), content_type='application/json')

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

    return HttpResponse(simplejson.dumps(result), content_type='application/json')

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

    return HttpResponse(simplejson.dumps(data), content_type="application/json")

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

    info = dict(
        version=settings.VERSION,
        specify6_version=re.findall(r'SPECIFY_VERSION=(.*)', specify_jar.read('resources_en.properties'))[0],
        database_version=spversion.appversion,
        schema_version=spversion.schemaversion,
        )
    return HttpResponse(simplejson.dumps(info), content_type='application/json')
