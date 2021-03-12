from typing import Dict, List, Union

from django.views.decorators.http import require_GET, require_POST
from django import http

from .views import login_maybe_required
from .datamodel import datamodel, Table, Field, Relationship, TableDoesNotExistError


@login_maybe_required
@require_GET
def openapi(request) -> http.HttpResponse:
    spec = {
        'openapi': '3.0',
        'info': {},
        'paths': {},
        'components': {
            'schemas': {
                table.django_name: table_to_schema(table)
                for table in datamodel.tables
            }
        }
    }
    return http.JsonResponse(spec)

@login_maybe_required
@require_GET
def view(request, model: str) -> http.HttpResponse:
    try:
        table = datamodel.get_table_strict(model)
    except TableDoesNotExistError:
        return http.HttpResponseNotFound()

    return http.JsonResponse(table_to_schema(table))

def table_to_schema(table: Table) -> Dict:
    return {
        'title': table.django_name,
        'type': 'object',
        'properties': {
            f.name.lower(): field_to_schema(f)
            for f in table.all_fields
        },
        'additionalProperties': False,
        'required': [f.name for f in table.all_fields]
    }

def field_to_schema(field: Field) -> Dict:
    if field.is_relationship:
        assert isinstance(field, Relationship)
        if field.dependent:
            if field.type == 'one-to-one':
                return {
                    'ref$': f'#components/schemas/{field.relatedModelName.capitalize()}'
                }
            else:
                return {}
        else:
            return {}

    elif field.type in ('text', 'java.lang.String'):
        return {
            'type': required_to_schema(field, 'string'),
            'maxLength': getattr(field, 'length', 0)
        }

    elif field.type in (
            'java.lang.Integer',
            'java.lang.Long',
            'java.lang.Byte',
            'java.lang.Short',
            'java.lang.Float',
            'java.lang.Double',):
        return {'type': required_to_schema(field, 'number')}

    elif field.type in ('java.util.Calendar', 'java.util.Date'):
        return {'type': required_to_schema(field, 'string'), 'format': 'date'}

    elif field.type == 'java.sql.Timestamp':
        return {'type': required_to_schema(field, 'string'), 'format': 'date-time'}

    elif field.type == 'java.math.BigDecimal':
        return {'type': required_to_schema(field, 'string')}

    elif field.type == 'java.lang.Boolean':
        return {'type': required_to_schema(field, 'boolean')}

    else:
        raise Exception(f'unexpected field type: {field.type}')

def required_to_schema(field: Field, ftype: str) -> Union[str, List[str]]:
    return ftype if field.required else [ftype, 'null']

