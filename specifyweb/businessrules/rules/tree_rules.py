import logging

from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify.tree_extras import is_instance_of_tree_def_item
from specifyweb.specify.tree_ranks import *

logger = logging.getLogger(__name__)

@orm_signal_handler('pre_save')
def pre_tree_rank_initiation_handler(sender, obj):
    if is_instance_of_tree_def_item(obj): # is it a treedefitem?
        if obj.pk is None:
            pre_tree_rank_init(sender, obj)
        else:
            # pre_tree_rank_update(sender, obj)
            pass

# @orm_signal_handler('post_init')
@orm_signal_handler('post_save')
def post_tree_rank_initiation_handler(sender, obj):
    if hasattr(obj, 'treedef'): # is it a treedefitem?
        post_tree_rank_save(sender, obj)

@orm_signal_handler('pre_delete')
def cannot_delete_root_treedefitem(sender, obj):
    if hasattr(obj, 'treedef'):  # is it a treedefitem?
        if sender.objects.get(id=obj.id).parent is None:
            raise TreeBusinessRuleException(
                "cannot delete root level tree definition item",
                {"tree": obj.__class__.__name__,
                 "localizationKey": 'deletingTreeRoot',
                 "node": {
                     "id": obj.id
                 }})
        pre_tree_rank_deletion(sender, obj)

@orm_signal_handler('post_delete')
def post_tree_rank_deletion_handler(sender, obj):
    if hasattr(obj, 'treedef'): # is it a treedefitem?
        post_tree_rank_deletion(obj)

@orm_signal_handler('pre_save')
def set_is_accepted_if_prefereed(sender, obj):
    if hasattr(obj, 'isaccepted'):
        obj.isaccepted = obj.accepted_id == None


    