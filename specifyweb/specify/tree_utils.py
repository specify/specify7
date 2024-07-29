from typing import Tuple
from django.db.models import Q
from specifyweb.specify.model_extras import Taxontreedefitem
from specifyweb.specify.models import (
    CollectionObjectType,
    Collection,
    Discipline,
    Taxontreedef,
    Geographytreedef,
    Storagetreedef,
    Geologictimeperiodtreedef,
    Lithostrattreedef,
    Taxontreedefitem,
    Geographytreedefitem,
    Storagetreedefitem,
    Geologictimeperiodtreedefitem,
    Lithostrattreedefitem,
)

def get_treedefs(collection: Collection, tree_name: str):
    # Get the appropriate TreeDef based on the Collection and tree_name
    treedefs = None
    if tree_name == 'Taxon':
        # return get_taxon_treedef(collection)
        return get_taxon_treedefs_by_discipline(collection)
        # return get_all_taxon_treedefs()
    elif tree_name == 'Storage':
        treedefs = Storagetreedef.objects.filter(institution=collection.discipline.division.institution)
    elif tree_name == 'Geography':
        treedefs = Geographytreedef.objects.filter(discipline=collection.discipline)
    elif tree_name == 'Geologictimeperiod':
        treedefs = Geologictimeperiodtreedef.objects.filter(discipline=collection.discipline)
    elif tree_name == 'Lithostrat':
        treedefs = Lithostrattreedef.objects.filter(discipline=collection.discipline)
    
    # if treedefs is None:
    #     treedef = getattr(collection.discipline, tree_name.lower() + 'treedef')
    
    return treedefs

def get_treedef_items(collection: Collection, tree_name: str):
    # Get all the TreeDefItems related to the TreeDefs in the resulting queryset from get_treedefs
    treedefs = get_treedefs(collection, tree_name)
    return Taxontreedefitem.objects.filter(treedef__in=treedefs)

def get_treedefs_items(treedefs, tree_name: str):
    # Get all the TreeDefItems related to the TreeDefs in the resulting treedefs queryset
    TreeDef = None
    if tree_name == 'Taxon':
        TreeDef = Taxontreedefitem
    elif tree_name == 'Storage':
        TreeDef = Storagetreedefitem
    elif tree_name == 'Geography':
        TreeDef = Geographytreedefitem
    elif tree_name == 'Geologictimeperiod':
        TreeDef = Geologictimeperiodtreedefitem
    elif tree_name == 'Lithostrat':
        TreeDef = Lithostrattreedefitem
    
    return TreeDef.objects.filter(treedef__in=treedefs)

def get_treedefs_ranks(collection: Collection, tree_name: str):
    TreeDefItem = None
    if tree_name == 'Taxon':
        TreeDefItem = Taxontreedefitem
    elif tree_name == 'Storage':
        TreeDefItem = Storagetreedefitem
    elif tree_name == 'Geography':
        TreeDefItem = Geographytreedefitem
    elif tree_name == 'Geologictimeperiod':
        TreeDefItem = Geologictimeperiodtreedefitem
    elif tree_name == 'Lithostrat':
        TreeDefItem = Lithostrattreedefitem
    
    ranks = TreeDefItem.objects.filter(treedef__discipline=collection.discipline)
    if ranks.count() == 0:
        collections = Collection.objects.filter(discipline=collection.discipline)
        collection_object_types = CollectionObjectType.objects.filter(collection__in=collections)
        ranks = TreeDefItem.objects.filter(treedef__in=collection_object_types.values_list("taxontreedef", flat=True))

    return ranks

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

def get_taxon_treedefs_by_collection(collection: Collection) -> Taxontreedef:
    # Get all TaxonTreedefs related to the Collection based on CollectionObjectTypes
    return Taxontreedef.objects.filter(
        id__in=CollectionObjectType.objects.filter(collection=collection)
        .values_list("taxontreedef_id", flat=True)
        .distinct()
    )

def get_taxon_treedef_ids_by_collection(collection: Collection) -> Tuple[int]:
    # Get all TaxonTreedef IDs related to the Collection based on CollectionObjectTypes
    return tuple(
        CollectionObjectType.objects.filter(collection=collection).values_list(
            "taxontreedef_id", flat=True
        )
    )

def get_taxon_treedefs_by_discipline(collection: Collection):
    # Get all TaxonTreedefs related to the Discipline
    # Handle TaxonTreedefs with null discipline by searching through CollectionObjectTypes
    return Taxontreedef.objects.filter(discipline=collection.discipline).union(
        Taxontreedef.objects.filter(
            id__in=CollectionObjectType.objects.filter(collection__discipline=collection.discipline)
            .values_list("taxontreedef_id", flat=True)
            .distinct())
    )#.distinct()

def get_taxon_treedef_ids_by_discipline(collection: Collection):
    # Get all TaxonTreedef IDs related to the Discipline
    return tuple(get_taxon_treedefs_by_discipline(collection).values_list("id", flat=True))

def get_all_taxon_treedefs():
    # Get all TaxonTreedefs
    return Taxontreedef.objects.all()

def get_all_taxon_treedef_ids() -> Tuple[int]:
    # Get all TaxonTreedef IDs
    return tuple(Taxontreedef.objects.values_list("id", flat=True))
