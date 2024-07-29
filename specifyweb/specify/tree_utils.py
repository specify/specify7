from typing import Tuple, List
import specifyweb.specify.models as spmodels
from django.db.models import Count, Model

get_search_filters = lambda collection, tree: {
    'institution': collection.discipline.division.institution
    } if tree.lower() == 'storage' else {
        'discipline': collection.discipline
        }

def get_treedef(collection: spmodels.Collection, tree_name: str) ->  List[Tuple[int, int, int]]:
    # Get the appropriate TreeDef based on the Collection and tree_name

    # we actually don't care here. everything can be not limited, but I'm doing it this way so that 
    # we can mimic and follow legacy stuff as closely as possible. queryconstruct can perfectly handle
    # even storage or geography being of multiple types. heck, everything gets converted to a list
    _limit = lambda query: (query if tree_name.lower() == 'taxon' else query[:1])
    search_filters = get_search_filters(collection, tree_name)
    
    lookup_tree = tree_name + 'treedef'
    tree_model: Model = getattr(spmodels, lookup_tree)
    # we get all the treedefids, and the count of item in each, corresponding to our search predicates
    search_query = _limit(tree_model.objects.filter(**search_filters).annotate(item_counts=Count('treedefitems')).values_list('id', 'item_counts'))
    
    result = list(search_query)
    assert len(result) > 0, "Got no definition to query on"

    return result


# TODO: Double check that this in the intended logic
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
    # Get all TaxonTreedefs related to the Collection based on CollectionObjectTypes
    return spmodels.Taxontreedef.objects.filter(**get_search_filters(collection, "Taxon")).values_list('id', flat=True)
