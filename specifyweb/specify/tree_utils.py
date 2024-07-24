from typing import Tuple
from specifyweb.specify.models import (
    CollectionObjectType,
    Collection,
    Taxontreedef,
    Taxontreedef,
    Geographytreedef,
    Storagetreedef,
    Geologictimeperiodtreedef,
    Lithostrattreedef,
)

def get_treedef(collection: Collection, tree_name: str):
    # Get the appropriate TreeDef based on the Collection and tree_name
    treedef = None
    if tree_name == 'Taxon':
        return get_taxon_treedef(collection)
    elif tree_name == 'Storage':
        treedef = Storagetreedef.objects.filter(institution=collection.discipline.division.institution).first()
    elif tree_name == 'Geography':
        treedef = Geographytreedef.objects.filter(discipline=collection.discipline).first()
    elif tree_name == 'GeologicTimePeriod':
        treedef = Geologictimeperiodtreedef.objects.filter(discipline=collection.discipline).first()
    elif tree_name == 'LithoStrat':
        treedef = Lithostrattreedef.objects.filter(discipline=collection.discipline).first()
    
    if treedef is None:
        return getattr(collection.discipline, tree_name.lower() + 'treedef')
    
    return treedef

# TODO: Double check that this in the intended logic
def get_taxon_treedef(collection: Collection, collection_object_type: CollectionObjectType = None):
    # Use the provided collection_object_type if not None
    if collection_object_type and collection_object_type.taxontreedef:
        return collection_object_type.taxontreedef

    # Use the collection's default collectionobjecttype if it exists
    if collection.collectionobjecttype and collection.collectionobjecttype.taxontreedef:
        return collection.collectionobjecttype.taxontreedef

    # Otherwise, try to get the first CollectionObjectType related to the collection
    cot = CollectionObjectType.objects.filter(collection=collection).first()
    if cot:
        return cot.taxontreedef

    # Fallback to the old method of discipline's taxontreedef if no CollectionObjectType is found
    if collection.discipline.taxontreedef:
        return collection.discipline.taxontreedef

    # If all else fails, return the first TaxonTreedef found
    return Taxontreedef.objects.first()


def get_taxon_treedefs(collection: Collection) -> Taxontreedef:
    # Get all TaxonTreedefs related to the Collection based on CollectionObjectTypes
    return Taxontreedef.objects.filter(
        id__in=CollectionObjectType.objects.filter(collection=collection)
        .values_list("taxontreedef_id", flat=True)
        .distinct()
    )

def get_taxon_treedef_ids(collection: Collection) -> Tuple[int]:
    # Get all TaxonTreedef IDs related to the Collection based on CollectionObjectTypes
    return tuple(
        CollectionObjectType.objects.filter(collection=collection).values_list(
            "taxontreedef_id", flat=True
        )
    )
