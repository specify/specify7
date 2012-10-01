from collections import defaultdict

from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.utils import simplejson

from specify.models import Splocalecontainer as Container
from specify.models import Splocalecontaineritem as Item
from specify.models import Splocaleitemstr as SpString

schema_localization_cache = {}

def get_schema_localization(collection):
    disc = collection.discipline
    if disc in schema_localization_cache:
        return schema_localization_cache[disc]

    strings = dict(
        ((i.containername_id, i.containerdesc_id, i.itemname_id, i.itemdesc_id), i.text) \
            for i in SpString.objects.filter(language='en')
        )

    ifields = ('format', 'ishidden', 'isuiformatter', 'picklistname',
               'type', 'isrequired', 'weblinkname',)

    items = defaultdict(dict)
    for i in Item.objects.all():
        items[i.container_id][i.name.lower()] = item = dict((field, getattr(i, field)) for field in ifields)
        item.update({
                'name': strings.get((None, None, i.id, None), None),
                'desc': strings.get((None, None, None, i.id), None)})

    cfields = ('format', 'ishidden', 'isuiformatter', 'picklistname', 'type', 'aggregator', 'defaultui')

    containers = {}
    for c in Container.objects.filter(discipline=disc, schematype=0):
        containers[c.name] = container = dict((field, getattr(c, field)) for field in cfields)
        container.update({
                'name': strings.get((c.id, None, None, None), None),
                'desc': strings.get((None, c.id, None, None), None),
                'items': items[c.id] })

    sl = schema_localization_cache[disc] =  simplejson.dumps(containers)
    return sl

@require_GET
@login_required
def schema_localization(request):
    sl = get_schema_localization(request.specify_collection)
    return HttpResponse(sl, content_type='application/json')
