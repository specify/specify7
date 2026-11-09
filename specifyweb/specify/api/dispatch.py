import json
from django.http import (
    Http404,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden,
    HttpResponseNotAllowed,
    QueryDict,
)

from django.core.exceptions import FieldError
from django.shortcuts import get_object_or_404

from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.backend.permissions.permissions import enforce, table_permissions_checker
from specifyweb.backend.stored_queries.access import ensure_query_access
from specifyweb.specify.api.crud import apply_filters, delete_resource, get_collection, get_model_or_404, get_resource, post_resource, put_resource
from specifyweb.specify.api.exceptions import FilterError, OrderByError
from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.specify.api.serializers import _obj_to_data, toJson
from specifyweb.specify.api.validators import (
    GetCollectionForm,
    RowsForm,
    has_unfiltered_query_path,
)


UNIQUENESS_RULE_MODELS = {'uniquenessrule', 'uniquenessrulefield'}


def _uniqueness_rule_write_forbidden(request, model: str) -> HttpResponse | None:
    if model.lower() in UNIQUENESS_RULE_MODELS and not request.specify_user.is_admin():
        return HttpResponseForbidden('Specifyuser must be an institution admin')
    return None


def resource_dispatch(request, model, id) -> HttpResponse:
    """Handles requests related to individual resources.

    Determines the client's version of the resource.
    Determines the logged-in user and collection from the request.
    Dispatches on the request type.
    De/Encodes structured data as JSON.
    """
    request_params = QueryDict(request.META['QUERY_STRING'])

    # Get the version the client has, if it is given
    # in URL query string or in the HTTP if-match header.
    try:
        version = request_params['version']
    except KeyError:
        try:
            version = request.headers['if-match']
        except KeyError:
            version = None

    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    # Dispatch on the request type.
    if request.method == 'GET':
        if model.lower() == 'spquery':
            ensure_query_access(id, request.specify_user.id)
        elif model.lower() == 'spqueryfield':
            from specifyweb.specify.models import Spqueryfield

            field = get_object_or_404(Spqueryfield, pk=id)
            if field.query_id is None:
                raise Http404("Query not found.")
            ensure_query_access(field.query_id, request.specify_user.id)
        data = get_resource(model, id, checker, request.GET.get('recordsetid', None))
        resp = HttpResponse(toJson(data), content_type='application/json')

    elif request.method == 'PUT':
        forbidden = _uniqueness_rule_write_forbidden(request, model)
        if forbidden is not None:
            return forbidden

        data = json.load(request)
        # Look for a version field in the resource data itself.
        try:
            version = data['version']
        except KeyError:
            pass

        obj = put_resource(request.specify_collection,
                           request.specify_user_agent,
                           model, id, version, data)

        resp = HttpResponse(toJson(_obj_to_data(obj, checker)),
                            content_type='application/json')

    elif request.method == 'DELETE':
        forbidden = _uniqueness_rule_write_forbidden(request, model)
        if forbidden is not None:
            return forbidden

        if model.lower() == 'discipline' and not request.specify_user.is_admin():
            return HttpResponseForbidden('Specifyuser must be an institution admin')

        # Block deleting currently logged collection
        if model.lower() == 'collection' and int(id) == request.specify_collection.id:
            raise BusinessRuleException(
                "You cannot delete the collection you are currently logged into."
            )

        delete_resource(request.specify_collection,
                        request.specify_user_agent,
                        model, id, version)

        resp = HttpResponse('', status=204)

    else:
        # Unhandled request type.
        resp = HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

    return resp

class HttpResponseCreated(HttpResponse):
    """Returned to the client when a POST request succeeds and a new
    resource is created.
    """
    status_code = 201

def collection_dispatch(request, model) -> HttpResponse:
    """Handles requests related to collections of resources.

    Dispatches on the request type.
    Determines the logged-in user and collection from the request.
    De/Encodes structured data as JSON.
    """

    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    if request.method == 'GET':
        control_params = GetCollectionForm(request.GET)
        if not control_params.is_valid():
            return HttpResponseBadRequest(toJson(control_params.errors),
                                          content_type='application/json')
        query_model = get_model_or_404(model)
        filter_paths = [
            key for key in request.GET.keys() if key not in control_params.cleaned_data
        ]
        if any(
            has_unfiltered_query_path(query_model, filter_path)
            for filter_path in filter_paths
        ):
            return HttpResponseBadRequest(
                "Query-related filters must use a query or query-field root with visibility checks."
            )
        try:
            data = get_collection(
                request.specify_collection,
                model,
                checker,
                control_params.cleaned_data,
                request.GET,
                query_user_id=request.specify_user.id,
            )
        except (FilterError, OrderByError) as e:
            return HttpResponseBadRequest(e)
        resp = HttpResponse(toJson(data), content_type='application/json')

    elif request.method == 'POST':
        forbidden = _uniqueness_rule_write_forbidden(request, model)
        if forbidden is not None:
            return forbidden

        obj = post_resource(request.specify_collection,
                            request.specify_user_agent,
                            model, json.loads(request.body),
                            request.GET.get('recordsetid', None))

        resp = HttpResponseCreated(toJson(_obj_to_data(obj, checker)),
                                   content_type='application/json')
    else:
        # Unhandled request type.
        resp = HttpResponseNotAllowed(['GET', 'POST'])

    return resp

def rows(request, model_name: str) -> HttpResponse:
    enforce(request.specify_collection, request.specify_user_agent, [f'/table/{model_name.lower()}'], "read")

    form = RowsForm(request.GET)

    if not form.is_valid():
        return HttpResponseBadRequest(toJson(form.errors), content_type='application/json')

    query = apply_filters(request.specify_collection, request.GET, model_name, form.cleaned_data)
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
