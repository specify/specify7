from specifyweb.middleware.general import require_http_methods
from specifyweb.specify.api.crud import apply_filters
from specifyweb.specify.api.exceptions import OrderByError
from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.specify.api.serializers import toJson
from specifyweb.specify.api.validators import RowsForm
from specifyweb.specify.views import login_maybe_required
from django.http import (HttpResponse, HttpResponseBadRequest)
from specifyweb.backend.permissions.permissions import enforce
from django.core.exceptions import FieldError

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def rows(request, model: str) -> HttpResponse:
    enforce(request.specify_collection, request.specify_user_agent, [f'/table/{model.lower()}'], "read")

    form = RowsForm(request.GET)

    if not form.is_valid():
        return HttpResponseBadRequest(toJson(form.errors), content_type='application/json')

    query = apply_filters(request.specify_collection, request.GET, model, form.cleaned_data)
    fields = form.cleaned_data['fields'].split(',')
    try:
        query = query.values_list(*fields).order_by(*fields)
    except FieldError as e:
        return HttpResponseBadRequest(e)
    if form.cleaned_data['domainfilter'] == 'true':
        query = filter_by_collection(query, request.specify_collection)
    if form.cleaned_data['orderby']:
        try:
            query = query.order_by(form.cleaned_data['orderby'])
        except FieldError as e:
            raise OrderByError(e)
    if form.cleaned_data['distinct']:
        query = query.distinct()

    limit = form.cleaned_data['limit']
    offset = form.cleaned_data['offset']
    if limit == 0:
        query = query[offset:]
    else:
        query = query[offset:offset + limit]

    data = list(query)
    return HttpResponse(toJson(data), content_type='application/json')