import logging

from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify import tree_extras

logger = logging.getLogger(__name__)

# @orm_signal_handler('post_init')
@orm_signal_handler('post_save')
def post_tree_rank_initiation_handler(sender, obj):
    if hasattr(obj, 'treedef'): # is it a treedefitem?
        post_tree_rank_initiation(sender, obj)

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

def post_tree_rank_initiation(tree_def_item_model, new_rank):
    tree_def = new_rank.treedef
    parent_rank = new_rank.parent
    new_rank_id = new_rank.rankid

    # Set the parent rank, that previously pointed to the target, to the new rank
    child_ranks = tree_def_item_model.objects.filter(treedef=tree_def, parent=parent_rank).exclude(rankid=new_rank_id)
    if child_ranks.exists():
        # Iterate through the child ranks, but there should only ever be 0 or 1 child ranks to update
        for child_rank in child_ranks:
            child_rank.parent = new_rank 
            child_rank.save()

    # Regenerate full names
    tree_extras.set_fullnames(tree_def, null_only=False, node_number_range=None)

def pre_tree_rank_deletion(tree_def_item_model, rank):
    tree_def = rank.treedef

    # Make sure no nodes are present in the rank before deleting rank
    rank = tree_def_item_model.objects.get(name=rank.name)
    if tree_def_item_model.objects.filter(parent=rank).count() > 1:
        raise TreeBusinessRuleException(
            "The Rank is not empty, cannot delete!",
            {"tree": rank.treedef.__class__.__name__,
             "localizationKey": 'deletingTreeRank',
             "node": {
                 "id": rank.id
             }})

    # Set the parent rank, that previously pointed to the old rank, to the target rank
    child_ranks = tree_def_item_model.objects.filter(treedef=tree_def, parent=rank)
    if child_ranks.exists():
        # Iterate through the child ranks, but there should only ever be 0 or 1 child ranks to update
        for child_rank in child_ranks:
            child_rank.parent = rank.parent
            child_rank.save()

def post_tree_rank_deletion(rank):
    # Regenerate full names
    tree_extras.set_fullnames(rank.treedef, null_only=False, node_number_range=None)
    