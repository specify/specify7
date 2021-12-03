import os
import logging
import requests

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

clientid = settings.OAUTH_LOGIN_PROVIDERS['github']['client_id']
clientsecret = settings.OAUTH_LOGIN_PROVIDERS['github']['client_secret']

def oic_login(request):
    if request.method == 'POST':
        redirect = request.build_absolute_uri('/accounts/oic_callback/')
        state = crypto.get_random_string(length=32)
        request.session['oauth_state'] = state
        return HttpResponseRedirect(
            f'https://github.com/login/oauth/authorize?client_id={clientid}&redirect_uri={redirect}&state={state}'
        )
    return render(request, "oic_login.html")

def oic_callback(request):
    assert crypto.constant_time_compare(request.GET['state'], request.session['oauth_state'])
    del request.session['oauth_state'] # not really necessary, but might as well clean up.
    code = request.GET['code']

    get_token = requests.post(
        'https://github.com/login/oauth/access_token',
        data={
            'client_id': clientid,
            'client_secret': clientsecret,
            'code': code,
            'redirect_uri': request.build_absolute_uri('/accounts/oic_callback/token/'),
        },
        headers={'Accept': 'application/json'},
    )
    token = get_token.json()['access_token']
    get_ext_user = requests.get(
        'https://api.github.com/user',
        headers={
            'Authorization': f"token {token}",
            'Accept': 'application/json',
        }
    )
    ext_user = get_ext_user.json()
    try:
        user = Specifyuser.objects.get(spuserexternalid__provider="github", spuserexternalid__providerid=str(ext_user['id']))
    except Specifyuser.DoesNotExist:
        request.session['external_user_id'] = str(ext_user['id'])
        request.session['external_user_provider'] = "github"
        request.session['external_user_name'] = ext_user['name']
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

    language = translation.get_language()
    if request.COOKIES.get('language') != language:
        response.set_cookie(
            'language',
            language,
            max_age=365 * 24 * 60 * 60
        )

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
