from django import http
from django.db import router, transaction
from django.db.models.deletion import Collector
from django.db.models import ForeignKey

from specifyweb.middleware.general import require_http_methods
from specifyweb.specify.api.crud import (
    get_discipline_delete_guard_blockers,
    get_object_or_404,
    prepare_discipline_for_delete,
)
from specifyweb.specify.api.serializers import toJson
from specifyweb.specify.views import login_maybe_required

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def delete_blockers(request, model, id):
    """Returns a JSON list of fields on <model> that point to related
    resources which prevent the resource <id> of that model from being
    deleted.
    """
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
