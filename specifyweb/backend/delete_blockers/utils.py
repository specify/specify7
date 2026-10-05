from typing_extensions import TypeIs

from django.db.models import Field, ForeignObjectRel
from django.db.models.deletion import PROTECT, CASCADE
from sqlalchemy import select, and_, or_, not_, union_all
from sqlalchemy.orm import aliased

from specifyweb.specify.models_utils.model_extras import ModelWithTable
from specifyweb.specify.models import protect_with_blockers
from specifyweb.specify.api.crud import strict_get_model
from specifyweb.backend.stored_queries import models as sqlmodels

def field_is_remote(field: Field | ForeignObjectRel) -> TypeIs[ForeignObjectRel]:
    # TODO: Check whether there are any concrete fields that SHOULD be
    # included here, like some ToOne fields that acts as blockers
    return field.is_relation and not getattr(field, "concrete", True)

def relationship_blocks_deletion(relationship: ForeignObjectRel):
    return relationship.on_delete is protect_with_blockers or relationship.on_delete is PROTECT

def relationship_cascades_delete(relationship: ForeignObjectRel):
    return relationship.on_delete is CASCADE

def blocker_relationships_for_obj(obj: ModelWithTable) -> tuple[list[ForeignObjectRel], list[ForeignObjectRel]]:
    protect, cascade = [], []
    all_fields = obj._meta.get_fields(include_hidden=True)
    remote_relationships = filter(
        field_is_remote,
        all_fields
    )
    for relationship in remote_relationships:
        if relationship_blocks_deletion(relationship):
            protect.append(relationship)
        elif relationship_cascades_delete(relationship):
            cascade.append(relationship)

    return protect, cascade

# FIXME: add redis cache here. This can move a lot of pages into and out of the
# buffer pool. Make sure to invalidate the cache on tree renumbering
# REFACTOR: If we need to speed this up even more, consider using the DB cursor
# directly and skip SQLAlchemy constructs (like validate_tree_numbering)
def node_numbers_valid_for_tree(tree_name: str, definition_id: int) -> bool:
    tree_model = strict_get_model(tree_name)
    tree_table = tree_model.specify_model
    canonical_tree_name = tree_table.name
    tree_node = sqlmodels.models_by_tableid[tree_table.tableId]
    with sqlmodels.session_context() as session:
        invalid_nodes_exist = _individual_nodes_invalid(tree_node, canonical_tree_name, definition_id)
        nodes_in_acceptable_ranges = _node_numbers_within_parent_ranges(tree_node, canonical_tree_name, definition_id)
        final_query = (
            union_all(invalid_nodes_exist, nodes_in_acceptable_ranges)
            .limit(1)
        )
        result = session.execute(final_query).scalar_one_or_none()
        return result is None

# REFACTOR: It might be better here to validate all NodeNumbers and
# HighestChildNodeNumbers are distinct here instead.
# e.g., COUNT(*) == COUNT(DISTINCT NodeNumber) == COUNT(DISTINCT HighestChildNodeNumber)
def _individual_nodes_invalid(tree_model, tree_name: str, definition_id: int):
    tree_def = getattr(tree_model, tree_name + "TreeDefID")
    invalid_nodes_exist_query = (
        select(1)
        .select_from(tree_model)
        .where(
            and_(
                tree_def == definition_id,
                or_(
                    tree_model.nodeNumber.is_(None),
                    tree_model.highestChildNodeNumber.is_(None),
                    tree_model.highestChildNodeNumber < tree_model.nodeNumber
                )
            )
        )
        .limit(1)
    )
    return invalid_nodes_exist_query

def _node_numbers_within_parent_ranges(tree_model, tree_name: str, definition_id: int):
    # This is one of two generally efficient ways i've found to validate nodes
    # are within their correct ranges.
    # The other method is to build a derived table that groups tree nodes by
    # parent and gets the MIN and MAX of all of the children's NodeNumbers.
    # Then the tree table is joined on the derived table by ParentID and
    # validates the MIN and MAX nodenumber across all children lie within the
    # parent's expected range.
    # That method uses significantly less page accesses (~10x on some DBs) than
    # this direct Parent JOIN, but these accesses are usually not for distinct
    # pages, so not a big deal as long as they're in the buffer pool.
    # The other method does use some space in the buffer pool for filesort
    # operations, so keeping with this approach for now.
    tree_def = getattr(tree_model, tree_name + "TreeDefID")
    parent = aliased(tree_model)
    children_within_node_ranges = (
        select(1)
        .select_from(tree_model)
        .join(parent, tree_model.ParentID == parent._id)
        .where(
            tree_def == definition_id,
            not_(tree_model.nodeNumber.between(
                    parent.nodeNumber,
                    parent.highestChildNodeNumber
                )
            )
        )
        .limit(1)
    )
    return children_within_node_ranges
