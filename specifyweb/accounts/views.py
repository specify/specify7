import base64
import hashlib
import hmac
import json
import jwt
import logging
import requests
import time
from django import forms
from django import http
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import AbstractBaseUser
from django.db import connection
from django.db.models import Max
from django.shortcuts import render
from django.template.response import TemplateResponse
from django.utils import crypto
from django.utils.http import is_safe_url, urlencode
from django.views.decorators.cache import never_cache
from typing import Union, Optional, Dict, cast
from typing_extensions import TypedDict

from specifyweb.middleware.general import require_GET, require_http_methods

from specifyweb.permissions.permissions import PermissionTarget, \
    PermissionTargetAction, check_permission_targets
from specifyweb.specify import models as spmodels
from specifyweb.specify.views import login_maybe_required, openapi
from .models import Spuserexternalid
from specifyweb.specify.models import Specifyuser

logger = logging.getLogger(__name__)
class ProviderInfo(TypedDict):
    "Elements of settings.OAUTH_LOGIN_PROVIDERS should have this type."
    title: str # The name of the provider for UI purposes.
    client_id: str
    client_secret: str
    scope: str
    # config can be either the OpenId discovery endpoint or
    # a dictionary of auth and token endpoints.
    config: Union[str, "ProviderConf"]

def is_provider_info(d: Dict) -> bool:
    required_keys = ["title", "client_id", "client_secret", "scope", "config"]
    return all(key in d for key in required_keys)

class ProviderConf(TypedDict):
    """OpenId provider endpoints provided by the settings or by
    the provider's discovery document."""
    authorization_endpoint: str
    token_endpoint: str


class OAuthLogin(TypedDict):
    "Data carried through a session variable during oauth login."
    state: str
    provider: str
    provider_conf: ProviderConf


class ExternalUser(TypedDict):
    """Information passed through a session variable to associate the
    user's external id to a specifyuser record."""
    provider: str
    provider_title: str # For UI purposes.
    id: str # The user's id in the provider's system.
    name: str # The user's name for UI purposes.
    idtoken: Dict # The JWT from the provider.

class InviteToken(TypedDict):
    """Embedded in an invite token."""
    userid: int  # The Specify user id
    username: str
    sequence: Optional[int] # To prevent reuse of token.
    expires: int # A time.time() value after which the token is expired.


@require_http_methods(['GET', 'POST'])
def oic_login(request: http.HttpRequest) -> http.HttpResponse:
    """Initiates the OpenId Connect login process by providing the list of
    available providers, then redirecting to the one chosen.
    """
    if request.method == 'POST':
        provider = request.POST['provider']
        provider_info_dict = settings.OAUTH_LOGIN_PROVIDERS[provider]
        assert is_provider_info(provider_info_dict), "provider_info_dict does not match ProviderInfo structure"
        provider_info: ProviderInfo = cast(ProviderInfo, provider_info_dict)

        provider_conf: ProviderConf
        if isinstance(provider_info['config'], str):
            discovery_url = provider_info['config']
            if not discovery_url.endswith("/.well-known/openid-configuration"):
                discovery_url += "/.well-known/openid-configuration"
            provider_conf = requests.get(discovery_url).json() # This could be cached.
        else:
            provider_conf = provider_info['config']

        state = crypto.get_random_string(length=32)
        oauth_login: OAuthLogin = {
            'state': state,
            'provider': provider,
            'provider_conf': provider_conf,
        }
        request.session['oauth_login'] = oauth_login

        endpoint = provider_conf['authorization_endpoint']
        params = urlencode({
            'response_type': 'code',
            'scope': provider_info['scope'],
            'client_id': provider_info['client_id'],
            'redirect_uri': request.build_absolute_uri('/accounts/oic_callback/'),
            'state': state,
        })
        return http.HttpResponseRedirect(f'{endpoint}?{params}')

    providers = [
        {'provider': p, 'title': d['title']}
        for p, d in settings.OAUTH_LOGIN_PROVIDERS.items()
    ]
    return render(request, "oic_login.html", context={'providers': providers})

@openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns a list of configured OIC identity providers.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "provider": { "type": "string" },
                                    "title": { "type": "string" },
                                },
                                "required": ["provider", "title"],
                                "additionalProperties": False,
                            }
                        }
                    }
                }
            }
        }
    }
})
@require_GET
def oic_providers(request: http.HttpRequest) -> http.HttpResponse:
    "Return a list of configured identity providers."
    providers = [
        {'provider': p, 'title': d['title']}
        for p, d in settings.OAUTH_LOGIN_PROVIDERS.items()
    ]
    return http.JsonResponse(providers, safe=False)

@require_GET
def oic_callback(request: http.HttpRequest) -> http.HttpResponse:
    """Handles the return callback from the OIC identity provider. """
    oauth_login: OAuthLogin = request.session['oauth_login']
    del request.session['oauth_login'] # not really necessary, but might as well clean up.
    assert crypto.constant_time_compare(request.GET['state'], oauth_login['state'])
    if 'error' in request.GET:
        logger.error('OAuth error: %s', request.GET)
        return http.HttpResponseRedirect('/accounts/login/')

    provider = oauth_login['provider']
    provider_conf: ProviderConf = oauth_login['provider_conf']
    
    provider_info_dict = settings.OAUTH_LOGIN_PROVIDERS[provider]
    assert is_provider_info(provider_info_dict), "provider_info_dict does not match ProviderInfo structure"
    provider_info: ProviderInfo = cast(ProviderInfo, provider_info_dict)
    
    clientid = provider_info['client_id']
    clientsecret = provider_info['client_secret']
    code = request.GET['code']

    get_token = requests.post(
        provider_conf['token_endpoint'],
        data={
            'grant_type': "authorization_code",
            'client_id': clientid,
            'client_secret': clientsecret,
            'code': code,
            'redirect_uri': request.build_absolute_uri('/accounts/oic_callback/'),
        },
        headers={'Accept': 'application/json'},
    )
    id_token = get_token.json()['id_token']
    ext_user = jwt.decode(id_token, options={"verify_signature": False})

    if 'invite_token' in request.session:
        # We are in the invite link workflow.
        token: InviteToken = request.session['invite_token']
        user = Specifyuser.objects.annotate(token_seq=Max('spuserexternalid__id')).get(id=token['userid'])

        if time.time() > token['expires'] or user.token_seq != token['sequence']:
            return http.HttpResponseBadRequest("Token expired.", content_type="text/plain")

        user.spuserexternalid_set.create(
            provider=provider,
            providerid=str(ext_user['sub']),
            idtoken=ext_user,
        )
        del request.session['invite_token']
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return http.HttpResponseRedirect('/accounts/choose_collection/')

    try:
        spuserexternalid = Spuserexternalid.objects.get(provider=provider, providerid=str(ext_user['sub']))
    except Spuserexternalid.DoesNotExist:
        # Redirect to legacy login to associate the user's
        # external identity with a Specify account.
        external_user: ExternalUser = {
            'id': str(ext_user['sub']),
            'provider': provider,
            'provider_title': provider_info['title'],
            'name': ext_user.get('name', ext_user.get('email', None)),
            'idtoken': ext_user,
        }
        request.session['external_user'] = external_user
        return http.HttpResponseRedirect('/accounts/legacy_login/')

    if not spuserexternalid.enabled:
        return http.HttpResponse("Logins with this identity are disabled.", content_type="text/plain")

    # Update our copy of the JWT
    spuserexternalid.idtoken = ext_user
    spuserexternalid.save()

    login(request,
          cast(AbstractBaseUser, spuserexternalid.specifyuser),
          backend='django.contrib.auth.backends.ModelBackend')
    return http.HttpResponseRedirect('/accounts/choose_collection')

class InviteLinkPT(PermissionTarget):
    resource = "/admin/user/invite_link"
    create = PermissionTargetAction()

@require_GET
@login_maybe_required
def invite_link(request, userid:int) -> http.HttpResponse:
    """API endpoint for generating an invite link."""
    check_permission_targets(None, request.specify_user.id, [InviteLinkPT.create])
    # The id field of the spuserexternalid table is used as a non
    # repeating number to prevent replay of invite tokens. For this to
    # work, the external id records shouldn't be deleted as that would
    # cause the "None" sequence value to be repeated. This prevents
    # the same invite token from being used to associate multiple
    # external ids to the same Specify user.
    user = Specifyuser.objects.annotate(token_seq=Max('spuserexternalid__id')).get(id=userid)
    token: InviteToken = {
        'userid': userid,
        'username': user.name,
        'sequence': user.token_seq,
        'expires': int(time.time()) + 7 * 24 * 60 * 60,
    }
    message = base64.urlsafe_b64encode(json.dumps(token).encode('utf-8'))
    mac = hmac.new(settings.SECRET_KEY.encode('utf-8'), msg=message, digestmod=hashlib.sha256)
    params = urlencode({'token': message, 'mac': base64.urlsafe_b64encode(mac.digest())})
    link = request.build_absolute_uri(f'/accounts/use_invite_link/?{params}')
    return http.HttpResponse(link, content_type='text/plain')

@require_GET
def use_invite_link(request) -> http.HttpResponse:
    """Begins the process of using an invite token to associate an
    external id to a Specify account. We validate the token and store
    it in a server side session variable, then redirect to the regular
    OIC login process which will retrieve the token after the user
    authenticates with their chosen IdP.
    """
    message = request.GET['token'].encode('utf-8')
    mac = base64.urlsafe_b64decode(request.GET['mac'])
    mac_ = hmac.new(settings.SECRET_KEY.encode('utf-8'), msg=message, digestmod=hashlib.sha256)
    if not hmac.compare_digest(mac, mac_.digest()):
        return http.HttpResponseBadRequest("Token invalid.", content_type="text/plain")

    token: InviteToken = json.loads(base64.urlsafe_b64decode(message).decode('utf-8'))
    user = Specifyuser.objects.annotate(token_seq=Max('spuserexternalid__id')).get(id=token['userid'])

    if time.time() > token['expires'] or user.token_seq != token['sequence']:
        return http.HttpResponseBadRequest("Token expired.", content_type="text/plain")

    token['username'] = user.name # Just in case it has changed.
    request.session['invite_token'] = token
    return http.HttpResponseRedirect('/accounts/login/')


class UserOICProvidersPT(PermissionTarget):
    resource = "/admin/user/oic_providers"
    read = PermissionTargetAction()
    # an update action could be added to enable/disable certain providers.

@openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns a list of the OIC identity providers with identities linked the user.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items":  {
                                "type": "object",
                                "properties": {
                                    "provider": { "type": "string" },
                                    "title": { "type": "string" },
                                },
                                "required": ["provider", "title"],
                                "additionalProperties": False,
                            },
                        }
                    }
                }
            }
        }
    }
})
@require_GET
@login_maybe_required
def user_providers(request, userid: int) -> http.HttpResponse:
    """Return a list of configured identity providers
    which the specified user has registered identities with.
    """
    check_permission_targets(None, request.specify_user.id, [UserOICProvidersPT.read])
    providers = [
        {'provider': p, 'title': d['title']}
        for p, d in settings.OAUTH_LOGIN_PROVIDERS.items()
        if p in Spuserexternalid.objects.filter(specifyuser_id=userid).values_list('provider', flat=True)
    ]
    return http.JsonResponse(providers, safe=False)

class CollectionChoiceField(forms.ChoiceField):
    widget = forms.RadioSelect
    def label_from_instance(self, obj):
        return obj.collectionname

@login_maybe_required
@require_http_methods(['GET', 'POST'])
@never_cache
def choose_collection(request) -> http.HttpResponse:
    """The HTML page for choosing which collection to log into. Presented
    after the main auth process. Since the legacy login process passes
    through here, we also use the opportunity to associate an external
    id to the user if one is provided.
    """
    from specifyweb.context.views import set_collection_cookie, users_collections_for_sp7
    from specifyweb.specify.api import obj_to_data, toJson

    if 'external_user' in request.session and request.user.is_authenticated:
        # This will be set if the user logged in with an external IdP
        # that returned an unknown identity. They only get here if
        # they then completed a legacy authentication.
        external_user: ExternalUser = request.session['external_user']
        del request.session['external_user']

        request.specify_user.spuserexternalid_set.create(
            provider=external_user['provider'],
            providerid=external_user['id'],
            idtoken=external_user['idtoken'],
        )

    redirect_to = (request.POST if request.method == "POST" else request.GET).get('next', '')
    redirect_resp = http.HttpResponseRedirect(
        redirect_to if is_safe_url(url=redirect_to, allowed_hosts=request.get_host())
        else settings.LOGIN_REDIRECT_URL
    )

    available_collections = users_collections_for_sp7(request.specify_user.id)

    if len(available_collections) == 1:
        set_collection_cookie(redirect_resp, available_collections[0].id)
        return redirect_resp

    class Form(forms.Form):
        collection = CollectionChoiceField(
            choices=[(c.id, c.collectionname) for c in available_collections],
            initial=request.COOKIES.get('collection', None))

    if request.method == 'POST':
        form = Form(data=request.POST)
        if form.is_valid():
            set_collection_cookie(redirect_resp, form.cleaned_data['collection'])
            return redirect_resp

    context = {
        'available_collections': toJson([obj_to_data(c) for c in available_collections]),
        'initial_value': request.COOKIES.get('collection', None),
        'next': redirect_to
    }
    return TemplateResponse(request, 'choose_collection.html', context)

@require_GET
def support_login(request: http.HttpRequest) -> http.HttpResponse:
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
        login(request, user, backend='specifyweb.specify.support_login.SupportLoginBackend')
        return http.HttpResponseRedirect('/')
    else:
        return http.HttpResponseForbidden()
