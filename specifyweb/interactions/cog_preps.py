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

def parse_uri_id(uri: str, field: str) -> int:
    pattern = rf'^/api/specify/{field}/(\d+)/$'
    match = re.search(pattern, uri)
    if match:
        return int(match.group(1))
    else:
        raise ValueError(f"No {field} ID found in the URL")

def parse_preparation_id(uri: str) -> int:
    return parse_uri_id(uri, "preparation")

def parse_loan_preparation_id(uri: str) -> int:
    return parse_uri_id(uri, "loanpreparation")

def modify_update_of_interaction_sibling_preps(original_interaction_obj, updated_interaction_data):
    """
    Determine the difference between the preparation IDs in the Loanpreparations of the original and updated interactions.
    Based on the preparation differences, determine which preparations were added and removed from the interaction.
    Remove all sibling preparations from the loan that were removed from the interaction.
    Add all sibling preparations to the loan that were added to the interaction.
    Return the modified updated interaction object.
    """
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

def modify_update_of_loan_return_sibling_preps_old(original_interaction_obj, updated_interaction_data):
    if 'loanpreparations' not in updated_interaction_data:
        return updated_interaction_data

    loan_prep_data = updated_interaction_data["loanpreparations"]
    loan_return_prep_data_lst = []
    loan_prep_data_to_prep_id_map = {}
    map_prep_id_to_loan_prep_idx = {}
    loan_return_prep_data_to_prep_id_map = {}
    # map_prep_id_to_
    loan_prep_idx = 0
    return_date = None
    for loan_prep_data in updated_interaction_data["loanpreparations"]:
        prep_uri = loan_prep_data["preparation"] if "preparation" in loan_prep_data.keys() else None
        prep_id = parse_preparation_id(prep_uri) if prep_uri is not None else None
        loan_prep_data_to_prep_id_map[loan_prep_data] = prep_id
        loan_prep_id = loan_prep_data["id"] if "id" in loan_prep_data.keys() else None
        map_prep_id_to_loan_prep_idx[prep_id] = loan_prep_idx
        loan_prep_idx += 1

        for loan_return_prep_data in loan_prep_data["loanreturnpreparations"]:
            if "returneddate" in loan_return_prep_data.keys():
                return_date = loan_return_prep_data["returneddate"]

            loan_return_prep_data_lst.append(loan_return_prep_data)
            loan_return_loan_prep_id = loan_return_prep_data["loanpreparation"]
            if loan_return_loan_prep_id == loan_prep_id:
                loan_return_prep_data_to_prep_id_map[loan_return_prep_data] = prep_id
            else:
                loan_prep = Loanpreparation.objects.filter(id=loan_return_loan_prep_id).first()
                loan_return_prep_data_to_prep_id_map[loan_return_prep_data] = (
                    loan_prep.preparation_id if loan_prep is not None else None
                )

    preps = {prep for prep in Preparation.objects.filter(id__in=loan_return_prep_data_to_prep_id_map.values())}
    loan_prep_ids = {prep.id for prep in preps}  

    map_prep_id_to_sibling_prep_ids = {}
    map_sibling_prep_ids_to_original_prep_ids = {}
    for prep in preps:
        prep = Preparation.objects.filter(id=prep_id).first()
        sibling_preps = get_all_sibling_preps_within_consolidated_cog(prep)
        sibling_prep_ids = {sibling_prep.id for sibling_prep in sibling_preps}
        map_prep_id_to_sibling_prep_ids[prep.id] = sibling_prep_ids
        for sibling_prep in sibling_preps:
            if sibling_prep.id not in map_sibling_prep_ids_to_original_prep_ids.keys():
                map_sibling_prep_ids_to_original_prep_ids[sibling_prep.id] = set(prep.id)
            else:
                map_sibling_prep_ids_to_original_prep_ids[sibling_prep.id].update({prep.id})

    # sibling_preps = {
    #     sibling_prep
    #     for prep in preps
    #     for sibling_prep in get_all_sibling_preps_within_consolidated_cog(prep)
    # }
    # sibling_prep_ids = {prep.id for prep in sibling_preps}
    sibling_prep_ids = set(map_sibling_prep_ids_to_original_prep_ids.keys())
    added_prep_ids = sibling_prep_ids - loan_prep_ids
    new_loan_return_prep_ids = {prep_id for prep_id in added_prep_ids if prep_id in map_prep_id_to_loan_prep_idx.keys()}

    for prep_id in new_loan_return_prep_ids:
        loan_prep_idx = map_prep_id_to_loan_prep_idx[prep_id]
        existing_loan_return_prep_data = loan_prep_data[loan_prep_idx]["loanreturnpreparations"]

        orginal_prep_ids = map_sibling_prep_ids_to_original_prep_ids[prep_id]
        original_loan_return_data = None
        original_loan_prep_idx = None
        if len(orginal_prep_ids) == 1:
            original_prep_id = orginal_prep_ids.pop()
            original_loan_prep_idx = map_prep_id_to_loan_prep_idx[original_prep_id]
            original_loan_return_data = loan_prep_data[original_loan_prep_idx]["loanreturnpreparations"].last()
        elif len(orginal_prep_ids) > 1:
            logger.warning
            pass # TODO
        else:
            continue

        # TODO: Continue if a loan return preparation already exists for the loan preparation

        loan_prep_id = loan_prep_data[loan_prep_idx]["id"]
        # discipline_uri = existing_loan_return_prep_data
        quantity_returned = ( # TODO
            original_loan_return_data["quantityreturned"]
            if original_loan_return_data is not None
            else 1
        )
        quantity_resolved = ( # TODO
            original_loan_return_data["quantityresolved"]
            if original_loan_return_data is not None
            else 1
        )
        discipline_uri = (
            loan_prep_data[loan_prep_idx]["discipline"]
            if original_loan_return_data is not None
            else original_loan_return_data["discipline"]
        )
        return_date = return_date if return_date is not None else "2025-01-02" # TODO
        received_by_agent_uri = "" # TODO

        # Handle different cases for quantity returned and resolved
        # if the original loan return has all the items returned/resolved, then the new loan return should have all the items returned/resolved
        # if the original loan return has zero the items returned/resolved, then the new loan return should have zero the items returned/resolved
        # otherwise, just match the quantity returned/resolved to the original loan return, in the case of a partial return, but don't exceed the loan prep quantity
        # if original_loan_return_data["quantityreturned"] == 

        new_loan_return_data = {
            # "discipline": f"/api/specify/discipline/{original_interaction_obj.discipline.id}/",
            "quantityreturned": quantity_returned,
            "quantityresolved": quantity_resolved,
            "discipline": discipline_uri,
            "loanpreparation": f"/api/specify/loanpreparation/{loan_prep_id}/",
            "remarks": "",
            "receivedby": received_by_agent_uri,
            "returneddate": return_date,
            "_tableName": "LoanReturnPreparation"
        }

        updated_interaction_data["loanpreparations"][loan_prep_idx][
            "loanreturnpreparations"
        ].extend([new_loan_return_data])
    
    return updated_interaction_data


def modify_update_of_loan_return_sibling_preps(original_interaction_obj, updated_interaction_data):
    if 'loanpreparations' not in updated_interaction_data:
        return updated_interaction_data

    # Parse and map loan preparation data
    map_prep_id_to_loan_prep_idx = {}
    map_prep_id_to_loan_prep_id = {}
    map_prep_id_to_new_loan_return_prep_data = {}
    target_preps = set()
    target_prep_ids = set()
    loan_prep_idx = 0
    for loan_prep_data in updated_interaction_data["loanpreparations"]:
        prep_uri = loan_prep_data["preparation"] if "preparation" in loan_prep_data.keys() else None
        prep_id = parse_preparation_id(prep_uri) if prep_uri is not None else None
        map_prep_id_to_loan_prep_idx[prep_id] = loan_prep_idx
        loan_prep_idx += 1

        # Continue if the loan return preparation is not new
        if "id" in loan_prep_data.keys():
            loan_prep_id = int(loan_prep_data["id"])
            if Loanpreparation.objects.filter(id=loan_prep_id).exists():
                map_prep_id_to_loan_prep_id[prep_id] = loan_prep_id # TODO: Double check this

        for loan_return_prep_data in loan_prep_data["loanreturnpreparations"]:
            loan_return_loan_prep_id = loan_return_prep_data["loanpreparation"]
            if loan_return_loan_prep_id == loan_prep_id:
                target_prep_ids.update({prep_id})
                prep = Preparation.objects.filter(id=prep_id).first()
                if prep is not None:
                    target_preps.update({prep})
                    map_prep_id_to_loan_prep_id[prep_id] = loan_prep_id
                    map_prep_id_to_new_loan_return_prep_data[prep_id] = loan_return_prep_data
            else:
                loan_prep = Loanpreparation.objects.filter(id=loan_return_loan_prep_id).first()
                prep = loan_prep.preparation if loan_prep is not None else None
                if prep is not None:
                    target_prep_ids.update({prep.id})
                    target_preps.update({prep})

    # Get the sibling preparations
    map_prep_id_to_sibling_prep_ids = {}
    map_sibling_prep_ids_to_original_prep_ids = {}
    for prep in target_preps:
        prep = Preparation.objects.filter(id=prep_id).first()
        sibling_preps = get_all_sibling_preps_within_consolidated_cog(prep)
        sibling_prep_ids = {sibling_prep.id for sibling_prep in sibling_preps}
        map_prep_id_to_sibling_prep_ids[prep.id] = sibling_prep_ids
        for sibling_prep in sibling_preps:
            if sibling_prep.id not in map_sibling_prep_ids_to_original_prep_ids.keys():
                map_sibling_prep_ids_to_original_prep_ids[sibling_prep.id] = set(prep.id)
            else:
                map_sibling_prep_ids_to_original_prep_ids[sibling_prep.id].update({prep.id})

    sibling_prep_ids = set(map_sibling_prep_ids_to_original_prep_ids.keys())
    added_prep_ids = sibling_prep_ids - target_prep_ids
    new_loan_return_prep_ids = {prep_id for prep_id in added_prep_ids if prep_id in map_prep_id_to_loan_prep_idx.keys()}

    # Create new loan return preparation data
    for prep_id in new_loan_return_prep_ids:
        loan_prep_idx = map_prep_id_to_loan_prep_idx[prep_id]
        existing_loan_return_prep_data = loan_prep_data[loan_prep_idx]["loanreturnpreparations"]

        # Determine the original loan return preparation data that this new sibling loan return preparation data should be based on
        orginal_prep_ids = map_sibling_prep_ids_to_original_prep_ids[prep_id]
        orignal_loan_prep_data = None
        original_loan_return_data = None
        original_loan_prep_idx = None
        if len(orginal_prep_ids) == 1:
            original_prep_id = orginal_prep_ids.pop()
            original_loan_prep_idx = map_prep_id_to_loan_prep_idx[original_prep_id]
            orignal_loan_prep_data = loan_prep_data[original_loan_prep_idx]
            original_loan_return_data = loan_prep_data[original_loan_prep_idx]["loanreturnpreparations"].last()
        elif len(orginal_prep_ids) > 1:
            logger.warning
            pass # TODO
        else:
            continue

        # Handle different cases for quantity returned and resolved
        original_loan_prep_quanity = loan_prep_data[original_loan_prep_idx]["quantity"]
        original_loan_return_quantity_returned = (
            original_loan_return_data["quantityreturned"]
            if original_loan_return_data is not None
            else 0
        )
        original_loan_return_quantity_resolved = (
            original_loan_return_data["quantityresolved"]
            if original_loan_return_data is not None
            else 0
        )
        # all_original_loan_prep_loan_returns = loan_prep_
        
        quantity_returned = ( # TODO
            original_loan_return_data["quantityreturned"]
            if original_loan_return_data is not None
            else 1
        )
        quantity_resolved = ( # TODO
            original_loan_return_data["quantityresolved"]
            if original_loan_return_data is not None
            else 1
        )

        # Add new loan return preparation data to the loan prep
        loan_prep_id = loan_prep_data[loan_prep_idx]["id"]
        discipline_uri = (
            loan_prep_data[loan_prep_idx]["discipline"]
            if original_loan_return_data is not None
            else original_loan_return_data["discipline"]
        )
        return_date = (
            original_loan_return_data["returneddate"]
            if "returneddate" in original_loan_return_data.keys()
            else None
        )
        received_by_agent_uri = "" # TODO
        new_loan_return_data = {
            # "discipline": f"/api/specify/discipline/{original_interaction_obj.discipline.id}/",
            "quantityreturned": quantity_returned,
            "quantityresolved": quantity_resolved,
            "discipline": discipline_uri,
            "loanpreparation": f"/api/specify/loanpreparation/{loan_prep_id}/",
            "remarks": "",
            "receivedby": received_by_agent_uri,
            "returneddate": return_date,
            "_tableName": "LoanReturnPreparation"
        }
        updated_interaction_data["loanpreparations"][loan_prep_idx][
            "loanreturnpreparations"
        ].extend([new_loan_return_data])

    # TODO: Handle removed sibling preparations after removing an existing loan return preparation

    return updated_interaction_data
