from django import http
from django.db import router
from django.db.models.deletion import Collector

from specifyweb.middleware.general import require_http_methods
from specifyweb.specify import api
from specifyweb.specify.views import login_maybe_required

@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def delete_blockers(request, model, id):
    """Returns a JSON list of fields on <model> that point to related
    resources which prevent the resource <id> of that model from being
    deleted.
    """
    obj = api.get_object_or_404(model, id=int(id))
    using = router.db_for_write(obj.__class__, instance=obj)
    collector = Collector(using=using)
    collector.delete_blockers = []
    collector.collect([obj])
    result = flatten([
        [
            {
                'table': sub_objs[0].__class__.__name__,
                'field': field.name,
                'ids': [sub_obj.id for sub_obj in sub_objs]
            }
        ] for field, sub_objs in collector.delete_blockers
    ])
    return http.HttpResponse(api.toJson(result), content_type='application/json')

def flatten(l):
    return [item for sublist in l for item in sublist]