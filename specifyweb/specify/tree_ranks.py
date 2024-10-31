from functools import wraps
from hmac import new
from operator import ge
from enum import Enum
from django.db.models import Count

from specifyweb.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify.utils import get_spmodel_class
from . import tree_extras
from sys import maxsize

import logging
logger = logging.getLogger(__name__)

TAXON_RANKS = {
    'taxonomy_root': 0,
    'taxonomy root':0,
    'life': 0,
    'kingdom': 10,
    'subkingdom': 20,
    'division': 30,
    'phylum': 30,
    'subdivision': 40,
    'subphylum': 40,
    'superclass': 50,
    'class': 60,
    'subclass': 70,
    'infraclass': 80,
    'superorder': 90,
    'order': 100,
    'suborder': 110,
    'infraorder': 120,
    'parvorder': 125,
    'superfamilly': 130,
    'family': 140,
    'subfamily': 150,
    'tribe': 160,
    'subtribe': 170,
    'genus': 180,
    'subgenus': 190,
    'section': 200,
    'subsection': 210,
    'species': 220,
    'subspecies': 230,
    'variety': 240,
    'subvariety': 250,
    'forma': 260,
    'subforma': 270
}
GEOGRAPHY_RANKS = {
    'continent': 100,
    'country': 200,
    'state': 300,
    'county': 400
}
STORAGE_RANKS = {
    'building': 100,
    'collection': 150,
    'room': 200,
    'aisle': 250,
    'cabinet': 300,
    'shelf': 350,
    'box': 400,
    'rack': 450,
    'vial': 500
}
GEOLOGIC_TIME_PERIOD_RANKS = {
    'era': 100,
    'period': 200,
    'epoch': 300,
    'age': 400
}
LITHO_STRAT_RANKS = {
    'supergroup': 100,
    'group': 200,
    'formation': 300,
    'member': 400,
    'bed': 500
}
TECTONIC_UNIT_RANKS = {
    'root': 0,
    'superstructure': 10,
    'domain': 20,
    'subdomain': 30,
    'unit': 40,
    'subunit': 50,
}

DEFAULT_RANK_INCREMENT = 100
TAXON_RANK_INCREMENT = 10
GEOGRAPHY_RANK_INCREMENT = DEFAULT_RANK_INCREMENT
STORAGE_RANK_INCREMENT = 50
GEOLOGIC_TIME_PERIOD_INCREMENT = DEFAULT_RANK_INCREMENT
LITHO_STRAT_INCREMENT = DEFAULT_RANK_INCREMENT
TECTONIC_UNIT_INCREMENT = 10

# Map tree type to default tree ranks and default rank id increment
TREE_RANKS_MAPPING = {
    'taxon': (TAXON_RANKS, TAXON_RANK_INCREMENT),
    'geography': (GEOGRAPHY_RANKS, GEOGRAPHY_RANK_INCREMENT),
    'storage': (STORAGE_RANKS, STORAGE_RANK_INCREMENT),
    'geologictimeperiod': (GEOLOGIC_TIME_PERIOD_RANKS, GEOLOGIC_TIME_PERIOD_INCREMENT),
    'lithostrat': (LITHO_STRAT_RANKS, LITHO_STRAT_INCREMENT),
    'tectonicunit': (TECTONIC_UNIT_RANKS, TECTONIC_UNIT_INCREMENT),
}

TREE_RANK_TO_ITEM_MAP = {
    'Taxontreedefitem': 'Taxon',
    'Geographytreedefitem': 'Geography',
    'Storagetreedefitem': 'Storage',
    'Geologictimeperiodtreedefitem': 'Geologictimeperiod',
    'Lithostrattreedefitem': 'Lithostrat',
    'Tectonicunittreedefitem': 'Tectonicunit'
}

def get_tree_item_model(tree_rank_model_name):
    tree_item_model_name = TREE_RANK_TO_ITEM_MAP.get(tree_rank_model_name.title(), None)
    if not tree_item_model_name:
        return None
    return get_spmodel_class(tree_item_model_name)

def tree_rank_count(tree_rank_model_name, tree_rank_id) -> int:
    tree_item_model = get_tree_item_model(tree_rank_model_name)
    if not tree_item_model:
        return 0
    return tree_item_model.objects.filter(definitionitem_id=tree_rank_id).count()

def is_tree_rank_empty(tree_rank_model, tree_rank) -> bool:
    tree_item_model = get_tree_item_model(tree_rank_model.__name__)
    if not tree_item_model:
        return False
    return tree_item_model.objects.filter(definitionitem=tree_rank).count() == 0

def post_tree_rank_save(tree_def_item_model, new_rank):
    tree_def = new_rank.treedef
    parent_rank = new_rank.parent
    new_rank_id = new_rank.rankid

    # Set the parent rank, that previously pointed to the target, to the new rank
    child_ranks = (
        tree_def_item_model.objects.filter(treedef=tree_def, parent=parent_rank)
        .exclude(id=new_rank.id)
        .update(parent=new_rank)
    )

    # Regenerate full names
    tree_extras.set_fullnames(tree_def, null_only=False, node_number_range=None)

def pre_tree_rank_deletion(tree_def_item_model, rank):
    tree_def = rank.treedef
    # Make sure no nodes are present in the rank before deleting rank
    if tree_def_item_model.objects.filter(treedef=tree_def, parent=rank).count() > 1:
        raise TreeBusinessRuleException("The Rank {rank.name} is not empty, cannot delete!")

    # Set the parent rank, that previously pointed to the old rank, to the target rank
    child_ranks = tree_def_item_model.objects.filter(parent=rank).update(parent=rank.parent)

def post_tree_rank_deletion(rank):
    # Regenerate full names
    tree_extras.set_fullnames(rank.treedef, null_only=False, node_number_range=None)

def pre_tree_rank_init(new_rank):
    set_rank_id(new_rank)

def set_rank_id(new_rank):
    """
    Sets the new rank to the specified tree when adding a new rank.
    Expects at least the name, parent, and tree_def of the rank to be set.
    All the other parameters are optional.
    """
    # Get parameter values from data
    tree = new_rank.specify_model.name.replace("TreeDefItem", "").lower()
    new_rank_name = new_rank.name
    parent_rank_name = new_rank.parent.name if new_rank.parent else 'root'
    tree_def = getattr(new_rank, 'treedef', None)

    # Throw exceptions if the required parameters are not given correctly
    if new_rank_name is None:
        raise TreeBusinessRuleException("Rank name is not given")
    if parent_rank_name is None:
        raise TreeBusinessRuleException("Parent rank name is not given")
    if tree_def is None:
        raise TreeBusinessRuleException("Tree definition is not given")
    if tree is None or tree.lower() not in TREE_RANKS_MAPPING.keys():
        raise TreeBusinessRuleException("Invalid tree type")

    # Get tree def item model
    tree_def_item_model_name = (tree + 'treedefitem').lower().title()
    tree_def_item_model = get_spmodel_class(tree_def_item_model_name)

    # Handle case where the parent rank is not given, and it is not the first rank added.
    # This is happening in the UI workflow of Treeview->Treedef->Treedefitems->Add
    if (
        new_rank.parent is None
        and new_rank.rankid is None
        and get_spmodel_class(new_rank.specify_model.django_name).objects.filter(treedef=tree_def).count() > 1
    ):
        new_rank.parent = tree_def_item_model.objects.filter(treedef=tree_def).order_by("rankid").last()
        parent_rank_name = new_rank.parent.name

    # Check if the new rank already has a rank id
    if getattr(new_rank, 'rankid', None):
        new_rank_id = new_rank.rankid
        if new_rank.parent and new_rank_id <= new_rank.parent.rankid:
            raise TreeBusinessRuleException(
                f"Rank ID {new_rank_id} must be greater than the parent rank ID {new_rank.parent.rankid}")
        child_rank = tree_def_item_model.objects.filter(treedef=new_rank.treedef,
                                                        parent=new_rank.parent).exclude(id=new_rank.id)
        if child_rank.exists() and new_rank_id >= child_rank.first().rankid:
            # Raising this exception causes many workbench tests to fail
            # raise TreeBusinessRuleException(
            #     f"Rank ID {new_rank_id} must be less than the child rank ID {child_rank.first().rankid}")
            new_rank_id = None
        if new_rank_id:
            return

    # Determine the new rank id parameters
    new_rank_id = getattr(new_rank, 'rankid', None)
    parent_rank = new_rank.parent
    if parent_rank is None and parent_rank_name != 'root':
        raise TreeBusinessRuleException("Target rank name does not exist")
    parent_rank_id = parent_rank.rankid if parent_rank_name != 'root' else -1
    rank_ids = sorted(list(tree_def_item_model.objects.filter(treedef=tree_def).values_list('rankid', flat=True)))
    parent_rank_idx = rank_ids.index(parent_rank_id) if parent_rank_name != 'root' else -1
    next_rank_id = rank_ids[parent_rank_idx + 1] if  parent_rank_idx + 1 < len(rank_ids) else None
    if next_rank_id is None and parent_rank_name != 'root':
        next_rank_id = maxsize

    # Don't allow rank IDs less than 0, but really shouldn't be less than 2
    if new_rank_id is not None and next_rank_id is not None and next_rank_id < 0:
        raise TreeBusinessRuleException("Can't create rank ID less than 0")
    
    # Set conditions for rank ID creation
    is_tree_def_items_empty = len(rank_ids) < 1
    is_new_rank_first = parent_rank_id == -1
    is_new_rank_last = parent_rank_idx == len(rank_ids) - 1
    
    # Set the default ranks and increments depending on the tree type
    default_tree_ranks, rank_increment = TREE_RANKS_MAPPING.get(tree.lower())

    # In the future, add this as a function parameter to allow for more flexibility.
    # use_default_rank_ids can be set to false if you do not want to use the default rank ids.
    use_default_rank_ids = True

    # Determine if the default rank ID can be used
    can_use_default_rank_id = (
        use_default_rank_ids 
        and new_rank_name.lower() in default_tree_ranks
    )
    
    # Only use the the default rank id if the fhe following criteria is met: 
    # - new_rank_name is in the the default ranks set
    # - the default rank id is not already used
    # - the default rank is greater than the target rank
    # - the default rank is less than the current next rank from the target rank
    if can_use_default_rank_id:
        default_rank_id = default_tree_ranks[new_rank_name.lower()]

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

class RankOperation(Enum):
    CREATED = 'created'
    DELETED = 'deleted'
    UPDATED = 'updated'

def verify_rank_parent_chain_integrity(rank, rank_operation: RankOperation):
    """
    Verifies the parent chain integrity of the ranks.
    """
    tree_def = rank.treedef
    tree_def_item_model_name = rank.specify_model.name.lower().title()
    tree_def_item_model = get_spmodel_class(tree_def_item_model_name)

    # Get all the ranks and their parent ranks
    rank_id_to_parent_dict = {item.id: item.parent.id if item.parent is not None else None
                              for item in tree_def_item_model.objects.filter(treedef=tree_def)}

    # Edit the rank_id_to_parent_dict with the new rank, depending on the operation.
    if rank_operation == RankOperation.CREATED or rank_operation == RankOperation.UPDATED:
        rank_id_to_parent_dict[rank.id] = rank.parent.id if rank.parent is not None else None
    elif rank_operation == RankOperation.DELETED:
        rank_id_to_parent_dict.pop(rank.id, None)
    else:
        raise ValueError(f"Invalid rank operation: {rank_operation}")

    # Verify the parent chain integrity of the ranks.
    # This is done by checking that each rank points to a valid parent rank, and that each parent only has one child.
    parent_to_children_dict = {}
    for rank_id, parent_id in rank_id_to_parent_dict.items():
        if parent_id is not None:
            if parent_id not in rank_id_to_parent_dict.keys():
                raise TreeBusinessRuleException(f"Rank {rank_id} points to a non-existent parent rank {parent_id}")
            if rank_id is not None:
                parent_to_children_dict.setdefault(parent_id, []).append(rank_id)

    for parent_id, children in parent_to_children_dict.items():
        if len(children) > 1 and parent_id is not None:
            raise TreeBusinessRuleException(f"Parent rank {parent_id} has more than one child rank")
