import logging

from typing import Dict, Any, List

from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce

from . import models

logger = logging.getLogger(__name__)

def get_model(name: str):
    """Fetch an ORM model from the module dynamically so that
    the typechecker doesn't complain.
    """
    return getattr(models, name.capitalize())

GiftPreparation = get_model('GiftPreparation')
ExchangeOutPrep = get_model('ExchangeOutPrep')
DisposalPreparation = get_model('DisposalPreparation')
Preparation = get_model('Preparation')

def calculate_totals_deaccession(obj, model_name, related_field_name):
    Model = get_model(model_name)
    total_preps = Model.objects.filter(deaccession=obj).count()
    total_items = Model.objects.filter(deaccession=obj).aggregate(
        total=Sum(f"{related_field_name}__quantity"))["total"] or 0
    return total_preps, total_items

def calc_prep_item_count(obj, prep_field_name, extra):
    model_preparations = getattr(obj, prep_field_name)
    extra["totalPreps"] = model_preparations.count()
    extra["totalItems"] = model_preparations.aggregate(total=Sum("quantity"))["total"] or 0
    return extra

def calculate_extra_fields(obj, data: Dict[str, Any]) -> Dict[str, Any]:
    extra: Dict[str, Any] = {}

    if isinstance(obj, get_model("Preparation")):
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

    elif isinstance(obj, get_model("Specifyuser")):
        extra["isadmin"] = obj.userpolicy_set.filter(
            collection=None, resource="%", action="%"
        ).exists()

    elif isinstance(obj, get_model("Collectionobject")):
        preparations = obj.preparations.all()
        total_count_amount = preparations.aggregate(total=Coalesce(Sum('countamt'), Value(0)))['total']

        # Calculate the sums for all preparations at once
        giftpreparation_sums = GiftPreparation.objects.filter(
            preparation__in=preparations
        ).values('preparation').annotate(total=Coalesce(Sum('quantity'), Value(0)))

        exchangeoutprep_sums = ExchangeOutPrep.objects.filter(
            preparation__in=preparations
        ).values('preparation').annotate(total=Coalesce(Sum('quantity'), Value(0)))

        disposalpreparation_sums = DisposalPreparation.objects.filter(
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

    elif isinstance(obj, get_model("Loan")):
        preps = data["loanpreparations"]
        prep_count = len(preps)
        quantities = sum(prep.get('quantity', 0) for prep in preps)
        unresolved_prep_count = sum(not prep["isresolved"] for prep in preps)
        unresolved_quantities = sum(
            (prep.get("quantity", 0) - prep.get("quantityresolved", 0))
            * (not prep["isresolved"])
            for prep in preps
        )

        extra["totalPreps"] = prep_count
        extra["totalItems"] = quantities
        extra["unresolvedPreps"] = unresolved_prep_count
        extra["unresolvedItems"] = unresolved_quantities
        extra["resolvedPreps"] = prep_count - unresolved_prep_count
        extra["resolvedItems"] = quantities - unresolved_quantities

    elif isinstance(obj, get_model('Accession')):
        # Calculate the quantities for giftpreparation, exchangeoutprep, and disposalpreparation
        gp_quantity = (
            GiftPreparation.objects.filter(
                preparation__collectionobject__accession__id=obj.id
            ).aggregate(total=Sum("quantity"))["total"]
            or 0
        )
        ep_quantity = (
            ExchangeOutPrep.objects.filter(
                preparation__collectionobject__accession__id=obj.id
            ).aggregate(total=Sum("quantity"))["total"]
            or 0
        )
        dp_quantity = (
            DisposalPreparation.objects.filter(
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

    elif isinstance(obj, get_model("Disposal")):
        extra = calc_prep_item_count(obj, "disposalpreparations", extra)

    elif isinstance(obj, get_model("Gift")):
        extra = calc_prep_item_count(obj, "giftpreparations", extra)

    elif isinstance(obj, get_model("ExchangeOut")):
        extra = calc_prep_item_count(obj, "exchangeoutpreps", extra)

    elif isinstance(obj, get_model("Deaccession")):
        total_preps_disposals, total_items_disposals = calculate_totals_deaccession(
            obj, "Disposal", "disposalpreparations"
        )
        total_preps_exchangeouts, total_items_exchangeouts = calculate_totals_deaccession(
            obj, "ExchangeOut", "exchangeoutpreps"
        )
        total_preps_gifts, total_items_gifts = calculate_totals_deaccession(
            obj, "Gift", "giftpreparations"
        )

        # sum up all totalItems of disposals, exchangeouts and gifts
        extra["totalPreps"] = total_preps_disposals + total_preps_exchangeouts + total_preps_gifts
        extra["totalItems"] = total_items_disposals + total_items_exchangeouts + total_items_gifts

    return extra
