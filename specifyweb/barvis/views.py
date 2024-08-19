from django.http import HttpResponse
from django.db.models import Count, Q

from specifyweb.middleware.general import require_GET
from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.filter_by_col import filter_by_collection
from specifyweb.specify.api import toJson
from specifyweb.specify.models import Taxon

from django.db import connection


@require_GET
@login_maybe_required
def taxon_bar(request):
    # "Returns the data for creating a taxon tiles visualization."
    # cursor = connection.cursor()
    # cursor.execute("""
    # SELECT t.TaxonID,
    # t.RankID,
    # t.ParentID,
    # t.Name,
    # (SELECT COUNT(*) FROM determination d WHERE t.TaxonID = d.TaxonID AND d.IsCurrent = 1)
    # FROM taxon t
    # WHERE t.TaxonTreeDefID = %s
    # """, [request.specify_collection.discipline.taxontreedef_id])

    # Implementing the previous SQL query in Django ORM:
    taxons = (
        Taxon.objects.annotate(
            current_determination_count=Count(
                'determinations', filter=Q(determinations__iscurrent=True))
        )
        .values_list("id", "rankid", "parent_id", "name", "current_determination_count")
    )
    filtered_taxons = filter_by_collection(taxons, request.specify_collection)
    result = toJson(list(filtered_taxons))

    # SELECT d.TaxonID, COUNT(DISTINCT d.CollectionObjectID), t.ParentID
    # FROM determination d
    # INNER JOIN taxon t ON t.TaxonID = d.TaxonID
    # WHERE d.CollectionMemberID = %s
    # AND d.IsCurrent = 1
    # GROUP BY d.TaxonId
    # ORDER BY d.TaxonId
    # """, [request.specify_collection.id])
    # result = toJson(cursor.fetchall())
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
