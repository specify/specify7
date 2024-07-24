from django.http import HttpResponse
from django.db.models import Count, Q, OuterRef, Subquery, IntegerField

from sqlalchemy.sql.expression import func, distinct

from specifyweb.middleware.general import require_GET
from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.api import toJson
from specifyweb.specify.tree_utils import get_taxon_treedefs
from specifyweb.specify.models import Taxon, Determination

# from specifyweb.stored_queries.models import Determination, Taxon

from django.db import connection

@require_GET
@login_maybe_required
def taxon_bar(request):
    "Returns the data for creating a taxon tiles visualization."  
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
    taxon_tree_defs = get_taxon_treedefs(request.specify_collection)
    taxons = (
        Taxon.objects.filter(definition__in=taxon_tree_defs)
        .annotate(
            current_determination_count=Subquery(
                Determination.objects.filter(taxon_id=OuterRef("id"), iscurrent=True)
                .values("taxon_id")
                .annotate(count=Count("*"))
                .values("count"),
                output_field=IntegerField(),
            )
        )
        .values("id", "rankid", "parent_id", "name", "current_determination_count")
    )
    result = toJson(list(taxons))

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
