from django.core.exceptions import FieldError
from .models import Geography, Taxon

HIERARCHY = ['collectionobject', 'collection', 'discipline', 'division', 'institution']

class HierarchyException(Exception):
    pass

def filter_by_collection(queryset, collection, strict=True):
    if queryset.model is Geography:
        return queryset.filter(definition__disciplines=collection.discipline)

    if queryset.model is Taxon:
        return queryset.filter(definition__discipline=collection.discipline)

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

