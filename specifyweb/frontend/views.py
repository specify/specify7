import os
import logging
import requests
import jwt

from django.shortcuts import render
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.conf import settings
from django.utils import translation, crypto
from django.utils.translation import gettext as _

from specifyweb.specify import models as spmodels
Specifyuser = getattr(spmodels, 'Specifyuser')

DIR = os.path.dirname(__file__)

logger = logging.getLogger(__name__)

login_maybe_required = (
    (lambda func: func) if settings.ANONYMOUS_USER else login_required
)


def oic_login(request):
    if request.method == 'POST':
        provider = request.POST['provider']
        provider_info = settings.OAUTH_LOGIN_PROVIDERS[provider]

        if isinstance(provider_info['config'], str):
            discovery_url = provider_info['config']
            if not discovery_url.endswith("/.well-known/openid-configuration"):
                discovery_url += "/.well-known/openid-configuration"
            provider_conf = requests.get(discovery_url).json()
        else:
            provider_conf = provider_info['config']

        state = crypto.get_random_string(length=32)
        request.session['oauth_login'] = {
            'state': state,
            'provider': provider,
            'provider_conf': provider_conf,
        }

        endpoint = provider_conf['authorization_endpoint']
        scope = provider_info['scope']
        clientid = provider_info['client_id']
        redirect = request.build_absolute_uri('/accounts/oic_callback/')
        return HttpResponseRedirect(
            f'{endpoint}?response_type=code&scope={scope}&client_id={clientid}&redirect_uri={redirect}&state={state}'
        )

    providers = [
        {'provider': p, 'title': d['title']}
        for p, d in settings.OAUTH_LOGIN_PROVIDERS.items()
    ]
    return render(request, "oic_login.html", context={'providers': providers})

def oic_callback(request):
    oauth_login = request.session['oauth_login']
    del request.session['oauth_login'] # not really necessary, but might as well clean up.
    assert crypto.constant_time_compare(request.GET['state'], oauth_login['state'])

    provider = oauth_login['provider']
    provider_conf = oauth_login['provider_conf']

    provider_info = settings.OAUTH_LOGIN_PROVIDERS[provider]
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
    print(get_token.json())
    id_token = get_token.json()['id_token']
    print(id_token)
    # token = get_token.json()['access_token']
    # get_ext_user = requests.get(
    #     settings.OAUTH_LOGIN_PROVIDERS[provider]['user_endpoint'],
    #     headers={
    #         'Authorization': f"token {token}",
    #         'Accept': 'application/json',
    #     }
    # )
    # ext_user = get_ext_user.json()
    ext_user = jwt.decode(id_token, options={"verify_signature": False})
    print(ext_user)
    try:
        user = Specifyuser.objects.get(
            spuserexternalid__provider=provider,
            spuserexternalid__providerid=str(ext_user['sub'])
        )
    except Specifyuser.DoesNotExist:
        request.session['external_user_id'] = str(ext_user['sub'])
        request.session['external_user_provider'] = provider
        request.session['external_user_name'] = ext_user['email']
        return HttpResponseRedirect('/accounts/legacy_login/')

    login(request, user)
    return HttpResponseRedirect('/specify')

@login_maybe_required
@ensure_csrf_cookie
def specify(request):
    resp = loader.get_template("specify.html").render(
        {
            "use_raven": settings.RAVEN_CONFIG is not None,
        }
    )
    response = HttpResponse(resp)

    return response


@login_maybe_required
def api_tables(request):
    return render(
        request,
        "swagger-ui.html",
        dict(
            open_api_schema_endpoint="/api/specify_schema/openapi.json",
            title=_("Specify 7 Tables API"),
        ),
    )


@login_maybe_required
def api_operations(request):
    return render(
        request,
        "swagger-ui.html",
        dict(
            open_api_schema_endpoint="/context/api_endpoints.json",
            title=_("Specify 7 Operations API"),
        ),
    )

@login_maybe_required
def api_operations_all(request):
    return render(
        request,
        "swagger-ui.html",
        dict(
            open_api_schema_endpoint="/context/api_endpoints_all.json",
            title=_("Specify 7 Operations API (all)"),
        ),
    )
