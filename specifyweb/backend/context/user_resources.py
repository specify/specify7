from specifyweb.context.app_resource import get_usertype
from specifyweb.specify import models, api
from specifyweb.specify.views import openapi
from specifyweb.context.resources import Resource, Resources
from specifyweb.specify.models import Spappresource, Spappresourcedir

user_resource_dir_filter_gen = lambda request: {
                'specifyuser': request.specify_user,
                'ispersonal': True,
                'usertype': get_usertype(request.specify_user),
}

user_resources = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns list of app resources owned by the logged in user in the logged in collection.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": { "type": "integer", "description": "The appresource id." },
                                    "name": { "type": "string", "description": "The appresource name." },
                                    "mimetype": { "type": "string" },
                                    "metadata": { "type": "string" },
                                },
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
            "description": "Creates appresource in the logged in collection owned by the logged in user.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "The appresource name." },
                            "mimetype": { "type": "string" },
                            "metadata": { "type": "string" },
                            "data": { "type": "string", "description": "The data to be stored in the appresource." },
                        },
                        'required': ['name', 'mimetype', 'metadata', 'data'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "The user resource was created.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "The appresource id." },
                                "name": { "type": "string", "description": "The appresource name." },
                                "mimetype": { "type": "string" },
                                "metadata": { "type": "string" },
                                "data": { "type": "string", "description": "The data to be stored in the appresource." },
                            },
                            'required': ['name', 'mimetype', 'metadata', 'data'],
                            'additionalProperties': False
                        }
                    }
                }
            }
        }
    }
})(Resources.as_view(_spappresourcedirfilter= user_resource_dir_filter_gen,
                     _spappresourcefilter= lambda request: {
                'spappresourcedir__specifyuser': request.specify_user,
                'spappresourcedir__ispersonal':True
}, _spappresourcefilterpost=lambda request: {
                'specifyuser': request.specify_user
},_spappresourcedircreate=user_resource_dir_filter_gen
                     ))


user_resource = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "The app resource of the given id owned by the logged in user in the logged in collection.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "The appresource id." },
                                "name": { "type": "string", "description": "The appresource name." },
                                "mimetype": { "type": "string" },
                                "metadata": { "type": "string" },
                                "data": { "type": "string", "description": "The data to be stored in the appresource." },
                            },
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
            "description": "Updates the appresource with the given id in the logged in collection owned by the logged in user.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "The appresource name." },
                            "mimetype": { "type": "string" },
                            "metadata": { "type": "string" },
                            "data": { "type": "string", "description": "The data to be stored in the appresource." },
                        },
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
})(Resource.as_view(_spappresourcefilter= lambda request: {
            'spappresourcedir__specifyuser': request.specify_user,
            'spappresourcedir__ispersonal': True,
}))




