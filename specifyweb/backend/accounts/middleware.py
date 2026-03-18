import jwt

from django.contrib.auth import login, authenticate
from django.utils.functional import SimpleLazyObject

from specifyweb.specify.models import Collection, Specifyuser, Agent
from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.backend.accounts.auth_token_utils import get_token_from_request, token_is_revoked

def get_agent(request):
    try:
        return filter_by_collection(Agent.objects, request.specify_collection) \
            .select_related('specifyuser') \
            .get(specifyuser=request.specify_user)
    except Agent.DoesNotExist:
        return None

class JWTAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        token = get_token_from_request(request)
        if token == False or token_is_revoked(token):
            return self.get_response(request)
        user_id = token["sub"]
        collection_id = token["collection"]

        request.specify_collection = SimpleLazyObject(lambda: Collection.objects.get(id=collection_id))
        lazy_user = SimpleLazyObject(lambda: Specifyuser.objects.get(id=user_id))
        request.specify_user = lazy_user
        request.user = lazy_user
        request.specify_user_agent = SimpleLazyObject(lambda: get_agent(request))

        # We can disable CSRF checks with users authenticated via JWT.
        # This is ONLY because the end user must explicitly pass the auth token
        # as a header, and is not stored within the session, cookies, etc.
        # Essentially, with CSRF protection disabled for users authenticated 
        # via token, we have to be careful not to store any auth information in
        # a stateful way within the session
        # e.g., avoid calling django.contrib.auth.login
        request._dont_enforce_csrf_checks = True
        return self.get_response(request)
