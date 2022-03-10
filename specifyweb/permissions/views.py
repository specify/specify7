import json

from typing import Dict

from django import http
from django.db import transaction
from django.views import View

from specifyweb.specify.views import openapi

from . import models


class UserPolicies(View):
    def get(self, request, collectionid: int, userid: int) -> http.HttpResponse:
        data = [
            {'resource': p.resource, 'action': p.action}
            for p in models.UserPolicy.objects.filter(
                    collection_id=collectionid,
                    specifyuser_id=userid)
        ]
        return http.JsonResponse(data, safe=False)

    def put(self, request, collectionid: int, userid: int) -> http.HttpResponse:
        data = json.loads(request.body)

        with transaction.atomic():
            models.UserPolicy.objects.filter(
                collection_id=collectionid,
                specifyuser_id=userid
            ).delete()

            for p in  data:
                models.UserPolicy.objects.create(
                    collection_id=collectionid,
                    specifyuser_id=userid,
                    resource=p['resource'],
                    action=p['action'])

        return http.HttpResponse('', status=204)

user_policies = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns permission policies for user in collection.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "resource": { "type": "string" },
                                    "action": { "type": "string" },
                                },
                                'required': ['resource', 'action'],
                                'additionalProperties': False
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
            "description": "Sets the permission policies for user in collection.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "resource": { "type": "string" },
                                "action": { "type": "string" },
                            },
                            'required': ['resource', 'action'],
                            'additionalProperties': False
                        }
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "User policies set."}
        }
    }
})(UserPolicies.as_view())

class UserRoles(View):
    def get(self, request, collectionid: int, userid: int) -> http.HttpResponse:
        data = [
            serialize_role(ur.role)
            for ur in models.UserRole.objects.select_related('role').filter(
                    role__collection_id=collectionid,
                    specifyuser_id=userid
            )
        ]
        return http.JsonResponse(data, safe=False)

    def put(self, request, collectionid: int, userid: int) -> http.HttpResponse:
        data = json.loads(request.body)

        with transaction.atomic():
            models.UserRole.objects.filter(
                specifyuser_id=userid,
                role__collection_id=collectionid,
            ).delete()

            assert not models.Role.objects.filter(id__in=[r['id'] for r in data]).exclude(collection_id=collectionid).exists()

            for role in data:
                models.UserRole.objects.create(
                    role_id=role['id'],
                    specifyuser_id=userid)

        return http.HttpResponse('', status=204)

user_roles = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns permission roles for user in collection.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": { "type": "integer", "description": "The role id." },
                                    "name": { "type": "string", "description": "The role name." },
                                    "policies": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "resource": { "type": "string" },
                                                "action": { "type": "string" },
                                            },
                                            'required': ['resource', 'action'],
                                            'additionalProperties': False
                                        }
                                    }
                                },
                                'required': ['id', 'name', 'policies'],
                                'additionalProperties': False
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
            "description": "Sets the permission roles for user in collection.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "The role id." },
                            },
                            'required': ['id'],
                        }
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "User roles set."}
        }
    }
})(UserRoles.as_view())

def serialize_role(role: models.Role) -> Dict:
    return {
        'id': role.id,
        'name': role.name,
        'policies': [
            {'resource': p.resource, 'action': p.action}
                for p in role.policies.all()
        ]
    }


class Role(View):
    def get(self, request, roleid: int) -> http.HttpResponse:
        r = models.Role.objects.get(id=roleid)
        return http.JsonResponse(serialize_role(r), safe=False)

    def put(self, request, roleid: int) -> http.HttpResponse:
        data = json.loads(request.body)

        with transaction.atomic():
            r = models.Role.objects.get(id=roleid)
            r.name = data['name']
            r.save()

            r.policies.all().delete()
            for p in data['policies']:
                r.policies.create(
                    resource=p['resource'],
                    action=p['action'])

        return http.HttpResponse('', status=204)

    def delete(self, request, roleid: int) -> http.HttpResponse:
        models.Role.objects.get(id=roleid).delete()
        return http.HttpResponse('', status=204)

role = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns the name and permission policies for the given role.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "The role id." },
                                "name": { "type": "string", "description": "The role name." },
                                "policies": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "resource": { "type": "string" },
                                            "action": { "type": "string" },
                                        },
                                        'required': ['resource', 'action'],
                                        'additionalProperties': False
                                    }
                                }
                            },
                            'required': ['id', 'name', 'policies'],
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
            "description": "Sets the name and permission policies for the given role.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "The role name." },
                            "policies": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "resource": { "type": "string" },
                                        "action": { "type": "string" },
                                    },
                                    'required': ['resource', 'action'],
                                    'additionalProperties': False
                                }
                            }
                        },
                        'required': ['name', 'policies'],
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "The role was updated."}
        }
    },
    "delete": {
        "responses": {
            "204": {"description": "The role was deleted.",}
        }
    }
})(Role.as_view())

class Roles(View):
    def get(self, request, collectionid: int) -> http.HttpResponse:
        rs = models.Role.objects.filter(collection_id=collectionid)
        data = [serialize_role(r) for r in rs]
        return http.JsonResponse(data, safe=False)

    def post(self, request, collectionid: int) -> http.HttpResponse:
        data = json.loads(request.body)

        with transaction.atomic():
            r = models.Role.objects.create(
                collection_id=collectionid,
                name=data['name'],
            )

            for p in data['policies']:
                r.policies.create(
                    resource=p['resource'],
                    action=p['action'])

        return http.JsonResponse(serialize_role(r), status=201)

roles = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns list of roles available in collection.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": { "type": "integer", "description": "The role id." },
                                    "name": { "type": "string", "description": "The role name." },
                                    "policies": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "resource": { "type": "string" },
                                                "action": { "type": "string" },
                                            },
                                            'required': ['resource', 'action'],
                                            'additionalProperties': False
                                        }
                                    }
                                },
                                'required': ['id', 'name', 'policies'],
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
            "description": "Creates a new role in a collection.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "The role name." },
                            "policies": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "resource": { "type": "string" },
                                        "action": { "type": "string" },
                                    },
                                    'required': ['resource', 'action'],
                                    'additionalProperties': False
                                }
                            }
                        },
                        'required': ['name', 'policies'],
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "The role was created.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "The role id." },
                                "name": { "type": "string", "description": "The role name." },
                                "policies": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "resource": { "type": "string" },
                                            "action": { "type": "string" },
                                        },
                                        'required': ['resource', 'action'],
                                        'additionalProperties': False
                                    }
                                }
                            },
                            'required': ['id', 'name', 'policies'],
                            'additionalProperties': False
                        }
                    }
                }
            }
        }
    }
})(Roles.as_view())
