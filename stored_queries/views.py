import operator
from collections import namedtuple

from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.conf import settings

from sqlalchemy.sql.expression import asc, desc, and_, or_

from specify.api import toJson
from specify.views import login_required
import models

from fieldspec import FieldSpec

SORT_TYPES = [None, asc, desc]
SORT_OPS = [None, operator.gt, operator.lt]

def value_from_request(field, get):
    try:
        return get['f%s' % field.spQueryFieldId]
    except KeyError:
        return None

FieldAndOp = namedtuple('FieldAndOp', 'field op')

def build_filter_previous(field_op_values):
    field, op, value = field_op_values.pop(0)
    if len(field_op_values) < 1:
        return op(field, value)
    else:
        return or_(op(field, value),
                   and_(field == value,
                        build_filter_previous(field_op_values)))
@require_GET
@login_required
def query(request, id):
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))

    session = settings.SA_SESSION()
    sp_query = session.query(models.SpQuery).get(int(id))
    field_specs = [FieldSpec.from_spqueryfield(field, value_from_request(field, request.GET))
                   for field in sorted(sp_query.fields, key=lambda field: field.position)]
    model = models.models_by_tableid[sp_query.contextTableId]
    id_field = getattr(model, model._id)
    query = session.query(id_field)

    headers = ['id']
    order_by_exprs = []
    for fs in field_specs:
        query, field = fs.add_to_query(query,
                                       collection=request.specify_collection)
        if fs.display:
            query = query.add_columns(field)
            headers.append(fs.spqueryfieldid)
        sort_type = SORT_TYPES[fs.sort_type]
        if sort_type is not None:
            order_by_exprs.append(sort_type(field))
    query = query.order_by(*order_by_exprs).distinct().limit(limit).offset(offset)

    print query
    results = [headers]
    results.extend(query)
    session.close()
    return HttpResponse(toJson(results), content_type='application/json')

