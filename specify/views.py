from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from urllib import urlopen

@login_required
def jpa_proxy(request, model):
    url = "http://localhost:8080/specify-data-service/search/uidata/fish/%s" % model
    f = urlopen(url + "?" + request.GET.urlencode())
    return HttpResponse(f.read())
