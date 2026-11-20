from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from collections import namedtuple, deque

from django.db.models import QuerySet, Count, Q
from sqlalchemy import orm, sql, or_

from specifyweb.specify.datamodel import datamodel, is_tree_table
from specifyweb.specify.models_utils.load_datamodel import Table
from specifyweb.backend.trees.utils import get_tree_ranks_in_collection, get_treedef_scope_filters, get_treedef_model, SPECIFY_TREES

from specifyweb.backend.stored_queries import models
from specifyweb.backend.stored_queries.tree_rank import TreeRankQuery

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec

def tree_depths_in_collection(collection, tree_name: str) -> QuerySet:
    """
    Returns a QuerySet that returns the IDs and number of ranks for each tree
    scopable to the given collection
    """
    if tree_name.lower() not in SPECIFY_TREES:
        raise ValueError(f"unexpected tree type: {tree_name}")

    treedef_model = get_treedef_model(tree_name)
    scoping_filters = get_treedef_scope_filters(collection, tree_name)
    query = (
        treedef_model.objects.filter(scoping_filters)
        .annotate(rank_count=Count("treedefitems", distinct=True))
        .distinct()
        .values_list("pk", "rank_count")
    )
    return query

def resolve_tree_ranks(
        collection,
        tree_table_name: str,
        rank_name: str,
        tree_def_id: int | None = None) -> list[tuple[int, int]]:
    """
    This is just a helper function to map trees scoped to the collection to a
    list containing objects of the form (definition_id, rank_id) given some
    particular rank name.
    In other words, this creates a mapping of ranks with a specific name to
    their tree definitions.

    For example: if there are two trees (a Tree A and Tree B) in the
    collection's discipline that both have a Genus rank (Rank A for Genus in
    Tree A and Rank B for Genus in Tree B), this function will return:
        [(tree_a_id, rank_a_id), (tree_b_id, rank_b_id)]

    The helper will only return tree and rank ids where the rank exists with
    the given name.
    e.g., if only Tree A has a "Genus" rank, the function will only return:
        [(tree_a_id, rank_a_id)]
    """
    if collection is None:
        raise AssertionError(f"No Collection found in Query for {tree_table_name}")

    rank_filters = None
    if tree_def_id is not None:
        rank_filters = Q(treedef_id=tree_def_id)

    tree_ranks = get_tree_ranks_in_collection(
        collection,
        tree_table_name,
        rank_name,
        additional_rank_filters=rank_filters
    )
    formatted_results = tree_ranks.values_list("treedef_id", "pk")
    return list(formatted_results)

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

        cache_key = (table, "TreeAncestors")
        if cache_key in query.join_cache:
            logger.debug("using join cache for %r tree ranks.", node)
            ancestors = query.join_cache[cache_key]
        else:
            tree_depths = tree_depths_in_collection(query.collection, table.name)
            # Not using exists here because we want to use the return value of
            # the Query. This will evaluate it and cache the results, which
            # we'll use soon.
            if len(tree_depths) == 0:
                logger.warning(
                    "Didn't find tree rank %r across any %s tree; skipping field",
                    tree_rank.name,
                    table.name,
                )
                return query_before_tree_joins, None, None, table

            # We need to take the max here. Otherwise, it is possible that the same rank
            # name may not occur at the same level across tree defs.
            max_depth = max(
                depth for _, depth in tree_depths
            )

            ancestors = [node]
            for _ in range(max_depth - 1):
                ancestor = orm.aliased(node)
                query = query.outerjoin(ancestor, ancestors[-1].ParentID == ancestor._id)
                ancestors.append(ancestor)

            logger.debug("adding to join cache for %r tree ranks.", node)
            query = query._replace(join_cache=query.join_cache.copy())
            query.join_cache[cache_key] = ancestors

        # FEAT: Cache this rank lookup on the Query?
        treedefs_with_rank_ids = resolve_tree_ranks(
            collection=query.collection,
            tree_table_name=table.name,
            rank_name=tree_rank.name,
            tree_def_id=tree_rank.treedef_id
        )

        if not treedefs_with_rank_ids:
            logger.warning(
                "Didn't find tree rank %r across any %s tree; skipping field",
                tree_rank.name,
                table.name,
            )
            return query_before_tree_joins, None, None, table

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

        # FEAT: Cache this rank lookup on the Query?
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
