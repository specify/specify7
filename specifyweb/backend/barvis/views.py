from django.db.models import Count, IntegerField, OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.http import HttpResponse

from specifyweb.middleware.general import require_GET
from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.specify.api.serializers import toJson
from specifyweb.specify.models import Determination, Taxon
from specifyweb.specify.views import login_maybe_required


def get_taxon_bar_data(collection):
    """Return taxon tile rows with a correlated current-count lookup."""
    current_determination_counts = (
        Determination.objects
        .filter(
            taxon_id=OuterRef('pk'),
            collectionmemberid=collection.id,
            iscurrent=True,
        )
        .values('taxon_id')
        .annotate(count=Count('collectionobject', distinct=True))
        .values('count')
    )
    taxons = Taxon.objects.annotate(
        current_determination_count=Coalesce(
            Subquery(
                current_determination_counts,
                output_field=IntegerField(),
            ),
            0,
        )
    ).values_list(
        'id', 'rankid', 'parent_id', 'name', 'current_determination_count'
    )
    return list(filter_by_collection(taxons, collection))


@require_GET
@login_maybe_required
def taxon_bar(request):
    """Return the data for creating a taxon tiles visualization."""
    return HttpResponse(
        toJson(get_taxon_bar_data(request.specify_collection)),
        content_type='application/json',
    )
