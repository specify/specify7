import logging

from django.db.models.fields.related import ReverseSingleRelatedObjectDescriptor
from django.db.models.fields.related import ForeignRelatedObjectsDescriptor
from django.conf import settings

from specifyweb.specify.models import datamodel
from specifyweb.stored_queries import models
from specifyweb.stored_queries.fieldspec import FieldSpec
from specifyweb.stored_queries.query_ops import QueryOps
from specifyweb.stored_queries.views import build_query

logger = logging.getLogger(__name__)

def dots2dunders(lookups):
    return {k.replace('.', '__'): v
            for k, v in lookups.items()}

    
class RelatedSearch(object):
    distinct = False
    filters = {}
    excludes = {}
    definitions = None
    columns = None

    @classmethod
    def get_all(cls):
        return [cls(defn) for defn in cls.definitions]

    @classmethod
    def final_result(cls, queries, offset, limit):
        total_count = sum(q.count() for q in queries if q is not None)
        results = [item
                   for q in queries if q is not None
                   for item in q.limit(limit).offset(offset)]
        return {
            'definition': cls.def_as_dict(),
            'totalCount': total_count,
            'results': results
            }

    @classmethod
    def def_as_dict(cls):
        return {
            'name': cls.__name__,
            'root': cls.root().name,
            'columns': cls.columns,
            }

    @classmethod
    def root(cls):
        return datamodel.get_table(cls.definitions[0].split('.')[0])

    def __init__(self, definition):
        self.definition = definition

    def fieldspec_std_vals(self):
        return dict(
            date_part=None,
            root_table=getattr(models, self.root().name),
            is_relation=False,
            negate=False,
            sort_type=0)

    def make_join_path(self, path):
        table = self.root()
        logger.info("make_join_path from %s : %s" % (table, path))
        model = getattr(models, table.name)
        fieldname, join_path = None, []

        for element in path:
            field = table.get_field(element)
            fieldname = field.name
            if field.is_relationship:
                table = datamodel.get_table(field.relatedModelName)
                model = getattr(models, table.name)
                join_path.append((fieldname, model))

        return fieldname, join_path

    def make_fieldspecs(self, primary_query):
        std_vals = self.fieldspec_std_vals()
        _, jp = self.make_join_path(self.definition.split('.')[1:])
        logger.debug('definition %s resulted in join path %s', self.definition, jp)

        def_fieldspec = FieldSpec(
            field_name=jp[-1][1]._id if jp else self.root().idFieldName,
            join_path=jp,
            op_num=QueryOps.OPERATIONS.index('op_in'),
            value=primary_query,
            display=False,
            **std_vals)

        return [def_fieldspec] + [
            FieldSpec(
                field_name=fieldname,
                join_path=joinpath,
                op_num=1,
                value="",
                display=True,
                **std_vals)
            for (fieldname, joinpath) in [self.make_join_path(col.split('.'))
                                          for col in self.columns]]
                
    def pivot(self):
        pivot = self.root()
        path = self.definition.split('.')[1:]
        while len(path):
            field = pivot.get_field(path[0])
            pivot = datamodel.get_table(field.relatedModelName)
            path = path[1:]
        return pivot

    def build_related_query(self, session, primary_query, collection):
        if primary_query is None:
            return None # self.root().objects.none()

        field_specs = self.make_fieldspecs(primary_query)

        related_query, _, _ = build_query(session, collection, self.root().tableId, field_specs)

        if self.distinct:
            related_query = related_query.distinct()

        return related_query
        # filters = dots2dunders(self.filters)
        # excludes = dots2dunders(self.excludes)
        # return relatedqs.filter(**filters).exclude(**excludes)

