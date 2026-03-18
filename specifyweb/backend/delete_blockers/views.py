from django import http
from django.db import router, transaction
from django.db.models.deletion import Collector

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
        if not request.specify_user.is_admin():
            return http.HttpResponseForbidden('Specifyuser must be an institution admin')
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
            {
                'table': sub_objs[0].__class__.__name__,
                'field': field.name,
                'ids': [sub_obj.id for sub_obj in sub_objs]
            }
        ] for field, sub_objs in collector.delete_blockers
    ])

def flatten(l):
    return [item for sublist in l for item in sublist]