from typing import TypedDict, Any

from django.db.models import Q, Model, Prefetch

import specifyweb.specify.models as spmodels
from specifyweb.specify.datamodel import datamodel, Table
from specifyweb.specify.api.serializers import obj_to_data
from specifyweb.specify.utils.func import Func
from specifyweb.specify.api.crud import strict_get_model

import logging
logger = logging.getLogger(__name__)

treedef_lookup = lambda tree: (tree.lower() + 'treedef')
treedefitem_lookup = lambda tree: (tree.lower() + 'treedefitem')

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

def get_treedef_model(tree_name: str):
    tree_table = datamodel.get_table_strict(treedef_lookup(tree_name))
    # BUG: prefer get_model here in case a tree is defined in an app that is
    # not 'specify'
    tree_model: Model = strict_get_model(tree_table.django_name)
    return tree_model

def _get_treedef_filter_dict(collection: spmodels.Collection, tree: str) -> list[dict]:
    """
    Returns a dictonary of filters that can be passed to a TreeDef QuerySet.
    Each dictonary in the returned list is meant to be OR'd together.
    Example usage:
    ```py
    raw_filters = _get_treedef_filter_dict(collection, tree)
    q_objs = [Q(**filter_dict) for filter_dict in raw_filters]
    filters = reduce(lambda accum, curr: accum | curr, q_objs)

    scoped_trees = tree_model.objects.filter(filters)
    ```
    """
    tree_name = tree.lower()
    if tree_name not in SPECIFY_TREES:
        raise ValueError(f"unexpected tree type: {tree}")
    filters = []
    if tree_name == 'storage':
        filters.append({
            "institution": collection.discipline.division.institution
        })
        return filters
    filters.append({
        "discipline": collection.discipline
    })
    if tree_name == 'taxon':
        filters.append({
            "cotypes__collection": collection
        })
    tree_at_discipline = getattr(collection.discipline, treedef_lookup(tree))
    if tree_at_discipline:
        filters.append({
            "id": tree_at_discipline.id
        })
    return filters

def get_treedef_scope_filters(collection: spmodels.Collection, tree: str):
    initial_filters = _get_treedef_filter_dict(collection, tree)
    transformed_filters = [Q(**filter_dict) for filter_dict in initial_filters]
    filters = Func.make_ors(transformed_filters)
    return filters

def get_treedefitem_scope_filters(collection: spmodels.Collection, tree: str):
    """
    Returns a Q object that can be applied to a TreeDefItem QuerySet to scope
    the returned TreeDefItems to the respective collection
    """
    treedef_filters = _get_treedef_filter_dict(collection, tree)
    query_filter = Q()
    for treedef_filter in treedef_filters:
        q_obj = Q(**{
            f"treedef__{k}": v
            for k,v in treedef_filter.items()
        })
        query_filter |= q_obj
    return query_filter

class TreeInformation(TypedDict):
    # definition will be the serialized TreeDef
    definition: dict
    # ranks will be a list of serialized TreeDefItems, ordered by RankID
    # (ascending--lowest rank first)
    ranks: list[dict]

def get_tree_defs_in_collection(
        collection: spmodels.Collection,
        tree_name: str,
        tree_def_filters: dict[str, Any] | None = None,
        rank_filters: dict[str, Any] | None = None) -> list[TreeInformation]:
    """
    Given a particular Collection and tree name (Taxon, Storage, Geography,
    etc.), return information on each trees and their ranks within scope of the
    Collection (most of the time, this will be all trees within the
    Collection's Discipline).

    Additional filters can be directly passed to the TreeDef QuerySet in the
    form of a dict via tree_def_filters.
    Filters on the ranks for each tree can be passed in the form of a dict via
    rank_filters.
    Note that if a tree exists in scope but no ranks match the filters, the
    tree will still be returned, but ranks will be an empty list.
    
    e.g., to return all Taxon trees in the collection's scope created before
    2026:
    ```py
    get_tree_defs_in_collection(
        collection,
        "Taxon",
        {"timestampcreated__year__lt": 2026}
    )
    ```

    To return the Taxon trees and just the "Genus" rank for all Taxon trees in
    the collection's scope:
    ```py
    get_tree_defs_in_collection(
        collection=collection,
        tree_name="Taxon",
        rank_filters={"name": "Genus"}
    )
    ```
    """
    # REFACTOR: For flexibility, instead type tree_def_filters and rank_filters
    # as Q objects. Thus the caller can perform more advanced filtering.
    if tree_name.lower() not in SPECIFY_TREES:
        raise ValueError(f"unexpected tree type: {tree_name}")

    tree_model = get_treedef_model(tree_name)
    scoping_filters = get_treedef_scope_filters(collection, tree_name)
    # REFACTOR: prefer using string lookup with tree + 'treedefitem' lookup?
    # the .field accesses the FK on the TreeDef model, and the .model retreives
    # its related model (the TreeDefItem)
    tree_rank_model = tree_model.treedefitems.field.model
    tree_rank_query = tree_rank_model.objects.order_by('rankid')
    if rank_filters is not None:
        tree_rank_query = tree_rank_query.filter(**rank_filters)
    rank_prefetch = Prefetch(
        'treedefitems',
        queryset=tree_rank_query,
        to_attr='ordered_ranks'
    )
    tree_defs_query = tree_model.objects.prefetch_related(rank_prefetch).filter(scoping_filters)
    if tree_def_filters is not None:
        tree_defs_query = tree_defs_query.filter(**tree_def_filters)
    result = []
    for definition in tree_defs_query.distinct():
        ranks = definition.ordered_ranks
        serialized_tree_info = {
            'definition': obj_to_data(definition),
            'ranks': [obj_to_data(rank) for rank in ranks]
        }
        result.append(serialized_tree_info)
    return result

def get_tree_ranks_in_collection(
        collection: spmodels.Collection,
        tree_name: str,
        rank_name: str,
        additional_rank_filters: Q | None = None):
    """
    """
    if tree_name.lower() not in SPECIFY_TREES:
        raise ValueError(f"unexpected tree type: {tree_name}")
    scoping_filters = get_treedefitem_scope_filters(collection, tree_name)
    treedefitem_table_name = treedefitem_lookup(tree_name)
    treedefitem_table = datamodel.get_table_strict(treedefitem_table_name)
    treedefitem_model = strict_get_model(treedefitem_table.django_name)

    rank_query = (
        treedefitem_model.objects
        .filter(scoping_filters)
        .filter(name=rank_name)
    )
    if additional_rank_filters is not None:
        rank_query = rank_query.filter(additional_rank_filters)
    return rank_query.distinct()


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

