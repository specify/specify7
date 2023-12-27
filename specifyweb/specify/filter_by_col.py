"""
Modules for filtering resources by the collection logged in
"""

from django.core.exceptions import FieldError, ObjectDoesNotExist
from django.db.models import Q

from . import scoping
from .models import Geography, Geologictimeperiod, Lithostrat, Taxon, Storage, \
    Attachment

# Defines hierarchies, and paths to take up hierarchy on.
# For example, collectionobject also serves as collectionobject
# TODO: Add more paths.

HIERARCHIES = ['collection', 'discipline', 'division', 'institution']


HIERARCHY_ADDONS = {
    'collection': ['collectionobject']
}

def pluralize(field):
    return f"{field}s"


def get_lookup(model, field):
    for single in [True, False]:
        lookup = field if single else pluralize(field)
        if getattr(model, lookup, None):
            return lookup
    return None

def get_hierarchy_lookup(model):
    for hierarchy in HIERARCHIES:
        direct_lookup = get_lookup(model, hierarchy)
        if direct_lookup:
            return hierarchy, direct_lookup
        child_lookups = [get_lookup(model, field)
                         for field in HIERARCHY_ADDONS.get(hierarchy, [])]
        for child_lookup in child_lookups:
            if child_lookup:
                return hierarchy, f'{child_lookup}__{hierarchy}'
    return None


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


    hierarchy_lookup = get_hierarchy_lookup(queryset.model)
    if hierarchy_lookup is None:
        if strict:
            raise HierarchyException('queryset model ' + queryset.model.__name__ + ' has no hierarchy field')
        else:
            return queryset

    current_hierarchy, lookup = hierarchy_lookup

    value = collection
    field = 'collection'
    while field != current_hierarchy:
        field = HIERARCHIES[ 1+HIERARCHIES.index(field) ]
        value = getattr(value, field)

    return queryset.filter(**{ lookup: value })
