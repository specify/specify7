import json
from django.http import (JsonResponse)
from django import http
from specifyweb.specify.views import login_maybe_required, openapi

from specifyweb.backend.setup_tool import api
from specifyweb.middleware.general import require_GET
from django.views.decorators.http import require_POST
from django.db import transaction
from specifyweb.backend.setup_tool.utils import normalize_keys
from specifyweb.backend.setup_tool.tree_defaults import start_preload_default_tree

import logging
logger = logging.getLogger(__name__)

_SCHEMA_COMPONENTS = {
    "schemas": {
        "Resources": {
            "type": "object",
            "properties": {
                "institution": {"type": "boolean"},
                "storageTreeDef": {"type": "boolean"},
                "division": {"type": "boolean"},
                "discipline": {"type": "boolean"},
                "geographyTreeDef": {"type": "boolean"},
                "taxonTreeDef": {"type": "boolean"},
                "collection": {"type": "boolean"},
                "specifyUser": {"type": "boolean"}
            },
            "required": ["institution", "storageTreeDef", "division", "discipline", "geographyTreeDef",
                         "taxonTreeDef", "collection", "specifyUser"],
            "description": "A list of which required database resources have been created so far."
        },
        "SetupProgress": {
            "type": "object",
            "properties": {
                "resources": {"$ref": "#/components/schemas/Resources"},
                "last_error": {
                    "oneOf": [{"type": "string"}, {"type": "null"}],
                    "description": "Last error message if any, null otherwise."
                },
                "busy": {"type": "boolean", "description": "True if setup is in progress."}
            },
            "required": ["resources", "busy"]
        },   
    }
}

@openapi(
    schema={
        "post": {
            "requestBody": {
                "description": "Request body for the creation of all database resources. Currently unrestricted.",
                "required": False,
                "content": {
                    "application/json": {
                        "schema": {}
                    }
                }
            },
            "responses": {
                "200": {
                    "description": "Setup task started successfully.",
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "success": {"type": "boolean"},
                                    "task_id": {"type": "string"},
                                    "setup_progress": {"$ref": "#/components/schemas/SetupProgress"}
                                },
                                "required": ["success", "task_id", "setup_progress"]
                            }
                        }
                    }
                },
                "409": {
                    "description": "Database setup is already in progress.",
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "error": {"type": "string"},
                                },
                                "required": ["error"]
                            }
                        }
                    }
                }
            }
        }
    },
    components=_SCHEMA_COMPONENTS,
)
@require_POST
def setup_database_view(request):
    """Creates all database setup resources sequentially in the background. Atomic."""
    return api.setup_database(request)

@require_POST
def create_institution_view(request):
    return api.handle_request(request, api.create_institution)

@require_POST
def create_storage_tree_view(request):
    return api.handle_request(request, api.create_storage_tree)

@require_POST
def create_division_view(request):
    return api.handle_request(request, api.create_division)

@require_POST
def create_discipline_view(request):
    return api.handle_request(request, api.create_discipline)

@require_POST
def create_geography_tree_view(request):
    return api.handle_request(request, api.create_geography_tree)

@require_POST
def create_taxon_tree_view(request):
    return api.handle_request(request, api.create_taxon_tree)

@require_POST
def create_collection_view(request):
    return api.handle_request(request, api.create_collection)

@require_POST
def create_specifyuser_view(request):
    return api.handle_request(request, api.create_specifyuser)

@login_maybe_required
@require_POST
@transaction.atomic
def create_discipline_and_trees(request):
    raw_data = json.loads(request.body)
    data = normalize_keys(raw_data)

    logger.info('Creating discipline')
    discipline_result = api.create_discipline(data['discipline'])
    discipline_id = discipline_result.get('discipline_id')

    # Ensure discipline id is set for tree creation
    if isinstance(data.get('geographytreedef'), dict):
        data['geographytreedef']['discipline_id'] = data['geographytreedef'].get('discipline_id') or discipline_id
    if isinstance(data.get('taxontreedef'), dict):
        data['taxontreedef']['discipline_id'] = data['taxontreedef'].get('discipline_id') or discipline_id

    logger.info('Creating geography tree')
    geography_result = api.create_geography_tree(data['geographytreedef'].copy(), global_tree=False)
    geography_treedef_id = geography_result.get('treedef_id')

    logger.info('Creating taxon tree')
    taxon_result = api.create_taxon_tree(data['taxontreedef'].copy())
    taxon_treedef_id = taxon_result.get('treedef_id')

    if data['geographytreedef'].get('preload'):
        start_preload_default_tree('Geography', discipline_id, None, geography_treedef_id, None, data['geographytreedef'].get('preloadfile'))
    if data['taxontreedef'].get('preload'):
        start_preload_default_tree('Taxon', discipline_id, None, taxon_treedef_id, None, data['taxontreedef'].get('preloadfile'))

    return JsonResponse({"success": True}, status=200)

# check which resource are present in a new db to define setup step
@openapi(
    schema={
        "get": {
            "responses": {
                "200": {
                    "description": "Information about the current completion of the database setup.",
                    "content": {"application/json": {
                        "schema": {"$ref": "#/components/schemas/SetupProgress"}
                    }}
                }
            }
        },
    },
    components=_SCHEMA_COMPONENTS,
)
@require_GET
def get_setup_progress(request):
    """Returns a dictionary of the status of the database setup."""
    return http.JsonResponse(api.get_setup_progress())