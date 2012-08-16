from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.views.decorators.http import require_GET

import os
import mimetypes
from urllib import urlopen
from zipfile import ZipFile

specify_jar = ZipFile(os.path.join(settings.SPECIFY_THICK_CLIENT, 'specify.jar'))

@login_required
@require_GET
def images(request, path):
    mimetype = mimetypes.guess_type(path)[0]
    path = 'edu/ku/brc/specify/images/' + path
    return HttpResponse(specify_jar.read(path), content_type=mimetype)

@login_required
@require_GET
def properties(request, name):
    path = name + '.properties'
    return HttpResponse(specify_jar.read(path), content_type='text/plain')

@login_required
def jpa_proxy(request, model):
    url = "http://localhost:8080/specify-data-service/search/uidata/fish/%s" % model
    f = urlopen(url + "?" + request.GET.urlencode())
    return HttpResponse(f.read())
