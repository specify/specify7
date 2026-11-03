"""Query-scoped, indexed ancestor resolution for tree rank fields.

Ordinary predicates bound the seed set before rank filters are evaluated. Each
tree shares a recursive parent mapping across its relationship aliases. Counts
can omit display-only ranks; scalar pages resolve them after selecting rows.
Grouping, synonym searches, mixed trees and formatted objects remain eager.
Mappings live only in the SQL statement: there is no tree cache to invalidate.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Protocol

from sqlalchemy import orm, sql

from . import models

if TYPE_CHECKING:
    from specifyweb.specify.models_utils.load_datamodel import Table
    ObjectFormatter = object
    Rank = tuple[object, Table, tuple[int, ...]]


class RankField(Protocol):
    @property
    def fieldspec(self) -> object:
        raise NotImplementedError


def rank_path(spec):
    from specifyweb.specify.datamodel import datamodel, is_tree_table
    for index, part in enumerate(spec.join_path):
        if (
            hasattr(part, "relatedModelName")
            and hasattr(part, "name")
            and hasattr(part, "treedef_id")
            and is_tree_table(datamodel.get_table_strict(part.relatedModelName))
        ):
            return spec.join_path[:index], part, spec.join_path[index + 1:]
    return None


def path_key(spec):
    path, rank, _ = rank_path(spec)
    return (spec.root_sql_table, tuple(part.name for part in path),
            rank.relatedModelName, rank.name, rank.treedef_id)


def ancestor_mapping(seeds, table):
    model = getattr(models, table.name)
    node = orm.aliased(model)
    definition = table.name + "TreeDefID"
    item = table.name + "TreeDefItemID"
    mapping = sql.select(
        node._id.label("seed_id"), node._id.label("ancestor_id"),
        node.ParentID.label("parent_id"),
        getattr(node, item).label("item_id"),
        getattr(node, definition).label("definition_id"),
    ).select_from(seeds).join(node, node._id == seeds.c.node_id).cte(recursive=True)
    parent = orm.aliased(model)
    # UNION terminates even if a damaged tree contains a parent cycle.
    return mapping.union(sql.select(
        mapping.c.seed_id, parent._id, parent.ParentID,
        getattr(parent, item), getattr(parent, definition),
    ).select_from(mapping).join(
        parent, parent._id == mapping.c.parent_id,
    ).where(getattr(parent, definition) == mapping.c.definition_id))


def ancestor_id(mapping, node_id, item_ids, definition_id, distinct=False):
    ancestors = mapping.alias()
    selected = sql.select(ancestors.c.ancestor_id)
    if distinct:
        selected = selected.distinct()
    return selected.where(
        ancestors.c.seed_id == node_id,
        ancestors.c.item_id.in_(item_ids),
        ancestors.c.definition_id == definition_id,
    ).correlate_except(ancestors).scalar_subquery()


@dataclass
class TreeRanks:
    deferred: set = field(default_factory=set)
    mappings: dict = field(default_factory=dict)
    displays: dict[int, tuple[RankField, Rank, ObjectFormatter]] = field(default_factory=dict)
    current_field: RankField | None = None
    current_rank: Rank | None = None
    mapped_nodes: set = field(default_factory=set)
    row_ids: list = field(default_factory=list)

    def join(self, query, node, ancestor, table, item_ids):
        deferred = (
            self.current_field is not None
            and rank_path(self.current_field.fieldspec) is not None
            and path_key(self.current_field.fieldspec) in self.deferred
        )
        self.current_rank = (node, table, item_ids)
        if deferred:
            return query.outerjoin(ancestor, ancestor._id == node._id)
        key = table if node in self.mapped_nodes else (table, node)
        if key not in self.mappings:
            seeds = query.query.with_entities(node._id.label("node_id")).distinct().subquery()
            self.mappings[key] = ancestor_mapping(seeds, table)
        mapping = self.mappings[key]
        definition = table.name + "TreeDefID"
        return query.outerjoin(ancestor, sql.and_(
            ancestor._id == ancestor_id(
                mapping, node._id, item_ids, getattr(node, definition)),
            getattr(ancestor, definition) == getattr(node, definition),
        ))


def prepare_tree_ranks(query, query_fields, defer_display, count_only=False):
    """Seed ancestors from ordinary filters, before adding any rank predicates."""
    ranks = TreeRanks()
    tree_fields = [f for f in query_fields if rank_path(f.fieldspec) is not None]
    required = {
        path_key(f.fieldspec) for f in tree_fields
        if (f.sort_type and not count_only) or f.negate or f.op_num != 8
        or len(rank_path(f.fieldspec)[2]) != 1
        or f.fieldspec.is_relationship() or f.fieldspec.is_temporal()
    }
    if defer_display:
        ranks.deferred = {
            path_key(f.fieldspec) for f in tree_fields
            if path_key(f.fieldspec) not in required
            and len(rank_path(f.fieldspec)[2]) == 1
            and not f.fieldspec.is_relationship()
            and not f.fieldspec.is_temporal()
        }

    nodes_by_table = {}
    for query_field in tree_fields:
        spec = query_field.fieldspec
        path, _, _ = rank_path(spec)
        query, node, table, _ = query.build_join(
            spec.root_table, spec.root_sql_table, path)
        if path_key(spec) not in ranks.deferred:
            nodes_by_table.setdefault(table, set()).add(node)
    for table, nodes in nodes_by_table.items():
        nodes = list(nodes)
        # Unpivot relationship IDs without repeating the candidate query.
        slots = sql.union_all(*[
            sql.select(sql.literal(i).label("slot")) for i in range(len(nodes))
        ]).subquery()
        candidate = query.query.with_entities(*[
            node._id.label(f"node_{i}") for i, node in enumerate(nodes)
        ]).subquery()
        seeds = sql.select(sql.case([
            (slots.c.slot == i, candidate.c[f"node_{i}"])
            for i in range(len(nodes))
        ]).label("node_id")).select_from(candidate.join(slots, sql.true())).distinct().subquery()
        ranks.mappings[table] = ancestor_mapping(seeds, table)
        ranks.mapped_nodes.update(nodes)
    query.join_cache["tree_ranks"] = ranks
    return query


def resolve_page(query, order, ranks, limit, offset):
    """Walk display-only ancestors from selected rows, not the whole result.

    Base/to-many IDs break requested-sort ties without collapsing duplicate rows.
    """
    order = [*order, *ranks.row_ids]
    if not ranks.displays:
        selected = query.order_by(*order).offset(offset)
        return selected.limit(limit) if limit else selected

    records = list(ranks.displays.values())
    # Eligibility is checked before deferring fields: all belong to one tree.
    nodes = list(dict.fromkeys(record[1][0] for record in records))
    columns = [entry["expr"] for entry in query.column_descriptions]
    page_columns = [
        (sql.null() if i in ranks.displays else column).label(f"value_{i}")
        for i, column in enumerate(columns)
    ]
    page_columns += [node._id.label(f"node_{i}") for i, node in enumerate(nodes)]
    page_columns.append(sql.func.row_number().over(order_by=order).label("page_order"))
    selected = query.with_entities(*page_columns).order_by(*order).offset(offset)
    if limit:
        selected = selected.limit(limit)
    page = selected.subquery()

    # Carry page rows through real ancestor recursion. The page is a single seed
    # of this CTE, not an independently materialized CTE referenced repeatedly.
    table = records[0][1][1]
    model = getattr(models, table.name)
    slots = sql.union_all(*[
        sql.select(sql.literal(i).label("slot")) for i in range(len(nodes))
    ]).subquery()
    seed_id = sql.case([
        (slots.c.slot == i, page.c[f"node_{i}"]) for i in range(len(nodes))
    ])
    node = orm.aliased(model)
    definition = table.name + "TreeDefID"
    item = table.name + "TreeDefItemID"
    walk = sql.select(
        *page.c, slots.c.slot, seed_id.label("seed_id"),
        node._id.label("ancestor_id"), node.ParentID.label("parent_id"),
        getattr(node, item).label("item_id"),
        getattr(node, definition).label("definition_id"),
        sql.true().label("is_seed"),
    ).select_from(page.join(slots, sql.true()).outerjoin(
        node, node._id == seed_id)).cte(recursive=True)
    parent = orm.aliased(model)
    recursive = sql.select(
        *[walk.c[column.key] for column in page.c],
        walk.c.slot, walk.c.seed_id, parent._id, parent.ParentID,
        getattr(parent, item), getattr(parent, definition), sql.false(),
    ).select_from(walk).join(parent, parent._id == walk.c.parent_id).where(
        getattr(parent, definition) == walk.c.definition_id)
    mapping = ranks.mappings.get(table)
    if mapping is not None:
        recursive = recursive.where(~sql.exists(
            sql.select(mapping.c.seed_id).where(mapping.c.seed_id == walk.c.seed_id)
        ))
    walk = walk.union(recursive)
    result = query.session.query(*[
        walk.c[f"value_{i}"] for i in range(len(columns))
    ]).select_from(walk).filter(walk.c.is_seed, walk.c.slot == 0)
    aliases = {}
    selected_nodes = {}
    replacements = {}
    for index, (query_field, (original_node, _, item_ids), formatter) in ranks.displays.items():
        node_id = walk.c[f"node_{nodes.index(original_node)}"]
        key = (original_node, item_ids)
        if key not in aliases:
            ancestor = orm.aliased(model)
            # Definition comes from the selected node; never use rank name alone.
            if original_node not in selected_nodes:
                selected_node = orm.aliased(model)
                result = result.outerjoin(selected_node, selected_node._id == node_id)
                selected_nodes[original_node] = selected_node
            selected_node = selected_nodes[original_node]
            definition_id = getattr(selected_node, definition)
            resolved_id = ancestor_id(walk, node_id, item_ids, definition_id, distinct=True)
            if mapping is not None:
                resolved_id = sql.func.coalesce(
                    ancestor_id(mapping, node_id, item_ids, definition_id), resolved_id)
            result = result.outerjoin(ancestor, sql.and_(
                ancestor._id == resolved_id,
                getattr(ancestor, definition) == definition_id,
            ))
            aliases[key] = ancestor
        _, _, remaining = rank_path(query_field.fieldspec)
        column = getattr(aliases[key], remaining[0].name)
        replacements[index] = formatter.fieldformat(query_field, column)
    return result.with_entities(*[
        replacements.get(i, walk.c[f"value_{i}"]) for i in range(len(columns))
    ]).order_by(walk.c.page_order).execution_options(specify_tree_ranks=ranks)
