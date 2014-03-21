from django.http import HttpResponse, HttpResponseBadRequest, Http404, HttpResponseForbidden
from django.views.decorators.http import require_http_methods, require_GET
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, views as auth_views, logout as auth_logout, login as auth_login
from django.utils import simplejson
from django.conf import settings

from specifyweb.specify.models import Collection
from specifyweb.specify.serialize_datamodel import datamodel_to_json
from specifyweb.specify.views import login_required
from specifyweb.attachment_gw.views import get_settings as attachment_settings

from .app_resource import get_app_resource
from .viewsets import get_view
from .schema_localization import get_schema_localization

def login(request):
    """A Django view to log users into the system.
    Supplements the stock Django login with a collection selection.
    """
    if request.method == 'POST':
        request.session['collection'] = request.POST['collection_id']

    kwargs = {
        'template_name': 'login.html',
        'extra_context': { 'collections': Collection.objects.all() } }
    return auth_views.login(request, **kwargs)

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
        request.session['collection'] = collection.id

        return HttpResponse('', status=204)

    return HttpResponse(simplejson.dumps(dict(
        collections={c.collectionname: c.id for c in Collection.objects.all()},
        username=None,
        password=None,
        collection=None)), content_type='application/json')

@login_required
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
        request.session['collection'] = str(collection.id)
        return HttpResponse('ok')
    else:
        collection = request.session.get('collection', '')
        return HttpResponse(collection, content_type="text/plain")

@login_required
@require_GET
def user(request):
    """Return json representation of the currently logged in SpecifyUser."""
    from specifyweb.specify.api import obj_to_data, toJson
    data = obj_to_data(request.specify_user)
    data['isadmin'] = request.specify_user.is_admin()
    if settings.SAFE_MODE:
        data['usertype'] = "readonly"
    return HttpResponse(toJson(data), content_type='application/json')

@login_required
@require_GET
def domain(request):
    """Return the context hierarchy of the logged in collection."""
    collection = request.specify_collection
    domain = {
        'collection': collection.id,
        'discipline': collection.discipline.id,
        'division': collection.discipline.division.id,
        'institution': collection.discipline.division.institution.id,
        'embeddedCollectingEvent': collection.isembeddedcollectingevent,
        }

    return HttpResponse(simplejson.dumps(domain), content_type='application/json')

@login_required
@require_GET
def app_resource(request):
    """Return a Specify app resource by name taking into account the logged in user and collection."""
    resource_name = request.GET['name']
    result = get_app_resource(request.specify_collection,
                              request.specify_user,
                              resource_name)
    if result is None: raise Http404()
    resource, mimetype = result
    return HttpResponse(resource, content_type=mimetype)


@require_GET
def available_related_searches(request):
    """Return a list of the available 'related' express searches."""
    from specifyweb.express_search import related_searches
    return HttpResponse(simplejson.dumps(related_searches.__all__),
                        content_type='application/json')

datamodel_json = None

@require_GET
@login_required
def datamodel(request):
    from specifyweb.specify.models import datamodel
    global datamodel_json
    if datamodel_json is None:
        datamodel_json = datamodel_to_json(datamodel)

    return HttpResponse(datamodel_json, content_type='application/json')

@require_GET
@login_required
def schema_localization(request):
    """Return the schema localization information for the logged in collection."""
    sl = get_schema_localization(request.specify_collection)
    return HttpResponse(sl, content_type='application/json')

@require_GET
@login_required
def view(request):
    """Return a Specify view definition by name taking into account the logged in user and collection."""
    if 'collectionid' in request.GET:
        # Allow a URL parameter to override the logged in collection.
        collection = Collection.objects.get(id=request.GET['collectionid'])
    else:
        collection = request.specify_collection

    data = get_view(collection, request.specify_user, request.GET['name'])

    return HttpResponse(simplejson.dumps(data), content_type="application/json")
