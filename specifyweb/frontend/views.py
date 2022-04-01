import os
import logging

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.conf import settings
from django.utils import translation, crypto
from django.utils.translation import gettext as _


DIR = os.path.dirname(__file__)

logger = logging.getLogger(__name__)

login_maybe_required = (
    (lambda func: func) if settings.ANONYMOUS_USER else login_required
)


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
