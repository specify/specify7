import json
from datetime import date

from django import http
from django.core.exceptions import FieldDoesNotExist
from django.db import connection, transaction
from django.views.decorators.http import require_POST

from specifyweb.middleware.general import require_GET
from specifyweb.permissions.permissions import check_table_permissions
from specifyweb.specify.api import toJson
from specifyweb.specify.models import Collectionobject, Loan, Loanpreparation, \
    Loanreturnpreparation
from specifyweb.specify.views import login_maybe_required


@login_maybe_required
@require_GET
def preps_available_rs(request, recordset_id):
    "Returns a list of preparations that are loanable? based on the CO recordset <recordset_id>."
    cursor = connection.cursor()
    cursor.execute("""
    SELECT co.catalognumber,
           co.collectionobjectid AS co_id,
           t.fullname,
           t.taxonid AS t_id,
           p.preparationid,
           pt.name,
           p.countamt,
           Sum(lp.quantity - lp.quantityreturned)                        Loaned,
           Sum(gp.quantity)                                              Gifted,
           Sum(ep.quantity)                                              Exchanged,
           p.countamt - Coalesce(Sum(lp.quantity - lp.quantityresolved), 0) -
           Coalesce(Sum(gp.quantity), 0) - Coalesce(Sum(ep.quantity), 0) Available
    FROM   preparation p
           LEFT JOIN loanpreparation lp
                  ON lp.preparationid = p.preparationid
           LEFT JOIN giftpreparation gp
                  ON gp.preparationid = p.preparationid
           LEFT JOIN exchangeoutprep ep
                  ON ep.preparationid = p.preparationid
           INNER JOIN collectionobject co
                   ON co.collectionobjectid = p.collectionobjectid
           INNER JOIN preptype pt
                   ON pt.preptypeid = p.preptypeid
           LEFT JOIN determination d
                  ON d.collectionobjectid = co.collectionobjectid
           LEFT JOIN taxon t
                  ON t.taxonid = d.taxonid
    WHERE  pt.isloanable
           AND p.collectionmemberid = %s
           AND ( d.iscurrent
                  OR d.determinationid IS NULL )
           AND p.collectionobjectid IN (SELECT recordid
                                        FROM   recordsetitem
                                        WHERE  recordsetid = %s)
    GROUP  BY 1,
              2,
              3,
              4,
              5
    ORDER  BY 1; 
    """, [request.specify_collection.id, recordset_id])
    rows = cursor.fetchall()

    return http.HttpResponse(toJson(rows), content_type='application/json')

@require_POST
@login_maybe_required
def preps_available_ids(request):
    """Returns a list of preparations that are loanable? based on
    a list of collection object ids passed in the 'co_ids' POST
    parameter as a JSON list.
    """

    # make sure the field is actually a field in the collection object table
    try:
        id_fld = Collectionobject._meta.get_field(request.POST['id_fld'].lower()).db_column
    except FieldDoesNotExist as e:
        raise http.Http404(e)

    co_ids = json.loads(request.POST['co_ids'])

    sql = """
    select co.CatalogNumber, co.collectionObjectId, t.FullName, t.taxonId, p.preparationid, pt.name, p.countAmt, sum(lp.quantity-lp.quantityreturned) Loaned,
        sum(gp.quantity) Gifted, sum(ep.quantity) Exchanged,
        p.countAmt - coalesce(sum(lp.quantity-lp.quantityresolved),0) - coalesce(sum(gp.quantity),0) - coalesce(sum(ep.quantity),0) Available
    from preparation p
    left join loanpreparation lp on lp.preparationid = p.preparationid
    left join giftpreparation gp on gp.preparationid = p.preparationid
    left join exchangeoutprep ep on ep.PreparationID = p.PreparationID
    inner join collectionobject co on co.CollectionObjectID = p.CollectionObjectID
    inner join preptype pt on pt.preptypeid = p.preptypeid
    left join determination d on d.CollectionObjectID = co.CollectionObjectID
    left join taxon t on t.TaxonID = d.TaxonID
    where pt.isloanable and p.collectionmemberid = %s
    and (d.IsCurrent or d.DeterminationID is null)
    and co.{id_fld} in ({params})
    group by 1,2,3,4,5 order by 1;
    """.format(id_fld=id_fld, params=",".join("%s" for __ in co_ids))

    cursor = connection.cursor()
    cursor.execute(sql, [int(request.specify_collection.id)] + co_ids)
    rows = cursor.fetchall()

    return http.HttpResponse(toJson(rows), content_type='application/json')


def record_set_or_loan_nos(record_set_id=None, loan_nos=None, by_id=True):
    if record_set_id is not None:
        id_clause = "select RecordId from recordsetitem where RecordSetId = %s"
        id_params = [record_set_id]
    elif loan_nos is not None:
        where_clause = "LoanNumber in (" \
                       + ",".join("%s" for __ in loan_nos) \
                       + ")"
        if by_id:
            id_clause = "select LoanId from loan where " + where_clause
        else:
            id_clause = where_clause
        id_params = loan_nos
    else:
        raise Exception("must supply either record set or loan numbers")

    return id_clause, id_params

def insert_loanreturnpreps(cursor, returned_date, discipline_id, returned_by_id,
                           current_user_agent_id, record_set_id=None, loan_nos=None):

    id_clause, id_params = record_set_or_loan_nos(record_set_id, loan_nos)

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
    from loanpreparation
    lp where lp.LoanID in ({id_clause})
    and not lp.IsResolved and lp.Quantity - lp.QuantityResolved != 0
    """.format(id_clause=id_clause)

    cursor.execute(sql, [
        returned_date,
        discipline_id,
        returned_by_id,
        current_user_agent_id
        ] + id_params)

def resolve_loanpreps(cursor, current_user_agent_id, record_set_id=None, loan_nos=None):

    id_clause, id_params = record_set_or_loan_nos(record_set_id, loan_nos)

    sql = """
    update loanpreparation set
    TimestampModified = now(),
    ModifiedByAgentID = %s,
    Version = Version + 1,
    QuantityReturned = QuantityReturned + Quantity - QuantityResolved,
    QuantityResolved = Quantity,
    IsResolved = true
    where not IsResolved and LoanID in ({id_clause})
    """.format(id_clause=id_clause)

    cursor.execute(sql, [current_user_agent_id] + id_params)
    return cursor.rowcount

def close_loan(cursor, current_user_agent_id, returned_date, record_set_id=None, loan_nos=None):
    using_loan_nos = loan_nos is not None

    id_clause, id_params = record_set_or_loan_nos(record_set_id, loan_nos, by_id=(not using_loan_nos))

    where_clause = id_clause if using_loan_nos else "LoanID in ({})".format(id_clause)

    sql = """
    update loan set
    TimestampModified = now(),
    ModifiedByAgentID = %s,
    Version = Version + 1,
    IsClosed = true,
    DateClosed = date(%s)
    where not IsClosed
    and {where_clause}
    """.format(where_clause=where_clause)
    cursor.execute(sql, [current_user_agent_id, returned_date] + id_params)
    return cursor.rowcount


@require_POST
@login_maybe_required
@transaction.atomic
def loan_return_all_items(request):
    """Causes all loan items to be marked returned based on various POST parameters.
    """
    check_table_permissions(request.specify_collection, request.specify_user, Loan, "update")
    check_table_permissions(request.specify_collection, request.specify_user, Loanpreparation, "update")
    check_table_permissions(request.specify_collection, request.specify_user, Loanreturnpreparation, "create")

    if 'returnedDate' in request.POST:
        returned_date = str(request.POST['returnedDate'])
    else:
        returned_date = date.today()

    discipline_id = request.specify_collection.discipline.id
    returned_by_id = int(request.POST.get('returnedById', request.specify_user_agent.id))
    current_user_agent_id = int(request.specify_user_agent.id)
    record_set_id = request.POST.get('recordSetId', None)

    if 'loanNumbers' in request.POST:
        loan_nos = json.loads(request.POST['loanNumbers'])
    else:
        loan_nos = None

    cursor = connection.cursor()
    insert_loanreturnpreps(cursor,
                           returned_date,
                           discipline_id,
                           returned_by_id,
                           current_user_agent_id,
                           record_set_id=record_set_id,
                           loan_nos=loan_nos)

    prepsReturned = resolve_loanpreps(cursor, current_user_agent_id,
                                      record_set_id=record_set_id,
                                      loan_nos=loan_nos)

    loansClosed = close_loan(cursor, current_user_agent_id, returned_date,
                             record_set_id=record_set_id, loan_nos=loan_nos)

    return http.HttpResponse(toJson([prepsReturned, loansClosed]), content_type='application/json')

@require_GET
@login_maybe_required
def prep_availability(request, prep_id, iprep_id=None, iprep_name=None):
    "Returns available counts for preps."
    args = [prep_id]
    sql = """select p.countAmt - coalesce(sum(lp.quantity-lp.quantityresolved),0) - coalesce(sum(gp.quantity),0) - coalesce(sum(ep.quantity),0) 
    from preparation p
    left join loanpreparation lp on lp.preparationid = p.preparationid
    left join giftpreparation gp on gp.preparationid = p.preparationid
    left join exchangeoutprep ep on ep.PreparationID = p.PreparationID
    where p.preparationid = %s 
    """
    if iprep_id is not None:
        from specifyweb.specify import models
        keyfld = models.datamodel.get_table(iprep_name).idFieldName
        sql += " and " + keyfld + " != %s "
        args.append(iprep_id)

    sql += " group by p.preparationid"

    print(sql)

    cursor = connection.cursor()
    cursor.execute(sql, args)
    row = cursor.fetchone()

    return http.HttpResponse(toJson(row), content_type='application/json')
    

@require_POST
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

    cursor.execute(sql, [str(request.POST['prepIds'])])
    rows = cursor.fetchall()

    return http.HttpResponse(toJson(rows), content_type='application/json')
