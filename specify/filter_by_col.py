from models import *
from django.db.models.fields.related import ForeignKey

HIERARCHY = ['collectionobject', 'collection', 'discipline', 'division', 'institution']

def filter_by_collection(queryset, collection):
    for fieldname in HIERARCHY:
        if getattr(queryset.model, fieldname, None):
            break
    else:
        return queryset
        raise Exception('queryset model ' + queryset.model.__name__ + ' has no hierarchy field')

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

