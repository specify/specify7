from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404

from specify.models import Spquery

from execute import execute
from make_filter import extract_date_part

from specify.api import toJson

@require_GET
@login_required
def query(request, id):
    query = get_object_or_404(Spquery, id=id)
    qs, field_specs = execute(query)

    display_fields = [(fs['query_field'].id,) + extract_date_part(fs['key'])
                      for fs in field_specs
                      if fs['query_field'].isdisplay]

    columns = ['id'] + [key for id, key, date_part in display_fields]

    results = [['id'] + [id for id, key, date_part in display_fields]]
    results.extend(qs.values_list(*columns))

    return HttpResponse(toJson(list(results)), content_type='application/json')

