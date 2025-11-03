from django.db import transaction
from django.db.models import Model as DjangoModel
from typing import Type

from ..trees.utils import get_models

import logging
logger = logging.getLogger(__name__)

def create_default_tree(name: str, kwargs: dict, ranks: dict):
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
        treedefitems_bulk = []
        for rank_id, enabled in ranks.items():
            if enabled:
                treedefitems_bulk.append(
                    tree_rank_model(
                        treedef=treedef,
                        name=str(rank_id), # TODO: allow rank name configuration
                        rankid=int(rank_id),
                    )
                )
        if treedefitems_bulk:
            tree_rank_model.objects.bulk_create(treedefitems_bulk, ignore_conflicts=True)

        tree_def_item, create = tree_rank_model.objects.get_or_create(
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
            definitionitem=tree_def_item,
            fullname="Root"
        )

        return treedef
    
def update_tree_scoping(treedef: Type[DjangoModel], discipline_id: int):
    """Trees may be created before a discipline is created. This will update their discipline."""
    setattr(treedef, "discipline_id", discipline_id)
    treedef.save(update_fields=["discipline_id"])