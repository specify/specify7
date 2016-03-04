from collections import defaultdict

from django.utils import simplejson
from django.conf import settings
from django.db import connection

from specifyweb.specify.models import (
    Splocalecontainer as Container,
    Splocalecontaineritem as Item,
    Splocaleitemstr as SpString)

schema_localization_cache = {}

def get_schema_localization(collection, schematype):
    disc = collection.discipline
    if (disc, schematype) in schema_localization_cache:
        return schema_localization_cache[(disc, schematype)]

    lang = settings.SCHEMA_LANGUAGE

    cursor = connection.cursor()
    cursor.execute("""
    select name, format, ishidden!=0, isuiformatter, picklistname, type, aggregator, defaultui, n.text, d.text
    from splocalecontainer
    left outer join splocaleitemstr n on n.splocalecontainernameid = splocalecontainerid and n.language = %s
    left outer join splocaleitemstr d on d.splocalecontainerdescid = splocalecontainerid and d.language = %s
    where schematype = %s and disciplineid = %s;
    """, [lang, lang, schematype, disc.id])

    cfields = ('format', 'ishidden', 'isuiformatter', 'picklistname', 'type', 'aggregator', 'defaultui', 'name', 'desc')

    containers = {
        row[0]: dict(items={}, **{field: row[i+1] for i, field in enumerate(cfields)})
        for row in cursor.fetchall()
    }

    cursor.execute("""
    select container.name, item.name,
           item.format, item.ishidden!=0, item.isuiformatter, item.picklistname,
           item.type, item.isrequired, item.weblinkname, n.text, d.text
    from splocalecontainer container
    inner join splocalecontaineritem item on item.splocalecontainerid = container.splocalecontainerid
    left outer join splocaleitemstr n on n.splocalecontaineritemnameid = item.splocalecontaineritemid and n.language = %s
    left outer join splocaleitemstr d on d.splocalecontaineritemdescid = item.splocalecontaineritemid and d.language = %s
    where schematype = %s and disciplineid = %s;
    """, [lang, lang, schematype, disc.id])

    ifields = ('format', 'ishidden', 'isuiformatter', 'picklistname', 'type', 'isrequired', 'weblinkname', 'name', 'desc')

    for row in cursor.fetchall():
        containers[row[0]]['items'][row[1].lower()] = {field: row[i+2] for i, field in enumerate(ifields)}

    sl = schema_localization_cache[(disc, schematype)] =  simplejson.dumps(containers)
    return sl

