import os
import logging
import subprocess

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.template import loader, Context

DIR = os.path.dirname(__file__)

logger = logging.getLogger(__name__)

MT_CONTEXT = Context()

@login_required
def specify(request):
    # This seems to cost about 16-30 ms.
    up_to_date = subprocess.call(['make', '-q', '-C', DIR]) == 0
    logger.debug('js and css optimization is up-to-date: %s', up_to_date)

    template = 'specify-built.html' if up_to_date else 'specify.html'
    resp = loader.get_template(template).render(MT_CONTEXT)
    return HttpResponse(resp)

