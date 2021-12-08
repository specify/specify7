import logging
import requests
import jwt

from typing import Union
from typing_extensions import TypedDict

from django import forms
from django import http
from django.db import connection
from django.conf import settings
from django.utils import crypto
from django.utils.http import is_safe_url
from django.shortcuts import render
from django.contrib.auth import login, logout
from django.template.response import TemplateResponse
from django.views.decorators.http import require_GET, require_http_methods
from django.views.decorators.cache import cache_control, never_cache

from specifyweb.specify import models as spmodels
from specifyweb.context.views import set_collection_cookie, users_collections
from specifyweb.specify.views import login_maybe_required

logger = logging.getLogger(__name__)

Specifyuser = getattr(spmodels, 'Specifyuser')

class ProviderInfo(TypedDict):
    "Elements of settings.OAUTH_LOGIN_PROVIDERS should have this type."
    title: str # The name of the provider for UI purposes.
    client_id: str
    client_secret: str
    scope: str
    # config can be either the OpenId discovery endpoint or
    # a dictionary of auth and token endpoints.
    config: Union[str, "ProviderConf"]


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


@require_http_methods(['GET', 'POST'])
def oic_login(request: http.HttpRequest) -> http.HttpResponse:
    if request.method == 'POST':
        provider = request.POST['provider']
        provider_info: ProviderInfo = settings.OAUTH_LOGIN_PROVIDERS[provider]

        provider_conf: ProviderConf
        if isinstance(provider_info['config'], str):
            discovery_url = provider_info['config']
            if not discovery_url.endswith("/.well-known/openid-configuration"):
                discovery_url += "/.well-known/openid-configuration"
            provider_conf = requests.get(discovery_url).json()
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
        scope = provider_info['scope']
        clientid = provider_info['client_id']
        redirect = request.build_absolute_uri('/accounts/oic_callback/')
        return http.HttpResponseRedirect(
            f'{endpoint}?response_type=code&scope={scope}&client_id={clientid}&redirect_uri={redirect}&state={state}'
        )

    providers = [
        {'provider': p, 'title': d['title']}
        for p, d in settings.OAUTH_LOGIN_PROVIDERS.items()
    ]
    return render(request, "oic_login.html", context={'providers': providers})

@require_GET
def oic_callback(request: http.HttpRequest) -> http.HttpResponse:
    oauth_login: OAuthLogin = request.session['oauth_login']
    del request.session['oauth_login'] # not really necessary, but might as well clean up.
    assert crypto.constant_time_compare(request.GET['state'], oauth_login['state'])
    if 'error' in request.GET:
        logger.error('OAuth error: %s', request.GET)
        return http.HttpResponseRedirect('/accounts/login/')

    provider = oauth_login['provider']
    provider_conf: ProviderConf = oauth_login['provider_conf']

    provider_info: ProviderInfo = settings.OAUTH_LOGIN_PROVIDERS[provider]
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

    try:
        user = Specifyuser.objects.get(
            spuserexternalid__provider=provider,
            spuserexternalid__providerid=str(ext_user['sub'])
        )
    except Specifyuser.DoesNotExist:
        external_user: ExternalUser = {
            'id': str(ext_user['sub']),
            'provider': provider,
            'provider_title': provider_info['title'],
            'name': ext_user.get('name', ext_user.get('email', None)),
        }
        request.session['external_user'] = external_user
        return http.HttpResponseRedirect('/accounts/legacy_login/')

    login(request, user)
    return http.HttpResponseRedirect('/specify')

class CollectionChoiceField(forms.ChoiceField):
    widget = forms.RadioSelect
    def label_from_instance(self, obj):
        return obj.collectionname

@login_maybe_required
@require_http_methods(['GET', 'POST'])
@never_cache
def choose_collection(request) -> http.HttpResponse:
    "The HTML page for choosing which collection to log into. Presented after the main auth page."
    if 'external_user' in request.session:
        external_user: ExternalUser = request.session['external_user']
        del request.session['external_user']

        request.specify_user.spuserexternalid_set.create(
            provider=external_user['provider'],
            providerid=external_user['id'],
        )

    redirect_to = (request.POST if request.method == "POST" else request.GET).get('next', '')
    redirect_resp = http.HttpResponseRedirect(
        redirect_to if is_safe_url(url=redirect_to, allowed_hosts=request.get_host())
        else settings.LOGIN_REDIRECT_URL
    )

    available_collections = users_collections(connection.cursor(), request.specify_user.id)
    available_collections.sort(key=lambda x: x[1])

    if len(available_collections) < 1:
        logout(request)
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
        login(request, user)
        return http.HttpResponseRedirect('/')
    else:
        return http.HttpResponseForbidden()
