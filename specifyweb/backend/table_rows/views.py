from specifyweb.middleware.general import require_http_methods
from specifyweb.specify.api.crud import apply_filters, get_model_or_404
from specifyweb.specify.api.exceptions import OrderByError
from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.specify.api.serializers import toJson
from specifyweb.specify.api.validators import RowsForm
from specifyweb.specify.views import login_maybe_required
from django.http import (HttpResponse, HttpResponseBadRequest)
from specifyweb.backend.permissions.permissions import (
    enforce, filter_forward_related_read_queryset, filter_scoped_read_queryset,
    prepare_reverse_related_read_queryset,
)
from django.core.exceptions import FieldError

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def rows(request, model: str) -> HttpResponse:
    enforce(request.specify_collection, request.specify_user_agent, [f'/table/{model.lower()}'], "read")

    form = RowsForm(request.GET)

    if not form.is_valid():
        return HttpResponseBadRequest(toJson(form.errors), content_type='application/json')

    fields = form.cleaned_data['fields'].split(',')
    filter_fields = [key for key in request.GET if key not in form.cleaned_data]
    orderby = form.cleaned_data['orderby']
    try:
        query, aliases = prepare_reverse_related_read_queryset(
            get_model_or_404(model).objects.all(),
            fields + filter_fields + (
                [field.removeprefix('-') for field in orderby.split(',')] if orderby else []
            ),
            request.specify_user_agent,
        )
        query = apply_filters(
            request.specify_collection, request.GET, model, form.cleaned_data,
            queryset=query, field_aliases=aliases,
        )
        query = filter_scoped_read_queryset(query, request.specify_user_agent)
        query = filter_forward_related_read_queryset(
            query, fields + filter_fields, request.specify_user_agent
        )
        projected_fields = [aliases[field] for field in fields]
        query = query.values_list(*projected_fields).order_by(*projected_fields)
    except FieldError as e:
        return HttpResponseBadRequest(e)
    if form.cleaned_data['domainfilter'] == 'true':
        query = filter_by_collection(query, request.specify_collection)
    if orderby:
        try:
            query = filter_forward_related_read_queryset(
                query, [orderby.removeprefix('-')],
                request.specify_user_agent,
            )
            query = query.order_by(
                ('-' if orderby.startswith('-') else '')
                + aliases[orderby.removeprefix('-')]
            )
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