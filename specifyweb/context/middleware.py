from django.http import HttpResponseBadRequest
from django.utils.functional import SimpleLazyObject
from django.conf import settings

from specifyweb.specify.models import Collection, Specifyuser, Agent
from specifyweb.specify.filter_by_col import filter_by_collection


def get_cached(attr, func, request):
    if not hasattr(request, attr):
        setattr(request, attr, func(request))
    return getattr(request, attr)

def get_user(request):
    if request.user.is_authenticated():
        return request.user
    elif settings.ANONYMOUS_USER:
        return Specifyuser.objects.get(name=settings.ANONYMOUS_USER)
    else:
        return None

def get_collection(request):
    qs = Collection.objects.select_related('discipline',
                                           'discipline__division',
                                           'discipline__division__institution')

    try:
        collection_id = int(request.COOKIES.get('collection', ''))
    except ValueError:
        return qs.all()[0]
    else:
        return qs.get(id=collection_id)

def get_agent(request):
    try:
        return filter_by_collection(Agent.objects, request.specify_collection) \
            .select_related('specifyuser') \
            .get(specifyuser=request.specify_user)
    except Agent.DoesNotExist:
        return None

def get_readonly(request):
    return (
        settings.RO_MODE or
        request.specify_user.usertype not in ('Manager', 'FullAccess'))

class ContextMiddleware(object):
    """Adds information about the logged in user and collection to requests."""
    def process_request(self, request):
        request.specify_collection = SimpleLazyObject(lambda: get_cached('_cached_collection', get_collection, request))
        request.specify_user_agent = SimpleLazyObject(lambda: get_cached('_cached_agent', get_agent, request))
        request.specify_user       = SimpleLazyObject(lambda: get_cached('_cached_specify_user', get_user, request))
        request.specify_readonly   = SimpleLazyObject(lambda: get_cached('_cached_specify_readonly', get_readonly, request))

    def process_template_response(self, request, response):
        collection = getattr(request, 'specify_collection', None)
        if collection is not None:
            response.context_data['collection'] = collection
        return response
