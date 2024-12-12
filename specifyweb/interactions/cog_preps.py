from typing import Any, List, Optional, Set
from django.db.models import Subquery
from django.db.models.query import QuerySet
from specifyweb.specify.models import Collectionobject, Collectionobjectgroup, Collectionobjectgroupjoin, Loan, Loanpreparation, Preparation, Recordset, Recordsetitem
from specifyweb.specify.models_by_table_id import get_table_id_by_model_name

def get_cog_consolidated_preps(cog: Collectionobjectgroup) -> List[Preparation]:
    """
    Recursively get all the child CollectionObjectGroups, then get the leaf CollectionObjects,
    and then reuturn all the preparation ids if the CollectionObjectGroup to CollectionObject is consolidated
    """
    # Don't continue if the cog is not consolidated
    if cog.cogtype is None or cog.cogtype.type is None or cog.cogtype.type.lower().title() != 'Consolidated':
        return []

    # For each child cog, recursively get the consolidated preparations
    child_cogs = Collectionobjectgroupjoin.objects.filter(
        parentcog=cog, childcog__isnull=False
    ).values_list("childcog", flat=True)
    consolidated_preps = []
    for child_cog in child_cogs:
        child_preps = get_cog_consolidated_preps(child_cog)
        consolidated_preps.extend(child_preps)

    # Get the child CollectionObjects
    collection_objects = Collectionobjectgroupjoin.objects.filter(
        parentcog=cog, childco__isnull=False
    ).values_list("childco", flat=True)

    # For each CollectionObject, get the preparations
    for co in collection_objects:
        consolidated_preps.extend(Preparation.objects.filter(collectionobject=co))

    return consolidated_preps

def get_the_top_consolidated_parent_cog_of_prep(prep: Preparation) -> Optional[Collectionobjectgroup]:
    """
    Get the topmost consolidated parent CollectionObjectGroup of the preparation
    """
    # Get the CollectionObject of the preparation
    co = prep.collectionobject
    if co is None:
        return None

    # Get the parent cog of the CollectionObject
    cog = Collectionobjectgroupjoin.objects.filter(childco=co).first().parentcog
    if cog is None:
        return None

    cojo = Collectionobjectgroupjoin.objects.filter(childcog=cog).first()
    consolidated_parent_cog = cojo.parentcog if cojo is not None else None
    top_cog = consolidated_parent_cog if consolidated_parent_cog is not None else cog

    # Move up consolidated parent CollectionObjectGroups until the top consolidated CollectionObjectGroup is found
    while consolidated_parent_cog is not None:
        if consolidated_parent_cog.cogtype is None or consolidated_parent_cog.cogtype.type is None or consolidated_parent_cog.cogtype.type.lower().title() != 'Consolidated':
            break
        top_cog = consolidated_parent_cog
        cojo = Collectionobjectgroupjoin.objects.filter(childcog=consolidated_parent_cog).first()
        consolidated_parent_cog = cojo.parentcog if cojo is not None else None

    return top_cog

def get_all_sibling_preps_within_consolidated_cog(prep: Preparation) -> List[Preparation]:
    """
    Get all the sibling preparations within the consolidated cog
    """
    # Get the topmost consolidated parent cog of the preparation
    top_consolidated_cog = get_the_top_consolidated_parent_cog_of_prep(prep)
    if top_consolidated_cog is None:
        return [prep]
    
    # Get all the sibling preparations
    sibling_preps = get_cog_consolidated_preps(top_consolidated_cog)

    # Remove the prep.id from the sibling preparations
    sibling_preps = [p for p in sibling_preps if p.id != prep.id]

    return sibling_preps

def remove_all_cog_sibling_preps_from_loan(prep: Preparation, loan: Loan) -> None:
    """
    Remove all the sibling preparations within the consolidated cog
    """
    # Get all the sibling preparations
    preps = get_all_sibling_preps_within_consolidated_cog(prep)

    # Get the loan preparations
    loan_preps = Loanpreparation.objects.filter(loan=loan, preparation__in=preps)

    # Delete the loan preparations
    loan_preps.delete()

def is_cog_recordset(rs: Recordset) -> bool:
    """
    Check if the recordset is a CollectionObjectGroup recordset
    """
    return rs.dbtableid == get_table_id_by_model_name('Collectionobjectgroup')

def is_co_recordset(rs: Recordset) -> bool:
    """
    Check if the recordset is a CollectionObjectGroup recordset
    """
    return rs.dbtableid == get_table_id_by_model_name('Collectionobject')

def get_cogs_from_co_recordset(rs: Recordset) -> Optional[QuerySet[Collectionobjectgroup]]:
    """
    Get the CollectionObjectGroups from the CollectionObject recordset
    """

    if not is_co_recordset(rs):
        return None
    
    # Subquery to get CollectionObjectIDs from the recordset
    co_subquery = Recordsetitem.objects.filter(recordset=rs).values('recordid')
    
    # Subquery to get parentcog IDs from Collectionobjectgroupjoin
    parent_cog_subquery = Collectionobjectgroupjoin.objects.filter(
        childco__in=Subquery(co_subquery)
    ).values('parentcog')
    
    # Main query to get Collectionobjectgroup objects
    cogs = Collectionobjectgroup.objects.filter(id__in=Subquery(parent_cog_subquery))
    return cogs

def get_cogs_from_co_ids(co_ids: List[int]) -> Optional[QuerySet[Collectionobjectgroup]]:
    """
    Get the CollectionObjectGroups from the CollectionObject IDs
    """
    # Subquery to get parentcog IDs from Collectionobjectgroupjoin
    parent_cog_subquery = Collectionobjectgroupjoin.objects.filter(
        childco__in=co_ids
    ).values('parentcog')
    
    # Main query to get Collectionobjectgroup objects
    cogs = Collectionobjectgroup.objects.filter(id__in=Subquery(parent_cog_subquery))
    return cogs

def get_cog_consolidated_preps_co_ids(cog: Collectionobjectgroup) -> Set[Collectionobject]:
    preps = get_cog_consolidated_preps(cog)
    
    # Return set of distinct CollectionObjectIDs associated with the preparations
    return set(prep.collectionobject.id for prep in preps)

def add_consolidated_sibling_co_ids(request_co_ids: List[Any], id_fld: Optional[str]=None) -> List[Any]:
    """
    Get the consolidated sibling CO IDs of the COs in the list
    """
    cog_sibling_co_ids = set()
    if id_fld is None:
        # id_fld = 'id'
        id_fld = 'catalognumber'
    id_fld = id_fld.lower()
    co_ids = Collectionobject.objects.filter(**{f"{id_fld}__in": request_co_ids}).values_list('id', flat=True)
    cogs = get_cogs_from_co_ids(co_ids)
    for cog in cogs:
        cog_sibling_co_ids.update(get_cog_consolidated_preps_co_ids(cog))
    # cog_sibling_co_ids -= set(co_ids)

    cog_sibling_co_idfld_ids = Collectionobject.objects.filter(id__in=cog_sibling_co_ids).values_list(id_fld, flat=True)
    return list(set(request_co_ids).union(set(cog_sibling_co_idfld_ids)))

def get_consolidated_co_siblings_from_rs(rs: Recordset) -> Set[Collectionobject]:
    """
    Get the consolidated sibling CO IDs of the COs in the recordset
    """
    cog_sibling_co_ids = set()
    # if is_co_recordset(rs):
    #     cogs = get_cogs_from_co_recordset(rs)
    #     for cog in cogs:
    #         cog_sibling_co_ids = cog_sibling_co_ids.union(get_cog_consolidated_preps_co_ids(cog))
    #     # cog_sibling_co_ids -= set(rs.recordsetitems.values_list('recordid', flat=True))
    if is_cog_recordset(rs):
        # cogs = Collectionobjectgroup.objects.filter(id__in=rs.recordsetitems.values_list('recordid', flat=True))
        cogs = Collectionobjectgroup.objects.filter(
            id__in=rs.recordsetitems.values_list("recordid", flat=True),
            cogtype__type__iexact="Consolidated",
        )
        for cog in cogs:
            cog_sibling_co_ids = cog_sibling_co_ids.union(get_cog_consolidated_preps_co_ids(cog))

    return cog_sibling_co_ids
