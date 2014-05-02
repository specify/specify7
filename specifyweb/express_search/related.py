from django.db.models.fields.related import ReverseSingleRelatedObjectDescriptor
from django.db.models.fields.related import ForeignRelatedObjectsDescriptor
from django.conf import settings

from specifyweb.specify import models

def dots2dunders(lookups):
    return {k.replace('.', '__'): v
            for k, v in lookups.items()}

class RelatedSearch(object):
    distinct = False
    filters = {}
    excludes = {}

    @classmethod
    def get_all(cls):
        return [cls(defn) for defn in cls.definitions]

    @classmethod
    def final_result(cls, querysets):
        total_count = sum(qs.count() for qs in querysets)
        results = sum((list(qs) for qs in querysets), [])
        data = {
            'definition': cls.def_as_dict(),
            'totalCount': total_count,
            'results': results
            }
        if settings.DEBUG:
            data['sqls'] = [unicode(qs.query) for qs in querysets
                            if hasattr(qs, 'query')]
        return data

    @classmethod
    def def_as_dict(cls):
        return {
            'name': cls.__name__,
            'root': cls.root().__name__,
            'columns': cls.columns,
            }

    @classmethod
    def root(cls):
        return getattr(models, cls.definitions[0].split('.')[0])

    def __init__(self, definition):
        self.definition = definition

    def pivot_path(self):
        return '__'.join( self.definition.split('.')[1:] )

    def pivot(self):
        pivot = self.root()
        path = self.definition.split('.')[1:]
        while len(path):
            fieldname = path[0]
            field = getattr(pivot, fieldname)
            if isinstance(field, ReverseSingleRelatedObjectDescriptor):
                pivot = field.field.related.parent_model
            elif isinstance(field, ForeignRelatedObjectsDescriptor):
                pivot = field.related.model
            else:
                raise Exception('non relationship field in related search definition')
            path = path[1:]
        return pivot

    def build_related_queryset(self, queryset):
        if queryset is None:
            return self.root().objects.none()

        assert queryset.model is self.pivot()
        if self.pivot_path() == '':
            relatedqs = queryset
        else:
            relatedqs = self.root().objects.filter(**{
                    self.pivot_path() + '__in': queryset })
        if self.distinct: relatedqs = relatedqs.distinct()
        filters = dots2dunders(self.filters)
        excludes = dots2dunders(self.excludes)
        return relatedqs.filter(**filters).exclude(**excludes)

    def to_values(self, queryset):
        fields = [col.replace('.', '__') for col in self.columns]
        fields.append('id')
        return queryset.values_list(*fields)

    def do_search(self, queryset, offset, limit):
        rqs = self.build_related_queryset(queryset)
        rqs = self.to_values(rqs).order_by('id')
        return rqs[offset:offset+limit]


