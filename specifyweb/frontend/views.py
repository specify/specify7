import os
import logging
import subprocess

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.template import loader, Context
from django.conf import settings

DIR = os.path.dirname(__file__)

logger = logging.getLogger(__name__)

if settings.DEBUG:
    @login_required
    def specify(request):
        # This seems to cost about 16-30 ms.
        up_to_date = subprocess.call(['make', '-q', '-C', DIR]) == 0
        logger.debug('js and css optimization is up-to-date: %s', up_to_date)
        resp = loader.get_template('specify.html').render(Context({'use_built': up_to_date}))

        return HttpResponse(resp)
else:
    resp = loader.get_template('specify.html').render(Context({'use_built': True}))

    @login_required
    def specify(request):
        return HttpResponse(resp)
