"""
Provide the proper Schema Localization to the front-end
"""

import logging
logger = logging.getLogger(__name__)

from django.conf import settings
from django.db import connection


def get_schema_languages():
    cursor = connection.cursor()

    cursor.execute("""
    SELECT DISTINCT
        lower(`language`),
        lower(`country`),
        lower(`variant`)
    FROM splocaleitemstr;
    """)

    return list(cursor.fetchall())

def get_schema_localization(collection, schematype, lang):
    disc = collection.discipline
    language, country = lang.lower().split('-') if '-' in lang else (lang, None)

    cursor = connection.cursor()

    # # It's possible to generate the json in the DB as follows:

    # cursor.execute("""
    # select json_objectagg(
    #   name, json_object(
    #     'format', format,
    #     'ishidden', ishidden != 0,
    #     'isuiformatter', isuiformatter != 0,
    #     'picklistname', picklistname,
    #     'type', type,
    #     'aggregator', aggregator,
    #     'defaultui', defaultui,
    #     'name', n.text,
    #     'desc', d.text,
    #     'items', json_merge('{}', items.items)
    # ))
    # from splocalecontainer
    # left outer join (
    #        select splocalecontainerid, json_objectagg(
    #        lower(name), json_object(
    #          'format', format,
    #          'ishidden', ishidden != 0,
    #          'isuiformatter', isuiformatter != 0,
    #          'picklistname', picklistname,
    #          'type', type,
    #          'isrequired', isrequired != 0,
    #          'weblinkname', weblinkname,
    #          'name', n.text,
    #          'desc', d.text
    #       )) as items
    #       from splocalecontaineritem item
    #       left outer join splocaleitemstr n on n.splocalecontaineritemnameid = item.splocalecontaineritemid and n.language = %s
    #       left outer join splocaleitemstr d on d.splocalecontaineritemdescid = item.splocalecontaineritemid and d.language = %s
    #       group by splocalecontainerid
    # ) items using (splocalecontainerid)
    # left outer join splocaleitemstr n on n.splocalecontainernameid = splocalecontainerid and n.language = %s
    # left outer join splocaleitemstr d on d.splocalecontainerdescid = splocalecontainerid and d.language = %s
    # where schematype = %s and disciplineid = %s
    # """, [lang, lang, lang, lang, schematype, disc.id])

    # return cursor.fetchone()[0]

    cursor.execute(f"""
    select name, format, ishidden, isuiformatter, picklistname, type, aggregator, defaultui,
           coalesce({'n1.text, ' if country is not None else ''} n2.text, n3.text, name),
           coalesce({'d1.text, ' if country is not None else ''} d2.text, d3.text, name)
    from splocalecontainer

    {'''
    left outer join splocaleitemstr n1 on n1.splocalecontainernameid = splocalecontainerid
    and n1.language = %(language)s
    and n1.country = %(country)s
    and (n1.variant is null or n1.variant = '')
    '''  if country is not None else ''}

    left outer join splocaleitemstr n2 on n2.splocalecontainernameid = splocalecontainerid
    and n2.language = %(language)s
    and (n2.country is null or n2.country = '')
    and (n2.variant is null or n2.variant = '')

    left outer join splocaleitemstr n3 on n3.splocalecontainernameid = splocalecontainerid
    and n3.language = 'en'
    and (n3.country is null or n3.country = '')
    and (n3.variant is null or n3.variant = '')

    {'''
    left outer join splocaleitemstr d1 on d1.splocalecontainerdescid = splocalecontainerid
    and d1.language = %(language)s
    and d1.country = %(country)s
    and (d1.variant is null or d1.variant = '')
    ''' if country is not None else ''}

    left outer join splocaleitemstr d2 on d2.splocalecontainerdescid = splocalecontainerid
    and d2.language = %(language)s
    and (d2.country is null or d2.country = '')
    and (d2.variant is null or d2.variant = '')

    left outer join splocaleitemstr d3 on d3.splocalecontainerdescid = splocalecontainerid
    and d3.language = 'en'
    and (d3.country is null or d3.country = '')
    and (d3.variant is null or d3.variant = '')

    where schematype = %(schematype)s and disciplineid = %(disciplineid)s
    order by name
    """, {'language': language, 'country': country, 'schematype': schematype, 'disciplineid': disc.id})

    cfields = ('format', 'ishidden', 'isuiformatter', 'picklistname', 'type', 'aggregator', 'defaultui', 'name', 'desc')

    containers = {
        row[0].lower(): dict(items={}, **{field: row[i+1] for i, field in enumerate(cfields)})
        for row in cursor.fetchall()
    }

    cursor.execute(f"""
    select container.name, item.name,
           item.format, item.ishidden, item.isuiformatter, item.picklistname,
           item.type, item.isrequired, item.weblinkname,
           coalesce({'n1.text, ' if country is not None else ''} n2.text, n3.text, item.name),
           coalesce({'d1.text, ' if country is not None else ''} d2.text, d3.text, item.name)
    from splocalecontainer container
    inner join splocalecontaineritem item on item.splocalecontainerid = container.splocalecontainerid

    {'''
    left outer join splocaleitemstr n1 on n1.splocalecontaineritemnameid = splocalecontaineritemid
    and n1.language = %(language)s
    and n1.country = %(country)s
    and (n1.variant is null or n1.variant = '')
    '''  if country is not None else ''}

    left outer join splocaleitemstr n2 on n2.splocalecontaineritemnameid = splocalecontaineritemid
    and n2.language = %(language)s
    and (n2.country is null or n2.country = '')
    and (n2.variant is null or n2.variant = '')

    left outer join splocaleitemstr n3 on n3.splocalecontaineritemnameid = splocalecontaineritemid
    and n3.language = 'en'
    and (n3.country is null or n3.country = '')
    and (n3.variant is null or n3.variant = '')

    {'''
    left outer join splocaleitemstr d1 on d1.splocalecontaineritemdescid = splocalecontaineritemid
    and d1.language = %(language)s
    and d1.country = %(country)s
    and (d1.variant is null or d1.variant = '')
    ''' if country is not None else ''}

    left outer join splocaleitemstr d2 on d2.splocalecontaineritemdescid = splocalecontaineritemid
    and d2.language = %(language)s
    and (d2.country is null or d2.country = '')
    and (d2.variant is null or d2.variant = '')

    left outer join splocaleitemstr d3 on d3.splocalecontaineritemdescid = splocalecontaineritemid
    and d3.language = 'en'
    and (d3.country is null or d3.country = '')
    and (d3.variant is null or d3.variant = '')

    where schematype = %(schematype)s and disciplineid = %(disciplineid)s
    order by item.name
    """, {'language': language, 'country': country, 'schematype': schematype, 'disciplineid': disc.id})


    ifields = ('format', 'ishidden', 'isuiformatter', 'picklistname', 'type', 'isrequired', 'weblinkname', 'name', 'desc')

    for row in cursor.fetchall():
        containers[row[0].lower()]['items'][row[1].lower()] = {field: row[i+2] for i, field in enumerate(ifields)}

    return containers

