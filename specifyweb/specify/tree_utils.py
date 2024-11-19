from typing import Tuple, List
from django.db.models import Q, Count, Model
import specifyweb.specify.models as spmodels
from specifyweb.specify.datamodel import datamodel

lookup = lambda tree: (tree.lower() + 'treedef')

SPECIFY_TREES = {"taxon", "storage", "geography", "geologictimeperiod", "lithostrat", 'tectonicunit'}

def get_search_filters(collection: spmodels.Collection, tree: str):
    tree_name = tree.lower()
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

def get_treedefs(collection: spmodels.Collection, tree_name: str, treedef_id=None) ->  List[Tuple[int, int]]:
    # Get the appropriate TreeDef based on the Collection and tree_name

    # Mimic the old behavior of limiting the query to the first item for trees other than taxon.
    # Even though the queryconstruct can handle trees with multiple types.
    _limit = lambda query: (query if tree_name.lower() == 'taxon' else query[:1])
    search_filters = get_search_filters(collection, tree_name) if treedef_id is None else Q(id=treedef_id)

    lookup_tree = lookup(tree_name)
    tree_table = datamodel.get_table_strict(lookup_tree)
    tree_model: Model = getattr(spmodels, tree_table.django_name)

    # Get all the treedefids, and the count of item in each, corresponding to our search predicates
    search_query = _limit(
        tree_model.objects.filter(search_filters)
        .annotate(item_counts=Count("treedefitems", distinct=True))
        .distinct()
        .values_list("id", "item_counts")
    )

    result = list(search_query)

    assert len(result) > 0, "No definition to query on"

    return result
