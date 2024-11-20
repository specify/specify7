import logging

from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify.tree_extras import is_treedefitem
from specifyweb.specify.tree_ranks import *

logger = logging.getLogger(__name__)

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
    if is_treedefitem(obj):  # is it a treedefitem?
        pass
#         if sender.objects.get(id=obj.id).parent is None:
#             raise TreeBusinessRuleException(
#                 "cannot delete root level tree definition item",
#                 {"tree": obj.__class__.__name__,
#                  "localizationKey": 'deletingTreeRoot',
#                  "node": {
#                      "id": obj.id
#                  }})
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

