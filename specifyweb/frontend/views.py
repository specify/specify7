import logging
import os

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from django.utils.translation import gettext as _
from django.views.decorators.csrf import ensure_csrf_cookie

DIR = os.path.dirname(__file__)

logger = logging.getLogger(__name__)

login_maybe_required = (
    (lambda func: func) if settings.ANONYMOUS_USER else login_required
)

def open_search(request):
    return HttpResponse(f"""<?xml version="1.0"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>Specify 7</ShortName>
  <Description>Biological Collections Data Management Platform</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image height="16" width="16" type="image/png">/static/img/fav_icon.png</Image>
  <Url type="text/html" method="get" template="{request.build_absolute_uri('/specify/express-search/?q=')}{'{searchTerms}'}" />
  <moz:SearchForm>{request.build_absolute_uri('/specify/express-search/')}</moz:SearchForm>
</OpenSearchDescription>""",content_type='text/xml')

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
