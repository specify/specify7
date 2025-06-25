from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.businessrules.exceptions import BusinessRuleException
from django.db import connection


def get_availability(prep, iprepid, iprepid_fld):
    args = [prep.id]
    sql = """
    select p.countAmt - coalesce(sum(lp.quantity-lp.quantityresolved),0) - coalesce(sum(gp.quantity),0) - coalesce(sum(ep.quantity),0) 
    from preparation p
    left join loanpreparation lp on lp.preparationid = p.preparationid
    left join giftpreparation gp on gp.preparationid = p.preparationid
    left join exchangeoutprep ep on ep.PreparationID = p.PreparationID
    where p.preparationid = %s """
    if iprepid is not None:
        sql += "and " + iprepid_fld + " != %s "
        args.append(iprepid)

    sql += "group by p.preparationid"

    cursor = connection.cursor()
    cursor.execute(sql, args)
    row = cursor.fetchone()
    if row is None:
        return prep.countamt
    else:
        return row[0]


@orm_signal_handler('pre_save', 'Loanpreparation')
def loanprep_quantity_must_be_lte_availability(ipreparation):
    if ipreparation.preparation is not None:
        available = get_availability(
            ipreparation.preparation, ipreparation.id, "loanpreparationid") or 0
        quantity = int(ipreparation.quantity) or 0
        quantityresolved = int(ipreparation.quantityresolved) or 0
        if available < (quantity - quantityresolved):
            raise BusinessRuleException(
                f"loan preparation quantity exceeds availability ({ipreparation.id}: {quantity - quantityresolved} {available})",
                {"table": "LoanPreparation",
                 "fieldName": "quantity",
                 "preparationid": ipreparation.id,
                 "quantity": quantity,
                 "quantityresolved": quantityresolved,
                 "available": available})


@orm_signal_handler('pre_save', 'Giftpreparation')
def giftprep_quantity_must_be_lte_availability(ipreparation):
    if ipreparation.preparation is not None:
        available = get_availability(
            ipreparation.preparation, ipreparation.id, "giftpreparationid") or 0
        quantity = int(ipreparation.quantity) or 0
        if available < quantity:
            raise BusinessRuleException(
                f"gift preparation quantity exceeds availability ({ipreparation.id}: {quantity} {available})",
                {"table": "GiftPreparation",
                 "fieldName": "quantity",
                 "preparationid": ipreparation.id,
                 "quantity": quantity,
                 "available": available})


@orm_signal_handler('pre_save', 'Exchangeoutprep')
def exchangeoutprep_quantity_must_be_lte_availability(ipreparation):
    if ipreparation.preparation is not None:
        available = get_availability(
            ipreparation.preparation, ipreparation.id, "exchangeoutprepid") or 0
        quantity = int(ipreparation.quantity) or 0
        if available < quantity:
            raise BusinessRuleException(
                "exchangeout preparation quantity exceeds availability ({ipreparation.id}: {quantity} {available})",
                {"table": "ExchangeOutPrep",
                 "fieldName": "quantity",
                 "preparationid": ipreparation.id,
                 "quantity": quantity,
                 "available": available})
