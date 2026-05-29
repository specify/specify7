from django import http
from django.db import router, transaction

from specifyweb.middleware.general import require_http_methods
from specifyweb.specify.api.crud import (
    get_discipline_delete_guard_blockers,
    get_object_or_404,
    prepare_discipline_for_delete,
)
from specifyweb.specify.api.serializers import toJson
from specifyweb.specify.models import protect_with_blockers
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

def _collect_delete_blockers(obj, using, id_limit=100) -> list[dict]:
    """Find PROTECT-related objects that block deletion of *obj*.

    Instead of using Django's Collector (which loads every related row
    into memory), we iterate the model's reverse relations, run a COUNT
    query for each PROTECT relationship, and fetch at most *id_limit*
    primary keys.  This keeps memory bounded regardless of how many
    blocking rows exist (#7515).
    """
    result = []
    for related in obj._meta.get_fields(include_hidden=True):
        if not related.auto_created or related.concrete:
            continue
        if not (related.one_to_many or related.one_to_one):
            continue
        if related.on_delete is not protect_with_blockers:
            continue
        qs = related.related_model._base_manager.db_manager(using).filter(
            **{related.field.name: obj.pk})
        total = qs.count()
        if total > 0:
            ids = list(qs.order_by('pk').values_list('pk', flat=True)[:id_limit])
            result.append({
                'table': related.related_model.__name__,
                'field': related.field.name,
                'ids': ids,
                'total_count': total,
            })
    return result
