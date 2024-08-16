# Create your views here.
import json

from django import http
from django.db import transaction
from django.db.models import Q, Count
from django.views.decorators.http import require_POST

from specifyweb.middleware.general import require_http_methods
from specifyweb.businessrules.models import UniquenessRule
from specifyweb.businessrules.uniqueness_rules import rule_is_global
from specifyweb.specify.views import login_maybe_required, openapi
from specifyweb.specify import models
from specifyweb.specify.models import datamodel
from specifyweb.permissions.permissions import PermissionTarget, PermissionTargetAction, check_permission_targets


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
                    "description": "The unique fields of the rule, which is an array of field names for a rule's model",
                    "items": {
                        "type": "string",
                    }
                },
                "scopes": {
                    "type": "array",
                    "items": {
                        "description": "The 'scope' of the uniqueness rule. The rule is unique to database if scope is null and otherwise is a field name or path to a field",
                        "type": "string",
                    }
                },
                "modelName": {
                    "type": "string"
                },
                "isDatabaseConstraint": {
                    "type": "boolean"
                }
            }
        }
    },
    "required": ["id", "fields", "scopes", "modelName", "isDatabaseConstraint"],
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
                            "model": {
                                "type": "string"
                            }
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
@require_http_methods(['GET', 'PUT'])
@transaction.atomic
def uniqueness_rule(request, discipline_id):
    data = {}

    if request.method == 'GET':

        try:
            model = request.GET["model"]
        except:
            model = None

        rules = UniquenessRule.objects.filter(
            Q(discipline=discipline_id) | Q(discipline=None))
        for rule in rules:
            rule_fields = rule.fields.filter(isScope=0)
            scopes = rule.fields.filter(isScope=1)

            table = rule.modelName
            if model is not None and table.lower() != model.lower():
                continue
            if table not in data.keys():
                data[table] = []
            data[table].append({"rule": {"id": rule.id, "fields": [field.fieldPath for field in rule_fields], "scopes": [
                               _scope.fieldPath for _scope in scopes],
                "modelName": rule.modelName, "isDatabaseConstraint": rule.isDatabaseConstraint}})

    if request.method == 'PUT':
        ids = set()
        tables = set()
        rules = json.loads(request.body)['rules']
        model = datamodel.get_table(json.loads(request.body)["model"])
        discipline = models.Discipline.objects.get(id=discipline_id)
        for rule in rules:
            scopes = rule["scopes"]
            if rule["id"] is None:
                fetched_rule = UniquenessRule.objects.create(
                    isDatabaseConstraint=rule["isDatabaseConstraint"], modelName=datamodel.get_table_strict(rule['modelName']).django_name, discipline=None if rule_is_global(scopes) else discipline)
                ids.add(fetched_rule.id)
            else:
                ids.add(rule["id"])
                fetched_rule = UniquenessRule.objects.filter(
                    id=rule["id"]).first()
                tables.add(fetched_rule.modelName)
                fetched_rule.discipline = None if rule_is_global(
                    scopes) else discipline
                fetched_rule.isDatabaseConstraint = rule["isDatabaseConstraint"]
                fetched_rule.save()

            fetched_rule.fields.clear()
            fetched_rule.fields.set(rule["fields"])
            if len(scopes) > 0:
                fetched_rule.fields.add(
                    *scopes, through_defaults={"isScope": True})

        rules_to_remove = UniquenessRule.objects.filter(
            Q(discipline=discipline) | Q(discipline=None), Q(modelName__in=[*tables, model.django_name])).exclude(id__in=ids)

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
                                                "minimum": 1
                                            },
                                            "fields": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "description": "An object with keys of field names and values corresponding to the value of the field. \
                                                    For example: `{catalognumber : 012345678}`",
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
    table = datamodel.get_table_strict(data['table'])
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

    for scope in scopes:
        strict_filters &= (~Q(**{f"{scope}": None}))

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