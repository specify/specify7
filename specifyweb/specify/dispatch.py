import json
from django.http import (HttpResponse, HttpResponseBadRequest, HttpResponseNotAllowed, QueryDict)

from django.core.exceptions import FieldError

from specifyweb.backend.permissions.permissions import enforce, table_permissions_checker
from specifyweb.specify.crud import apply_filters, delete_resource, get_collection, get_resource, post_resource, put_resource
from specifyweb.specify.exceptions import FilterError, OrderByError
from specifyweb.specify.filter_by_col import filter_by_collection
from specifyweb.specify.serializers import _obj_to_data, toJson
from specifyweb.specify.validators import GetCollectionForm, RowsForm

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
        data = get_resource(model, id, checker, request.GET.get('recordsetid', None))
        resp = HttpResponse(toJson(data), content_type='application/json')

    elif request.method == 'PUT':
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
        try:
            data = get_collection(request.specify_collection, model, checker,
                                  control_params.cleaned_data, request.GET)
        except (FilterError, OrderByError) as e:
            return HttpResponseBadRequest(e)
        resp = HttpResponse(toJson(data), content_type='application/json')

    elif request.method == 'POST':
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

def collection_dispatch_bulk(request, model) -> HttpResponse:
    """
    Do the same as collection_dispatch, but for bulk POST operations.
    Call this endpoint with a list of objects of the same type to create.
    This reduces the amount of API calls needed to create multiple objects, like when creating multiple carry forwards.
    """
    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
        
    data = json.loads(request.body)
    resp_objs = []
    for obj_data in data:
        obj = post_resource(
            request.specify_collection,
            request.specify_user_agent,
            model,
            obj_data,
            request.GET.get("recordsetid", None),
        )
        resp_objs.append(_obj_to_data(obj, checker))

    return HttpResponseCreated(toJson(resp_objs), content_type='application/json')

def collection_dispatch_bulk_copy(request, model, copies) -> HttpResponse:
    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    data = json.loads(request.body)
    data = dict(filter(lambda item: item[0] != 'id', data.items())) # Remove ID field before making copies
    resp_objs = []
    for _ in range(int(copies)):
        obj = post_resource(
            request.specify_collection,
            request.specify_user_agent,
            model,
            data,
            request.GET.get("recordsetid", None),
        )
        resp_objs.append(_obj_to_data(obj, checker))

    return HttpResponseCreated(toJson(resp_objs), content_type='application/json')

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