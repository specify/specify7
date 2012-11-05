from django.http import HttpResponse, HttpResponseBadRequest, Http404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods, require_GET
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import views as auth_views
from django.utils import simplejson

from specify.models import Collection

from app_resource import get_app_resource

from viewsets import view
from schema_localization import schema_localization

def login(request):
    if request.method == 'POST':
        request.session['collection'] = request.POST['collection_id']

    kwargs = {
        'template_name': 'login.html',
        'extra_context': { 'collections': Collection.objects.all() } }
    return auth_views.login(request, **kwargs)

def logout(request):
    return auth_views.logout(request, template_name='logged_out.html')

@login_required
@csrf_exempt
@require_http_methods(['GET', 'POST'])
def collection(request):
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
def domain(request):
    levels = ('collection', 'discipline', 'division', 'institution')
    domain = {}
    obj = type('dummy', (object,), {'collection': request.specify_collection})
    for level in levels:
        obj = getattr(obj, level)
        domain[level] = obj.id

    return HttpResponse(simplejson.dumps(domain), content_type='application/json')

@login_required
@require_GET
def app_resource(request):
    resource_name = request.GET['name']
    result = get_app_resource(request.specify_collection,
                              request.specify_user,
                              resource_name)
    if result is None: raise Http404()
    resource, mimetype = result
    return HttpResponse(resource, content_type=mimetype)


@require_GET
def available_related_searches(request):
    import express_search.related_searches
    return HttpResponse(simplejson.dumps(express_search.related_searches.__all__),
                        content_type='application/json')
