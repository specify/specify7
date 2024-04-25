import logging

from typing import Dict, Any

from django.db.models import Count, Sum

from . import models

logger = logging.getLogger(__name__)

def get_model(name: str):
    """Fetch an ORM model from the module dynamically so that
    the typechecker doesn't complain.
    """
    return getattr(models, name.capitalize())

def calculate_quantity(obj, field_name: str) -> int:
    return obj.aggregate(total=Sum(field_name))["total"] or 0

def calculate_actual_count(obj, preparations):
    actualTotalCountAmt = 0
    for prep in preparations:
        giftpreparation_quantity = calculate_quantity(prep.giftpreparations, "quantity")
        exchangeoutprep_quantity = calculate_quantity(prep.exchangeoutpreps, "quantity")
        disposalpreparation_quantity = calculate_quantity(prep.disposalpreparations, "quantity")

        countamt = obj.countamt or 0
        available = max(0, countamt - giftpreparation_quantity - exchangeoutprep_quantity - disposalpreparation_quantity)
        actualTotalCountAmt += available
    return actualTotalCountAmt

def calculate_totals_deaccession(obj, model_name, related_field_name):
    Model = get_model(model_name)
    totalPreps = Model.objects.filter(deaccession=obj).count()
    totalItems = Model.objects.filter(deaccession=obj).aggregate(
        total=Sum(f"{related_field_name}__quantity"))["total"] or 0
    return totalPreps, totalItems

def calc_prep_item_count(obj, model_name, extra):
    model_preparations = getattr(obj, f"{model_name.lower()}preparations")
    extra["totalPreps"] = model_preparations.count()
    extra["totalItems"] = model_preparations.aggregate(total=Sum("quantity"))["total"] or 0
    return extra

def calculate_extra_fields(obj, data: Dict[str, Any]) -> Dict[str, Any]:
    extra: Dict[str, Any] = {}

    if isinstance(obj, get_model("Preparation")):
        preparations = [obj]
        actualCountAmt = calculate_actual_count(obj, preparations)
        extra["actualCountAmt"] = int(actualCountAmt)
        extra["isonloan"] = obj.isonloan()

    elif isinstance(obj, get_model("Specifyuser")):
        extra["isadmin"] = obj.userpolicy_set.filter(
            collection=None, resource="%", action="%"
        ).exists()

    elif isinstance(obj, get_model("Collectionobject")):
        preparations = obj.preparations.all()
        totalCountAmt = calculate_quantity(preparations, "countamt")

        actualTotalCountAmt = calculate_actual_count(obj, preparations)
        extra["actualTotalCountAmt"] = int(actualTotalCountAmt)
        extra["totalCountAmt"] = int(totalCountAmt)

        dets = data["determinations"] or []
        extra["currentdetermination"] = next(
            (det["resource_uri"] for det in dets if det["iscurrent"]), None
        )

    elif isinstance(obj, get_model("Loan")):
        preps = data["loanpreparations"]
        items = 0
        quantities = 0
        unresolvedItems = 0
        unresolvedQuantities = 0
        for prep in preps:
            items = items + 1
            prep_quantity = prep["quantity"] if prep["quantity"] is not None else 0
            prep_quantityresolved = (
                prep["quantityresolved"] if prep["quantityresolved"] is not None else 0
            )
            quantities = quantities + prep_quantity
            if not prep["isresolved"]:
                unresolvedItems = unresolvedItems + 1
                unresolvedQuantities = unresolvedQuantities + (
                    prep_quantity - prep_quantityresolved
                )
        extra["totalPreps"] = items
        extra["totalItems"] = quantities
        extra["unresolvedPreps"] = unresolvedItems
        extra["unresolvedItems"] = unresolvedQuantities
        extra["resolvedPreps"] = items - unresolvedItems
        extra["resolvedItems"] = quantities - unresolvedQuantities

    elif isinstance(obj, get_model("Accession")):
        Preparation = get_model("Preparation")
        preparations = Preparation.objects.filter(collectionobject__accession=obj)
        preparationCount = preparations.count()
        totalCountAmt = calculate_quantity(preparations, "countamt")

        actualTotalCountAmt = calculate_actual_count(obj, preparations)
        extra["actualTotalCountAmt"] = int(actualTotalCountAmt)
        extra["totalCountAmt"] = int(totalCountAmt)
        extra["preparationCount"] = preparationCount
        extra.update(obj.collectionobjects.aggregate(collectionObjectCount=Count("id")))

    elif isinstance(obj, get_model("Disposal")):
        extra = calc_prep_item_count(obj, "disposal", extra)

    elif isinstance(obj, get_model("Gift")):
        extra = calc_prep_item_count(obj, "gift", extra)

    elif isinstance(obj, get_model("ExchangeOut")):
        extra = calc_prep_item_count(obj, "exchangeout", extra)

    elif isinstance(obj, get_model("Deaccession")):
        totalPreps_disposals, totalItems_disposals = calculate_totals_deaccession(obj, "Disposal", "disposalpreparations")
        totalPreps_exchangeouts, totalItems_exchangeouts = calculate_totals_deaccession(obj, "ExchangeOut", "exchangeoutpreps")
        totalPreps_gifts, totalItems_gifts = calculate_totals_deaccession(obj, "Gift", "giftpreparations")

        # sum up all totalItems of disposals, exchangeouts and gifts
        extra["totalPreps"] = totalPreps_disposals + totalPreps_exchangeouts + totalPreps_gifts
        extra["totalItems"] = totalItems_disposals + totalItems_exchangeouts + totalItems_gifts

    return extra
