from typing import Dict, List, Union

from django.views.decorators.http import require_GET
from django import http

from .views import login_maybe_required
from .datamodel import (
    datamodel,
    Table,
    Field,
    Relationship,
    TableDoesNotExistError,
)


def base_schema() -> Dict:
    return {
        "openapi": "3.0.0",
        "info": {
            "title": "Specify 7 API",
            "version": "7.6",  # TODO: don't hardcore the version
            "description": "Description of all Specify 7 API endpoints",
            "license": {
                "name": "GPS-2.0 Licence",
                "url": "https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html",
            },
        },
        "externalDocs": {
            "description": "How to use specifyweb API as a generic webservice",
            "url": "https://github.com/specify/specify7/wiki/Api-Demo",
        },
    }


@login_maybe_required
@require_GET
def openapi(request) -> http.HttpResponse:
    """Returns a OpenAPI spec for the Specify API at "/api/specify/...".
    This is a work in progress.
    """
    spec = {
        **base_schema(),
        "paths": {
            "/api/specify/"
            + table.django_name: table_to_endpoint(table)
            for table in datamodel.tables
        },
        "components": {
            "parameters": {
                "limit": {
                    "name": "limit",
                    "in": "query",
                    "description": "Limit the number of results",
                    "required": False,
                    "schema": {"type": "number", "minimum": 1},
                },
                "offset": {
                    "name": "offset",
                    "in": "query",
                    "description": "Offset the returned records by n records",
                    "required": False,
                    "schema": {"type": "number", "minimum": 1},
                },
            },
            "schemas": {
                **{
                    table.django_name: table_to_schema(table)
                    for table in datamodel.tables
                },
                "meta": {
                    "type": "object",
                    "properties": {
                        "meta": {
                            "type": "object",
                            "properties": {
                                "offset": {
                                    "type": "number",
                                }
                            },
                        }
                    },
                },
            },
        },
    }
    return http.JsonResponse(spec)


@login_maybe_required
@require_GET
def view(request, model: str) -> http.HttpResponse:
    """Returns a JSONSchema for the JSON representation of resources
    of the given <model> type.
    """
    try:
        table = datamodel.get_table_strict(model)
    except TableDoesNotExistError:
        return http.HttpResponseNotFound()

    return http.JsonResponse(table_to_schema(table))


def table_to_endpoint(table: Table) -> Dict:
    return {
        "get": {
            "tags": ["table"],
            "summary": "Get records from the "
            + table.django_name
            + " table",
            "description": "TODO: description",
            "parameters": [
                {
                    "$ref": "#/components/parameters/limit",
                },
                {"$ref": "#/components/parameters/offset"},
            ],
            "responses": {
                "200": {
                    "description": "Data fetched successfully",
                    "content": {
                        "application/json": {
                            "schema": {
                                "allOf": [
                                    {
                                        "$ref": "#/components/schemas/meta",
                                    },
                                    {
                                        "type": "object",
                                        "properties": {
                                            "objects": {
                                                "type": "array",
                                                "items": {
                                                    "$ref": "#/components/schemas/"
                                                    + table.django_name
                                                },
                                            },
                                        },
                                    },
                                ]
                            }
                        }
                    },
                }
            },
        }
    }


def table_to_schema(table: Table) -> Dict:
    return {
        "title": table.django_name,
        "type": "object",
        "properties": {
            f.name.lower(): field_to_schema(f) for f in table.all_fields
        },
        "additionalProperties": False,
        "required": [f.name for f in table.all_fields],
    }


def field_to_schema(field: Field) -> Dict:
    if field.is_relationship:
        assert isinstance(field, Relationship)
        if field.dependent:
            if field.type == "one-to-one":
                return {
                    "ref$": f"#components/schemas/{field.relatedModelName.capitalize()}"
                }
            else:
                return {}
        else:
            return {}

    elif field.type in ("text", "java.lang.String"):
        return {
            "type": required_to_schema(field, "string"),
            "maxLength": getattr(field, "length", 0),
        }

    elif field.type in (
        "java.lang.Integer",
        "java.lang.Long",
        "java.lang.Byte",
        "java.lang.Short",
        "java.lang.Float",
        "java.lang.Double",
    ):
        return {"type": required_to_schema(field, "number")}

    elif field.type in ("java.util.Calendar", "java.util.Date"):
        return {
            "type": required_to_schema(field, "string"),
            "format": "date",
        }

    elif field.type == "java.sql.Timestamp":
        return {
            "type": required_to_schema(field, "string"),
            "format": "date-time",
        }

    elif field.type == "java.math.BigDecimal":
        return {"type": required_to_schema(field, "string")}

    elif field.type == "java.lang.Boolean":
        return {"type": required_to_schema(field, "boolean")}

    else:
        raise Exception(f"unexpected field type: {field.type}")


def required_to_schema(
    field: Field, ftype: str
) -> Union[str, List[str]]:
    return ftype if field.required else [ftype, "null"]
