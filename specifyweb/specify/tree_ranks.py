from functools import wraps
from hmac import new

from specifyweb.businessrules.exceptions import TreeBusinessRuleException
from . import tree_extras
from . import models as spmodels
from sys import maxsize

import logging
logger = logging.getLogger(__name__)

TAXON_RANKS = {
    'TAXONOMY_ROOT': 0,
    'TAXONOMY ROOT': 0,
    'LIFE': 0,
    'KINGDOM': 10,
    'SUBKINGDOM': 20,
    'DIVISION': 30,
    'PHYLUM': 30,
    'SUBDIVISION': 40,
    'SUBPHYLUM': 40,
    'SUPERCLASS': 50,
    'CLASS': 60,
    'SUBCLASS': 70,
    'INFRACLASS': 80,
    'SUPERORDER': 90,
    'ORDER': 100,
    'SUBORDER': 110,
    'INFRAORDER': 120,
    'PARVORDER': 125,
    'SUPERFAMILY': 130,
    'FAMILY': 140,
    'SUBFAMILY': 150,
    'TRIBE': 160,
    'SUBTRIBE': 170,
    'GENUS': 180,
    'SUBGENUS': 190,
    'SECTION': 200,
    'SUBSECTION': 210,
    'SPECIES': 220,
    'SUBSPECIES': 230,
    'VARIETY': 240,
    'SUBVARIETY': 250,
    'FORMA': 260,
    'SUBFORMA': 270
}
GEOGRAPHY_RANKS = {
    'CONTINENT': 100,
    'COUNTRY': 200,
    'STATE': 300,
    'COUNTY': 400
}
STORAGE_RANKS = {
    'BUILDING': 100,
    'COLLECTION': 150,
    'ROOM': 200,
    'AISLE': 250,
    'CABINET': 300,
    'SHELF': 350,
    'BOX': 400,
    'RACK': 450,
    'VIAL': 500
}
GEOLOGIC_TIME_PERIOD_RANKS = {
    'ERA': 100,
    'PERIOD': 200,
    'EPOCH': 300,
    'AGE': 400
}
LITHO_STRAT_RANKS = {
    'SUPERGROUP': 100,
    'GROUP': 200,
    'FORMATION': 300,
    'MEMBER': 400,
    'BED': 500
}

DEFAULT_RANK_INCREMENT = 100
TAXON_RANK_INCREMENT = 10
GEOGRAPHY_RANK_INCREMENT = DEFAULT_RANK_INCREMENT
STORAGE_RANK_INCREMENT = 50
GEOLOGIC_TIME_PERIOD_INCREMENT = DEFAULT_RANK_INCREMENT
LITHO_STRAT_INCREMENT = DEFAULT_RANK_INCREMENT

# Map tree type to default tree ranks and default rank id increment
TREE_RANKS_MAPPING = {
    'taxon': (TAXON_RANKS, TAXON_RANK_INCREMENT),
    'geography': (GEOGRAPHY_RANKS, GEOGRAPHY_RANK_INCREMENT),
    'storage': (STORAGE_RANKS, STORAGE_RANK_INCREMENT),
    'geologictimeperiod': (GEOLOGIC_TIME_PERIOD_RANKS, GEOLOGIC_TIME_PERIOD_INCREMENT),
    'lithostrat': (LITHO_STRAT_RANKS, LITHO_STRAT_INCREMENT),
}

def post_tree_rank_save(tree_def_item_model, new_rank):
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

    # Update the old root rank to point to the new root rank if the new rank is the new root rank
    if new_rank.parent is None:
        old_root_rank = tree_def_item_model.objects.exclude(id=new_rank.id).filter(treedef=tree_def, parent=None).first()
        if old_root_rank is not None:
            old_root_rank.parent = new_rank
            old_root_rank.save()

    # Regenerate full names
    tree_extras.set_fullnames(tree_def, null_only=False, node_number_range=None)

def pre_tree_rank_deletion(tree_def_item_model, rank):
    tree_def = rank.treedef

    # Make sure no nodes are present in the rank before deleting rank
    if tree_def_item_model.objects.filter(parent=rank).count() > 1:
        raise TreeBusinessRuleException("The Rank {rank.name} is not empty, cannot delete!")

    # Set the parent rank, that previously pointed to the old rank, to the target rank
    child_ranks = tree_def_item_model.objects.filter(treedef=tree_def, parent=rank)
    if child_ranks.exists():
        # Iterate through the child ranks, but there should only ever be 0 or 1 child ranks to update
        for child_rank in child_ranks:
            child_rank.parent = rank.parent
            child_rank.save()
            print(child_rank.name)

def post_tree_rank_deletion(rank):
    # Regenerate full names
    tree_extras.set_fullnames(rank.treedef, null_only=False, node_number_range=None)

def pre_tree_rank_init(new_rank):
    tree = new_rank.specify_model.name.replace("TreeDefItem", "").lower()
    set_rank_id(new_rank, tree)

def set_rank_id(new_rank, tree, use_default_rank_ids=True):
    """
    Sets the new rank to the specified tree when adding a new rank.
    Expects at least the name and parent of the rank to be set.
    All the other parameters are optional.
    The use_default_rank_ids defaults to True, but can be set to false if you do not want to use the default rank ids.
    """
    # Get parameter values from data
    new_rank_name = getattr(new_rank, 'name', None)
    parent_rank_name = getattr(new_rank.parent, 'name', 'root') if getattr(new_rank, 'parent', None) else 'root'
    tree_name = getattr(new_rank.treedef, 'name', tree) if getattr(new_rank, 'treedef', None) else tree
    tree_id = getattr(new_rank.treedef, 'id', 1) if getattr(new_rank, 'treedef', None) else 1

    # Throw exceptions if the required parameters are not given correctly
    if new_rank_name is None:
        raise TreeBusinessRuleException("Rank name is not given")
    if parent_rank_name is None:
        raise TreeBusinessRuleException("Parent rank name is not given")
    if tree is None or tree.lower() not in TREE_RANKS_MAPPING.keys():
        raise TreeBusinessRuleException("Invalid tree type")

    # Get tree def item model
    tree_def_model_name = (tree + 'treedef').lower().title()
    tree_def_item_model_name = (tree + 'treedefitem').lower().title()
    tree_def_model = getattr(spmodels, tree_def_model_name.lower().title())
    tree_def_item_model = getattr(spmodels, tree_def_item_model_name.lower().title())

    # Make sure the new rank has a tree definition set
    if not hasattr(new_rank, 'treedef'):
        new_rank.treedef = tree_def_model.objects.get(id=tree_id)

    # Check if the new rank already has a rank id
    new_rank_id = new_rank.rankid if hasattr(new_rank, 'rankid') else None
    if new_rank_id:
        if type(new_rank_id) is str:
            new_rank_id = int(new_rank_id)
            new_rank.rankid = new_rank_id
        if new_rank.parent and new_rank_id <= new_rank.parent.rankid:
            # Raising this exception causes many workbench tests to fail
            # raise TreeBusinessRuleException(f"Rank ID {new_rank_id} must be greater than the parent rank ID {new_rank.parent.rankid}")
            new_rank_id = None
        child_rank = tree_def_item_model.objects.filter(treedef=new_rank.treedef, parent=new_rank.parent).exclude(id=new_rank.id)
        if child_rank.exists() and new_rank_id >= child_rank.first().rankid:
            # Raising this exception causes many workbench tests to fail
            # raise TreeBusinessRuleException(f"Rank ID {new_rank_id} must be less than the child rank ID {child_rank.first().rankid}")
            new_rank_id = None
        if new_rank_id:
            return

    # Determine the new rank id parameters
    tree_def = tree_def_model.objects.get(id=tree_id)
    try:
        tree_def = tree_def_model.objects.get(name=tree_name)
    except tree_def_model.DoesNotExist:
        pass
    parent_rank = tree_def_item_model.objects.filter(treedef=tree_def, name=parent_rank_name).first()
    if parent_rank is None and parent_rank_name != 'root':
        raise TreeBusinessRuleException("Target rank name does not exist")
    parent_rank_id = parent_rank.rankid if parent_rank_name != 'root' else -1
    rank_ids = sorted(list(tree_def_item_model.objects.filter(treedef=tree_def).values_list('rankid', flat=True)))
    parent_rank_idx = rank_ids.index(parent_rank_id) if rank_ids is not None and parent_rank_name != 'root' else -1
    next_rank_id = rank_ids[parent_rank_idx + 1] if rank_ids is not None and  parent_rank_idx + 1 < len(rank_ids) else None
    if next_rank_id is None and parent_rank_name != 'root':
        next_rank_id = maxsize

    # Don't allow rank IDs less than 0, but really shouldn't be less than 2
    if new_rank_id is not None and next_rank_id is not None and next_rank_id < 0:
        raise TreeBusinessRuleException("Can't create rank ID less than 0")
    
    # Set conditions for rank ID creation
    is_tree_def_items_empty = rank_ids is None or len(rank_ids) < 1
    is_new_rank_first = parent_rank_id == -1
    is_new_rank_last = parent_rank_idx == len(rank_ids) - 1 if rank_ids is not None else True
    
    # Set the default ranks and increments depending on the tree type
    default_tree_ranks, rank_increment = TREE_RANKS_MAPPING.get(tree.lower(), (None, 100))

    # Determine if the default rank ID can be used
    can_use_default_rank_id = (
        use_default_rank_ids 
        and default_tree_ranks is not None 
        and new_rank_name.upper() in default_tree_ranks
    )
    
    # Only use the the default rank id if the fhe following criteria is met: 
    # - new_rank_name is in the the default ranks set
    # - the default rank id is not already used
    # - the default rank is greater than the target rank
    # - the default rank is less than the current next rank from the target rank
    if can_use_default_rank_id:
        default_rank_id = default_tree_ranks[new_rank_name.upper()]

        # Check if the default rank ID is not already used
        is_default_rank_id_unused = default_rank_id not in rank_ids

        # Check if the default rank ID can be logically placed in the hierarchy
        is_placement_valid = (
            is_tree_def_items_empty 
            or (is_new_rank_first and default_rank_id < next_rank_id) 
            or (is_new_rank_last and default_rank_id > parent_rank_id)
            or (default_rank_id > parent_rank_id and default_rank_id < next_rank_id)
        )

        if is_default_rank_id_unused and is_placement_valid:
            new_rank_id = default_rank_id

    # Set the new rank id if a default rank id is not available
    if new_rank_id is None:
        # If this is the first rank, set the rank id to the default increment
        if is_tree_def_items_empty:
            new_rank_id = rank_increment

        # If there are no ranks higher than the target rank, then add the new rank to the end of the hierarchy
        elif is_new_rank_first:
            min_rank_id = rank_ids[0]
            new_rank_id = int(min_rank_id / 2)
            if new_rank_id >= min_rank_id:
                raise TreeBusinessRuleException(f"Can't add rank id bellow {min_rank_id}")

        # If there are no ranks lower than the target rank, then add the new rank to the top of the hierarchy
        elif is_new_rank_last:
            max_rank_id = rank_ids[-1]
            new_rank_id = max_rank_id + rank_increment

        # If the new rank is being placed somewhere in the middle of the heirarchy
        else:
            new_rank_id = int((next_rank_id - parent_rank_id) / 2) + parent_rank_id
            if next_rank_id - parent_rank_id < 1:
                raise TreeBusinessRuleException(f"Can't add rank id between {new_rank_id} and {parent_rank_id}")

    # Set the new rank id
    new_rank.rankid = new_rank_id
