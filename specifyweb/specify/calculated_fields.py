import logging

from typing import Dict, Any, List

from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce

# from . import models
from specifyweb.specify.models import (
    Giftpreparation,
    Exchangeoutprep,
    Disposalpreparation,
    Preparation,
    Disposal,
    Exchangeout,
    Gift,
    Specifyuser,
    Collectionobject,
    Loan,
    Deaccession,
    Accession,
    CollectionObjectGroupJoin,
)

logger = logging.getLogger(__name__)

def calculate_totals_deaccession(obj, Model, related_field_name):
    total_preps = 0
    total_items = 0
    for prep in Model.objects.filter(deaccession=obj):
        counts = calc_prep_item_count(prep, related_field_name, {})
        total_preps += counts["totalPreps"]
        total_items += counts["totalItems"]
    
    return total_preps, total_items

def calc_prep_item_count(obj, prep_field_name, extra):
    model_preparations = getattr(obj, prep_field_name)
    extra["totalPreps"] = model_preparations.count()
    extra["totalItems"] = model_preparations.aggregate(total=Sum("quantity"))["total"] or 0
    return extra

def calculate_extra_fields(obj, data: Dict[str, Any]) -> Dict[str, Any]:
    extra: Dict[str, Any] = {}

    if isinstance(obj, Preparation):
        # Calculate the preperation sums
        giftpreparation_sum = obj.giftpreparations.aggregate(total=Coalesce(Sum('quantity'), Value(0)))['total']
        exchangeoutprep_sum = obj.exchangeoutpreps.aggregate(total=Coalesce(Sum('quantity'), Value(0)))['total']
        disposalpreparation_sum = obj.disposalpreparations.aggregate(total=Coalesce(Sum('quantity'), Value(0)))['total']

        # Calculate the actual count
        actual_count_amount = max(
            0,
            (obj.countamt or 0)
            - giftpreparation_sum
            - exchangeoutprep_sum
            - disposalpreparation_sum,
        )

        extra["actualCountAmt"] = actual_count_amount
        extra["isonloan"] = obj.isonloan()

    elif isinstance(obj, Specifyuser):
        extra["isadmin"] = obj.is_admin()

    elif isinstance(obj, Collectionobject):
        preparations = obj.preparations.all()
        total_count_amount = preparations.aggregate(total=Coalesce(Sum('countamt'), Value(0)))['total']

        # Calculate the sums for all preparations at once
        giftpreparation_sums = Giftpreparation.objects.filter(
            preparation__in=preparations
        ).values('preparation').annotate(total=Coalesce(Sum('quantity'), Value(0)))

        exchangeoutprep_sums = Exchangeoutprep.objects.filter(
            preparation__in=preparations
        ).values('preparation').annotate(total=Coalesce(Sum('quantity'), Value(0)))

        disposalpreparation_sums = Disposalpreparation.objects.filter(
            preparation__in=preparations
        ).values('preparation').annotate(total=Coalesce(Sum('quantity'), Value(0)))

        # Convert the sums to dictionaries for faster access
        giftpreparation_sums = {item['preparation']: item['total'] for item in giftpreparation_sums}
        exchangeoutprep_sums = {item['preparation']: item['total'] for item in exchangeoutprep_sums}
        disposalpreparation_sums = {item['preparation']: item['total'] for item in disposalpreparation_sums}

        # Calculate the available count and the total available count
        extra["actualTotalCountAmt"] = sum(
            max(
                0,
                (prep.countamt or 0)
                - giftpreparation_sums.get(prep.id, 0)
                - exchangeoutprep_sums.get(prep.id, 0)
                - disposalpreparation_sums.get(prep.id, 0),
            )
            for prep in preparations
        )
        extra["totalCountAmt"] = total_count_amount

        dets = data["determinations"] or []
        extra["currentdetermination"] = next(
            (det["resource_uri"] for det in dets if det["iscurrent"]), None
        )

        extra["isMemberOfCOG"] = CollectionObjectGroupJoin.objects.filter(childco=obj).exists()

    elif isinstance(obj, Loan):
        preps = data["loanpreparations"]
        prep_count = len(preps)
        quantities = sum((prep.get('quantity') or 0) for prep in preps)
        unresolved_prep_count = sum(not prep["isresolved"] for prep in preps)
        unresolved_quantities = sum(
            max((prep.get("quantity") or 0) - (prep.get("quantityresolved") or 0), 0)
            * (not prep["isresolved"])
            for prep in preps
        )

        extra["totalPreps"] = prep_count
        extra["totalItems"] = quantities
        extra["unresolvedPreps"] = unresolved_prep_count
        extra["unresolvedItems"] = unresolved_quantities
        extra["resolvedPreps"] = prep_count - unresolved_prep_count
        extra["resolvedItems"] = quantities - unresolved_quantities

    elif isinstance(obj, Accession):
        # Calculate the quantities for giftpreparation, exchangeoutprep, and disposalpreparation
        gp_quantity = (
            Giftpreparation.objects.filter(
                preparation__collectionobject__accession__id=obj.id
            ).aggregate(total=Sum("quantity"))["total"]
            or 0
        )
        ep_quantity = (
            Exchangeoutprep.objects.filter(
                preparation__collectionobject__accession__id=obj.id
            ).aggregate(total=Sum("quantity"))["total"]
            or 0
        )
        dp_quantity = (
            Disposalpreparation.objects.filter(
                preparation__collectionobject__accession__id=obj.id
            ).aggregate(total=Sum("quantity"))["total"]
            or 0
        )

        # Calculate the quantities for preparation
        preparations = Preparation.objects.filter(collectionobject__accession__id=obj.id).aggregate(
            PreparationCount=Count('id'),
            TotalCountAmt=Coalesce(Sum('countamt'), Value(0)),
            ActualTotalCountAmt=Coalesce(Sum('countamt'), Value(0)) - gp_quantity - ep_quantity - dp_quantity
        )

        extra["actualTotalCountAmt"] = int(preparations['ActualTotalCountAmt'])
        extra["totalCountAmt"] = int(preparations['TotalCountAmt'])
        extra["preparationCount"] = preparations['PreparationCount']
        extra.update(obj.collectionobjects.aggregate(collectionObjectCount=Count("id")))

    elif isinstance(obj, Disposal):
        extra = calc_prep_item_count(obj, "disposalpreparations", extra)

    elif isinstance(obj, Gift):
        extra = calc_prep_item_count(obj, "giftpreparations", extra)

    elif isinstance(obj, Exchangeout):
        extra = calc_prep_item_count(obj, "exchangeoutpreps", extra)

    elif isinstance(obj, Deaccession):
        total_preps_disposals, total_items_disposals = calculate_totals_deaccession(
            obj, Disposal, "disposalpreparations"
        )
        total_preps_exchangeouts, total_items_exchangeouts = calculate_totals_deaccession(
            obj, Exchangeout, "exchangeoutpreps"
        )
        total_preps_gifts, total_items_gifts = calculate_totals_deaccession(
            obj, Gift, "giftpreparations"
        )

        # sum up all totalItems of disposals, exchangeouts and gifts
        extra["totalPreps"] = total_preps_disposals + total_preps_exchangeouts + total_preps_gifts
        extra["totalItems"] = total_items_disposals + total_items_exchangeouts + total_items_gifts

    return extra
