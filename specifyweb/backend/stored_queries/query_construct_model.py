from __future__ import annotations

import logging
from collections import namedtuple, deque, defaultdict

from sqlalchemy import orm, sql, or_

from specifyweb.specify.datamodel import datamodel, is_tree_table
from specifyweb.specify.models_utils.load_datamodel import Table
from specifyweb.backend.trees.utils import get_tree_defs_in_collection

from specifyweb.backend.stored_queries import models
from specifyweb.backend.stored_queries.tree_rank import TreeRankQuery
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)


def resolve_tree_ranks(
        collection,
        tree_table_name: str,
        rank_name: str | None = None,
        tree_def_id: int | None = None) -> list[tuple[int, int]]:
    """
    This is just a helper function to map trees scoped to the collection to a
    list containing objects of the form (definition_id, rank_id) given some
    particular rank name.
    In other words, this creates a mapping of ranks with a specific name to
    their tree definitions.

    Alternatively, rank_name can be omitted or None to retrieve all ranks
    within each tree.
    """
    if collection is None:
        raise AssertionError(f"No Collection found in Query for {tree_table_name}")

    tree_def_filters = None
    if tree_def_id is not None:
        tree_def_filters = {
            "pk": tree_def_id
        }
    rank_filters = None
    if rank_name is not None:
        rank_filters = {
            "name": rank_name
        }
    # REFACTOR: (performance) this makes two queries, one for the definition
    # info and one for the ranks.
    # This can theoretically be optimized to a single query for the ranks.

    # e.g., if filtering on TreeDef, something like the following:
    # AND NOT EXISTS (SELECT 1 FROM treedefitem WHERE name=? AND TreeDefID=?)
    # i.e., tree_def_model.filter(...).filter(Exists(tree_def_item_model.objects.filter(name=?, treedef=OuterRef('pk'))))
    tree_defs = get_tree_defs_in_collection(
        collection=collection,
        tree_name=tree_table_name,
        tree_def_filters=tree_def_filters,
        rank_filters=rank_filters)
    result = []
    for tree_info in tree_defs:
        def_id = tree_info['definition']['id']
        ranks = tree_info['ranks']
        # Some data integrity checks if a specific rank name is provided
        if rank_name is not None:
            # If the tree exists but doesn't have the rank with the provided name,
            # just skip considering the tree
            if len(ranks) == 0:
                continue
            # Trees shouldn't have more than one rank with the same name
            if len(ranks) > 1:
                raise Exception(f"Got more than once matching rank for name {rank_name} on {tree_table_name} with id {def_id}")

        for rank in ranks:
            result.append((def_id, rank['id']))

    return result

class QueryConstruct(
    namedtuple(
        "QueryConstruct",
        "collection objectformatter base_table query join_cache tree_rank_count internal_filters",
    )
):
    def __new__(cls, *args, **kwargs):
        kwargs["join_cache"] = dict()
        # TODO: Use tree_rank_count to implement cases where formatter of taxon is defined with fields from the parent.
        # In that case, the cycle will end (unlike other cyclical cases).
        kwargs["tree_rank_count"] = 0
        kwargs["internal_filters"] = []
        return super().__new__(cls, *args, **kwargs)

    def _handle_tree_self_join(
        self,
        node,
        table: Table,
        tree_rank: TreeRankQuery,
        next_join_path,
        current_field_spec: QueryFieldSpec
    ):
        """
        This function handles adding a tree field to a Query that has a tree base
        table.
        This is distinct at the moment largely due to performance reasons:
        building a query on a tree table using the algorithm for non-tree
        tables will result in a very expensive query that takes far too long
        to run.

        See https://github.com/specify/specify7/pull/8670
        """
        query = self
        query_before_tree_joins = query
        if query.collection is None:  # Not sure it makes sense to query across collections
            raise AssertionError(
                f"No Collection found in Query for {table}",
                {"table": table, "localizationKey": "noCollectionInQuery"},
            )
        logger.info(
            "handling treefield %s rank: %s field: %s",
            table,
            tree_rank.name,
            next_join_path,
        )

        treedefitem_column = table.name + "TreeDefItemID"
        treedef_column = table.name + "TreeDefID"

        cache_key = (table, "TreeRanks")
        if cache_key in query.join_cache:
            logger.debug("using join cache for %r tree ranks.", node)
            ancestors, treedefs_with_rank_ids = query.join_cache[cache_key]
        else:
            treedefs_with_rank_ids = resolve_tree_ranks(
                collection=query.collection,
                tree_table_name=table.name,
                rank_name=None,
                tree_def_id=tree_rank.treedef_id
            )

            if not treedefs_with_rank_ids:
                logger.warning(
                    "Didn't find tree rank %r across any %s tree; skipping field",
                    tree_rank.name,
                    table.name,
                )
                return query_before_tree_joins, None, None, table

            # We need to take the max here. Otherwise, it is possible that the same rank
            # name may not occur at the same level across tree defs.
            rank_counts = defaultdict(int)
            for treedef_id, _rank_id in treedefs_with_rank_ids:
                rank_counts[treedef_id] += 1
            max_depth = max(
                rank_count for _treedef_id, rank_count in rank_counts.items()
            )

            ancestors = [node]
            for _ in range(max_depth - 1):
                ancestor = orm.aliased(node)
                query = query.outerjoin(ancestor, ancestors[-1].ParentID == ancestor._id)
                ancestors.append(ancestor)

            logger.debug("adding to join cache for %r tree ranks.", node)
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[cache_key] = (ancestors, treedefs_with_rank_ids)

        treedefs_with_rank_ids = resolve_tree_ranks(
            collection=query.collection,
            tree_table_name=table.name,
            rank_name=tree_rank.name,
            tree_def_id=tree_rank.treedef_id
        )

        treedefitem_params = [treedefitem_id for (_, treedefitem_id) in treedefs_with_rank_ids]

        def make_tree_field_spec(tree_node):
            return current_field_spec._replace(
                root_table=table,  # rebasing the query
                root_sql_table=tree_node,  # this is needed to preserve SQL aliased going to next part
                join_path=next_join_path,  # slicing join path to begin from after the tree
            )

        cases = []
        field = None  # just to stop mypy from complaining.
        for ancestor in ancestors:
            field_spec = make_tree_field_spec(ancestor)
            query, orm_field, field, table = field_spec.add_spec_to_query(query)
            # Field and table won't matter. Rank acts as fork, and these two will be same across siblings
            for treedefitem_param in treedefitem_params:
                cases.append(
                    (getattr(ancestor, treedefitem_column) == treedefitem_param, orm_field)
                )

        column = sql.case(cases)

        defs_to_filter_on = [def_id for (def_id, _) in treedefs_with_rank_ids]
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

    def _handle_tree_relationship(    
        self,
        node,
        table: Table,
        tree_rank: TreeRankQuery,
        next_join_path,
        current_field_spec: QueryFieldSpec,  
    ):
        """
        This function handles adding a tree field to a query that does not have
        a tree base table.
        The general approach is to build a CTE that starts with the direct join
        to the node (e.g., a determination's taxon), and recurse up the tree to
        retrieve the required rank's information.
        See prepare_tree_ranks and resolve_page in tree_ranks.py for a lot of
        the heavy-lifting when it comes to building the query.

        Additionally, see https://github.com/specify/specify7/pull/8670
        """
        query = self
        if query.collection is None:  # Not sure it makes sense to query across collections
            raise AssertionError(
                f"No Collection found in Query for {table}",
                {"table": table, "localizationKey": "noCollectionInQuery"},
            )
        logger.info(
            "handling treefield %s rank: %s field: %s",
            table,
            tree_rank.name,
            next_join_path,
        )

        treedef_column = table.name + 'TreeDefID'

        treedefs_with_ranks = resolve_tree_ranks(
            collection=query.collection,
            tree_table_name=table.name,
            rank_name=tree_rank.name,
            tree_def_id=tree_rank.treedef_id
        )

        if not treedefs_with_ranks:
            logger.warning(
                "Didn't find tree rank %r across any %s tree; skipping field",
                tree_rank.name,
                table.name,
            )
            return query, None, None, table

        treedefitem_params = tuple(sorted(
            treedefitem_id for (_, treedefitem_id) in treedefs_with_ranks
        ))
        defs_to_filter_on = [def_id for (def_id, _) in treedefs_with_ranks]
        cache_key = (node, table, treedefitem_params, 'TreeRank')
        ranks = query.join_cache.get("tree_ranks")
        if ranks is None:
            raise ValueError("expected tree_ranks to be in the join cache. Did you forget to call prepare_tree_ranks?")
        ranks.current_rank = (node, table, treedefitem_params)
        if cache_key in query.join_cache:
            ancestor = query.join_cache[cache_key]
        else:
            ancestor = orm.aliased(getattr(models, table.name))
            query = ranks.join(query, node, ancestor, table, treedefitem_params)
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[cache_key] = ancestor

        # We don't want to include treedef if the rank is not present.
        new_filters = [
            *query.internal_filters,
            or_(
                getattr(node, treedef_column).in_(defs_to_filter_on),
                getattr(node, treedef_column).is_(None),
            ),
        ]
        query = query._replace(internal_filters=new_filters)

        field_spec = current_field_spec._replace(
            root_table=table,
            root_sql_table=ancestor,
            join_path=next_join_path,
        )
        query, column, field, table = field_spec.add_spec_to_query(query)
        return query, column, field, table

    def handle_tree_field(
        self,
        node,
        table: Table,
        tree_rank: TreeRankQuery,
        next_join_path,
        current_field_spec: QueryFieldSpec,
    ):
        if is_tree_table(self.base_table):
            return self._handle_tree_self_join(
                node, table, tree_rank, next_join_path, current_field_spec
            )
        return self._handle_tree_relationship(
            node, table, tree_rank, next_join_path, current_field_spec
        )

    def build_join(self, table: Table, model, join_path):
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
            next_table = datamodel.get_table_strict(field.relatedModelName)
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


for name in "filter join outerjoin add_columns reset_joinpoint group_by".split():
    add_proxy_method(name)
