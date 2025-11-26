from django.db import transaction
from django.db.models import Model as DjangoModel
from typing import Type, Optional

from ..trees.utils import get_models

import logging
logger = logging.getLogger(__name__)

def create_default_tree(name: str, kwargs: dict, ranks: dict, preload_tree: Optional[str]):
    """Creates an initial empty tree. This should not be used outside of the initial database setup."""
    with transaction.atomic():
        tree_def_model, tree_rank_model, tree_node_model = get_models(name)

        if tree_def_model.objects.count() > 0:
            raise RuntimeError(f'Tree {name} already exists, cannot create default.')

        # Create tree definition
        treedef = tree_def_model.objects.create(
            name=name,
            **kwargs,
        )

        # Create tree ranks
        previous_tree_def_item = None
        rank_list = list(int(rank_id) for rank_id, enabled in ranks.items() if enabled)
        rank_list.sort()
        for rank_id in rank_list:
            previous_tree_def_item = tree_rank_model.objects.create(
                treedef=treedef,
                name=str(rank_id), # TODO: allow rank name configuration
                rankid=rank_id,
                parent=previous_tree_def_item,
            )
        root_tree_def_item, create = tree_rank_model.objects.get_or_create(
            treedef=treedef,
            rankid=0
        )

        # Create root node
        # TODO: Avoid having duplicated code from add_root endpoint
        root_node = tree_node_model.objects.create(
            name="Root",
            isaccepted=1,
            nodenumber=1,
            rankid=0,
            parent=None,
            definition=treedef,
            definitionitem=root_tree_def_item,
            fullname="Root"
        )

        # TODO: Preload tree
        if preload_tree is not None:
            pass

        return treedef
    
def update_tree_scoping(treedef: Type[DjangoModel], discipline_id: int):
    """Trees may be created before a discipline is created. This will update their discipline."""
    setattr(treedef, "discipline_id", discipline_id)
    treedef.save(update_fields=["discipline_id"])