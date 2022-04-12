"""
Modules for filtering resources by the collection logged in
"""

from django.core.exceptions import FieldError
from django.db.models import Q

from . import scoping
from .models import Geography, Geologictimeperiod, Lithostrat, Taxon, Storage, \
    Attachment

HIERARCHY = ['collectionobject', 'collection', 'discipline', 'division', 'institution']

class HierarchyException(Exception):
    pass

def filter_by_collection(queryset, collection, strict=True):
    if queryset.model is Attachment:
        return queryset.filter(
            Q(scopetype=None) |
            Q(scopetype=scoping.GLOBAL_SCOPE) |
            Q(scopetype=scoping.COLLECTION_SCOPE, scopeid=collection.id) |
            Q(scopetype=scoping.DISCIPLINE_SCOPE, scopeid=collection.discipline.id) |
            Q(scopetype=scoping.DIVISION_SCOPE, scopeid=collection.discipline.division.id) |
            Q(scopetype=scoping.INSTITUTION_SCOPE, scopeid=collection.discipline.division.institution.id))

    if queryset.model in (Geography, Geologictimeperiod, Lithostrat):
        return queryset.filter(definition__disciplines=collection.discipline)

    if queryset.model is Taxon:
        return queryset.filter(definition__discipline=collection.discipline)

    if queryset.model is Storage:
        return queryset.filter(definition__institutions=collection.discipline.division.institution.id)

    try:
        return queryset.filter(collectionmemberid=collection.id)
    except FieldError:
        pass

    for fieldname in HIERARCHY:
        if getattr(queryset.model, fieldname, None):
            break
    else:
        if strict:
            raise HierarchyException('queryset model ' + queryset.model.__name__ + ' has no hierarchy field')
        else:
            return queryset

    if fieldname == 'collectionobject':
        lookup = 'collectionobject__collection'
        join = 'collection'
    else:
        lookup = join = fieldname

    value = collection
    field = 'collection'
    while field != join:
        field = HIERARCHY[ 1+HIERARCHY.index(field) ]
        value = getattr(value, field)

    return queryset.filter(**{ lookup: value })
