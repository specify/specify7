from typing import TypedDict, Any

from django.db.models import Q, Model, Prefetch

import specifyweb.specify.models as spmodels
from specifyweb.specify.datamodel import datamodel, Table
from specifyweb.specify.api.serializers import obj_to_data

import logging
logger = logging.getLogger(__name__)

lookup = lambda tree: (tree.lower() + 'treedef')

SPECIFY_TREES = {"taxon", "storage", "geography", "geologictimeperiod", "lithostrat", 'tectonicunit'}

TREE_ROOT_NODES = {
    'taxon': 'Life',
    'storage': 'Root',
    'geography': "Earth",
    'geologictimeperiod': 'Time',
    'lithostrat': 'Earth',
    'tectonicunit': 'Root'
}

TREE_NAMES = {
    'taxon': 'Taxon',
    'storage': 'Storage',
    'geography': "Geography",
    'geologictimeperiod': 'Chronostratigraphy',
    'lithostrat': 'Lithostratigraphy',
    'tectonicunit': 'Tectonic Unit'
}

DISCIPLINE_TREE_MODELS = (
    spmodels.Geographytreedef,
    spmodels.Geologictimeperiodtreedef,
    spmodels.Lithostrattreedef,
    spmodels.Taxontreedef,
    spmodels.Tectonicunittreedef,
)

def get_search_filters(collection: spmodels.Collection, tree: str):
    tree_name = tree.lower()
    if tree_name not in SPECIFY_TREES:
        raise ValueError(f"unexpected tree type: {tree}")
    if tree_name == 'storage':
        return Q(institution=collection.discipline.division.institution)
    discipline_query = Q(discipline=collection.discipline)
    if tree_name == 'taxon':
        discipline_query |= Q(
            # TEST: should this only be added if discipline is null?
            cotypes__collection=collection
            )
    tree_at_discipline = getattr(collection.discipline, lookup(tree))
    if tree_at_discipline:
        discipline_query |= Q(id=tree_at_discipline.id)
    return discipline_query

class TreeInformation(TypedDict):
    definition: dict
    ranks: list[dict]

def get_tree_defs_in_collection(collection: spmodels.Collection, tree_name: str, tree_def_filters: dict[str, Any] | None = None) -> list[TreeInformation]:
    if tree_name.lower() not in SPECIFY_TREES:
        raise ValueError(f"unexpected tree type: {tree_name}")

    tree_table = datamodel.get_table_strict(lookup(tree_name))
    # BUG: prefer get_model here in case a tree is defined in an app that is
    # not 'specify'
    tree_model: Model = getattr(spmodels, tree_table.django_name)
    scoping_filters = get_search_filters(collection, tree_name)
    # REFACTOR: prefer using string lookup with tree + 'treedefitem' lookup?
    # the .field accesses the FK on the TreeDef model, and the .model retreives
    # its related model (the TreeDefItem)
    tree_rank_model = tree_model.treedefitems.field.model
    rank_prefetch = Prefetch(
        'treedefitems',
        queryset=tree_rank_model.objects.order_by('rankid'),
        to_attr='ordered_ranks'
    )
    tree_defs_query = tree_model.objects.prefetch_related(rank_prefetch).filter(scoping_filters)
    if tree_def_filters is not None:
        tree_defs_query.filter(tree_def_filters)
    result = []
    for definition in tree_defs_query:
        ranks = definition.ordered_ranks
        serialized_tree_info = {
            'definition': obj_to_data(definition),
            'ranks': [obj_to_data(rank) for rank in ranks]
        }
        result.append(serialized_tree_info)
    return result

def get_default_treedef(table: Table, collection):
    if table.name.lower() not in SPECIFY_TREES:
        raise Exception(f"unexpected tree type: {table.name}")
    
    if table.name == 'Taxon':
        return collection.discipline.taxontreedef

    elif table.name == "Geography":
        return collection.discipline.geographytreedef

    elif table.name == "LithoStrat":
        return collection.discipline.lithostrattreedef

    elif table.name == "GeologicTimePeriod":
        return collection.discipline.geologictimeperiodtreedef

    elif table.name == "Storage":
        return collection.discipline.division.institution.storagetreedef

    elif table.name == 'TectonicUnit':
        return collection.discipline.tectonicunittreedef
    
    return None

def get_treedefitem_model(tree: str):
    return getattr(spmodels, tree.lower().title() + 'treedefitem')

def get_treedef_model(tree: str):
    return getattr(spmodels, tree.lower().title() + 'treedef')

def get_models(name: str):
    tree_def_model = get_treedef_model(name)
    tree_rank_model = get_treedefitem_model(name)
    tree_node_model = getattr(spmodels, name.lower().title())
    
    return tree_def_model, tree_rank_model, tree_node_model

