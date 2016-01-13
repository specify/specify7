import os
import logging

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.template import loader, Context
from django.conf import settings

DIR = os.path.dirname(__file__)

logger = logging.getLogger(__name__)

login_maybe_required = (lambda func: func) if settings.ANONYMOUS_USER else login_required

resp = loader.get_template('specify.html').render(Context({
    'use_raven': settings.RAVEN_CONFIG is not None,
}))

@login_maybe_required
def specify(request):
    return HttpResponse(resp)
