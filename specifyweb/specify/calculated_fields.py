import logging

from typing import Dict, Any

from django.db.models import Count, Sum
from django.db import connection

from . import models

logger = logging.getLogger(__name__)

def get_model(name: str):
    """Fetch an ORM model from the module dynamically so that
    the typechecker doesn't complain.
    """
    return getattr(models, name.capitalize())

def calculate_extra_fields(obj, data: Dict[str, Any]) -> Dict[str, Any]:
    extra: Dict[str, Any] = {}
    cursor = connection.cursor()

    if isinstance(obj, get_model("Preparation")):
        giftpreparation_quantity = obj.giftpreparations.aggregate(total=Sum("quantity"))["total"] or 0
        exchangeoutprep_quantity = obj.exchangeoutpreps.aggregate(total=Sum("quantity"))["total"] or 0
        disposalpreparation_quantity = obj.disposalpreparations.aggregate(total=Sum("quantity"))["total"] or 0

        actualCountAmt = obj.countamt - giftpreparation_quantity - exchangeoutprep_quantity - disposalpreparation_quantity

        extra["actualCountAmt"] = int(actualCountAmt)
        extra["isonloan"] = obj.isonloan()

    elif isinstance(obj, get_model("Specifyuser")):
        extra["isadmin"] = obj.userpolicy_set.filter(
            collection=None, resource="%", action="%"
        ).exists()

    elif isinstance(obj, get_model("Collectionobject")):
        preparations = obj.preparations.all()
        totalCountAmt = preparations.aggregate(total=Sum("countamt"))["total"] or 0

        actualTotalCountAmt = 0
        for prep in preparations:
            giftpreparation_quantity = prep.giftpreparations.aggregate(total=Sum("quantity"))["total"] or 0
            exchangeoutprep_quantity = prep.exchangeoutpreps.aggregate(total=Sum("quantity"))["total"] or 0
            disposalpreparation_quantity = prep.disposalpreparations.aggregate(total=Sum("quantity"))["total"] or 0

            available = max(0, prep.countamt - giftpreparation_quantity - exchangeoutprep_quantity - disposalpreparation_quantity)
            actualTotalCountAmt += available

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
        totalCountAmt = preparations.aggregate(total=Sum("countamt"))["total"] or 0

        actualTotalCountAmt = 0
        for prep in preparations:
            giftpreparation_quantity = prep.giftpreparations.aggregate(total=Sum("quantity"))["total"] or 0
            exchangeoutprep_quantity = prep.exchangeoutpreps.aggregate(total=Sum("quantity"))["total"] or 0
            disposalpreparation_quantity = prep.disposalpreparations.aggregate(total=Sum("quantity"))["total"] or 0

            available = max(0, prep.countamt - giftpreparation_quantity - exchangeoutprep_quantity - disposalpreparation_quantity)
            actualTotalCountAmt += available

        extra["actualTotalCountAmt"] = int(actualTotalCountAmt)
        extra["totalCountAmt"] = int(totalCountAmt)
        extra["preparationCount"] = preparationCount
        extra.update(obj.collectionobjects.aggregate(collectionObjectCount=Count("id")))

    elif isinstance(obj, get_model("Disposal")):
        extra["totalPreps"] = obj.disposalpreparations.count()
        extra["totalItems"] = obj.disposalpreparations.aggregate(total=Sum("quantity"))["total"] or 0

    elif isinstance(obj, get_model("Gift")):
        extra["totalPreps"] = obj.giftpreparations.count()
        extra["totalItems"] = obj.giftpreparations.aggregate(total=Sum("quantity"))["total"] or 0

    elif isinstance(obj, get_model("ExchangeOut")):
        extra["totalPreps"] = obj.exchangeoutpreps.count()
        extra["totalItems"] = obj.exchangeoutpreps.aggregate(total=Sum("quantity"))["total"]

    elif isinstance(obj, get_model("Deaccession")):
        disposals = data["disposals"]
        exchangeouts = data["exchangeouts"]
        gifts = data["gifts"]
        # sum up all totalPreps of disposals, exchangeouts and gifts
        extra["totalPreps"] = sum(obj["totalPreps"] for obj in disposals) + \
            sum(obj["totalPreps"] for obj in exchangeouts) + \
                sum(obj["totalPreps"] for obj in gifts)

        # sum up all totalItems of disposals, exchangeouts and gifts
        extra["totalItems"] = sum(obj["totalItems"] for obj in disposals if obj["totalItems"] is not None) + \
            sum(obj["totalItems"] for obj in exchangeouts if obj["totalItems"] is not None) + \
                sum(obj["totalItems"] for obj in gifts if obj["totalItems"] is not None)

    return extra
