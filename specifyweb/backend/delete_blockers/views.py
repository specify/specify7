from collections import defaultdict

from django import http
from django.db import router, transaction
from django.db.models.deletion import Collector, CASCADE, PROTECT
from django.db.models import ForeignKey
from django.views.decorators.http import require_POST

from specifyweb.middleware.general import require_http_methods
from specifyweb.specify.api.crud import (
    get_discipline_delete_guard_blockers,
    get_object_or_404,
    get_model,
    prepare_discipline_for_delete,
)
from specifyweb.specify.models import protect_with_blockers
from specifyweb.specify.api.serializers import toJson
from specifyweb.specify.views import login_maybe_required

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def old_delete_blockers(request, model, id):
    """Returns a JSON list of fields on <model> that point to related
    resources which prevent the resource <id> of that model from being
    deleted.
    """
    # limit = request.GET["limit"]
    # depth_limit = request.GET["depthLimit"]

    obj = get_object_or_404(model, id=int(id))
    using = router.db_for_write(obj.__class__, instance=obj)

    if obj._meta.model_name == 'discipline': # Special case for discipline
        guard_blockers = get_discipline_delete_guard_blockers(obj)
        if guard_blockers:
            result = guard_blockers
        else:
            # Try pre-delete discipline tree detaching
            with transaction.atomic(using=using):
                prepare_discipline_for_delete(obj)
                result = _collect_delete_blockers(obj, using)
                transaction.set_rollback(True, using=using)
    else:
        # Standard delete blockers behavior
        result = _collect_delete_blockers(obj, using)

    return http.HttpResponse(toJson(result), content_type='application/json')

@login_maybe_required
@require_http_methods(['GET'])
def delete_blockers(request, model, id):
    limit = int(request.GET["limit"]) if "limit" in request.GET else 20
    offset = int(request.GET["offset"]) if "offset" in request.GET else 0
    obj = get_object_or_404(model, id=int(id))
    immediate, deferred = fetch_immediate_blockers(obj, limit=limit, offset=offset)
    result = {
        "results": immediate,
        "next": deferred
    }
    return http.HttpResponse(toJson(result), content_type='application/json')

def fetch_immediate_blockers(obj, limit=20, offset=0):
    all_fields = obj._meta.get_fields(include_hidden=True)
    all_relationships = filter(
        # Check whether there are any concrete fields that SHOULD be included
        # here, like some ToOne fields that acts as blockers
        lambda field: field.is_relation and not field.concrete,
        all_fields
    )
    results = []
    next = []
    for relationship in all_relationships:
        related_ids = _prepare_blockers(obj, relationship, limit=limit, offset=offset)
        if len(related_ids) == 0:
            continue
        complete = limit == 0 or len(related_ids) < limit
        payload = {
            "table": relationship.related_model._meta.model_name,
            "field": relationship.field.name,
            "ids": list(related_ids),
            "offset": offset,
            "limit": limit,
            "complete": complete
        }
        if relationship.on_delete is protect_with_blockers or relationship.on_delete is PROTECT:
            results.append(payload)
        elif relationship.on_delete is CASCADE:
            next.append(payload)
    return results, next


def _prepare_blockers(obj, relationship, limit=20, offset=0):
    query_set = (
        relationship.related_model.objects
            .filter(
                **{relationship.field.name: obj.pk}
            ).order_by("pk")
            .values_list("pk", flat=True))
    if limit != 0:
        query_set = query_set[offset: offset + limit]
    return query_set

def _collect_delete_blockers(obj, using) -> list[dict]:
    collector = Collector(using=using)
    collector.delete_blockers = []
    collector.collect([obj])
    return flatten([
        [
            _serialize_delete_blocker(field, sub_objs)
        ] for field, sub_objs in collector.delete_blockers
    ])

def _serialize_delete_blocker(field, sub_objs) -> dict:
    normalized = _normalize_many_to_many_blocker(field, sub_objs)
    if normalized is not None:
        return normalized

    return {
        'table': sub_objs[0].__class__.__name__,
        'field': field.name,
        'ids': [sub_obj.id for sub_obj in sub_objs]
    }

def _normalize_many_to_many_blocker(field, sub_objs) -> dict | None:
    through_model = sub_objs[0].__class__
    if hasattr(through_model, 'specify_model'):
        return None

    foreign_keys = [
        model_field
        for model_field in through_model._meta.fields
        if isinstance(model_field, ForeignKey)
    ]
    if len(foreign_keys) != 2:
        return None

    other_field = next(
        (
            model_field
            for model_field in foreign_keys
            if model_field.name != field.name
        ),
        None,
    )
    if other_field is None:
        return None

    other_model = other_field.related_model
    if not hasattr(other_model, 'specify_model'):
        return None

    relationship = next(
        (
            relationship
            for relationship in other_model.specify_model.relationships
            if getattr(relationship, 'through_model', None) == through_model.__name__
            and getattr(relationship, 'through_field', None) == other_field.name
        ),
        None,
    )
    if relationship is None:
        return None

    return {
        'table': other_model.specify_model.name,
        'field': relationship.name,
        'ids': [getattr(sub_obj, other_field.attname) for sub_obj in sub_objs],
    }

def flatten(l):
    return [item for sublist in l for item in sublist]
