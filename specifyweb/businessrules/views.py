# Create your views here.
from .models import UniquenessRule
import json

from django import http
from django.db import transaction
from django.db.models import Q, Count
from django.views.decorators.http import require_http_methods, require_POST

from specifyweb.specify.views import login_maybe_required, openapi
from specifyweb.specify import models
from specifyweb.specify.models import datamodel
from specifyweb.permissions.permissions import PermissionTarget, PermissionTargetAction, check_permission_targets

from .uniqueness_rules import make_uniqueness_rule, disconnect_uniqueness_rule


class SetUniqueRulePT(PermissionTarget):
    resource = "/schemaconfig/uniquenessrules"
    view = PermissionTargetAction()
    create = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()


UniquenessRuleSchema = {
    "type": "object",
    "properties": {
        "rule": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "number"
                },
                "fields": {
                    "type": "array",
                    "description": "The unique fields of the rule, which is an array of partially serialzed splocalecontaineritem objects",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "number"},
                            "name": {"type": "string"}
                        },
                        "required": ["id", "name"]
                    }
                },
                "scopes": {
                    "type": "array",
                    "items": {
                        "description": "The 'scope' of the uniqueness rule. The rule is unique to database if scope is null and otherwise is a serialzed splocalecontaineritem",
                        "type": "object",
                        "properties": {
                            "id": {"type": "number"},
                            "name": {"type": "string"}
                        },
                        "required": ["id", "name"],

                    }
                },
                "isDatabaseConstraint": {
                    "type": "boolean"
                }
            }
        }
    },
    "required": ["id", "fields", "scopes", "isDatabaseConstraint"],
    "additionalProperties": False,
}


@openapi(schema={
    "get": {
        "parameters": [
            {'in': 'query', 'name': 'model', 'required': False,
                'schema': {'type': 'string', 'description': 'The table name to fetch the uniqueness rules for'}}
        ],
        "responses": {
            "200": {
                "description": "Uniqueness Rules fetched successfully",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "description": "An object with keys corresponding to table names and values are an array of uniqueness rules",
                            "additionalProperties": {
                                "type": "array",
                                "description": "The array of uniqueness rules for a given table",
                                "items": UniquenessRuleSchema
                            }
                        }
                    }
                }
            }
        }
    },
    "put": {
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "rules": {
                                "type": "array",
                                "description": "The array of uniqueness rules for a given table",
                                "items": UniquenessRuleSchema
                            },
                        },
                        "required": ["rules"]
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Uniqueness rules properly updated and/or created",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object"
                        }
                    }
                }
            }
        }
    }
})
@login_maybe_required
@require_http_methods(['GET', 'PUT', 'POST'])
@transaction.atomic
def uniqueness_rule(request, discipline_id):
    data = {}

    try:
        model = request.GET["model"]
    except:
        model = None

    if request.method == 'GET':
        rules = UniquenessRule.objects.filter(discipline=discipline_id)
        for rule in rules:
            rule_fields = rule.splocalecontaineritems.filter(
                uniquenessrule_splocalecontaineritem__isScope=0)
            scope = rule.splocalecontaineritems.filter(
                uniquenessrule_splocalecontaineritem__isScope=1)

            table = rule_fields[0].container.name
            if model is not None and table.lower() != model.lower():
                continue
            if table not in data.keys():
                data[table] = []
            data[table].append({"rule": {"id": rule.id, "fields": [{"id": field.id, "name": field.name} for field in rule_fields], "scopes": [{
                               "id": _scope.id, "name": _scope.name} for _scope in scope], "isDatabaseConstraint": rule.isDatabaseConstraint}})

    else:
        if request.method == 'POST':
            check_permission_targets(
                request.specify_collection.id, request.specify_user.id, [SetUniqueRulePT.create])
        elif request.method == 'PUT':
            check_permission_targets(
                request.specify_collection.id, request.specify_user.id, [SetUniqueRulePT.update])

        ids = []
        rules = json.loads(request.body)['rules']
        discipline = models.Discipline.objects.get(id=discipline_id)
        for rule in rules:
            fetched_scopes = models.Splocalecontaineritem.objects.filter(
                id__in=[int(scope["id"]) for scope in rule["scopes"]]) if len(rule["scopes"]) > 0 else [None]
            if rule["id"] is None:
                fetched_rule = UniquenessRule.objects.create(
                    isDatabaseConstraint=rule["isDatabaseConstraint"], discipline=discipline)
            else:
                ids.append(rule["id"])
                fetched_rule = UniquenessRule.objects.get(id=rule["id"])
                fetched_rule.discipline = discipline
                fetched_rule.isDatabaseConstraint = rule["isDatabaseConstraint"]
                fetched_rule.save()

            fetched_rule.splocalecontaineritems.clear()
            locale_items = models.Splocalecontaineritem.objects.filter(
                id__in=[field["id"] for field in rule["fields"]])

            fetched_rule.splocalecontaineritems.set(list(locale_items))
            fetched_rule.splocalecontaineritems.add(
                *fetched_scopes, through_defaults={"isScope": True})

            make_uniqueness_rule(fetched_rule)

            table = fetched_rule.splocalecontaineritems.all()[0].container.name
            model_name = datamodel.get_table(table).django_name

            rules_to_remove = UniquenessRule.objects.filter(
                discipline=discipline, splocalecontaineritems__container__name=table).exclude(id__in=ids)

            for rule in rules_to_remove:
                disconnect_uniqueness_rule(rule)

            rules_to_remove.delete()

    return http.JsonResponse(data, safe=False, status=201 if request.method == "PUT" else 200)


@openapi(schema={
    "post": {
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "table": {
                                "type": "string",
                                "description": "The name of the table from which to validate uniqueness from",
                            },
                            "rule": {
                                "type": "object",
                                "properties": {
                                    "fields": {
                                        "description": "An array containing field names from <table> which represent the unique fields",
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        }
                                    },
                                    "scopes": {
                                        "type": "array",
                                        "items": {
                                            "description": "The given scope of the uniqueness rule, as a field name",
                                            "type": "string"
                                        }
                                    }
                                },
                                "required": ["fields", "scopes"]
                            }
                        }
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Uniqueness rules checked for validation",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "totalDuplicates": {
                                    "type": "number",
                                    "minimum": 0
                                },
                                "fields": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "duplicates": {
                                                "type": "number",
                                                "minimum": 0
                                            },
                                            "fields": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "examples": {
                                                        "catalognumber": "012345678"
                                                    }
                                                }
                                            }
                                        },
                                        "additionalProperties": False
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }})
@require_POST
def validate_uniqueness(request):
    data = json.loads(request.body)
    table = datamodel.get_table(data['table'])
    django_model = getattr(models, table.django_name, None)

    if table is None or django_model is None:
        return http.HttpResponseBadRequest('Invalid table name in request')

    uniqueness_rule = data['rule']
    fields = [field.lower() for field in uniqueness_rule['fields']]
    scopes = [rule.lower() for rule in uniqueness_rule['scopes']]

    required_fields = {field: table.get_field(
        field).required for field in fields}

    strict_filters = Q()
    for field, is_required in required_fields.items():
        if not is_required:
            strict_filters &= (~Q(**{f"{field}": None}))

    all_fields = [*fields, *scopes]

    duplicates_field = '__duplicates'

    duplicates = django_model.objects.values(
        *all_fields).annotate(**{duplicates_field: Count('id')}).filter(strict_filters).filter(**{f"{duplicates_field}__gt": 1}).order_by(f'-{duplicates_field}')

    total_duplicates = sum(duplicate[duplicates_field]
                           for duplicate in duplicates)

    final = {
        "totalDuplicates": total_duplicates,
        "fields": [{"duplicates": duplicate[duplicates_field], "fields": {field: value for field, value in duplicate.items() if field != duplicates_field}}
                   for duplicate in duplicates]}

    return http.JsonResponse(final, safe=False)
