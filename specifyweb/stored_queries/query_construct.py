import logging
from collections import namedtuple, deque

from sqlalchemy import orm, sql, or_

import specifyweb.specify.models as spmodels
from specifyweb.specify.tree_utils import get_treedefs

from .queryfieldspec import TreeRankQuery, QueryFieldSpec
from specifyweb.stored_queries import models

logger = logging.getLogger(__name__)

def _safe_filter(query):
    count = query.count()
    if count <= 1:
        return query.first()
    raise Exception(f"Got more than one matching: {list(query)}")

class QueryConstruct(namedtuple('QueryConstruct', 'collection objectformatter query join_cache tree_rank_count internal_filters')):

    def __new__(cls, *args, **kwargs):
        kwargs['join_cache'] = dict()
        # TODO: Use tree_rank_count to implement cases where formatter of taxon is defined with fields from the parent.
        # In that case, the cycle will end (unlike other cyclical cases).
        kwargs['tree_rank_count'] = 0
        kwargs['internal_filters'] = []
        return super().__new__(cls, *args, **kwargs)

    def handle_tree_field(self, node, table, tree_rank: TreeRankQuery, next_join_path, current_field_spec: QueryFieldSpec):
        query = self
        if query.collection is None: raise AssertionError( # Not sure it makes sense to query across collections
            f"No Collection found in Query for {table}",
            {"table" : table,
             "localizationKey" : "noCollectionInQuery"}) 
        logger.info('handling treefield %s rank: %s field: %s', table, tree_rank.name, next_join_path)

        treedefitem_column = table.name + 'TreeDefItemID'
        treedef_column = table.name + 'TreeDefID'

        if (table, 'TreeRanks') in query.join_cache:
            logger.debug("using join cache for %r tree ranks.", table)
            ancestors, treedefs = query.join_cache[(table, 'TreeRanks')]
        else:
            
            treedefs = get_treedefs(query.collection, table.name)

            # We need to take the max here. Otherwise, it is possible that the same rank
            # name may not occur at the same level across tree defs.
            max_depth = max(depth for _, depth in treedefs)
            
            ancestors = [node]
            for _ in range(max_depth-1):
                ancestor = orm.aliased(node)
                query = query.outerjoin(ancestor, ancestors[-1].ParentID == ancestor._id)
                ancestors.append(ancestor)
        

            logger.debug("adding to join cache for %r tree ranks.", table)
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[(table, 'TreeRanks')] = (ancestors, treedefs)

        item_model = getattr(spmodels, table.django_name + "treedefitem")

        # TODO: optimize out the ranks that appear? cache them
        treedefs_with_ranks: list[tuple[int, int]] = [tup for tup in [
            (treedef_id, _safe_filter(item_model.objects.filter(treedef_id=treedef_id, name=tree_rank.name).values_list('id', flat=True)))
            for treedef_id, _ in treedefs
            # For constructing tree queries for batch edit
            if (tree_rank.treedef_id is None or tree_rank.treedef_id == treedef_id)
            ] if tup[1] is not None]

        assert len(treedefs_with_ranks) >= 1, "Didn't find the tree rank across any tree"

        treedefitem_params = [treedefitem_id for (_, treedefitem_id) in treedefs_with_ranks]

        def make_tree_field_spec(tree_node):
            return current_field_spec._replace(
                root_table=table, # rebasing the query
                root_sql_table=tree_node, # this is needed to preserve SQL aliased going to next part
                join_path=next_join_path, # slicing join path to begin from after the tree
            )

        cases = []
        field = None # just to stop mypy from complaining.
        for ancestor in ancestors:
            field_spec = make_tree_field_spec(ancestor)
            query, orm_field, field, table = field_spec.add_spec_to_query(query)
            # Field and table won't matter. Rank acts as fork, and these two will be same across siblings
            for treedefitem_param in treedefitem_params:
                cases.append((getattr(ancestor, treedefitem_column) == treedefitem_param, orm_field))

        column = sql.case(cases)

        defs_to_filter_on = [def_id for (def_id, _) in treedefs_with_ranks]
        # We don't want to include treedef if the rank is not present.
        new_filters = [
            *query.internal_filters,
            or_(getattr(node, treedef_column).in_(defs_to_filter_on), getattr(node, treedef_column) == None)]
        query = query._replace(internal_filters=new_filters)

        return query, column, field, table

    def tables_in_path(self, table, join_path):
        path = deque(join_path)
        field = None
        tables = [table]
        while len(path) > 0:
            field = path.popleft()
            if isinstance(field, str):
                field = tables[-1].get_field(field, strict=True)
            if not field.is_relationship: # also handles tree ranks
                break

            tables.append(spmodels.datamodel.get_table(field.relatedModelName, strict=True))
        return tables

    def build_join(self, table, model, join_path):
        query = self
        path = deque(join_path)
        field = None
        while len(path) > 0:
            field = path.popleft()
            if isinstance(field, str):
                field = table.get_field(field, strict=True)
            # basically, tree ranks act as forks.
            if not field.is_relationship or isinstance(field, TreeRankQuery):
                break
            next_table = spmodels.datamodel.get_table(field.relatedModelName, strict=True)
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


    # To make things "simpler", it doesn't apply any filters, but returns a single predicate
    # @model is an input parameter, because cannot guess if it is aliased or not (callers are supposed to know that)
    def get_internal_filters(self):
        return sql.or_(*self.internal_filters)

def add_proxy_method(name):
    def proxy(self, *args, **kwargs):
        method = getattr(self.query, name)
        return self._replace(query=method(*args, **kwargs))
    setattr(QueryConstruct, name, proxy)

for name in 'filter join outerjoin add_columns reset_joinpoint group_by'.split():
    add_proxy_method(name)