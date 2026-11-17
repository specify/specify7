from __future__ import annotations

import logging
from collections import namedtuple, deque

from sqlalchemy import orm, sql, or_

from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models_utils.load_datamodel import Table
from specifyweb.backend.trees.utils import get_tree_defs_in_collection

from specifyweb.backend.stored_queries import models
from specifyweb.backend.stored_queries.tree_rank import TreeRankQuery
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)


def resolve_tree_rank(collection, tree_table_name: str, rank_name: str, tree_def_id: int | None = None) -> list[tuple[int, int]]:
    """
    This is just a helper function to map trees scoped to the collection to a
    list containing objects of the form (definition_id, rank_id) given some
    particular rank name.
    In other words, this creates a mapping of ranks with a specific name to
    their tree definitions.
    """
    if collection is None:
        raise AssertionError(f"No Collection found in Query for {tree_table_name}")

    filters = None
    if tree_def_id is not None:
        filters = {
            "pk": tree_def_id
        }
    # REFACTOR: (performance) this makes two queries, one for the definition
    # info and one for the ranks.
    # This can theoretically be optimized to a single query for the ranks.
    tree_defs = get_tree_defs_in_collection(collection, tree_table_name, filters)
    result = []
    for tree_info in tree_defs:
        def_id = tree_info['definition']['id']
        correct_ranks = tuple(
            filter(
                lambda rank: rank['name'].lower() == rank_name.lower(),
                tree_info['ranks']
            )
        )
        # If the tree exists but doesn't have the rank with the provided name,
        # just skip considering the tree
        # REFACTOR:(performance) This check can be moved to the filter itself.
        # If filtering on TreeDef, something like the following:
        # AND NOT EXISTS (SELECT 1 FROM treedefitem WHERE name=? AND TreeDefID=?)
        # i.e., tree_def_model.filter(...).filter(Exists(tree_def_item_model.objects.filter(...)))
        if len(correct_ranks) == 0:
            continue
        if len(correct_ranks) > 1:
            raise Exception(f"Got more than once matching rank for name {rank_name} on {tree_table_name} with id {def_id}")
        resolved_rank_id = correct_ranks[0]['id']
        result.append((def_id, resolved_rank_id))
    return result

class QueryConstruct(
    namedtuple(
        "QueryConstruct",
        "collection objectformatter query join_cache tree_rank_count internal_filters",
    )
):
    def __new__(cls, *args, **kwargs):
        kwargs["join_cache"] = dict()
        # TODO: Use tree_rank_count to implement cases where formatter of taxon is defined with fields from the parent.
        # In that case, the cycle will end (unlike other cyclical cases).
        kwargs["tree_rank_count"] = 0
        kwargs["internal_filters"] = []
        return super().__new__(cls, *args, **kwargs)

    def handle_tree_field(
        self,
        node,
        table: Table,
        tree_rank: TreeRankQuery,
        next_join_path,
        current_field_spec: QueryFieldSpec,
    ):
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

        treedefs_with_ranks = resolve_tree_rank(query.collection, table.name, tree_rank.name, tree_rank.treedef_id)

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
