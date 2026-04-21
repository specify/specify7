import json

from specifyweb.backend.permissions.permissions import table_permissions_checker
from django.http import (HttpResponse, HttpResponseNotAllowed)

from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.api.dispatch import HttpResponseCreated
from specifyweb.specify.api.serializers import _obj_to_data, toJson


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