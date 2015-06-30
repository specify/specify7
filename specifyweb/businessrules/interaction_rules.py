from .orm_signal_handler import orm_signal_handler
from specifyweb.specify import models
from .exceptions import BusinessRuleException
from django.db import connection
from specify.api import parse_uri

def get_availability(prep, iprepid, iprepid_fld):
    args = [prep.id]
    sql = """
    select p.countAmt - coalesce(sum(lp.quantity-lp.quantityresolved),0) - coalesce(sum(gp.quantity),0) - coalesce(sum(ep.quantity),0) 
    from preparation p
    left join loanpreparation lp on lp.preparationid = p.preparationid
    left join giftpreparation gp on gp.preparationid = p.preparationid
    left join exchangeoutprep ep on ep.PreparationID = p.PreparationID
    where p.preparationid = %s """
    if not (iprepid is None):
        sql += "and " + iprepid_fld + " != %s "               
        args.append(iprepid)
        
    sql += "group by p.preparationid"

    cursor = connection.cursor()
    cursor.execute(sql, args)
    row = cursor.fetchone()
    if row is None:
        return prep.countamt
    else:
        return row[0];
   
@orm_signal_handler('pre_save', 'Loanpreparation')
def loanprep_quantity_must_be_lte_availability(ipreparation):
    available = get_availability(ipreparation.preparation, ipreparation.id, "loanpreparationid")
    if available < (ipreparation.quantity - ipreparation.quantityresolved):
        raise BusinessRuleException("loan preparation quantity exceeds availability" \
                                    + "(" + str(ipreparation.id) + ": " + str(ipreparation.quantity - ipreparation.quantityresolved) + " " + str(available) + ")")

@orm_signal_handler('pre_save', 'Giftpreparation')
def giftprep_quantity_must_be_lte_availability(ipreparation):
    available = get_availability(ipreparation.preparation, ipreparation.id, "giftpreparationid")
    if available < ipreparation.quantity:
        raise BusinessRuleException("gift preparation quantity exceeds availability")

@orm_signal_handler('pre_save', 'Exchangeoutprep')
def exchangeoutprep_quantity_must_be_lte_availability(ipreparation):
    available = get_availability(ipreparation.preparation, ipreparation.id, "exchangeoutprepid")
    if available < ipreparation.quantity:
        raise BusinessRuleException("exchangeout preparation quantity exceeds availability")
