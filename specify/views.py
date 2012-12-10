from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET

import mimetypes
from urllib import urlopen

from specify_jar import specify_jar

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
