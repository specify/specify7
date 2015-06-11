import json

from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.db import connection, transaction
from django import http

from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.api import toJson

@login_maybe_required
@require_GET
def preps_available_rs(request, recordset_id):
    cursor = connection.cursor()
    cursor.execute("""
    select co.CatalogNumber, t.FullName, p.preparationid, pt.name, p.countAmt, sum(lp.quantity-lp.quantityreturned) Loaned,
           sum(gp.quantity) Gifted, sum(ep.quantity) Exchanged,
           p.countAmt - coalesce(sum(lp.quantity-lp.quantityreturned),0) - coalesce(sum(gp.quantity),0) - coalesce(sum(ep.quantity),0) Available
    from preparation p
    left join loanpreparation lp on lp.preparationid = p.preparationid
    left join giftpreparation gp on gp.preparationid = p.preparationid
    left join exchangeoutprep ep on ep.PreparationID = p.PreparationID
    inner join collectionobject co on co.CollectionObjectID = p.CollectionObjectID
    inner join preptype pt on pt.preptypeid = p.preptypeid
    left join determination d on d.CollectionObjectID = co.CollectionObjectID
    left join taxon t on t.TaxonID = d.TaxonID
    where pt.isloanable and p.collectionmemberid = %s and (d.IsCurrent or d.DeterminationID is null) and p.collectionobjectid in (
        select recordid from recordsetitem where recordsetid=%s
    ) group by 1,2,3,4,5 order by 1;
    """, [request.specify_collection.id, recordset_id])
    rows = cursor.fetchall()

    return http.HttpResponse(toJson(rows), content_type='application/json')

@login_maybe_required
@require_GET
def unresolved_loan_preps(request, loan_id):
    cursor = connection.cursor()
    cursor.execute("""
    select co.CatalogNumber, t.FullName, lp.LoanPreparationID, pt.Name, lp.Quantity - lp.QuantityResolved
    from loanpreparation lp
    inner join preparation p on p.PreparationID = lp.PreparationID
    inner join collectionobject co on co.CollectionObjectID = p.CollectionObjectID
    inner join preptype pt on pt.preptypeid = p.preptypeid
    left join determination d on d.CollectionObjectID = co.CollectionObjectID
    left join taxon t on t.TaxonID = d.TaxonID
    where not lp.IsResolved and (d.IsCurrent or d.DeterminationID is null) and lp.LoanID=%s order by 1, 4
    """, [loan_id])
    rows = cursor.fetchall()

    return http.HttpResponse(toJson(rows), content_type='application/json')


@require_POST
@csrf_exempt
@login_maybe_required
def preps_available_ids(request):
    cursor = connection.cursor()
    sql = """
    select co.CatalogNumber, t.FullName, p.preparationid, pt.name, p.countAmt, sum(lp.quantity-lp.quantityreturned) Loaned,
        sum(gp.quantity) Gifted, sum(ep.quantity) Exchanged,
        p.countAmt - coalesce(sum(lp.quantity-lp.quantityreturned),0) - coalesce(sum(gp.quantity),0) - coalesce(sum(ep.quantity),0) Available
    from preparation p
    left join loanpreparation lp on lp.preparationid = p.preparationid
    left join giftpreparation gp on gp.preparationid = p.preparationid
    left join exchangeoutprep ep on ep.PreparationID = p.PreparationID
    inner join collectionobject co on co.CollectionObjectID = p.CollectionObjectID
    inner join preptype pt on pt.preptypeid = p.preptypeid
    left join determination d on d.CollectionObjectID = co.CollectionObjectID
    left join taxon t on t.TaxonID = d.TaxonID
    where pt.isloanable and p.collectionmemberid = %s and (d.IsCurrent or d.DeterminationID is null) and
    """
    sql += " co." + request.POST['id_fld'] + " in(" + request.POST['co_ids'] + ") group by 1,2,3,4,5 order by 1;"

    cursor.execute(sql, [int(request.specify_collection.id)])
    rows = cursor.fetchall()

    return http.HttpResponse(toJson(rows), content_type='application/json')



@require_POST
@csrf_exempt
@login_maybe_required
@transaction.commit_manually
def loan_return_all_items(request):
    cursor = connection.cursor()

    sql = """
    insert into loanreturnpreparation(
    TimestampCreated,
    Version,
    QuantityResolved,
    QuantityReturned,
    ReturnedDate,
    DisciplineID,
    ReceivedByID,
    LoanPreparationID,
    CreatedByAgentID)
    select now(),
           0,
           lp.Quantity - lp.QuantityResolved,
           lp.Quantity - lp.QuantityResolved,
           date(%s),
           %s,
           %s,
           lp.LoanPreparationID,
           %s
    from loanpreparation lp where lp.LoanID in(
    """
    sql += request.POST['loanIds'] + ")  and not lp.IsResolved and lp.Quantity - lp.QuantityResolved != 0;"
    cursor.execute(sql, [unicode(request.POST['returnedDate']),
                         request.specify_collection.discipline.id,
                         int(request.POST['returnedById']),
                         int(request.specify_user_agent.id)])

    sql = """
    update loanpreparation set
    TimestampModified = now(),
    ModifiedByAgentID = %s,
    Version = Version + 1,
    QuantityReturned = QuantityReturned + Quantity - QuantityResolved,
    QuantityResolved = Quantity,
    IsResolved = true
    where not IsResolved and LoanID in (
    """ + request.POST['loanIds'] + ");"

    cursor.execute(sql, [int(request.specify_user_agent.id)])
    prepsReturned = cursor.rowcount

    if (request.POST['selection'] != ""):
        sql = """
        update loan set
        TimestampModified = now(),
        ModifiedByAgentID = %s,
        Version = Version + 1,
        IsClosed = true,
        DateClosed = date(%s)
        where not IsClosed and LoanNumber in(" + request.POST['selection'] + ");"
        cursor.execute(sql, [int(request.specify_user_agent.id),
                             unicode(request.POST['returnedDate'])])
    else:
        sql = """
        update loan set
        TimestampModified = now(),
        ModifiedByAgentID = %s,
        Version = Version + 1,
        IsClosed = true,
        DateClosed = date(%s) where not IsClosed and LoanID in(" + request.POST['loanIds'] + ");"
        cursor.execute(sql, [int(request.specify_user_agent.id),
                             unicode(request.POST['returnedDate'])])

    loansClosed = cursor.rowcount

    transaction.set_dirty()
    transaction.commit()

    return http.HttpResponse(toJson([prepsReturned, loansClosed]), content_type='application/json')

@require_POST
@csrf_exempt
@login_maybe_required
@transaction.commit_manually
def loan_return_items(request):

    # Columns:
    # 0 - loanpreparationid, 1 - returnQuantity, 2 - resolveQuantity, 3 - isResolved, 4 - remarks

    returns = json.loads(request.POST['returns'])
    stumpIn = """
    INSERT INTO loanreturnpreparation(
        TimestampCreated,
        Version,
        DisciplineID,
        CreatedByAgentID,
        ReturnedDate,
        ReceivedByID,
        QuantityResolved,
        QuantityReturned,
        Remarks,
        LoanPreparationID
    ) VALUES (
        now(),
        0,
    """
    stumpIn += str(request.specify_collection.discipline.id) + "," \
               + str(request.specify_user_agent.id) + \
               ", date('" + request.POST['returnedDate'] + "')," + \
               str(request.POST['returnedById']) + ","

    stumpUp = """
    UPDATE loanpreparation SET
    Version = Version + 1,
    TimestampModified = now(),
    ModifiedByAgentID = """ + str(request.specify_user_agent.id) + ","

    returnInSql = ""
    loanPrepUpSql = ""

    for ret in returns:
        returnInSql += stumpIn + str(ret[2]) + "," + str(ret[1]) + "," + ret[4] + "," + str(ret[0]) + ");"
        loanPrepUpSql += stumpUp + " IsResolved=" + ret[3] \
                         + ", QuantityResolved=QuantityResolved+" + str(ret[2]) \
                         + ", QuantityReturned=QuantityReturned+" + str(ret[1]) \
                         + " WHERE LoanPreparationID=" + str(ret[0]) + ";"


    cursor = connection.cursor()

    cursor.execute(returnInSql)
    returnedPreps = cursor.rowcount

    cursor.execute(loanPrepUpSql)
    updatedPreps = cursor.rowcount

    transaction.commit()

    return http.HttpResponse(toJson([returnedPreps, updatedPreps]), content_type='application/json')


@require_POST
@csrf_exempt
@login_maybe_required
def prep_interactions(request):
    cursor = connection.cursor()

    sql = """
    select p.preparationid, group_concat(distinct concat(lp.loanid,'>|<', l.loannumber)),
    group_concat(distinct concat(gp.giftid, '>|<', g.giftnumber)),
    group_concat(distinct concat(ep.exchangeoutid, '>|<', e.exchangeoutnumber))
    from preparation p
    left join loanpreparation lp on lp.preparationid = p.preparationid
    left join giftpreparation gp on gp.preparationid = p.preparationid
    left join exchangeoutprep ep on ep.preparationid = p.preparationid
    left join loan l on l.loanid = lp.loanid
    left join gift g on g.giftid = gp.giftid
    left join exchangeout e on  e.exchangeoutid = ep.exchangeoutid
    where (lp.loanpreparationid is null or not lp.isresolved) and p.preparationid in(%s)
    group by 1;
    """

    cursor.execute(sql, [unicode(request.POST['prepIds'])])
    rows = cursor.fetchall()

    return http.HttpResponse(toJson(rows), content_type='application/json')

