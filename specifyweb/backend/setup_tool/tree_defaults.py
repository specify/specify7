from django.db.models import Model as DjangoModel
from typing import Type, Optional
from pathlib import Path
from uuid import uuid4
import requests

from .utils import load_json_from_file
from specifyweb.backend.trees.defaults import initialize_default_tree, create_default_tree_task

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
DEFAULT_TAXON_TREE_LIST_URL = 'https://files.specifysoftware.org/taxonfiles/taxonfiles.json'
DEFAULT_TREE_URLS = {
    'Geography': 'https://files.specifysoftware.org/geographyfiles/geonames.csv',
    'Geologictimeperiod': 'https://files.specifysoftware.org/chronostratfiles/GeologicTimePeriod.csv',
}
DEFAULT_TREE_MAPPING_URLS = {
    'Geography': 'https://files.specifysoftware.org/treerows/geography.json',
    'Geologictimeperiod': 'https://files.specifysoftware.org/treerows/geologictimeperiod.json',
}

def start_default_tree_from_configuration(tree_type: str, kwargs: dict, user_rank_cfg: dict):
    """Starts the creation of an initial empty tree. This should not be used outside of the initial database setup."""
    # Load all default ranks for this type of tree
    if tree_type == 'Taxon':
        discipline = kwargs.get('discipline')
        if discipline:
            taxon_tree_discipline = discipline.type
            rank_data = load_json_from_file(Path(__file__).parent.parent.parent.parent / 'config' / taxon_tree_discipline / f'taxon_{taxon_tree_discipline}_tree.json')
    if rank_data is None:
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
            rank_included = user_rank.get('include', False)

            for field in configurable_fields:
                rank[field] = user_rank.get(field, rank.get(field))
        
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

    return tree_def

def start_preload_default_tree(tree_type: str, discipline_id: Optional[int], collection_id: Optional[int], tree_def_id: int, specify_user_id: Optional[int], preload_file = None):
    """Starts a populated default tree import without user input."""
    try:
        # Tree download config:
        tree_discipline_name = tree_type.lower()
        tree_name = tree_type.title()
        row_count = 1000000 # dummy value, only to allow progress checking
        # Tree file urls
        url = DEFAULT_TREE_URLS.get(tree_type)
        mapping_url = DEFAULT_TREE_MAPPING_URLS.get(tree_type)

        if tree_type.lower() == 'taxon' and preload_file is not None:
            # Schema described in CreateTree.tsx
            logger.debug(f'Using tree configuration provided for taxon tree {tree_discipline_name}')
            url = preload_file.get('file')
            mapping_url = preload_file.get('mappingFile', preload_file.get('mappingfile'))
            tree_name = preload_file.get('title', tree_name)
            row_count = preload_file.get('rows', row_count)

        if not url or not mapping_url:
            logger.warning(f'Can\'t preload tree, no default tree URLs for {tree_discipline_name} tree.')
            return

        resp = requests.get(mapping_url)
        resp.raise_for_status()
        tree_cfg = resp.json()

        task_id = str(uuid4())
        create_default_tree_task.apply_async(
            args=[url, discipline_id, tree_discipline_name, collection_id, specify_user_id, tree_cfg, row_count, tree_name, tree_def_id],
            task_id=f"create_default_tree_{tree_type}_{task_id}",
            taskid=task_id
        )
    except Exception as e:
        # Give up if there's an error to avoid resetting the entire setup.
        logger.warning(f'Error trying to preload {tree_type} tree: {e}')
        return
    
def update_tree_scoping(treedef: Type[DjangoModel], discipline_id: int):
    """Trees may be created before a discipline is created. This will update their discipline."""
    setattr(treedef, "discipline_id", discipline_id)
    treedef.save(update_fields=["discipline_id"])