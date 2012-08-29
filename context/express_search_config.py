import os

from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.conf import settings
from django.utils import simplejson

from specify.models import Collection, Spappresourcedata, Spappresourcedir, Specifyuser

from disciplines import discipline_dirs

def get_express_search_config(collection):
    try:
        return Spappresourcedata.objects.get(spappresource__name='ExpressSearchConfig').data
    except Spappresourcedata.DoesNotExist:
        pass

    discipline = collection.discipline
    discipline_dir = discipline_dirs[discipline.type]
    f = open(os.path.join(settings.SPECIFY_CONFIG_DIR, discipline_dir, 'es_config.xml'))
    return f.read()

@require_GET
@login_required
def express_search_config(request):
    xml = get_express_search_config(request.specify_collection)
    return HttpResponse(xml, content_type='text/xml')

@require_GET
def available_related_searches(request):
    import express_search.related_searches
    return HttpResponse(simplejson.dumps(express_search.related_searches.__all__),
                        content_type='application/json')
