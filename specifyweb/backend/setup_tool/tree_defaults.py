from django.db import transaction
from django.db.models import Model as DjangoModel
from typing import Type, Optional, List
from pathlib import Path

from .utils import load_json_from_file
from specifyweb.backend.trees.utils import initialize_default_tree

import logging
logger = logging.getLogger(__name__)

DEFAULT_TREE_RANKS_FILES = {
    'Storage': Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'storage_tree.json',
    'Geography': Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'geography_tree.json',
    'Taxon': Path(__file__).parent.parent.parent.parent / 'config' / 'mammal' / 'taxon_mammal_tree.json',
    'Geologictimeperiod': Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'geologictimeperiod_tree.json',
    'Lithostrat': Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'lithostrat_tree.json',
    'Tectonicunit': Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'tectonicunit_tree.json'
}

def create_default_tree(tree_type: str, kwargs: dict, user_rank_cfg: dict, preload_tree: Optional[str]):
    """Creates an initial empty tree. This should not be used outside of the initial database setup."""
    # Load all default ranks for this type of tree
    rank_data = load_json_from_file(DEFAULT_TREE_RANKS_FILES.get(tree_type))
    if rank_data is None:
        raise Exception(f'Could not load default rank JSON file for tree type {tree_type}.')

    # list[RankConfiguration]
    default_rank_cfg = rank_data.get('tree',{}).get('treedef',{}).get('levels')
    if default_rank_cfg is None:
        logger.debug(rank_data)
        raise Exception(f'No default ranks found in the {tree_type} rank JSON file.')

    # Override default configuration with user's configuration
    configurable_fields = {'title', 'enforced', 'infullname', 'fullnameseparator'}

    rank_cfg = []
    for rank in default_rank_cfg:
        name = rank.get('name', '').lower()
        user_rank = user_rank_cfg.get(name)

        # Initially assume all ranks should be included, except those explicitly set to False
        rank_included = not (user_rank == False)
        
        if isinstance(user_rank, dict):
            # The user configured this rank's properties
            rank_included = user_rank.get('include', True)

            for field in configurable_fields:
                rank[field] = user_rank.get(field, rank[field])
        
        if not rank_included:
            # The user disabled this rank.
            continue
        # Add this rank to the final rank configuration
        rank_cfg.append(rank)    

    if tree_type == 'Storage':
        discipline_or_institution = kwargs.get('institution')
    else:
        discipline_or_institution = kwargs.get('discipline')

    tree_def = initialize_default_tree(tree_type.lower(), discipline_or_institution, tree_type.title(), rank_cfg, kwargs['fullnamedirection'])

    # TODO: Preload tree
    # if preload_tree is not None:
    #     task_id = str(uuid4())
    #     create_default_tree_task.apply_async(
    #         args=[url, discipline.id, tree_discipline_name, request.specify_collection.id, request.specify_user.id, tree_cfg, row_count, tree_name],
    #         task_id=f"create_default_tree_{tree_discipline_name}_{task_id}",
    #         taskid=task_id
    #     )

    return tree_def
    
def update_tree_scoping(treedef: Type[DjangoModel], discipline_id: int):
    """Trees may be created before a discipline is created. This will update their discipline."""
    setattr(treedef, "discipline_id", discipline_id)
    treedef.save(update_fields=["discipline_id"])