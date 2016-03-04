from collections import defaultdict

from django.utils import simplejson
from django.conf import settings

from specifyweb.specify.models import (
    Splocalecontainer as Container,
    Splocalecontaineritem as Item,
    Splocaleitemstr as SpString)

schema_localization_cache = {}

def get_schema_localization(collection, schematype):
    disc = collection.discipline
    if (disc, schematype) in schema_localization_cache:
        return schema_localization_cache[(disc, schematype)]

    strings = dict(
        ((i.containername_id, i.containerdesc_id, i.itemname_id, i.itemdesc_id), i.text) \
            for i in SpString.objects.filter(language=settings.SCHEMA_LANGUAGE)
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
    for c in Container.objects.filter(discipline=disc, schematype=schematype):
        containers[c.name] = container = dict((field, getattr(c, field)) for field in cfields)
        container.update({
                'name': strings.get((c.id, None, None, None), None),
                'desc': strings.get((None, c.id, None, None), None),
                'items': items[c.id] })

    sl = schema_localization_cache[(disc, schematype)] =  simplejson.dumps(containers)
    return sl

