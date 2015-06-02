import mimetypes
from functools import wraps

from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_control
from django.conf import settings
from django import http

from .specify_jar import specify_jar
from . import api


if settings.ANONYMOUS_USER:
    login_maybe_required = lambda func: func
else:
    def login_maybe_required(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated():
                return http.HttpResponseForbidden()
            return view(request, *args, **kwargs)
        return wrapped

preps_available_sql = """select co.CatalogNumber, t.FullName, p.preparationid, pt.name, p.countAmt, sum(lp.quantity-lp.quantityreturned) Loaned,
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
%s) group by 1,2,3,4,5 order by 1;"""

class HttpResponseConflict(http.HttpResponse):
    status_code = 409

def api_view(dispatch_func):
    """Create a Django view function that handles exceptions arising
    in the api logic."""
    @login_maybe_required
    @csrf_exempt
    @cache_control(private=True, max_age=0)
    def view(request, *args, **kwargs):
        if request.method != "GET" and (
            settings.RO_MODE or
            request.specify_user.usertype not in ('Manager', 'FullAccess')
        ):
            return http.HttpResponseForbidden()
        try:
            return dispatch_func(request, *args, **kwargs)
        except api.StaleObjectException as e:
            return HttpResponseConflict(e)
        except api.MissingVersionException as e:
            return http.HttpResponseBadRequest(e)
        except http.Http404 as e:
            return http.HttpResponseNotFound(e)
    return view

resource = api_view(api.resource_dispatch)
collection = api_view(api.collection_dispatch)

def raise_error(request):
    raise Exception('This error is a test. You may now return to your regularly '
                    'scheduled hacking.')

@login_maybe_required
@require_GET
def rows(request, model):
    return api.rows(request, model)

@require_GET
def images(request, path):
    """A Django view that serves images and icons from the Specify thickclient jar file."""
    mimetype = mimetypes.guess_type(path)[0]
    path = 'edu/ku/brc/specify/images/' + path
    try:
        image = specify_jar.read(path)
    except KeyError as e:
        raise http.Http404(e)
    return http.HttpResponse(image, content_type=mimetype)

@login_maybe_required
@require_GET
def properties(request, name):
    """A Django view that serves .properities files from the thickclient jar file."""
    path = name + '.properties'
    return http.HttpResponse(specify_jar.read(path), content_type='text/plain')

@login_maybe_required
@require_GET
def preps_available_rs(request, recordset_id):
    from django.db import connection
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
    
    return http.HttpResponse(api.toJson(rows), content_type='application/json')

@login_maybe_required
@require_GET
def unresolved_loan_preps(request, loan_id):
    from django.db import connection
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
    
    return http.HttpResponse(api.toJson(rows), content_type='application/json')


@require_POST
@csrf_exempt
@login_maybe_required
def preps_available_ids(request):
    from django.db import connection
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
    
    return http.HttpResponse(api.toJson(rows), content_type='application/json')

@login_maybe_required
@require_GET
def preps_available_rs2(request, recordset_id):
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute(preps_available_sql, [request.specify_collection.id,  6])
    rows = cursor.fetchall()
    
    return http.HttpResponse(api.toJson(rows), content_type='application/json')

@login_maybe_required
@require_GET
def preps_available_ids2(request, ids):
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute(preps_available_sql, [request.specify_collection.id, ids])
    rows = cursor.fetchall()
    
    return http.HttpResponse(api.toJson(rows), content_type='application/json')

from django.db import transaction


@require_POST
@csrf_exempt
@login_maybe_required
@transaction.commit_manually
def loan_return_all_items(request):
    from django.db import connection

    cursor = connection.cursor()
    
    sql="""
    insert into loanreturnpreparation(TimestampCreated, Version, QuantityResolved, QuantityReturned, ReturnedDate, DisciplineID, ReceivedByID, LoanPreparationID, CreatedByAgentID)
    select now(), 0, lp.Quantity - lp.QuantityResolved, lp.Quantity - lp.QuantityResolved, date(%s), %s, %s, lp.LoanPreparationID, %s
    from loanpreparation lp where lp.LoanID in(
    """
    sql += request.POST['loanIds'] + ")  and not lp.IsResolved and lp.Quantity - lp.QuantityResolved != 0;"
    cursor.execute(sql, [unicode(request.POST['returnedDate']), request.specify_collection.discipline.id, int(request.POST['returnedById']), int(request.specify_user.id)])
    
    sql="update loanpreparation set TimestampModified = now(), ModifiedByAgentID = %s, Version = Version+1, QuantityReturned=QuantityReturned+Quantity-QuantityResolved, QuantityResolved=Quantity, IsResolved=true where not IsResolved and LoanID in(" + request.POST['loanIds'] + ");"

    cursor.execute(sql, [int(request.specify_user.id)])
    prepsReturned = cursor.rowcount

    if (request.POST['selection'] != ""):
        sql="update loan set TimestampModified = now(), ModifiedByAgentID = %s, Version = Version+1, IsClosed=true, DateClosed=date(%s) where not IsClosed and LoanNumber in(" + request.POST['selection'] + ");"
        cursor.execute(sql, [int(request.specify_user.id), unicode(request.POST['returnedDate'])])
    else:
        sql="update loan set TimestampModified = now(), ModifiedByAgentID = %s, Version = Version+1, IsClosed=true, DateClosed=date(%s) where not IsClosed and LoanID in(" + request.POST['loanIds'] + ");"
        cursor.execute(sql, [int(request.specify_user.id), unicode(request.POST['returnedDate'])])

    loansClosed = cursor.rowcount
                    
    transaction.set_dirty()
    transaction.commit()
    
    return http.HttpResponse(api.toJson([prepsReturned, loansClosed]), content_type='application/json')


    
@require_POST
@csrf_exempt
@login_maybe_required
def prep_interactions(request):
    from django.db import connection
    
    cursor = connection.cursor()

    sql = """select p.preparationid, group_concat(distinct concat(lp.loanid,'>|<', l.loannumber)), group_concat(distinct concat(gp.giftid, '>|<', g.giftnumber)), group_concat(distinct concat(ep.exchangeoutid, '>|<', e.exchangeoutnumber)) from preparation p left join loanpreparation lp on lp.preparationid = p.preparationid left join giftpreparation gp on gp.preparationid = p.preparationid left join exchangeoutprep ep on ep.preparationid = p.preparationid left join loan l on l.loanid = lp.loanid left join gift g on g.giftid = gp.giftid left join exchangeout e on  e.exchangeoutid = ep.exchangeoutid where p.preparationid in(%s) group by 1;"""

    cursor.execute(sql, [unicode(request.POST['prepIds'])])
    rows = cursor.fetchall()
    
    return http.HttpResponse(api.toJson(rows), content_type='application/json')
                  
    
