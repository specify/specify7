from typing import Union, Tuple
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

TreeDef = Union[Taxontreedef, Geographytreedef, Storagetreedef, Geologictimeperiodtreedef, Lithostrattreedef]

def get_treedef(collection: Collection, tree_name: str) -> TreeDef:
    if tree_name == 'Storage':
        return collection.discipline.division.institution.storagetreedef
    elif tree_name == 'Taxon':
        return get_taxon_treedef(collection)
    return getattr(collection.discipline, tree_name.lower() + "treedef")

# TODO: Double check that this in the intended logic
def get_taxon_treedef(collection: Collection, collection_object_type: CollectionObjectType = None) -> Taxontreedef:
    # Use the provided collection_object_type if not None
    if collection_object_type and collection_object_type.taxontreedef:
        return collection_object_type.taxontreedef

    # Use the collection's default collectionobjecttype if it exists
    if collection.collectionobjecttype:
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
    return Taxontreedef.objects.filter(
        id__in=CollectionObjectType.objects.filter(collection=collection)
        .values_list("taxontreedef_id", flat=True)
        .distinct()
    )

def get_taxon_treedef_ids(collection: Collection) -> Tuple[int]:
    return tuple(
        CollectionObjectType.objects.filter(collection=collection).values_list(
            "taxontreedef_id", flat=True
        )
    )
