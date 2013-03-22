from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from django.conf import settings

from specify.api import toJson
import models

from fieldspec import FieldSpec

def value_from_request(field, get):
    try:
        return get['f%s' % field.spQueryFieldId]
    except KeyError:
        return None

@require_GET
@login_required
def query(request, id):
    session = settings.SA_SESSION()
    sp_query = session.query(models.SpQuery).get(int(id))
    field_specs = [FieldSpec.from_spqueryfield(field, value_from_request(field, request.GET))
                   for field in sp_query.fields]
    model = models.models_by_tableid[sp_query.contextTableId]
    id_field = getattr(model, model._id)
    query = session.query(id_field).order_by(id_field)
    if 'last_id' in request.GET:
        query = query.filter(id_field > int(request.GET['last_id']))
    headers = ['id']
    for fs in field_specs:
        query, field = fs.add_to_query(query)
        if fs.display:
            query = query.add_columns(field)
            headers.append(fs.spqueryfieldid)

    results = [headers]
    results.extend(query.limit(20))
    return HttpResponse(toJson(results), content_type='application/json')

