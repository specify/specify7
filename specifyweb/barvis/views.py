from django.views.decorators.http import require_GET
from django.http import HttpResponse

from sqlalchemy.sql.expression import func, distinct

from specifyweb.specify.views import login_required
from specifyweb.specify.api import toJson

from specifyweb.stored_queries.models import Determination, Taxon

from django.db import connection

@require_GET
@login_required
def taxon_bar(request):
    cursor = connection.cursor()
    cursor.execute("""
    SELECT t.TaxonID,
    t.RankID,
    t.ParentID,
    t.Name,
    (SELECT COUNT(*) FROM determination d WHERE t.TaxonID = d.TaxonID AND d.IsCurrent = 1)
    FROM taxon t
    WHERE t.TaxonTreeDefID = %s
    """, [request.specify_collection.discipline.taxontreedef_id])

    # SELECT d.TaxonID, COUNT(DISTINCT d.CollectionObjectID), t.ParentID
    # FROM determination d
    # INNER JOIN taxon t ON t.TaxonID = d.TaxonID
    # WHERE d.CollectionMemberID = %s
    # AND d.IsCurrent = 1
    # GROUP BY d.TaxonId
    # ORDER BY d.TaxonId
    # """, [request.specify_collection.id])
    result = toJson(cursor.fetchall())
    # session = Session()
    # query = session.query(
    #     Determination.TaxonID,
    #     func.count(distinct(Determination.CollectionObjectID)),
    #     Taxon.ParentID) \
    #     .join(Taxon, Determination.TaxonID == Taxon.taxonId) \
    #     .filter(Determination.collectionMemberId == request.specify_collection.id) \
    #     .filter(Determination.isCurrent == True) \
    #     .group_by(Determination.TaxonID).order_by(Determination.TaxonID)

    # result = toJson(list(query))
    # session.close()
    return HttpResponse(result, content_type='application/json')
