from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from django.conf import settings

from specify.api import toJson
import models

from fieldspec import FieldSpec

def make_queryset(query, field_specs):
    model = models.models_by_tableid[query.contexttableid]
    filters = [fs.make_filter() for fs in field_specs]

    qs = model.objects.filter(*filters)

    if query.selectdistinct:
        qs = qs.distinct()

    return qs

def process_value(value, field_spec):
    if value is None: return None

    date_part = field_spec.date_part
    if date_part is not None:
        return getattr(value, date_part)

    tdis = field_spec.treedefitems
    if tdis is None: return value

    tree = field_spec.table
    def get_subtrees(tdi):
        subtrees = tree.objects.filter(
            definitionitem__in=tdis,
            nodenumber__lte=value,
            highestchildnodenumber__gte=value)
        return subtrees.values('name')

    ancestors = (subtree['name']
                 for tdi in tdis
                 for subtree in get_subtrees(tdi))
    try:
        return ancestors.next()
    except StopIteration:
        return None

def make_results(qs, field_specs):
    display_fields = [fs for fs in field_specs
                      if fs.spqueryfield.isdisplay]

    display_keys = ['id'] + [fs.key for fs in display_fields]

    results = [['id'] + [fs.spqueryfield.id for fs in display_fields]]

    results.extend(
        [values[0]] + [process_value(v, fs) for v, fs in zip(values[1:], display_fields)]
        for values in qs.values_list(*display_keys))

    return results

@require_GET
@login_required
def query(request, id):
    session = settings.SA_SESSION()
    sp_query = session.query(models.SpQuery).get(int(id))
    field_specs = [FieldSpec.from_spqueryfield(field) for field in sp_query.fields]
    model = models.models_by_tableid[sp_query.contextTableId]
    id_field = getattr(model, model._id)
    query = session.query(id_field)
    fields = []
    for fs in field_specs:
        query, field = fs.add_to_query(query)
        fields.append(field)

    results = list(query)
    return HttpResponse(toJson(results), content_type='application/json')

