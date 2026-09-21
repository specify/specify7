import logging
from collections import namedtuple, deque

from sqlalchemy import orm, sql, or_
from django.db.models import F, Q

import specifyweb.specify.models as spmodels
from specifyweb.backend.trees.utils import get_treedefs

from .queryfieldspec import TreeRankQuery, QueryFieldSpec
from specifyweb.backend.stored_queries import models

logger = logging.getLogger(__name__)

class QueryConstruct(namedtuple('QueryConstruct', 'collection objectformatter query join_cache tree_rank_count internal_filters')):

    def __new__(cls, *args, **kwargs):
        kwargs['join_cache'] = dict()
        # TODO: Use tree_rank_count to implement cases where formatter of taxon is defined with fields from the parent.
        # In that case, the cycle will end (unlike other cyclical cases).
        kwargs['tree_rank_count'] = 0
        kwargs['internal_filters'] = []
        return super().__new__(cls, *args, **kwargs)

    def tree_rank_metadata(self, table, tree_rank):
        """Resolve ranks once per query, shared by all paths into the same tree."""
        query = self
        defs_key = ('TreeDefinitions', table.name)
        if defs_key not in query.join_cache:
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[defs_key] = get_treedefs(query.collection, table.name)
        treedefs = query.join_cache[defs_key]

        # TreeRankQuery equality does not include the explicit tree definition.
        rank_key = ('TreeRankItems', table.name, tree_rank.name, tree_rank.treedef_id)
        if rank_key not in query.join_cache:
            item_model = getattr(spmodels, table.django_name + 'treedefitem')
            def_ids = [
                def_id for def_id, _ in treedefs
                if tree_rank.treedef_id is None or tree_rank.treedef_id == def_id
            ]
            items = item_model.objects.filter(
                treedef_id__in=def_ids, name=tree_rank.name
            ).values_list('treedef_id', 'id')
            by_definition = {}
            for def_id, item_id in items:
                if def_id in by_definition:
                    raise Exception('Got more than one matching tree rank')
                by_definition[def_id] = item_id
            ranks = [(def_id, by_definition[def_id]) for def_id in def_ids if def_id in by_definition]
            assert ranks, "Didn't find the tree rank across any tree"
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[rank_key] = ranks
        return query, treedefs, query.join_cache[rank_key]

    def tree_numbering_available(self, table, treedefs):
        """Fall back to parent links for trees with missing or reversed intervals.

        Tree writes maintain the nesting invariant. Do not renumber a tree while
        reading it, or cache this check across requests (uploads can change it).
        """
        cache_key = ('TreeNumbering', table.name)
        query = self
        if cache_key not in query.join_cache:
            model = getattr(spmodels, table.django_name)
            invalid = model.objects.filter(
                definition_id__in=[def_id for def_id, _ in treedefs]
            ).filter(
                Q(nodenumber__isnull=True)
                | Q(highestchildnodenumber__isnull=True)
                | Q(highestchildnodenumber__lt=F('nodenumber'))
            ).exists()
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[cache_key] = not invalid
        return query, query.join_cache[cache_key]

    def handle_tree_field(self, node, table, tree_rank: TreeRankQuery, next_join_path, current_field_spec: QueryFieldSpec, use_range=False, use_rank_lookup=False):
        query = self
        if query.collection is None:  # Not sure it makes sense to query across collections
            raise AssertionError(
                f"No Collection found in Query for {table}",
                {"table": table, "localizationKey": "noCollectionInQuery"},
            )
        logger.info('handling treefield %s rank: %s field: %s', table, tree_rank.name, next_join_path)

        treedefitem_column = table.name + 'TreeDefItemID'
        treedef_column = table.name + 'TreeDefID'

        query, treedefs, treedefs_with_ranks = query.tree_rank_metadata(table, tree_rank)

        if use_range:
            query, use_range = query.tree_numbering_available(table, treedefs)
        if use_range:
            # One matching ancestor at this rank, including the node itself.
            # Keep the filter on the ancestor column so the optimizer can start
            # with selective ID/name indexes and range-scan descendants.
            range_cache_key = (node, 'TreeRankLookup' if use_rank_lookup else 'TreeRankRange',
                               tree_rank.name, tree_rank.treedef_id)
            if range_cache_key in query.join_cache:
                ancestor = query.join_cache[range_cache_key]
            else:
                ancestor = orm.aliased(getattr(models, table.name))
                if use_rank_lookup:
                    # Map descendants to their ancestor once for this rank. The
                    # unfiltered mapping preserves displayed values when filters
                    # are combined with OR, while the PK join avoids a range
                    # comparison against every node at the requested rank.
                    model = getattr(models, table.name)
                    rank_node = orm.aliased(model)
                    child = orm.aliased(model)
                    lookup = sql.select(
                        rank_node._id.label('node_id'),
                        rank_node._id.label('ancestor_id'),
                        getattr(rank_node, treedef_column).label('definition_id'),
                    ).where(
                        getattr(rank_node, treedefitem_column).in_(
                            [item_id for _, item_id in treedefs_with_ranks]
                        ),
                    ).cte(recursive=True)
                    lookup = lookup.union(sql.select(
                        child._id, lookup.c.ancestor_id, getattr(child, treedef_column),
                    ).join(lookup, sql.and_(
                        child.ParentID == lookup.c.node_id,
                        getattr(child, treedef_column) == lookup.c.definition_id,
                    )))
                    query = query._replace(query=query.query.outerjoin(
                        lookup, node._id == lookup.c.node_id,
                    ).outerjoin(ancestor, ancestor._id == lookup.c.ancestor_id))
                else:
                    query = query._replace(query=query.query.outerjoin(ancestor, sql.and_(
                        getattr(node, treedef_column) == getattr(ancestor, treedef_column),
                        getattr(ancestor, treedefitem_column).in_(
                            [item_id for _, item_id in treedefs_with_ranks]
                        ),
                        node.nodeNumber.between(ancestor.nodeNumber, ancestor.highestChildNodeNumber),
                    )))
                query = query._replace(join_cache=query.join_cache.copy())
                query.join_cache[range_cache_key] = ancestor
            field_spec = current_field_spec._replace(
                root_table=table,
                root_sql_table=ancestor,
                join_path=next_join_path,
            )
            query, column, field, result_table = field_spec.add_spec_to_query(query)
            query = query._replace(internal_filters=[
                *query.internal_filters,
                or_(
                    getattr(node, treedef_column).in_([def_id for def_id, _ in treedefs_with_ranks]),
                    getattr(node, treedef_column).is_(None),
                ),
            ])
            return query, column, field, result_table

        cache_key = (node, 'TreeRanks')
        if cache_key in query.join_cache:
            logger.debug("using join cache for %r tree ranks.", node)
            ancestors, treedefs = query.join_cache[cache_key]
        else:
            # We need to take the max here. Otherwise, it is possible that the same rank
            # name may not occur at the same level across tree defs.
            max_depth = max(depth for _, depth in treedefs)

            ancestors = [node]
            for _ in range(max_depth - 1):
                ancestor = orm.aliased(node)
                query = query.outerjoin(ancestor, ancestors[-1].ParentID == ancestor._id)
                ancestors.append(ancestor)

            logger.debug("adding to join cache for %r tree ranks.", node)
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[cache_key] = (ancestors, treedefs)

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
            or_(
                getattr(node, treedef_column).in_(defs_to_filter_on),
                getattr(node, treedef_column).is_(None),
            ),
        ]
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
        # If nothing to filter on, return TRUE so .where(...) can run safely
        if not self.internal_filters:
            return sql.true()
        # Avoid OR on a single element
        if len(self.internal_filters) == 1:
            return self.internal_filters[0]
        return sql.or_(*self.internal_filters)

def add_proxy_method(name):
    def proxy(self, *args, **kwargs):
        method = getattr(self.query, name)
        return self._replace(query=method(*args, **kwargs))
    setattr(QueryConstruct, name, proxy)

for name in 'filter join outerjoin add_columns reset_joinpoint group_by'.split():
    add_proxy_method(name)
