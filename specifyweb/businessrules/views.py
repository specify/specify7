# Create your views here.
from .models import UniquenessRule
import json

from django import http
from django.db.models import Q, Count
from django.views.decorators.http import require_http_methods, require_POST


from specifyweb.specify.views import login_maybe_required, openapi
from specifyweb.specify.api import obj_to_data
from specifyweb.specify import models
from specifyweb.specify.models import datamodel

from .uniqueness_rules import make_uniqueness_rule

UniquenessRuleSchema = {
    "type": "object",
    "properties": {
        "id": {
            "type": "number"
        },
        "fields": {
            "type": "array",
            "description": "The unique fields of the rule, which is an array of serialzed splocalecontaineritem objects",
            "items": {
                "type": "object"
            }
        },
        "scope": {
            "description": "The 'scope' of the uniqueness rule. The rule is unique to database if scope is null and otherwise is a serialzed splocalecontaineritem",
            "anyOf": [
                {"type": "object"},
                {"type": "null"}
            ]
        },
        "isDatabaseConstraint": {
            "type": "boolean"
        }
    },
    "required": ["id", "fields", "scope", "isDatabaseConstraint"],
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
    "post": {
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
                            }
                        }
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
@require_http_methods(['GET', 'POST'])
def uniqueness_rule(request, discipline_id):
    data = {}
    DATABASE_FIELD_NAME = "_database"

    try:
        model = request.GET["model"]
    except:
        model = None

    if request.method == 'GET':
        rules = UniquenessRule.objects.filter(discipline=discipline_id)
        for rule in rules:
            rule_fields = rule.splocalecontaineritems.filter(
                uniquenessrule_splocalecontaineritem__isScope=0)
            _scope = rule.splocalecontaineritems.filter(
                uniquenessrule_splocalecontaineritem__isScope=1)
            scope = None if len(_scope) == 0 else _scope

            table = rule_fields[0].container.name
            if model is not None and table.lower() != model.lower():
                continue
            if table not in data.keys():
                data[table] = []
            data[table].append({"id": rule.id, "fields": [{"id": field.id, "name": field.name} for field in rule_fields], "scope": obj_to_data(
                scope[0]) if scope is not None else None, "isDatabaseConstraint": rule.isDatabaseConstraint})

    elif request.method == 'POST' or request.method == 'PUT':
        rules = json.loads(request.body)['rules']
        discipline = models.Discipline.objects.get(id=discipline_id)
        for rule in rules:
            fetched_scope = None if rule["scope"]["name"] == DATABASE_FIELD_NAME else models.Splocalecontaineritem.objects.get(
                id=rule["scope"]["id"])
            if rule["id"] is None:
                fetched_rule = UniquenessRule.objects.create(
                    isDatabaseConstraint=rule["isDatabaseConstraint"], discipline=discipline)
            else:
                fetched_rule = UniquenessRule.objects.get(id=rule["id"])
                fetched_rule.discipline = discipline
                fetched_rule.isDatabaseConstraint = rule["isDatabaseConstraint"]
                fetched_rule.save()

            fetched_rule.splocalecontaineritems.clear()
            locale_items = models.Splocalecontaineritem.objects.filter(
                id__in=[field["id"] for field in rule["fields"]])

            fetched_rule.splocalecontaineritems.set(list(locale_items))
            fetched_rule.splocalecontaineritems.add(
                fetched_scope, through_defaults={"isScope": True})

            make_uniqueness_rule(fetched_rule)

    return http.JsonResponse(data, safe=False, status=201 if request.method == "POST" else 200)


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
                                    "scope": {
                                        "description": "The given scope of the uniqueness rule, as a field name. If null, then the validation scopes the <fields> to a database level.",
                                        "anyOf": [
                                            {"type": "string"},
                                            {"type": "null"}
                                        ]
                                    },
                                    "strict": {
                                        "description": "Flag which if set to True considers NULL values for each field if the field is required when checking for duplicates",
                                        "type": "boolean",
                                        "default": False
                                    }
                                },
                                "required": ["fields", "scope"]
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
    scope = uniqueness_rule['scope'].lower(
    ) if uniqueness_rule['scope'] is not None else None

    required_fields = {field: table.get_field(
        field).required for field in fields}

    strict_search = data["strict"] if 'strict' in data.keys() else False

    strict_filters = Q()
    for field, is_required in required_fields.items():
        if not strict_search and not is_required:
            strict_filters &= (~Q(**{f"{field}": None}))

    fields = [field for field in fields]
    if scope is not None:
        fields.append(scope)

    duplicates_field = '__duplicates'

    duplicates = django_model.objects.values(
        *fields).annotate(**{duplicates_field: Count('id')}).filter(strict_filters).filter(**{f"{duplicates_field}__gt": 1}).order_by(f'-{duplicates_field}')

    total_duplicates = sum(duplicate[duplicates_field]
                           for duplicate in duplicates)

    final = {
        "totalDuplicates": total_duplicates,
        "fields": [{"duplicates": duplicate[duplicates_field], "fields": {field: value for field, value in duplicate.items() if field != duplicates_field}}
                   for duplicate in duplicates]}

    return http.JsonResponse(final, safe=False)
