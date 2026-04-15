"""
Provide the proper Schema Localization to the front-end
"""

import logging
logger = logging.getLogger(__name__)

from django.db.models import F, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce, Lower

from specifyweb.specify.models import (
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
)

def _is_null_or_blank(field_name: str) -> Q:
    return Q(**{f'{field_name}__isnull': True}) | Q(**{field_name: ''})

def _localized_text_subquery(fk_field_name: str, language: str, country: str | None) -> Subquery:
    filters = {
        fk_field_name: OuterRef('id'),
        'language': language,
    }
    query = Splocaleitemstr.objects.filter(**filters).filter(_is_null_or_blank('variant'))

    if country is None:
        query = query.filter(_is_null_or_blank('country'))
    else:
        query = query.filter(country=country)

    return Subquery(query.order_by('id').values('text')[:1])

def _localized_text_annotation(fk_field_name: str, language: str, country: str | None, fallback_field_name: str):
    candidates = []

    if country is not None:
        candidates.append(_localized_text_subquery(fk_field_name, language, country))

    candidates.append(_localized_text_subquery(fk_field_name, language, None))

    if language != 'en':
        candidates.append(_localized_text_subquery(fk_field_name, 'en', None))

    return Coalesce(*candidates, F(fallback_field_name))

def get_schema_languages():
    return list(
        Splocaleitemstr.objects.annotate(
            language_lower=Lower('language'),
            country_lower=Lower('country'),
            variant_lower=Lower('variant'),
        )
        .values_list('language_lower', 'country_lower', 'variant_lower')
        .distinct()
    )

def get_schema_localization(collection, schematype, lang):
    disc = collection.discipline
    language, country = lang.lower().split('-') if '-' in lang else (lang, None)

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

    container_rows = (
        Splocalecontainer.objects.filter(schematype=schematype, discipline_id=disc.id)
        .annotate(
            localized_name=_localized_text_annotation(
                'containername_id',
                language,
                country,
                'name',
            ),
            localized_desc=_localized_text_annotation(
                'containerdesc_id',
                language,
                country,
                'name',
            ),
        )
        .order_by('name')
        .values(
            'name',
            'format',
            'ishidden',
            'isuiformatter',
            'picklistname',
            'type',
            'aggregator',
            'defaultui',
            'localized_name',
            'localized_desc',
        )
    )

    containers = {
        row['name'].lower(): dict(
            items={},
            format=row['format'],
            ishidden=row['ishidden'],
            isuiformatter=row['isuiformatter'],
            picklistname=row['picklistname'],
            type=row['type'],
            aggregator=row['aggregator'],
            defaultui=row['defaultui'],
            name=row['localized_name'],
            desc=row['localized_desc'],
        )
        for row in container_rows
    }

    item_rows = (
        Splocalecontaineritem.objects.filter(
            container__schematype=schematype,
            container__discipline_id=disc.id,
        )
        .annotate(
            container_name=F('container__name'),
            localized_name=_localized_text_annotation(
                'itemname_id',
                language,
                country,
                'name',
            ),
            localized_desc=_localized_text_annotation(
                'itemdesc_id',
                language,
                country,
                'name',
            ),
        )
        .order_by('name')
        .values(
            'container_name',
            'name',
            'format',
            'ishidden',
            'isuiformatter',
            'picklistname',
            'type',
            'isrequired',
            'weblinkname',
            'localized_name',
            'localized_desc',
        )
    )

    for row in item_rows:
        container_key = row['container_name'].lower()
        if container_key not in containers:
            continue

        containers[container_key]['items'][row['name'].lower()] = {
            'format': row['format'],
            'ishidden': row['ishidden'],
            'isuiformatter': row['isuiformatter'],
            'picklistname': row['picklistname'],
            'type': row['type'],
            'isrequired': row['isrequired'],
            'weblinkname': row['weblinkname'],
            'name': row['localized_name'],
            'desc': row['localized_desc'],
        }

    return containers
