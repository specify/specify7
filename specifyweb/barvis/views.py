from django.views.decorators.http import require_GET
from django.http import HttpResponse

from sqlalchemy.sql.expression import func, distinct

from specifyweb.specify.views import login_required
from specifyweb.specify.api import toJson

from specifyweb.stored_queries.models import Determination
from specifyweb.stored_queries.views import Session

@require_GET
@login_required
def taxon_bar(request):
    session = Session()
    query = session.query(
        Determination.TaxonID,
        func.count(distinct(Determination.CollectionObjectID))) \
        .group_by(Determination.TaxonID).order_by(Determination.TaxonID)

    result = toJson(list(query))
    session.close()
    return HttpResponse(result, content_type='application/json')
