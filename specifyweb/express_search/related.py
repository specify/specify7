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

    def root(self):
        return getattr(models, self.definition.split('.')[0])

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

    def def_as_dict(self):
        return {
            'name': self.__class__.__name__,
            'root': self.root().__name__,
            'columns': self.columns,
            }

    def result_as_dict(self, total_count, queryset):
        data = {
            'definition': self.def_as_dict(),
            'totalCount': total_count,
            'results': list(queryset),
            }
        if settings.DEBUG and hasattr(queryset, 'query'):
            data['sql'] = unicode(queryset.query)
        return data

    def do_search(self, queryset, offset, limit):
        rqs = self.build_related_queryset(queryset)
        results = self.to_values(rqs).order_by('id')
        total_count = results.count()
        results = results[offset:offset+limit]
        return self.result_as_dict(total_count, results)


