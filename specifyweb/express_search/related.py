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
    __fielspec_std_vals = __display_fieldspecs = __root = None

    distinct = False
    filters = {}
    excludes = {}
    definitions = None
    columns = None

    @classmethod
    def root(cls):
        if cls.__root is None:
            cls.__root = datamodel.get_table(cls.definitions[0].split('.')[0])
        return cls.__root

    @classmethod
    def display_fieldspecs(cls):
        if cls.__display_fieldspecs is None:
            cls.__display_fieldspecs = [
                FieldSpec(field_name=fieldname,
                          join_path=joinpath,
                          op_num=1,
                          value="",
                          display=True,
                          **cls.fieldspec_std_vals())
                for (fieldname, joinpath) in [cls.make_join_path(col.split('.'))
                                              for col in cls.columns]
                ]
        return cls.__display_fieldspecs

    @classmethod
    def fieldspec_std_vals(cls):
        if cls.__fielspec_std_vals is None:
            cls.__fieldspec_std_vals = dict(
                date_part=None,
                root_table=getattr(models, cls.root().name),
                is_relation=False,
                negate=False,
                sort_type=0)
        return cls.__fieldspec_std_vals

    @classmethod
    def execute(cls, session, config, terms, collection, limit, offset):
        queries = [cls(defn).build_related_query(session, config, terms, collection)
                   for defn in cls.definitions]

        total_count = sum(q.count() for q in queries if q is not None)
        results = [item
                   for q in queries if q is not None
                   for item in q.limit(limit).offset(offset)]
        return {
            'totalCount': total_count,
            'results': results,
            'definition': {
                'name': cls.__name__,
                'root': cls.root().name,
                'columns': cls.columns,
                }
            }

    @classmethod
    def make_join_path(cls, path):
        table = cls.root()
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

    def __init__(self, definition):
        self.definition = definition

    def make_fieldspec(self, primary_query):
        _, jp = self.make_join_path(self.definition.split('.')[1:])
        logger.debug('definition %s resulted in join path %s', self.definition, jp)

        return FieldSpec(
            field_name=jp[-1][1]._id if jp else self.root().idFieldName,
            join_path=jp,
            op_num=QueryOps.OPERATIONS.index('op_in'),
            value=primary_query,
            display=False,
            **self.fieldspec_std_vals())
                
    def pivot(self):
        pivot = self.root()
        path = self.definition.split('.')[1:]
        while len(path):
            field = pivot.get_field(path[0])
            pivot = datamodel.get_table(field.relatedModelName)
            path = path[1:]
        return pivot

    def build_related_query(self, session, config, terms, collection):
        from .views import build_primary_query

        pivot = self.pivot()
        for searchtable in config.findall('tables/searchtable'):
            if searchtable.find('tableName').text == pivot.name:
                break
        else:
            return None
        
        primary_query = build_primary_query(session, searchtable, terms, collection, as_scalar=True)

        if primary_query is None:
            return None

        field_specs = self.display_fieldspecs() + [self.make_fieldspec(primary_query)]

        related_query, _, _ = build_query(session, collection, self.root().tableId, field_specs)

        if self.distinct:
            related_query = related_query.distinct()

        return related_query
        # filters = dots2dunders(self.filters)
        # excludes = dots2dunders(self.excludes)
        # return relatedqs.filter(**filters).exclude(**excludes)

