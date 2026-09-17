from django.utils.functional import SimpleLazyObject
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse

from specifyweb.specify.models import Collection, Specifyuser, Agent
from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.backend.accounts.access_token_utils import get_token_from_request, token_is_revoked
from specifyweb.backend.context.views import has_collection_access


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
        # The request doesn't have an access token, so pass through
        if token is None:
            return self.get_response(request)

        # There was an access token in the request, but it was invalid or
        # revoked. Stop here and return a 401 Unauthorized
        if token == False or token_is_revoked(token):
            response = HttpResponse('Invalid access token', status=401)
            response["WWW-Authenticate"] = 'error=\"invalid_token\", error_description=\"The access token is expired, revoked, or invalid\"'
            return response

        user_id = token["sub"]
        collection_id = token["collection"]

        # This shouldn't happen often in practice as this is also enforced when
        # the tokens are generated, but just in case a token is forged or the
        # user's collection access was revoked since the token was generated,
        # this prevents users from accessing Collections they shouldn't
        if not has_collection_access(collection_id, user_id):
            raise PermissionDenied()

        request.specify_collection = SimpleLazyObject(
            lambda: Collection.objects.get(id=collection_id))
        lazy_user = SimpleLazyObject(
            lambda: Specifyuser.objects.get(id=user_id))
        request.specify_user = lazy_user
        request.user = lazy_user
        request.specify_user_agent = SimpleLazyObject(
            lambda: get_agent(request))

        # We can disable CSRF checks with users authenticated via JWT.
        # This is ONLY because the end user must explicitly pass the auth token
        # as a header, and is not stored within the session, cookies, etc.
        # Essentially, with CSRF protection disabled for users authenticated
        # via token, we have to be careful not to store any auth information in
        # a stateful way within the session
        # e.g., avoid calling django.contrib.auth.login
        request._dont_enforce_csrf_checks = True
        return self.get_response(request)
