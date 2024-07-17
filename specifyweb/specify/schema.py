"""API schema generation based on Specify data model."""

from django import http
from django.conf import settings
from django.utils.translation import gettext as _
from typing import Dict, List, Tuple, cast

from specifyweb.middleware.general import require_GET
from .datamodel import (
    Field,
    Relationship,
    Table,
    TableDoesNotExistError,
    datamodel,
)
from .views import login_maybe_required


def base_schema(title="Specify 7 API", description="") -> Dict:
    """Return base schema object that is shared between both Swagger UI's.

    returns:
        base object to use for OpenAPI schema
    """
    return {
        "openapi": "3.0.0",
        "info": {
            "title": title,
            "version": settings.VERSION,
            "description": """Specify 7 API Documentation<br><br>
              %s<br><br>
              ℹ️
              <a
                href="https://www.leverege.com/blogpost/what-is-an-api"
                rel="noreferrer nofollow"
                target="_blank"
                title="(opens in new tab)"
              >
                A brief</a
              >
              and
              <a
                href="https://blog.usejournal.com/part-1-gentle-introduction-to-apis-for-non-technical-people-what-is-it-fde4d97a3083"
                rel="noreferrer nofollow"
                target="_blank"
                title="(opens in new tab)"
                >a not-so-brief</a
              >
              introduction to APIs for non-programmers.
              """ % description,
            "license": {
                "name": "GPL-2.0 Licence",
                "url": "https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html",
            },
        },
        "externalDocs": {
            "description": "How to use specifyweb API as a generic webservice",
            "url": "https://github.com/specify/specify7/wiki/API-Documentation-Demo",
        },
        "servers": [
            {
                "url": "/",
                "description": "Current Specify 7 Instance",
            },
            {
                "url": "https://sp7demofish.specifycloud.org/",
                "description": "Specify 7 Public Demo Instance",
            },
            {
                "url": "{url}",
                "variables": {
                    "url": {
                        "default": "/",
                    },
                },
                "description": "Custom Specify 7 Server",
            },
        ],
    }


record_version_description = (
    "A version to work with (can be specified in "
    "Query string, Header or request object's 'version' key)"
)


@login_maybe_required
@require_GET
def openapi(request) -> http.HttpResponse:
    """Return an OpenAPI spec for the Specify API at "/api/specify/...".

    params:
        request: the request object (unused)

    returns:
        OpenAPI spec for the main Specify endpoint
    """
    return http.JsonResponse(generate_openapi_for_tables())


def generate_openapi_for_tables():
    return {
        **base_schema(_("Specify 7 Tables API")),
        **base_schema(
            _("Specify 7 Tables API"),
            description=f"""<a href="/documentation/api/operations/">
                    {_("Specify 7 APIs for system operations")}
                </a>"""
        ),
        "paths": {
            endpoint_url.lower(): endpoint_description
            for table in datamodel.tables
            for endpoint_url, endpoint_description in table_to_endpoint(
                table
            )
        },
        "components": {
            "parameters": {
                "limit": {
                    "name": "limit",
                    "in": "query",
                    "description": "Return at most 'limit' items. 0 - no limit",
                    "required": False,
                    "schema": {
                        "type": "number",
                        "minimum": 0,
                        "default": 20,
                    },
                },
                "offset": {
                    "name": "offset",
                    "in": "query",
                    "description": "Offset the returned records by n records",
                    "required": False,
                    "schema": {
                        "type": "number",
                        "minimum": 0,
                        "default": 0,
                    },
                },
                "domainfilter": {
                    "name": "domainfilter",
                    "in": "query",
                    "description": "Use the logged_in_collection to limit request to relevant items",
                    "required": False,
                    "schema": {
                        "type": "boolean",
                        "default": False,
                    },
                },
                "domainfilter_default": {
                    "name": "domainfilter",
                    "in": "query",
                    "description": "Use the logged_in_collection to limit request to relevant items",
                    "required": False,
                    "schema": {
                        "type": "boolean",
                        "default": True,
                    },
                },
                "orderby": {
                    "name": "orderby",
                    "in": "query",
                    "description": "The name of the field to order by. Prefix the field name with '-' for DESC sort order. Can specify multiple fields separated by comma",
                    "required": False,
                    "schema": {
                        "type": "string",
                    },
                },
                "collection_recordsetid": {
                    "name": "recordsetid",
                    "in": "query",
                    "description": "Created resources would be added to a recordset with this ID",
                    "required": False,
                    "schema": {
                        "type": "number",
                        "minimum": 0,
                    },
                },
                "version_in_query": {
                    "name": "version",
                    "in": "query",
                    "description": record_version_description,
                    "required": False,
                    "schema": {"type": "number", "minimum": 0},
                },
                "id": {
                    "name": "id",
                    "in": "path",
                    "required": True,
                    "schema": {
                        "type": "number",
                        "minimum": 0,
                    }
                },
                "version_in_header": {
                    "name": "HTTP_IF_MATCH",
                    "in": "header",
                    "description": record_version_description,
                    "required": False,
                    "schema": {
                        "type": "number",
                        "minimum": 0,
                    },
                },
                "record_recordsetid": {
                    "name": "recordsetid",
                    "in": "query",
                    "description": "If provided, response would also contain a 'recordset_info' key.",
                    "required": False,
                    "schema": {
                        "type": "number",
                        "minimum": 0,
                    },
                },
            },
            "schemas": {
                **{
                    table.django_name: table_to_schema(table)
                    for table in datamodel.tables
                },
                "_permission_denied_error": {
                    "type": "object",
                    "properties": {
                        "NoMatchingRuleException": {
                            "description": "One or more permissions checks failed during the request due to no policy rule matching the requested actions.",
                            "type": "array",
                            "items": {
                                "description": "The action(s) which failed the permissions check.",
                                "type": "object",
                                "properties": {
                                    "action": {
                                        "type": "string",
                                        "description": "The specific action which was not allowed."
                                    },
                                    "resource": {
                                        "type": "string",
                                        "description": "The resource to which the action applied."
                                    },
                                    "collectionid": {
                                        "type": "integer",
                                        "description": "The collection within which the action was applied."
                                    },
                                    "userid": {
                                        "type": "integer",
                                        "description": "The user attempting the action."
                                    },
                                },
                                "additionalProperties": False,
                                "required": ["collectionid", "userid", "resource", "action"],
                            }
                        }
                    }
                },
                "_collection_get": {
                    "type": "object",
                    "properties": {
                        "meta": {
                            "type": "object",
                            "properties": {
                                "limit": {
                                    "type": "number",
                                },
                                "offset": {
                                    "type": "number",
                                },
                                "total_count": {
                                    "type": "number",
                                    "description": "Total number of records from this table. The count depends on the value of 'domainfilter' query parameter",
                                },
                            },
                        }
                    },
                },
                "_resource_get": {
                    "type": "object",
                    "properties": {
                        "recordset_info": {
                            "oneOf": [
                                {
                                    "type": "string",
                                    "description": "null",
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "recordsetid": {
                                            "type": "number",
                                            "minimum": 0,
                                        },
                                        "total_count": {
                                            "type": "number",
                                            "minimum": 0,
                                        },
                                        "index": {
                                            "type": "number",
                                            "minimum": 0,
                                        },
                                        "previous": {
                                            "oneOf": [
                                                {
                                                    "type": "string",
                                                    "description": "null",
                                                },
                                                {
                                                    "type": "string",
                                                    "description": "URL for fetching information about the previous record",
                                                    "example": "/api/specify/collectionobject/249/",
                                                    "minimum": 0,
                                                },
                                            ]
                                        },
                                        "next": {
                                            "oneOf": [
                                                {
                                                    "type": "string",
                                                    "description": "null",
                                                },
                                                {
                                                    "type": "string",
                                                    "description": "URL for fetching information about the next record",
                                                    "example": "/api/specify/collectionobject/249/",
                                                    "minimum": 0,
                                                },
                                            ]
                                        },
                                    },
                                },
                            ],
                        }
                    },
                },
            },
        },
    }


@login_maybe_required
@require_GET
def view(request, model: str) -> http.HttpResponse:
    """Get JSONSchema for a given model.

    params
        request: the request object (unused)
        model: the name of the table to display

    returns:
        JSONSchema for the JSON representation of resources
        of the given <model> type.
    """
    try:
        table = datamodel.get_table_strict(model)
    except TableDoesNotExistError:
        return http.HttpResponseNotFound()

    return http.JsonResponse(table_to_schema(table))


def table_to_endpoint(table: Table) -> List[Tuple[str, Dict]]:
    """Generate OpenAPI for several endpoints based on table.

    params:
        table: the table object

    returns:
        OpenAPI for several endpoints
    """
    return [
        (
            f"/api/specify/{table.django_name}/",
            {
                "get": {
                    "tags": [table.django_name],
                    "summary": f"Query multiple records from the {table.django_name} table",
                    "description": (
                        f"Query multiple records from the {table.django_name} table<br>"
                        f"Filtering is supported by providing field values as GET parameters<br>"
                        f"Example: /api/specify/sometable/?field=value. Advanced filtering "
                        f"options are also supported (e.g. ?numericfield__gte=4). More filters "
                        f"are documented here: "
                        f"<a href=https://docs.djangoproject.com/en/4.0/ref/models/querysets/#field-lookups-1>https://docs.djangoproject.com/en/4.0/ref/models/querysets/#field-lookups-1</a>"
                    ),
                    "parameters": [
                        {"$ref": "#/components/parameters/limit"},
                        {"$ref": "#/components/parameters/offset"},
                        {
                            "$ref": "#/components/parameters/domainfilter"
                        },
                        {"$ref": "#/components/parameters/orderby"},
                    ],
                    "responses": {
                        "200": {
                            "description": "Data fetched successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "allOf": [
                                            {
                                                "$ref": "#/components/schemas/_collection_get",
                                            },
                                            {
                                                "type": "object",
                                                "properties": {
                                                    "objects": {
                                                        "type": "array",
                                                        "items": {
                                                            "$ref": f"#/components/schemas/{table.django_name}"
                                                        },
                                                    },
                                                },
                                            },
                                        ]
                                    },
                                },
                            },
                        },
                        "403": {
                            "description": "Permission denied",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/_permission_denied_error"}
                                }
                            }
                        },
                    },
                },
                "post": {
                    "tags": [table.django_name],
                    "summary": f"Upload a single record to the {table.django_name} table",
                    "description": f"Upload a single record to the {table.django_name} table",
                    "parameters": [
                        {
                            "$ref": "#/components/parameters/collection_recordsetid"
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "description": "A JSON representation of an object",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": f"#/components/schemas/{table.django_name}"
                                }
                            }
                        },
                    },
                    "responses": {
                        "201": {
                            "description": "A newly created object",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": f"#/components/schemas/{table.django_name}"
                                    },
                                },
                            },
                        }
                    },
                },
            },
        ),
        (
            f"/api/specify/bulk/{table.django_name}/",
            {
                "post": {
                    "tags": [table.django_name],
                    "summary": f"Upload multiple records to the {table.django_name} table",
                    "description": f"Upload multiple records to the {table.django_name} table",
                    "parameters": [
                        {
                            "$ref": "#/components/parameters/collection_recordsetid"
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "description": "An array containing a JSON representation of the objects to create",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "$ref": f"#/components/schemas/{table.django_name}",
                                    }
                                }
                            }
                        },
                    },
                    "responses": {
                        "201": {
                            "description": "An array containing the newly created objects",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "$ref": f"#/components/schemas/{table.django_name}",
                                        }
                                    }
                                }
                            },
                        }
                    },
                },
            }
        ),
        (
            f"/api/specify/bulk/{table.django_name}/{{copies}}/",
            {
                "post": {
                    "tags": [table.django_name],
                    "summary": f"Upload multiple records to the {table.django_name} table",
                    "description": f"Upload multiple records to the {table.django_name} table",
                    "parameters": [
                        {
                            "$ref": "#/components/parameters/collection_recordsetid"
                        },
                        {
                            "name": "copies",
                            "in": "path",
                            "required": True,
                            "schema": {
                                "type": "number",
                                "minimum": 1,
                            },
                            "description": "Number of copies to create",
                        },
                    ],
                    "requestBody": {
                        "required": True,
                        "description": "A serialized JSON representation of the object to clone",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": f"#/components/schemas/{table.django_name}"
                                }
                            }
                        },
                    },
                    "responses": {
                        "201": {
                            "description": "An array containing the newly created objects",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "$ref": f"#/components/schemas/{table.django_name}",
                                        }
                                    }
                                }
                            },
                        }
                    },
                },
            }
        ),
        (
            f"/api/specify/{table.django_name}/{{id}}/",
            {
                "parameters": [
                    {
                        "$ref": "#/components/parameters/id"
                    },
                    {
                        "$ref": "#/components/parameters/version_in_query"
                    },
                    {
                        "$ref": "#/components/parameters/version_in_header"
                    },
                ],
                "get": {
                    "tags": [table.django_name],
                    "summary": f"Fetch a single record from the {table.django_name} table",
                    "description": f"Fetch a single record from the {table.django_name} table",
                    "parameters": [
                        {
                            "$ref": "#/components/parameters/record_recordsetid"
                        },
                    ],
                    "responses": {
                        "200": {
                            "description": "Data fetched successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "allOf": [
                                            {
                                                "$ref": "#/components/schemas/_resource_get",
                                            },
                                            {
                                                "$ref": f"#/components/schemas/{table.django_name}"
                                            },
                                        ]
                                    }
                                }
                            },
                        }
                    },
                },
                "put": {
                    "tags": [table.django_name],
                    "summary": f"Update a single record from the {table.django_name} table",
                    "description": f"Update a single record from the {table.django_name} table",
                    "requestBody": {
                        "required": True,
                        "description": "A JSON representation of an object",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "allOf": [
                                        {
                                            "anyOf": [
                                                {
                                                    "type": "object",
                                                    "properties": {
                                                        "version": {
                                                            "description": record_version_description,
                                                            "type": "number",
                                                            "minimum": 0,
                                                        }
                                                    },
                                                }
                                            ],
                                        },
                                        {
                                            "$ref": f"#/components/schemas/{table.django_name}"
                                        },
                                    ],
                                }
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "A modified object",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": f"#/components/schemas/{table.django_name}"
                                    },
                                },
                            },
                        }
                    },
                },
                "delete": {
                    "tags": [table.django_name],
                    "summary": f"Delete a record from the {table.django_name} table",
                    "description": f"Delete a record from the {table.django_name} table",
                    "responses": {
                        "204": {
                            "description": "Empty response",
                            "content": {
                                "text/plain": {
                                    "schema": {
                                        "type": "string",
                                        "maxLength": 0,
                                    }
                                }
                            },
                        }
                    },
                },
            },
        ),
        (
            f"/api/specify_rows/{table.django_name}/",
            {
                'get': {
                    "tags": [table.django_name],
                    "parameters": [
                        {
                            "name": "fields",
                            "in": "query",
                            "required": True,
                            "schema": {
                                "type": "string"
                            },
                            "example": "localityname,latitude1,localitycitations__referencework__title",
                            "description": ("Comma separated list of fileds to fetch. " 
                                            "Can include relationships and their fields separated by __ "
                                            "to include data from other tables")
                        },
                        {"$ref": "#/components/parameters/limit"},
                        {"$ref": "#/components/parameters/offset"},
                        {
                            "$ref": "#/components/parameters/domainfilter"
                        },
                        {"$ref": "#/components/parameters/orderby"},
                        {
                            "name": "distinct",
                            "in": "query",
                            "required": False,
                            "schema": {
                                "type": "boolean",
                                "default": False,
                            },
                            "description": "Whether results should be distinct",
                        },
                    ],
                    "summary": f"Get rows from the {table.django_name} table",
                    "description": (
                        f"Query multiple records from the {table.django_name} table<br>"
                        f"Filtering is supported by providing field values as GET parameters<br>"
                        f"Example: /api/specify_rows/sometable/fields=someFields&field=value. Advanced filtering "
                        f"options are also supported (e.g. ?numericfield__gte=4). More filters "
                        f"are documented here: "
                        f"<a href=https://docs.djangoproject.com/en/4.0/ref/models/querysets/#field-lookups-1>https://docs.djangoproject.com/en/4.0/ref/models/querysets/#field-lookups-1</a>"
                    ),
                    "responses": {
                        "200": {
                            "description": "2D array of results",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "description": f"A single record from the {table.django_name} table",
                                            "type": "array",
                                            "items": {
                                                "description": "The values of the fields for the record passed into the 'fields' parameter",
                                                "oneOf": [
                                                    {
                                                        "type": "string",
                                                    },
                                                    {
                                                        "type": "null"
                                                    },
                                                    {
                                                        "type": "number"
                                                    },
                                                    {
                                                        "type": "boolean"
                                                    }
                                                ]
                                            },
                                        },
                                    }
                                }
                            }
                        },
                    }
                },
            }
        ),
        (
            f"/api/delete_blockers/{table.django_name}/{{id}}/",
            {
                "get": {
                    "tags": [table.django_name],
                    "summary": "Returns a JSON list of fields that prevent " +
                    "the record from getting deleted",
                    "description": "Returns a JSON list of fields that " +
                    "point to related resources which prevent the resource " +
                    "of that model from being deleted.",
                    "parameters": [
                        {
                            "$ref": "#/components/parameters/id"
                        },
                    ],
                    "responses": {
                        "200": {
                            "description": "Data fetched successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "table": {
                                                    "type": "string",
                                                    "example": get_first_valid_relationship_attr(cast(List[Relationship], table.relationships), "relatedModelName").lower().capitalize()
                                                },
                                                "field": {
                                                    "type": "string",
                                                    "example": get_first_valid_relationship_attr(cast(List[Relationship], table.relationships), "otherSideName"),
                                                },
                                                "ids": {
                                                    "type": "array",
                                                    "description": "An array of blocking resources from <table>",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ),
        (
            f"/api/specify_schema/{table.django_name}/",
            {
                "get": {
                    "tags": [table.django_name],
                    "summary": f"Get OpenAPI schema for {table.django_name} table",
                    "description": f"Get OpenAPI schema for {table.django_name} table",
                    "responses": {
                        "200": {
                            "description": "Data fetched successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {},
                                        "description": "Open API Schema"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ),
    ]


def table_to_schema(table: Table) -> Dict:
    """Generate the OpenAPI schema's schema object for a table.

    params:
        table: the table object

    returns:
        OpenAPI schema's schema object for a table
    """
    return {
        "title": table.django_name,
        "type": "object",
        "properties": {
            f.name.lower(): field_to_schema(f) for f in table.all_fields
        },
        "additionalProperties": False,
        "required": [f.name.lower() for f in table.all_fields],
    }


def field_to_schema(field: Field) -> Dict:
    """Generate the OpenAPI schema's schema object for a field of a table.

    params:
        field: the field object

    returns:
        OpenAPI schema's schema object for a field of a table
    """
    if field.is_relationship:
        if not isinstance(field, Relationship):
            raise AssertionError(
                f"Field '{field.name}' is not a Relationship",
                {"field": field.name,
                 "localizaitonKey": "fieldNotRelationship"})
        if field.dependent:
            if (
                field.type == "one-to-one"
                or field.type == "many-to-one"
            ):
                return {
                    "$ref": f"#components/schemas/{field.relatedModelName.capitalize()}"
                }
            else:
                return {
                    "type": "array",
                    "items": {
                        "$ref": f"#components/schemas/{field.relatedModelName.capitalize()}"
                    },
                }
        else:
            return {
                "type": "string",
                "description": "A URL for querying information about a related record",
                "example": f"/api/specify/{field.relatedModelName.lower()}/3/",
            }

    elif field.type in ("text", "java.lang.String"):
        length = getattr(field, "length", None)
        if length is not None and length > 0:
            return {
                **required_to_schema(field, "string"),
                "maxLength": length,
            }
        else:
            return {
                **required_to_schema(field, "string"),
            }

    elif field.type in (
        "java.lang.Integer",
        "java.lang.Long",
        "java.lang.Byte",
        "java.lang.Short",
        "java.lang.Float",
        "java.lang.Double",
    ):
        return required_to_schema(field, "number")

    elif field.type in ("java.util.Calendar", "java.util.Date"):
        return {
            **required_to_schema(field, "string"),
            "format": "date",
        }

    elif field.type == "java.sql.Timestamp":
        return {
            **required_to_schema(field, "string"),
            "format": "date-time",
        }

    elif field.type == "java.math.BigDecimal":
        return required_to_schema(field, "string")

    elif field.type == "java.lang.Boolean":
        return required_to_schema(field, "boolean")

    elif field.type == "json":
        return required_to_schema(field, "string")

    else:
        raise Exception(f"unexpected field type: {field.type}")


def required_to_schema(field: Field, ftype: str) -> Dict:
    return {"type": ftype} if field.required else {"type": ftype, "nullable": True}

def get_first_valid_relationship_attr(relationships: List[Relationship], attr_name: str) -> str:
    for rel in relationships:
        if hasattr(rel, 'otherSideName') and rel.type.endswith('to-many') and not rel.dependent:
            return getattr(rel, attr_name, 'Default')
    return 'Default'
