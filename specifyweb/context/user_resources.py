from specifyweb.context.app_resource import get_usertype
from specifyweb.specify import models, api
from specifyweb.specify.views import openapi
from specifyweb.context.resources import Resource, Resources
from specifyweb.specify.models import Spappresource, Spappresourcedir

app_resource_data_schema = {
    "id": { "type": "integer", "description": "The appresource id." },
    "name": { "type": "string", "description": "The appresource name." },
    "mimetype": { "type": "string" },
    "metadata": { "type": "string" },
    "data": { "type": "string", "description": "The data to be stored in the appresource." },
}

def get_resources_endpoint_schema(
    description_get,
    description_create,
    description_created,
):
    return {
        "get": {
            "responses": {
                "200": {
                    "description": description_get,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {key:value for key,value in app_resource_data_schema.items() if key != "data"},
                                    'required': ['id', 'name', 'mimetype', 'metadata'],
                                    'additionalProperties': False
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
                "description": description_create,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {key:value for key,value in app_resource_data_schema.items() if key != "id"},
                            'required': ['name', 'mimetype', 'metadata', 'data'],
                            'additionalProperties': False
                        }
                    }
                }
            },
            "responses": {
                "201": {
                    "description": description_created,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": app_resource_data_schema,
                                'required': ['name', 'mimetype', 'metadata', 'data'],
                                'additionalProperties': False
                            }
                        }
                    }
                }
            }
        }
    }

user_resource_dir_filter_gen = lambda request: {
                'specifyuser': request.specify_user,
                'ispersonal': True,
                'usertype': get_usertype(request.specify_user),
}

user_resources = openapi(schema=get_resources_endpoint_schema(
    description_get="Returns list of app resources owned by the logged in user in the logged in collection.",
    description_create="Creates appresource in the logged in collection owned by the logged in user.",
    description_created="The user resource was created.",
))(Resources.as_view(_spappresourcedirfilter= user_resource_dir_filter_gen,
                     _spappresourcefilter= lambda request: {
                'spappresourcedir__specifyuser': request.specify_user,
                'spappresourcedir__ispersonal':True
}, _spappresourcefilterpost=lambda request: {
                'specifyuser': request.specify_user
},_spappresourcedircreate=user_resource_dir_filter_gen
                     ))

def get_resource_endpoint_schema(
    description_get,
    description_update,
):
    return {
        "get": {
            "responses": {
                "200": {
                    "description": description_get,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": app_resource_data_schema,
                                'required': ['id', 'name', 'mimetype', 'metadata', 'data'],
                                'additionalProperties': False
                            }
                        }
                    }
                }
            }
        },
        "put": {
            "requestBody": {
                "required": True,
                "description": description_update,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {key:value for key,value in app_resource_data_schema.items() if key != "id"},
                            'required': ['name', 'mimetype', 'metadata', 'data'],
                            'additionalProperties': False
                        }
                    }
                }
            },
            "responses": {
                "204": { "description": "The resource was updated.", },
            }
        },
        "delete": {
            "responses": {
                "204": {"description": "The resource was deleted.",}
            }
        }
    }

user_resource = openapi(schema=get_resource_endpoint_schema(
    description_get="The app resource of the given id owned by the logged in user in the logged in collection.",
    description_update="Updates the appresource with the given id in the logged in collection owned by the logged in user."
))(Resource.as_view(_spappresourcefilter= lambda request: {
            'spappresourcedir__specifyuser': request.specify_user,
            'spappresourcedir__ispersonal': True,
}))
