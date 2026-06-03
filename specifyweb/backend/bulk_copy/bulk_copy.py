import json

from specifyweb.backend.permissions.permissions import table_permissions_checker, cache_permission_queries
from django.http import (HttpResponse, HttpResponseNotAllowed, HttpResponseBadRequest)
from django.db import transaction

from specifyweb.specify.api.crud import delete_resource, post_resource
from specifyweb.specify.api.dispatch import HttpResponseCreated
from specifyweb.specify.api.serializers import _obj_to_data, toJson
from specifyweb.backend.businessrules.utils import cache_unique_catnum_preferences
from specifyweb.backend.businessrules.uniqueness_rules import cache_uniqueness_rules
from specifyweb.backend.context.remote_prefs import cache_remote_preferences


def collection_dispatch_bulk_copy(request, model, copies) -> HttpResponse:
    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    data = json.loads(request.body)
    data = dict(filter(lambda item: item[0] != 'id', data.items())) # Remove ID field before making copies
    resp_objs = []
    with (
        cache_unique_catnum_preferences(),
        cache_uniqueness_rules(),
        cache_remote_preferences(),
        cache_permission_queries()
    ):
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
    with (
        cache_unique_catnum_preferences(),
        cache_uniqueness_rules(),
        cache_remote_preferences(),
        cache_permission_queries()
    ):
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

from django.db import transaction
from sqlalchemy import inspect
from sqlalchemy.sql.expression import insert, literal
from specifyweb.backend.stored_queries.queryfield import fields_from_json
from specifyweb.backend.stored_queries.execution import build_query
from specifyweb.backend.stored_queries import models
from specifyweb.specify.api.crud import get_model_or_404
import logging
logger = logging.getLogger(__name__)

@transaction.atomic()
def collection_dispatch_bulk_delete(request, model) -> HttpResponse:
    version = None

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    
    data = json.loads(request.body)
    
    logger.debug("bulk deleting %s with data: %s", model, data)
    if isinstance(model, str):
        model = get_model_or_404(model)

    ids = data.get('ids', [])
    spquery = data.get('query', None)

    delete_from_query = (len(ids) == 0)

    if delete_from_query and spquery is not None:
        with models.session_context() as session:
            tableid = spquery["contexttableid"]
            
            field_specs = fields_from_json(spquery["fields"])

            query, __ = build_query(
                session,
                request.specify_collection,
                request.specify_user,
                tableid,
                field_specs
            )

            entity = query.column_descriptions[0]["entity"]
            pk_col = inspect(entity).primary_key[0]

            ids = list(session.execute(
                query.with_entities(pk_col).distinct()
            ).scalars())

    if len(ids) > 0:
        # Delete selection of records
        for id in ids:
            delete_resource(
                request.specify_collection,
                request.specify_user_agent,
                model,
                id,
                version
            )
    else:
        return HttpResponseBadRequest('Record ids or a query resource are missing.')

    return HttpResponse('', status=204)
