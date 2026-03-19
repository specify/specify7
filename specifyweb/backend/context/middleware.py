"""
Adds information about the specify user to incoming requests
"""

from django.conf import settings
from django.utils.functional import SimpleLazyObject

from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.specify.models import Collection, Specifyuser, Agent
from specifyweb.backend.context.views import users_collections_for_sp7


def get_cached(attr, func, request):
    if not hasattr(request, attr):
        setattr(request, attr, func(request))
    return getattr(request, attr)

def get_user(request):
    if request.user.is_authenticated:
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
        """
        If the collection cookie is not set, try and scope the request to a
        collection the user has access to.
        If the user can't be inferred, default to the first collection.
        """
        user = request.specify_user
        if user is None:
            return qs.all()[0]
        user_collections = users_collections_for_sp7(user.id)
        return user_collections[0]
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

class ContextMiddleware:
    """Adds information about the logged in user and collection to requests."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # These can be set by middleware "higher" in the chain/before this one,
        # particularly when using a different authentiation scheme, such as via
        # JWT Auth token
        if not hasattr(request, "specify_collection"):
            request.specify_collection = SimpleLazyObject(lambda: get_cached('_cached_collection', get_collection, request))
        if not hasattr(request, "specify_user_agent"):
            request.specify_user_agent = SimpleLazyObject(lambda: get_cached('_cached_agent', get_agent, request))
        if not hasattr(request, "specify_user"):
            request.specify_user       = SimpleLazyObject(lambda: get_cached('_cached_specify_user', get_user, request))

        return self.get_response(request)

    def process_template_response(self, request, response):
        collection = getattr(request, 'specify_collection', None)
        if collection is not None:
            response.context_data['collection'] = collection
        return response
