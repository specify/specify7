import logging
from collections import namedtuple, deque

from sqlalchemy import orm, sql

from specifyweb.specify.models import datamodel

from specifyweb.stored_queries import models

logger = logging.getLogger(__name__)


def get_treedef(collection, tree_name):
    if tree_name == 'Storage':
        return collection.discipline.division.institution.storagetreedef
    elif tree_name == 'Taxon':
        return get_taxon_treedef(collection)
    return getattr(collection.discipline, tree_name.lower() + "treedef")

def get_taxon_treedef(collection, collection_object_type=None):
    if collection_object_type is None:
        return collection.collectionobjecttype.taxontreedef
    return collection_object_type.taxontreedef

class QueryConstruct(namedtuple('QueryConstruct', 'collection objectformatter query join_cache param_count tree_rank_count')):

    def __new__(cls, *args, **kwargs):
        kwargs['join_cache'] = dict()
        kwargs['param_count'] = 0
        # TODO: Use tree_rank_count to implement cases where formatter of taxon is defined with fields from the parent.
        # In that case, the cycle will end (unlike other cyclical cases).
        kwargs['tree_rank_count'] = 0
        return super(QueryConstruct, cls).__new__(cls, *args, **kwargs)

    def handle_tree_field(self, node, table, tree_rank, tree_field):
        query = self
        if query.collection is None: raise AssertionError( # Not sure it makes sense to query across collections
            f"No Collection found in Query for {table}",
            {"table" : table,
             "localizationKey" : "noCollectionInQuery"}) 
        logger.info('handling treefield %s rank: %s field: %s', table, tree_rank, tree_field)

        treedefitem_column = table.name + 'TreeDefItemID'

        if (table, 'TreeRanks') in query.join_cache:
            logger.debug("using join cache for %r tree ranks.", table)
            ancestors, treedef = query.join_cache[(table, 'TreeRanks')]
        else:
            treedef = get_treedef(query.collection, table.name)
            rank_count = treedef.treedefitems.count()

            ancestors = [node]
            for i in range(rank_count-1):
                ancestor = orm.aliased(node)
                query = query.outerjoin(ancestor, ancestors[-1].ParentID == getattr(ancestor, ancestor._id))
                ancestors.append(ancestor)

            logger.debug("adding to join cache for %r tree ranks.", table)
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[(table, 'TreeRanks')] = (ancestors, treedef)

        query = query._replace(param_count=self.param_count+1)
        treedefitem_param = sql.bindparam('tdi_%s' % query.param_count, value=treedef.treedefitems.get(name=tree_rank).id)

        column_name = 'name' if tree_field is None else \
                      node._id if tree_field == 'ID' else \
                      table.get_field(tree_field.lower()).name

        column = sql.case([
            (getattr(ancestor, treedefitem_column) == treedefitem_param, getattr(ancestor, column_name))
            for ancestor in ancestors
        ])

        return query, column

    def tables_in_path(self, table, join_path):
        path = deque(join_path)
        field = None
        tables = [table]
        while len(path) > 0:
            field = path.popleft()
            if isinstance(field, str):
                field = tables[-1].get_field(field, strict=True)
            if not field.is_relationship:
                break

            tables.append(datamodel.get_table(field.relatedModelName, strict=True))
        return tables

    def build_join(self, table, model, join_path):
        query = self
        path = deque(join_path)
        field = None
        while len(path) > 0:
            field = path.popleft()
            if isinstance(field, str):
                field = table.get_field(field, strict=True)

            if not field.is_relationship:
                break
            next_table = datamodel.get_table(field.relatedModelName, strict=True)
            logger.debug("joining: %r to %r via %r", table, next_table, field)
            if (model, field.name) in query.join_cache:
                aliased = query.join_cache[(model, field.name)]
                logger.debug("using join cache for %r.%s", model, field.name)
            else:
                aliased = orm.aliased(getattr(models, next_table.name))
                query = query.outerjoin(aliased, getattr(model, field.name))

                logger.debug("adding to join cache %r, %r", (model, field.name), aliased)
                query = query._replace(join_cache=query.join_cache.copy())
                query.join_cache[(model, field.name)] = aliased

            table, model = next_table, aliased
        return query, model, table, field

def add_proxy_method(name):
    def proxy(self, *args, **kwargs):
        method = getattr(self.query, name)
        return self._replace(query=method(*args, **kwargs))
    setattr(QueryConstruct, name, proxy)

for name in 'filter join outerjoin add_columns reset_joinpoint group_by'.split():
    add_proxy_method(name)
