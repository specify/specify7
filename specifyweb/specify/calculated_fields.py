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

    if isinstance(obj, get_model('Preparation')):
        cursor.execute("""
   select coalesce(
      p.countamt
      - (select coalesce(sum(gp.quantity), 0) from giftpreparation gp where gp.preparationid = p.preparationid and gp.quantity is not null)
      - (select coalesce(sum(ep.quantity), 0) from exchangeoutprep ep where ep.preparationid = p.preparationid and ep.quantity is not null)
      - (select coalesce(sum(dp.quantity), 0) from disposalpreparation dp where dp.preparationid = p.preparationid and dp.quantity is not null),
      0) as ActualCountAmt
   from preparation p
   where preparationid = %s
""", [obj.id])
        actualCountAmt, = cursor.fetchone()

        extra['actualCountAmt'] = int(actualCountAmt)
        extra['isonloan'] = obj.isonloan()

    elif isinstance(obj, get_model('Specifyuser')):
        extra['isadmin'] = obj.userpolicy_set.filter(collection=None, resource='%', action='%').exists()

    elif isinstance(obj, get_model('Collectionobject')):
        cursor.execute("""
select coalesce(sum(countamt), 0) as TotalCountAmt, coalesce(sum(available), 0) as ActualTotalCountAmt from (
   select
   coalesce(p.countamt, 0) as countamt, -- assume countamt >= 0
   greatest(0, coalesce(  -- the greatest function ensures that if the available amount for some prep goes < 0 it doesn't count againts others
      p.countamt
      - (select coalesce(sum(gp.quantity), 0) from giftpreparation gp where gp.preparationid = p.preparationid and gp.quantity is not null)
      - (select coalesce(sum(ep.quantity), 0) from exchangeoutprep ep where ep.preparationid = p.preparationid and ep.quantity is not null)
      - (select coalesce(sum(dp.quantity), 0) from disposalpreparation dp where dp.preparationid = p.preparationid and dp.quantity is not null),
      0
   )) as available
   from preparation p
   where collectionobjectid = %s
) available_by_prep
""", [obj.id])
        totalCountAmt, actualTotalCountAmt = cursor.fetchone()
        extra["actualTotalCountAmt"] = int(actualTotalCountAmt)
        extra["totalCountAmt"] = int(totalCountAmt)

        dets = data['determinations'] or []
        extra['currentdetermination'] = next((det['resource_uri'] for det in dets if det['iscurrent']), None)

    elif isinstance(obj, get_model('Loan')):
        preps = data['loanpreparations']
        items = 0
        quantities = 0
        unresolvedItems = 0
        unresolvedQuantities = 0
        for prep in preps:
            items = items + 1;
            prep_quantity = prep['quantity'] if prep['quantity'] is not None else 0
            prep_quantityresolved = prep['quantityresolved'] if prep['quantityresolved'] is not None else 0
            quantities = quantities + prep_quantity
            if not prep['isresolved']:
                unresolvedItems = unresolvedItems + 1;
                unresolvedQuantities = unresolvedQuantities + (prep_quantity - prep_quantityresolved)
        extra['totalPreps'] = items
        extra['totalItems'] = quantities
        extra['unresolvedPreps'] = unresolvedItems
        extra['unresolvedItems'] = unresolvedQuantities
        extra['resolvedPreps'] = items - unresolvedItems
        extra['resolvedItems'] = quantities - unresolvedQuantities

    elif isinstance(obj, get_model('Accession')):
        cursor.execute("""
select count(id) as PreparationCount, coalesce(sum(countamt), 0) as TotalCountAmt, coalesce(sum(available), 0) as ActualTotalCountAmt from (
   select
   p.preparationid as id,
   coalesce(p.countamt, 0) as countamt, -- assume countamt >= 0
   greatest(0, coalesce(  -- the greatest function ensures that if the available amount for some prep goes < 0 it doesn't count againts others
      p.countamt
      - (select coalesce(sum(gp.quantity), 0) from giftpreparation gp where gp.preparationid = p.preparationid and gp.quantity is not null)
      - (select coalesce(sum(ep.quantity), 0) from exchangeoutprep ep where ep.preparationid = p.preparationid and ep.quantity is not null)
      - (select coalesce(sum(dp.quantity), 0) from disposalpreparation dp where dp.preparationid = p.preparationid and dp.quantity is not null),
      0
   )) as available
   from preparation p
   join collectionobject using (collectionobjectid)
   where accessionid = %s
) available_by_prep
""", [obj.id])

        preparationCount, totalCountAmt, actualTotalCountAmt = cursor.fetchone()
        extra["actualTotalCountAmt"] = int(actualTotalCountAmt)
        extra["totalCountAmt"] = int(totalCountAmt)
        extra["preparationCount"] = preparationCount
        extra.update(obj.collectionobjects.aggregate(collectionObjectCount=Count('id')))

    return extra


