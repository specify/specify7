import re
import logging
from typing import Any, List, Optional, Set
from django.db.models import Subquery
from django.db.models.query import QuerySet
from specifyweb.specify.models import (
    Collectionobject,
    Collectionobjectgroup,
    Collectionobjectgroupjoin,
    Disposalpreparation,
    Giftpreparation,
    Loan,
    Loanpreparation,
    Loanreturnpreparation,
    Preparation,
    Recordset,
    Recordsetitem,
)
from specifyweb.specify.models_by_table_id import get_table_id_by_model_name

logger = logging.getLogger(__name__)

def is_consolidated_cog(cog: Optional[Collectionobjectgroup]) -> bool:
    """
    Check if the CollectionObjectGroup is consolidated.
    """
    return (
        cog is not None
        and cog.cogtype is not None
        and cog.cogtype.type is not None
        and cog.cogtype.type.lower().title() == "Consolidated"
    )

def get_cog_consolidated_preps(cog: Collectionobjectgroup) -> List[Preparation]:
    """
    Recursively get all the child CollectionObjectGroups, then get the leaf CollectionObjects,
    and then reuturn all the preparation ids if the CollectionObjectGroup to CollectionObject is consolidated
    """
    # Don't continue if the cog is not consolidated
    if not is_consolidated_cog(cog):
        return []

    # For each child cog, recursively get the consolidated preparations
    child_cogs = Collectionobjectgroupjoin.objects.filter(
        parentcog=cog, childcog__isnull=False
    ).values_list("childcog", flat=True)
    consolidated_preps = []
    for child_cog_id in child_cogs:
        child_cog = Collectionobjectgroup.objects.filter(id=child_cog_id).first()
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
    Get the topmost consolidated parent CollectionObjectGroup of the preparation.
    """
    # Get the CollectionObject of the preparation
    co = prep.collectionobject
    if co is None:
        return None

    # Get the initial parent cog of the CollectionObject
    cojo = Collectionobjectgroupjoin.objects.filter(childco=co).first()
    if cojo is None:
        return None
    cog = cojo.parentcog
    if not is_consolidated_cog(cog):
        return None

    top_cog = cog

    # Move up consolidated parent CollectionObjectGroups until the top consolidated CollectionObjectGroup is found
    while True:
        cojo = Collectionobjectgroupjoin.objects.filter(childcog=top_cog).first()
        if cojo is None or not is_consolidated_cog(cojo.parentcog):
            break
        top_cog = cojo.parentcog

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
    if is_co_recordset(rs):
        cogs = get_cogs_from_co_recordset(rs)
        for cog in cogs:
            cog_sibling_co_ids = cog_sibling_co_ids.union(get_cog_consolidated_preps_co_ids(cog))
        # cog_sibling_co_ids -= set(rs.recordsetitems.values_list('recordid', flat=True))

    return cog_sibling_co_ids

def get_co_ids_from_shared_cog_rs(rs: Recordset) -> Set[Collectionobject]:
    """
    Get the CO IDs from the shared COGs in the recordset
    """
    if not is_cog_recordset(rs):
        return set()

    cogs = Collectionobjectgroup.objects.filter(
        id__in=rs.recordsetitems.values_list("recordid", flat=True),
        # cogtype__type__iexact="Consolidated",
    )

    cog_co_ids = set().union(*[
        Collectionobjectgroupjoin.objects.filter(parentcog=cog).values_list("childco", flat=True)
        for cog in cogs
    ])
    return cog_co_ids

def modify_prep_update_based_on_sibling_preps(original_prep_ids: Set[int], updated_prep_ids: Set[int]) -> Set[int]:
    """
    Determine the difference between the preparation IDs original and updated prep.
    Get a list of preparation IDs that were added and a list of preparation IDs that were removed.
    Create a map of a each preparation ID to a list of sibling preparation IDs.
    For each preparation ID that was removed, remove all sibling preparations from the updated_prep_ids.
    For each preparation ID that was added, add all sibling preparations to the updated_prep_ids.
    Return the modified updated_prep_ids.
    """
    # Get the preparation IDs that were added and removed
    modified_prep_ids = updated_prep_ids.copy()
    added_prep_ids = updated_prep_ids - original_prep_ids
    removed_prep_ids = original_prep_ids - updated_prep_ids

    # Create a map of each preparation ID to a list of sibling preparation IDs
    prep_to_sibling_preps = {}
    def update_prep_to_sibling_preps(prep_ids, prep_to_sibling_preps):
        for prep_id in prep_ids:
            if prep_id not in prep_to_sibling_preps:
                try:
                    prep = Preparation.objects.get(id=prep_id)
                    sibling_preps = get_all_sibling_preps_within_consolidated_cog(prep)
                    prep_to_sibling_preps[prep_id] = {p.id for p in sibling_preps}
                except Preparation.DoesNotExist:
                    prep_to_sibling_preps[prep_id] = set()

    all_prep_ids = updated_prep_ids | removed_prep_ids | added_prep_ids
    update_prep_to_sibling_preps(all_prep_ids, prep_to_sibling_preps)

    # Remove all sibling preparations from the updated_prep_ids that were removed
    for prep_id in removed_prep_ids:
        modified_prep_ids -= prep_to_sibling_preps[prep_id]

    # Add all sibling preparations to the updated_prep_ids that were added
    for prep_id in added_prep_ids:
        modified_prep_ids.update(prep_to_sibling_preps[prep_id])

    return modified_prep_ids

def modify_update_of_interaction_sibling_preps(original_interaction_obj, updated_interaction_data):
    """
    Determine the difference between the preparation IDs in the Loanpreparations of the original and updated interactions.
    Based on the preparation differences, determine which preparations were added and removed from the interaction.
    Remove all sibling preparations from the loan that were removed from the interaction.
    Add all sibling preparations to the loan that were added to the interaction.
    Return the modified updated interaction object.
    """
    def parse_preparation_id(uri: str) -> int:
        match = re.search(r'^/api/specify/preparation/(\d+)/$', uri)
        if match:
            return int(match.group(1))
        else:
            raise ValueError("No preparation ID found in the URL")

    interaction_prep_name = None
    InteractionPrepModel = None
    filter_fld = None
    if original_interaction_obj._meta.model_name == 'loan':
        if 'loanpreparations' in updated_interaction_data:
            interaction_prep_name = "loanpreparations"
            filter_fld = "loan"
            InteractionPrepModel = Loanpreparation
        elif 'loanreturnpreparations' in updated_interaction_data:
            interaction_prep_name = "loanreturnpreparations" 
            filter_fld = "loanreturn"
            InteractionPrepModel = Loanreturnpreparation
        else:
            return updated_interaction_data    
    elif original_interaction_obj._meta.model_name == 'gift':
        interaction_prep_name = "giftpreparations"
        filter_fld = "gift"
        InteractionPrepModel = Giftpreparation
    elif original_interaction_obj._meta.model_name == 'disposal':
        interaction_prep_name = "disposalpreparations"
        filter_fld = "disposal"
        InteractionPrepModel = Disposalpreparation
    else:
        # Permit, Exchange, Borrow interactions, no preparation data?
        return updated_interaction_data

    interaction_prep_data = updated_interaction_data[interaction_prep_name]
    updated_prep_ids = set(
        [
            parse_preparation_id(interaction_prep["preparation"])
            for interaction_prep in interaction_prep_data
            if "preparation" in interaction_prep.keys() and interaction_prep["preparation"] is not None
        ]
    )
    original_prep_ids = set(
        InteractionPrepModel.objects.filter(**{filter_fld: original_interaction_obj}).values_list(
            "preparation_id", flat=True
        )
    )
    modified_updated_prep_ids = modify_prep_update_based_on_sibling_preps(
        original_prep_ids, updated_prep_ids
    )
    unassociated_prep_data = [
        interaction_prep
        for interaction_prep in interaction_prep_data
        if "preparation" not in interaction_prep.keys()
        or interaction_prep["preparation"] is None
    ]

    if len(interaction_prep_data) != len(updated_prep_ids):
        # At least one preparation was not parsed correctly, or did not have an associated preparation ID
        logger.warning("Parsing of interaction preparations failed")

    added_prep_ids = modified_updated_prep_ids - original_prep_ids
    removed_prep_ids = original_prep_ids - modified_updated_prep_ids

    # Remove preps
    updated_interaction_data[interaction_prep_name] = [
        interaction_prep
        for interaction_prep in interaction_prep_data
        if "preparation" in interaction_prep.keys()
        and interaction_prep["preparation"] is not None
        and parse_preparation_id(interaction_prep["preparation"]) not in removed_prep_ids
    ]

    # Add preps
    added_prep_ids -= updated_prep_ids
    updated_interaction_data[interaction_prep_name].extend(
        [
            {
                "preparation": f"/api/specify/preparation/{prep_id}/",
                "quantity": 1,
                "isresolved": True,
                "discipline": f"/api/specify/discipline/{original_interaction_obj.discipline.id}/",
            }
            for prep_id in added_prep_ids
        ]
    )

    # Add back the unassociated preparation data
    updated_interaction_data[interaction_prep_name].extend(unassociated_prep_data)

    return updated_interaction_data
