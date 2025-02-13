import logging
from typing import Any, List, Optional, Set
from django.db.models import Subquery, Sum, F, Value, IntegerField, ExpressionWrapper, Q
from django.db.models.query import QuerySet
from django.db.models.functions import Coalesce
from specifyweb.specify.models import (
    Collectionobject,
    Collectionobjectgroup,
    Collectionobjectgroupjoin,
    Disposalpreparation,
    Giftpreparation,
    Loanpreparation,
    Loanreturnpreparation,
    Preparation,
    Recordset,
    Recordsetitem,
)
from specifyweb.specify.models_by_table_id import get_table_id_by_model_name
from specifyweb.specify.api import strict_uri_to_model

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
        child_cog = Collectionobjectgroup.objects.filter(
            id=child_cog_id).first()
        child_preps = get_cog_consolidated_preps(child_cog)
        consolidated_preps.extend(child_preps)

    # Get the child CollectionObjects
    collection_objects = Collectionobjectgroupjoin.objects.filter(
        parentcog=cog, childco__isnull=False
    ).values_list("childco", flat=True)

    # For each CollectionObject, get the preparations
    for co in collection_objects:
        consolidated_preps.extend(
            Preparation.objects.filter(collectionobject=co))

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
        cojo = Collectionobjectgroupjoin.objects.filter(
            childcog=top_cog).first()
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
    cogs = Collectionobjectgroup.objects.filter(
        id__in=Subquery(parent_cog_subquery))
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
    cogs = Collectionobjectgroup.objects.filter(
        id__in=Subquery(parent_cog_subquery))
    return cogs


def get_cog_consolidated_preps_co_ids(cog: Collectionobjectgroup) -> Set[Collectionobject]:
    preps = get_cog_consolidated_preps(cog)

    # Return set of distinct CollectionObjectIDs associated with the preparations
    return set(prep.collectionobject.id for prep in preps)


def add_consolidated_sibling_co_ids(request_co_ids: List[Any], id_fld: Optional[str] = None) -> List[Any]:
    """
    Get the consolidated sibling CO IDs of the COs in the list
    """
    cog_sibling_co_ids = set()
    if id_fld is None:
        # id_fld = 'id'
        id_fld = 'catalognumber'
    id_fld = id_fld.lower()
    co_ids = Collectionobject.objects.filter(
        **{f"{id_fld}__in": request_co_ids}).values_list('id', flat=True)
    cogs = get_cogs_from_co_ids(co_ids)
    for cog in cogs:
        cog_sibling_co_ids.update(get_cog_consolidated_preps_co_ids(cog))
    # cog_sibling_co_ids -= set(co_ids)

    cog_sibling_co_idfld_ids = Collectionobject.objects.filter(
        id__in=cog_sibling_co_ids).values_list(id_fld, flat=True)
    return list(set(request_co_ids).union(set(cog_sibling_co_idfld_ids)))


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
        Collectionobjectgroupjoin.objects.filter(
            parentcog=cog).values_list("childco", flat=True)
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
                    sibling_preps = get_all_sibling_preps_within_consolidated_cog(
                        prep)
                    prep_to_sibling_preps[prep_id] = {
                        p.id for p in sibling_preps}
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
    interaction_prep_name = None
    InteractionPrepModel = None
    filter_fld = None
    if original_interaction_obj is None:
        return updated_interaction_data
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
            # BUG: the preparation can be provided as an object in the request
            strict_uri_to_model(
                interaction_prep["preparation"], "preparation")[1]
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
        # BUG: the preparation can be provided as a dict in the request
        and strict_uri_to_model(interaction_prep["preparation"], 'preparation')[1] not in removed_prep_ids
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
    updated_interaction_data[interaction_prep_name].extend(
        unassociated_prep_data)

    return updated_interaction_data


def modify_update_of_loan_return_sibling_preps(original_interaction_obj, updated_interaction_data):
    if 'loanpreparations' not in updated_interaction_data:
        return updated_interaction_data

    # Parse and map loan preparation data
    map_prep_id_to_loan_prep_idx = {}  # Map preparation ID to loan preparation index
    map_prep_id_to_loan_prep_id = {}  # Map preparation ID to loan preparation ID
    # Map preparation ID to new loan return preparation data
    map_prep_id_to_new_loan_return_prep_data = {}
    # Preparations that the user explicitly requested to create a new loan return record
    target_preps = set()
    # Preparation IDs that the user explicitly requested to create a new loan return record
    target_prep_ids = set()
    loan_prep_idx = 0
    for loan_prep_data in updated_interaction_data["loanpreparations"]:
        if type(loan_prep_data) is str:
            continue
        loan_prep_id = int(
            loan_prep_data["id"]) if "id" in loan_prep_data.keys() else None

        # BUG: the preparation can be provided as a dict in the request
        prep_uri = loan_prep_data["preparation"] if "preparation" in loan_prep_data.keys(
        ) else None
        _, prep_id = strict_uri_to_model(
            prep_uri, "preparation") if prep_uri is not None else [None, None]
        map_prep_id_to_loan_prep_idx[prep_id] = loan_prep_idx
        loan_prep_idx += 1
        loan_return_prep_data_lst = (
            loan_prep_data["loanreturnpreparations"]
            if "loanreturnpreparations" in loan_prep_data.keys()
            else []
        )

        # Continue if the loan preparation has no new loan return preparation data,
        # or if there are more than one loan return preparation data (consolidated COG prep have no partial returns)
        if (
            loan_return_prep_data_lst is None
            or len(loan_return_prep_data_lst) != 1
            or "id" in loan_return_prep_data_lst[0].keys()
        ):
            continue

        loan_return_prep_data = loan_return_prep_data_lst[0]
        # BUG: the loanpreparation can be provided as an object in the request
        loan_return_loan_prep_id = strict_uri_to_model(
            loan_return_prep_data["loanpreparation"], "loanpreparation")[1]
        if loan_return_loan_prep_id == loan_prep_id:
            target_prep_ids.update({prep_id})
            prep = Preparation.objects.filter(id=prep_id).first()
            if prep is not None:
                target_preps.update({prep})
                map_prep_id_to_loan_prep_id[prep_id] = loan_prep_id
                map_prep_id_to_new_loan_return_prep_data[prep_id] = loan_return_prep_data
        else:
            loan_prep = Loanpreparation.objects.filter(
                id=loan_return_loan_prep_id).first()
            prep = loan_prep.preparation if loan_prep is not None else None
            if prep is not None:
                target_prep_ids.update({prep.id})
                target_preps.update({prep})

    # Get the sibling preparations
    # Map sibling preparation ID to original preparation IDs
    map_sibling_prep_ids_to_original_prep_ids = {}
    # Set of consolidated target preparations with siblings
    consolidated_target_preps_with_siblings = set()
    for target_prep in target_preps:
        sibling_preps = get_all_sibling_preps_within_consolidated_cog(
            target_prep)
        if sibling_preps is None or len(sibling_preps) == 0 or target_prep.id is None:
            continue
        consolidated_target_preps_with_siblings.update({target_prep})
        for sibling_prep in sibling_preps:
            if sibling_prep.id not in map_sibling_prep_ids_to_original_prep_ids.keys():
                map_sibling_prep_ids_to_original_prep_ids[sibling_prep.id] = set({
                                                                                 target_prep.id})
            else:
                map_sibling_prep_ids_to_original_prep_ids[sibling_prep.id].update({
                                                                                  target_prep.id})

    sibling_prep_ids = set(map_sibling_prep_ids_to_original_prep_ids.keys())
    added_prep_ids = sibling_prep_ids - target_prep_ids
    new_loan_return_prep_ids = {
        prep_id for prep_id in added_prep_ids if prep_id in map_prep_id_to_loan_prep_idx.keys()}

    # Set all the consolidated target loan returns to the max returned and resolved quantity
    for prep in consolidated_target_preps_with_siblings:
        if get_the_top_consolidated_parent_cog_of_prep(prep) is None:
            continue
        loan_prep = Loanpreparation.objects.filter(preparation=prep).first()
        loan_prep_idx = map_prep_id_to_loan_prep_idx[prep.id]
        updated_interaction_data["loanpreparations"][loan_prep_idx][
            "loanreturnpreparations"
        ][-1]["quantityreturned"] = loan_prep.quantity
        updated_interaction_data["loanpreparations"][loan_prep_idx][
            "loanreturnpreparations"
        ][-1]["quantityresolved"] = loan_prep.quantity

    # Create new loan return preparation data
    for prep_id in new_loan_return_prep_ids:
        loan_prep_idx = map_prep_id_to_loan_prep_idx[prep_id]

        # Determine the original loan return preparation data that this new sibling loan return preparation data should be based on
        orginal_prep_ids = map_sibling_prep_ids_to_original_prep_ids[prep_id]
        original_loan_prep_idx = None
        original_loan_prep_data = None
        original_loan_return_data_lst = None
        original_loan_return_data = None
        if len(orginal_prep_ids) < 1:
            continue
        if len(orginal_prep_ids) > 1:
            logger.warning("Multiple partial loan returns found for this consolidated COG preparation.")
        original_prep_id = orginal_prep_ids.pop()
        original_loan_prep_idx = map_prep_id_to_loan_prep_idx[original_prep_id]
        original_loan_prep_data = updated_interaction_data["loanpreparations"][original_loan_prep_idx]
        original_loan_return_data_lst = original_loan_prep_data["loanreturnpreparations"]
        original_loan_return_data = (
            original_loan_return_data_lst[-1]
            if original_loan_return_data_lst is not None
            and len(original_loan_return_data_lst) > 0
            else None
        )

        # Set the return and resolved quantity to the max amount.
        # In the future, maybe have more complex logic for partial returns/resolves of consolidated cogs.
        loan_prep_data_lst = updated_interaction_data["loanpreparations"]
        loan_prep_idx = map_prep_id_to_loan_prep_idx[prep_id]
        loan_prep_data = loan_prep_data_lst[loan_prep_idx]
        loan_prep_max_quantity = loan_prep_data_lst[loan_prep_idx]["quantity"]
        quantity_returned = loan_prep_max_quantity
        quantity_resolved = loan_prep_max_quantity

        # Add new loan return preparation data to the loan prep
        loan_prep_id = loan_prep_data["id"]

        # BUG: the discipline can be provided as an object in the request
        discipline_uri = (
            loan_prep_data["discipline"]
            if original_loan_return_data is not None
            else original_loan_return_data["discipline"]
        )
        return_date = (
            original_loan_return_data["returneddate"]
            if "returneddate" in original_loan_return_data.keys()
            else None
        )
        # BUG: the receivedby can be provided as an object in the request
        received_by_agent_uri = (  # Use the target agent, but review this, maybe use this sibling prep's loan agent?
            original_loan_return_data["receivedby"]
            if "receivedby" in original_loan_return_data.keys()
            else None
        )
        new_loan_return_data = {
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

    # Recalculate the total quantity returned and resolved for the loan preparation
    # based on the modified loan return preparation data.
    for loan_prep_idx in range(len(updated_interaction_data["loanpreparations"])):
        if type(updated_interaction_data["loanpreparations"]) is str:
            continue
        loan_return_data = (
            updated_interaction_data["loanpreparations"][loan_prep_idx][
                "loanreturnpreparations"
            ]
            if "loanreturnpreparations"
            in updated_interaction_data["loanpreparations"][loan_prep_idx].keys()
            else []
        )
        total_quantity_returned = sum(
            [loan_return["quantityreturned"] for loan_return in loan_return_data])
        total_quantity_resolved = sum(
            [loan_return["quantityresolved"] for loan_return in loan_return_data])
        updated_interaction_data["loanpreparations"][loan_prep_idx]["quantityresolved"] = total_quantity_resolved
        updated_interaction_data["loanpreparations"][loan_prep_idx]["quantityreturned"] = total_quantity_returned

        # Set the modified loan prep isresolved to True if all the preparations are resolved
        prep_uri = (
            updated_interaction_data["loanpreparations"][loan_prep_idx]["preparation"]
            if "preparation"
            in updated_interaction_data["loanpreparations"][loan_prep_idx].keys()
            else None
        )
        prep_id = strict_uri_to_model(prep_uri, "preparation")[1] if prep_uri is not None else None
        if prep_id in sibling_prep_ids or prep_id in new_loan_return_prep_ids or prep_id in target_prep_ids:
            quantity = updated_interaction_data["loanpreparations"][loan_prep_idx]["quantity"]
            if total_quantity_resolved >= quantity:
                updated_interaction_data["loanpreparations"][loan_prep_idx]["isresolved"] = True

    # NOTE: Maybe handle removed sibling preparations after removing an existing loan return preparation

    return updated_interaction_data

def enforce_interaction_sibling_prep_max_count(interaction_obj):
    def get_interaction_prep_model_and_filter_field(interaction_obj):
        model_map = {
            'loan': (Loanpreparation, 'loan', 'loanpreparations__id'),
            'gift': (Giftpreparation, 'gift', 'giftpreparations__id'),
            'disposal': (Disposalpreparation, 'disposal', 'disposalpreparations__id'),
        }
        return model_map.get(interaction_obj._meta.model_name, (None, None, None))

    def is_max_quantity_used(sibling_preps, interaction_prep_id, interaction_prep_ids, prep_id_fld, InteractionPrepModel):
        for sibling_prep in sibling_preps:
            if sibling_prep.id not in interaction_prep_ids:
                continue
            # count = sibling_prep.countamt
            available_count = get_availability_count(sibling_prep, interaction_prep_id, prep_id_fld) or 0
            interaction_sibling_prep = InteractionPrepModel.objects.filter(preparation=sibling_prep).first()
            if interaction_sibling_prep and interaction_sibling_prep.quantity == available_count:
                return True
        return False

    if interaction_obj is None:
        return interaction_obj

    InteractionPrepModel, filter_fld, id_fld = get_interaction_prep_model_and_filter_field(interaction_obj)
    if InteractionPrepModel is None:
        return interaction_obj

    interaction_preps = InteractionPrepModel.objects.filter(**{filter_fld: interaction_obj})
    interaction_prep_ids = set(interaction_preps.values_list("preparation_id", flat=True))

    for interaction_prep in interaction_preps:
        prep = interaction_prep.preparation
        sibling_preps = get_all_sibling_preps_within_consolidated_cog(prep)

        if is_max_quantity_used(
            sibling_preps, interaction_prep.id, interaction_prep_ids, id_fld, InteractionPrepModel
        ) or (sibling_preps is not None and len(sibling_preps) > 0):
            if interaction_prep.quantity == interaction_prep.preparation.countamt:
                continue
            available_count = get_availability_count(prep, interaction_prep.id, "loanpreparations__id") or 0
            interaction_prep.quantity = available_count
            interaction_prep.save()

    return interaction_obj

def get_availability_count(prep, iprepid, iprepid_fld):
    loan_filter = Q()
    gift_filter = Q()
    exchange_filter = Q()

    if iprepid is not None and iprepid_fld:
        if iprepid_fld.startswith('loanpreparations__'):
            loan_filter = ~Q(**{iprepid_fld: iprepid})
        elif iprepid_fld.startswith('giftpreparations__'):
            gift_filter = ~Q(**{iprepid_fld: iprepid})
        elif iprepid_fld.startswith('exchangeoutpreps__'):
            exchange_filter = ~Q(**{iprepid_fld: iprepid})
        else:
            loan_filter = ~Q(**{iprepid_fld: iprepid})
            gift_filter = ~Q(**{iprepid_fld: iprepid})
            exchange_filter = ~Q(**{iprepid_fld: iprepid})

    qs = (prep.__class__.objects
          .filter(id=prep.id)
          .annotate(
              loan_sum=Coalesce(
                  Sum(
                      ExpressionWrapper(
                          F('loanpreparations__quantity') - F('loanpreparations__quantityresolved'),
                          output_field=IntegerField()
                      ),
                      filter=loan_filter
                  ),
                  Value(0),
                  output_field=IntegerField()
              ),
              gift_sum=Coalesce(
                  Sum('giftpreparations__quantity', filter=gift_filter, output_field=IntegerField()),
                  Value(0),
                  output_field=IntegerField()
              ),
              exchange_sum=Coalesce(
                  Sum('exchangeoutpreps__quantity', filter=exchange_filter, output_field=IntegerField()),
                  Value(0),
                  output_field=IntegerField()
              ),
          )
          .values('countamt', 'loan_sum', 'gift_sum', 'exchange_sum')
         )

    row = qs.first()
    if row is None:
        return prep.countamt
    else:
        return row['countamt'] - row['loan_sum'] - row['gift_sum'] - row['exchange_sum']
