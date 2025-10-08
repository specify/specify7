from django import http

from specifyweb.backend.context.resources import Resource, Resources
from specifyweb.specify.views import openapi

GLOBAL_PREFS_USER_TYPE = 'Global Prefs'


class AdminRequiredMixin:
    def dispatch(self, request, *args, **kwargs):
        if not request.specify_user.is_admin():
            return http.HttpResponseForbidden()
        return super().dispatch(request, *args, **kwargs)


def _null_scope(_request):
    return None


def _directory_base(_request):
    return {'collection': None, 'discipline': None}


def _directory_filter(_request):
    return {
        'ispersonal': False,
        'specifyuser__isnull': True,
        'usertype': GLOBAL_PREFS_USER_TYPE,
        'collection__isnull': True,
        'discipline__isnull': True,
    }


def _resource_filter(_request):
    return {
        'spappresourcedir__ispersonal': False,
        'spappresourcedir__specifyuser__isnull': True,
        'spappresourcedir__usertype': GLOBAL_PREFS_USER_TYPE,
        'spappresourcedir__discipline__isnull': True,
    }


def _directory_create(_request):
    return {
        'ispersonal': False,
        'usertype': GLOBAL_PREFS_USER_TYPE,
        'specifyuser': None,
    }


def _resource_create(request):
    return {'specifyuser': request.specify_user}


class GlobalResourcesView(AdminRequiredMixin, Resources):
    _collection_getter = staticmethod(_null_scope)
    _discipline_getter = staticmethod(_null_scope)
    _spappresourcedirbase = staticmethod(_directory_base)
    _spappresourcedirfilter = staticmethod(_directory_filter)
    _spappresourcefilter = staticmethod(_resource_filter)
    _spappresourcefilterpost = staticmethod(_resource_create)
    _spappresourcedircreate = staticmethod(_directory_create)


class GlobalResourceView(AdminRequiredMixin, Resource):
    _collection_getter = staticmethod(_null_scope)
    _discipline_getter = staticmethod(_null_scope)
    _spappresourcedirbase = staticmethod(_directory_base)
    _spappresourcedirfilter = staticmethod(_directory_filter)
    _spappresourcefilter = staticmethod(_resource_filter)


global_resources = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns list of global app resources.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "integer", "description": "The appresource id."},
                                    "name": {"type": "string", "description": "The appresource name."},
                                    "mimetype": {"type": "string"},
                                    "metadata": {"type": "string"},
                                },
                                'required': ['id', 'name', 'mimetype', 'metadata'],
                                'additionalProperties': False,
                            },
                        },
                    }
                },
            }
        }
    },
    "post": {
        "requestBody": {
            "required": True,
            "description": "Creates a global app resource.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "The appresource name."},
                            "mimetype": {"type": "string"},
                            "metadata": {"type": "string"},
                            "data": {"type": "string", "description": "The data to be stored in the appresource."},
                        },
                        'required': ['name', 'mimetype', 'metadata', 'data'],
                        'additionalProperties': False,
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "The global resource was created.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "integer", "description": "The appresource id."},
                                "name": {"type": "string", "description": "The appresource name."},
                                "mimetype": {"type": "string"},
                                "metadata": {"type": "string"},
                                "data": {"type": "string", "description": "The data to be stored in the appresource."},
                            },
                            'required': ['name', 'mimetype', 'metadata', 'data'],
                            'additionalProperties': False,
                        },
                    }
                },
            }
        }
    }
})(GlobalResourcesView.as_view())


global_resource = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Global app resource contents.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "integer", "description": "The appresource id."},
                                "name": {"type": "string", "description": "The appresource name."},
                                "mimetype": {"type": "string"},
                                "metadata": {"type": "string"},
                                "data": {"type": "string", "description": "The data to be stored in the appresource."},
                            },
                            'required': ['id', 'name', 'mimetype', 'metadata', 'data'],
                            'additionalProperties': False,
                        },
                    }
                },
            }
        }
    },
    "put": {
        "requestBody": {
            "required": True,
            "description": "Updates the global app resource with the given id.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "The appresource name."},
                            "mimetype": {"type": "string"},
                            "metadata": {"type": "string"},
                            "data": {"type": "string", "description": "The data to be stored in the appresource."},
                        },
                        'required': ['name', 'mimetype', 'metadata', 'data'],
                        'additionalProperties': False,
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "The resource was updated."}
        }
    },
    "delete": {
        "responses": {
            "204": {"description": "The resource was deleted."}
        }
    }
})(GlobalResourceView.as_view())
