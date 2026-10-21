import logging

from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.backend.trees.extras import is_treedefitem
from specifyweb.backend.trees.ranks import *

logger = logging.getLogger(__name__)

@orm_signal_handler(
    'pre_delete',
    'Taxontreedefitem',
    dispatch_uid='specify.reparent_taxon_rank_children_before_delete',
)
def reparent_taxon_rank_children_before_delete(rank):
    """Reparent surviving children only when the rank is actually deleted."""
    if getattr(rank, '_taxon_rank_delete_from_tree', False):
        return

    deleting_rank_ids = getattr(rank, '_taxon_rank_deleting_ids', {rank.id})
    parent_id = rank.parent_id
    while parent_id in deleting_rank_ids:
        parent_id = (
            rank.__class__.objects.using(rank._state.db)
            .filter(id=parent_id)
            .values_list('parent_id', flat=True)
            .first()
        )
    if rank.parent_id in deleting_rank_ids:
        rank.__class__.objects.using(rank._state.db).filter(id=rank.id)\
            .update(parent_id=parent_id)
    rank.__class__.objects.using(rank._state.db).filter(parent_id=rank.id)\
        .exclude(id__in=deleting_rank_ids)\
        .update(parent_id=parent_id)

# @orm_signal_handler('pre_save')
def pre_tree_rank_initiation_handler(sender, obj):
    if is_treedefitem(obj) and obj.pk is None: # is it a treedefitem? 
        if obj.pk is None: # is it a new object?
            pre_tree_rank_init(obj)
            verify_rank_parent_chain_integrity(obj, RankOperation.CREATED)
        else:
            verify_rank_parent_chain_integrity(obj, RankOperation.UPDATED)

# @orm_signal_handler('post_save')
def post_tree_rank_initiation_handler(sender, obj, created):
    if is_treedefitem(obj) and created: # is it a treedefitem?
        post_tree_rank_save(sender, obj)

@orm_signal_handler('pre_delete')
def cannot_delete_root_treedefitem(sender, obj):
    pass
    # if is_treedefitem(obj):  # is it a treedefitem?
    #     if sender.objects.get(id=obj.id).parent is None:
    #         raise TreeBusinessRuleException(
    #             "cannot delete root level tree definition item",
    #             {"tree": obj.__class__.__name__,
    #              "localizationKey": 'deletingTreeRoot',
    #              "node": {
    #                  "id": obj.id
    #              }})
        # pre_tree_rank_deletion(sender, obj)
        # verify_rank_parent_chain_integrity(obj, RankOperation.DELETED)

# @orm_signal_handler('post_delete')
def post_tree_rank_deletion_handler(sender, obj):
    if is_treedefitem(obj): # is it a treedefitem?
        post_tree_rank_deletion(obj)

@orm_signal_handler('pre_save')
def set_is_accepted_if_preferred(sender, obj):
    if hasattr(obj, 'isaccepted') and hasattr(obj, 'accepted_id') :
        obj.isaccepted = obj.accepted_id == None
