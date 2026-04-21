import os

from django.http import HttpResponse

path = os.path.dirname(__file__)

def collection(request):
    return HttpResponse('4', content_type='text/plain')

def domain(request):
    return HttpResponse('{"discipline": 3, "division": 2, "institution": 1, "collection": 4}',
                        content_type='application/json')

def viewsets(request, level):
    viewfile = os.path.join(path, 'data', 'viewset_' + level + '.xml')
    return HttpResponse(open(viewfile).read(), content_type='text/xml')

def schema_localization(request):
    filename = os.path.join(path, 'data', 'schemalocalization.json')
    return HttpResponse(open(filename).read(), content_type='application/json')

def app_resource(request):
    resource = request.GET['name']
    filename = os.path.join(path, 'data', 'appresources', resource)
    return HttpResponse(open(filename).read(), content_type='text/plain')

def available_related_searches(request):
    return HttpResponse('{}', content_type='application/json')
