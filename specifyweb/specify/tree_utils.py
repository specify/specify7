from typing import Tuple, List
from django.db.models import Q, Count, Model
import specifyweb.specify.models as spmodels

get_search_filters = lambda collection, tree: (
    {"institution": collection.discipline.division.institution}
    if tree.lower() == "storage"
    else {"discipline": collection.discipline}
)

def get_treedef(collection: spmodels.Collection, tree_name: str) ->  List[Tuple[int, int, int]]:
    # Get the appropriate TreeDef based on the Collection and tree_name

    # Mimic the old behavior of limiting the query to the first item for trees other than taxon.
    # Even though the queryconstruct can handle trees with multiple types.
    _limit = lambda query: (query if tree_name.lower() == 'taxon' else query[:1])
    search_filters = get_search_filters(collection, tree_name)

    lookup_tree = tree_name + 'treedef'
    tree_model: Model = getattr(spmodels, lookup_tree)

    # Get all the treedefids, and the count of item in each, corresponding to our search predicates
    search_query = _limit(
        tree_model.objects.filter(**search_filters)
        .annotate(item_counts=Count("treedefitems"))
        .values_list("id", "item_counts")
    )

    result = list(search_query)

    # Handle null taxontreedef.discipline
    if len(result) == 0 and tree_name.lower() == 'taxon':
        result = list(spmodels.CollectionObjectType.objects\
            .filter(collection=collection)\
            .annotate(item_counts=Count('taxontreedef__treedefitems'))\
            .values_list('taxontreedef_id', 'item_counts'))

    assert len(result) > 0, "No definition to query on"

    return result

def get_taxon_treedef(collection: spmodels.Collection, collection_object_type: spmodels.CollectionObjectType = None):
    # Use the provided collection_object_type if not None
    if collection_object_type and collection_object_type.taxontreedef:
        return collection_object_type.taxontreedef

    # Use the collection's default collectionobjecttype if it exists
    if collection.collectionobjecttype and collection.collectionobjecttype.taxontreedef:
        return collection.collectionobjecttype.taxontreedef

    # Otherwise, try to get the first CollectionObjectType related to the collection
    cot = spmodels.CollectionObjectType.objects.filter(collection=collection).first()
    if cot:
        return cot.taxontreedef

    # Fallback to the old method of discipline's taxontreedef if no CollectionObjectType is found
    if collection.discipline.taxontreedef:
        return collection.discipline.taxontreedef

    # If all else fails crash
    raise Exception("Couldn't find a corresponding treedef")

def get_taxon_treedefs(collection: spmodels.Collection):
    return spmodels.Taxontreedef.objects.filter(discipline=collection.discipline).values_list('id', flat=True)

def get_all_taxon_treedefs():
    # Get all TaxonTreedefs
    return spmodels.Taxontreedef.objects.all()

def get_all_taxon_treedef_ids() -> Tuple[int]:
    # Get all TaxonTreedef IDs
    return tuple(spmodels.Taxontreedef.objects.values_list("id", flat=True))
