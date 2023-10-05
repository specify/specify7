# Create your views here.
import json

from django import http
from django.db.models import OuterRef, F, Q, Count, Subquery
from django.views.decorators.http import require_http_methods, require_POST


from specifyweb.specify.views import login_maybe_required, openapi
from specifyweb.specify.api import uri_for_model, obj_to_data
from specifyweb.specify import models
from specifyweb.specify.models import datamodel

from .models import UniquenessRule


@login_maybe_required
@require_http_methods(['GET', 'POST'])
@openapi(schema={
    "get": {
        "parameters": [
            {'in': 'query', 'name': 'model', 'required': False,
                'schema': {'type': 'string', 'description': ''}}
        ],
        "responses": {
            "200": {
                "description": "",
            }
        }
    }
})
def uniqueness_rule(request, discipline_id):
    data = {}

    try:
        model = request.GET["model"]
    except:
        model = None

    if request.method == 'GET':
        rules = UniquenessRule.objects.filter(discipline=discipline_id)
        for rule in rules:
            rule_fields = rule.splocalecontaineritems.get_queryset()

            table = rule_fields[0].container.name
            if model is not None and table != model.lower():
                continue
            if table not in data.keys():
                data[table] = []
            data[table].append({"id": rule.id, "fields": [obj_to_data(field) for field in rule_fields], "scope": obj_to_data(
                rule.scope) if rule.scope is not None else None, "isDatabaseConstraint": rule.isdatabaseconstraint})

    elif request.method == 'POST':
        rules = json.loads(request.body)['rules']
        discipline = models.Discipline.objects.get(id=discipline_id)
        for rule in rules:
            fetched_scope = rule["scope"] if rule["scope"] is None else models.Splocalecontaineritem.objects.get(
                id=rule["scope"]["id"])
            if rule["id"] is None:
                fetched_rule = UniquenessRule.objects.create(
                    isdatabaseconstraint=rule["isDatabaseConstraint"], discipline=discipline, scope=fetched_scope)
            else:
                fetched_rule = UniquenessRule.objects.get(id=rule["id"])
                fetched_rule.discipline = discipline
                fetched_rule.isdatabaseconstraint = rule["isDatabaseConstraint"]
                fetched_rule.scope = fetched_scope
                fetched_rule.save()

            fetched_rule.splocalecontaineritems.clear()
            locale_items = models.Splocalecontaineritem.objects.filter(id__in=[field["id"] for field in
                                                                               rule["fields"]])
            fetched_rule.splocalecontaineritems.set(list(locale_items))

    return http.JsonResponse(data, safe=False)


@require_POST
def validate_uniqueness(request):
    data = json.loads(request.body)
    model = datamodel.get_table(data['model'])
    django_model = getattr(models, model.django_name, None)

    if model is None:
        return http.HttpResponseBadRequest('Invalid model name in request')

    uniqueness_rule = data['rule']
    fields = [field['name'].lower() for field in uniqueness_rule['fields']]
    scope = uniqueness_rule['scope'].lower(
    ) if uniqueness_rule['scope'] is not None else None

    required_fields = {field: model.get_field(
        field).required for field in fields}

    strict_search = data["strict"] if 'strict' in data.keys() else False

    strict_filters = Q()
    for field, is_required in required_fields.items():
        if not strict_search and not is_required:
            strict_filters &= (~Q(**{f"{field}": None}))

    field_filters = [field for field in fields]
    if scope is not None:
        field_filters.append(scope)

    duplicates = django_model.objects.values(
        *field_filters).annotate(_duplicates=Count('id')).order_by().filter(strict_filters).filter(_duplicates__gt=1)

    total_duplicates = 0
    for dupe in duplicates:
        total_duplicates += dupe['_duplicates']

    final = {
        "totalDuplicates": total_duplicates,
        "fields": [{field: value for field, value in dupe.items()}
                   for dupe in duplicates]}
    return http.JsonResponse(final, safe=False)
