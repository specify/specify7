from functools import reduce
from typing import Any
from specifyweb.specify.models import datamodel
from specifyweb.specify.func import Func
from specifyweb.specify.load_datamodel import Table
from specifyweb.backend.trees.views import TREE_INFORMATION
from specifyweb.backend.stored_queries.execution import QuerySort
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec, TreeRankQuery
from .batch_edit import BatchEditFieldPack, BatchEditPack, RowPlanMap

BATCH_EDIT_REQUIRED_TREE_FIELDS: set[str] = {"name"}


def _track_observed_ranks(
    table_name,
    running_path,
    tree_def,
    all_current_ranks: dict[str, dict[Any, Any]],
    accum: tuple[list[int], list[tuple[str, RowPlanMap]]],
    _current: tuple[str, RowPlanMap],
):
    # 1. if tree rank itself is None (non tree field), nothing to do.
    # 2. if the tree rank that's in the query is not in the current ranks, ignore them.
    # 3. if the tree rank already has a specialized tree. There is no current way in which this can naturally happen but this does avoid
    #    a future bug when multiple treedef queries are supported.
    relname, current = _current
    if (
        current.tree_rank is None
        or (current.tree_rank.relatedModelName.lower() != table_name.lower())
        or current.tree_rank.treedef_id is not None
        or (current.tree_rank.name not in all_current_ranks)
    ):
        return accum

    current_rank = all_current_ranks[current.tree_rank.name]
    # Here, we also modify the columns to adjust the missing field stuff.
    current_fields = Func.filter_list(
        [
            None if column.field is None else column.field.fieldspec.get_field()
            for column in current.columns
        ]
    )

    # if the current_field is not found, insert them into the query with fields.
    naive_field_spec = QueryFieldSpec.from_path(running_path)
    adjusted_field_spec = lambda field_name: naive_field_spec._replace(
        join_path=(
            *naive_field_spec.join_path,
            current.tree_rank,
            naive_field_spec.table.get_field_strict(field_name),
        )
    )
    # Now, we need to run the adjuster over all the fields that are required but did not appear
    required_missing = BATCH_EDIT_REQUIRED_TREE_FIELDS - {
        field.name for field in current_fields
    }
    extra_columns = [
        BatchEditFieldPack(
            field=BatchEditPack._query_field(adjusted_field_spec(field_name), 0)
        )
        for field_name in required_missing
    ]

    new_columns = [*current.columns, *extra_columns]
    new_tree_rank_query = TreeRankQuery.create(
        current.tree_rank.name, current.tree_rank.relatedModelName, tree_def["id"],tree_def["name"]
    )

    new_columns = []
    for column in [*current.columns, *extra_columns]:
        column_field = column.field
        new_field_spec = BatchEditPack.replace_tree_rank(column_field.fieldspec, new_tree_rank_query)
        new_columns.append(
            column._replace(field=column_field._replace(fieldspec=new_field_spec))
        )

    return [*accum[0], current_rank["rankid"]], [
        *accum[1],
        # Making a copy here is important.
        (relname, current._replace(columns=new_columns, tree_rank=new_tree_rank_query, batch_edit_pack=current.batch_edit_pack.readjust_tree_rank(new_tree_rank_query))),
    ]


def _rewrite_multiple_trees(
    running_path,
    current: dict[str, RowPlanMap],
    all_tree_info: dict[str, list[TREE_INFORMATION]],
) -> dict[str, RowPlanMap]:
    # We now rewrite the query for multiple trees. We need to do this because we don't support querying a specific treedef.
    # Multiple different iterations were went into this:
    # 1. Trying it on frontend
    # 2. Trying it on backend
    #   2.a: Rewriting directly on fields
    # This place is currently more simpler than other places tried.

    new_rels: list[tuple[str, RowPlanMap]] = [
        (key, value) for (key, value) in current.items() if value.tree_rank is None
    ]

    # TODO: Check if the first loop is needed at all? Just do alltree_info[table.name] and go from there?
    for table_name, multiple_tree_info in all_tree_info.items():
        for single_tree_info in multiple_tree_info:
            augmented_tree_info = {
                rank["name"]: rank for rank in single_tree_info["ranks"]
            }
            ranks_found, rels_created = reduce(
                lambda p, c: _track_observed_ranks(
                    table_name, running_path, single_tree_info['definition'], augmented_tree_info, p, c
                ),
                current.items(),
                ([], []),
            )
            # This means that no rank was selected for this tree, so we completely skip this (no point in adding multiples)
            if len(ranks_found) == 0:
                continue
            # We now add the new ranks that were initially missing.
            min_rank_id = ranks_found[0] if len(ranks_found) == 1 else min(*ranks_found)
            ranks_to_add = [
                rank["name"]
                for rank in single_tree_info["ranks"]
                if rank["rankid"] > min_rank_id
                and rank["rankid"] not in ranks_found
            ]
            fieldspec = QueryFieldSpec.from_path(running_path)
            # To make things "simpler", we just run the reducer again.
            template_plans = {}
            for rank in ranks_to_add:
                tree_rank_query = TreeRankQuery.create(rank, table_name)
                adjusted = fieldspec._replace(
                    join_path=(*fieldspec.join_path, tree_rank_query)
                )
                template_plans = {
                    **template_plans,
                    rank: RowPlanMap(
                        batch_edit_pack=BatchEditPack.from_field_spec(adjusted),
                        tree_rank = tree_rank_query
                    )
                }
            final_ranks_created, final_rels_created = reduce(
                lambda p, c: _track_observed_ranks(
                    table_name, running_path, single_tree_info['definition'], augmented_tree_info, p, c
                ),
                template_plans.items(),
                ([], []),
            )
            assert len(final_ranks_created) == len(ranks_to_add)

            new_rels = [
                *new_rels,
                # NOTE: The order between finals_rels_created and rels_created does not matter
                *rels_created,
                *final_rels_created
            ]

    # Now, we'have done the iteration over all the possible treees and have made the corresponding tree query ranks in the columns
    # just scoped to a specific query. The only thing remaining is adjusting the name of the relationship being used.
    # Note that new_rels is a list on purpose. Now, it contains all the relationships corrected, but it contain duplicated first key.
    # We now make them deduplicated, by using the unique name that treerankquery makes.
    new_rels = [
        (
            rel if value.tree_rank is None else value.tree_rank.get_workbench_name(),
            value,
        )
        for rel, value in new_rels
    ]
    # Duplicates are not possible here.
    assert len(set(Func.first(new_rels))) == len(
        new_rels
    ), f"Duplicates created: {new_rels}"

    # It is not this function's responsibility to perform rewrites on next plans.
    return {key: value for (key, value) in new_rels}

def _safe_table(key: str, table: Table):
    field = table.get_field(key)
    if field is None:
        return table
    return datamodel.get_table_strict(field.relatedModelName)

def contains_coords(columns: list[BatchEditFieldPack]) -> bool:
    coordinate_field_names = ('latitude1', 'lat1text', 'longitude1',
                              'long1text', 'latitude2', 'lat2text',
                              'longitude2', 'long2text')
    locality_table = datamodel.get_table_strict('Locality')
    coordinate_fields = list(map(lambda field_name: locality_table.get_field_strict(
        field_name), coordinate_field_names))
    return any(column.field is not None and column.field.fieldspec.get_field() in coordinate_fields for column in columns)


def missing_coordinate_columns(running_path: list[str], columns: list[BatchEditFieldPack]) -> tuple[BatchEditFieldPack]:
    grouped_coordinate_fields = (
        ('latitude1', 'lat1text'),
        ('longitude1', 'long1text'),
        ('latitude2', 'lat2text'),
        ('longitude2', 'long2text')
    )
    coordinate_fields = tuple(
        field for pair in grouped_coordinate_fields for field in pair)
    present: dict[str, BatchEditFieldPack] = {}
    for column in columns:
        field = column.field.fieldspec.get_field() if column.field is not None else None
        if field is None or not field.name.lower() in coordinate_fields:
            continue
        present[field.name.lower()] = column
    present_field_names = present.keys()

    missing_cols = []
    for decimal_field, text_field in grouped_coordinate_fields:
        decimal_field_present = decimal_field in present_field_names
        text_field_present = text_field in present_field_names

        if decimal_field_present == text_field_present:
            continue

        missing_field = text_field if decimal_field_present else decimal_field
        field_spec = QueryFieldSpec.from_path([*running_path, missing_field])
        field = BatchEditPack._query_field(field_spec, QuerySort.NONE)
        missing_cols.append(BatchEditFieldPack(field=field))

    return tuple(missing_cols)


def _rewrite_locality_coords(running_path: list[str], current: RowPlanMap):
    """
        If the RowPlanMap contains any mappings to coordinate information, we
        need to adjust the RowPlanMap to also include
    """
    new_current = current
    if not contains_coords(current.columns):
        # If no coordinate fields are mapped, we don't have to do any re-writing
        return current

    # Now we have to identify which corresponding lat/longtext fields to add to the query
    missing_cols = missing_coordinate_columns(running_path, current.columns)
    new_current = current._replace(columns=[*current.columns, *missing_cols])

    return new_current

def _batch_edit_rewrite(
    self: RowPlanMap, table: Table, all_tree_info: TREE_INFORMATION, running_path=[]
) -> RowPlanMap:

    self = _rewrite_locality_coords(running_path, self)

    to_ones = {
        key: value.rewrite(
            _safe_table(key, table),
            all_tree_info,
            [*running_path, key],
        )
        for (key, value) in self.to_one.items()
    }
    to_many = {
        key: value.rewrite(
            _safe_table(key, table),
            all_tree_info,
            [*running_path, key],
        )
        for (key, value) in self.to_many.items()
    }
    to_ones = _rewrite_multiple_trees(running_path, to_ones, all_tree_info)
    to_many = _rewrite_multiple_trees(running_path, to_many, all_tree_info)
    return self._replace(to_one=to_ones, to_many=to_many)