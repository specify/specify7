import json

from typing import Dict, Union

from django import http
from django.db import transaction
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin

from specifyweb.specify.views import openapi

from . import models
from .permissions import PermissionTarget, PermissionTargetAction, check_permission_targets, registry, query

class PolicyRegistry(LoginRequiredMixin, View):
    def get(self, request):
        return http.JsonResponse(registry, safe=False)

policy_registry = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns the permissions resources and actions checked by the server.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "description": "The resources.",
                            "example": {
                                "/table/agent": ["read"],
                                "/table/collectionobject": ["create", "read", "update", "delete"],
                            },
                            "additionalProperties": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "description": "The supported actions for the resource."
                                }
                            }
                        }
                    }
                }
            }
        }
    }
})(PolicyRegistry.as_view())

class PoliciesUserPT(PermissionTarget):
    resource = "/permissions/policies/user"
    update = PermissionTargetAction()
    read = PermissionTargetAction()

class UserPolicies(LoginRequiredMixin, View):
    def get(self, request, collectionid: int, userid: int) -> http.HttpResponse:
        check_permission_targets(collectionid, request.specify_user.id, [PoliciesUserPT.read])

        data = [
            {'resource': p.resource, 'action': p.action}
            for p in models.UserPolicy.objects.filter(
                    collection_id=collectionid,
                    specifyuser_id=userid)
        ]
        return http.JsonResponse(data, safe=False)

    def put(self, request, collectionid: int, userid: int) -> http.HttpResponse:
        check_permission_targets(collectionid, request.specify_user.id, [PoliciesUserPT.update])

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

class UserRolesPT(PermissionTarget):
    resource = "/permissions/user/roles"
    update = PermissionTargetAction()
    read = PermissionTargetAction()


class UserRoles(LoginRequiredMixin, View):
    def get(self, request, collectionid: int, userid: int) -> http.HttpResponse:
        check_permission_targets(collectionid, request.specify_user.id, [UserRolesPT.read])

        data = [
            serialize_role(ur.role)
            for ur in models.UserRole.objects.select_related('role').filter(
                    role__collection_id=collectionid,
                    specifyuser_id=userid
            )
        ]
        return http.JsonResponse(data, safe=False)

    def put(self, request, collectionid: int, userid: int) -> http.HttpResponse:
        check_permission_targets(collectionid, request.specify_user.id, [UserRolesPT.update])

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

def serialize_role(role: Union[models.Role, models.LibraryRole]) -> Dict:
    return {
        'id': role.id,
        'name': role.name,
        'description': role.description,
        'policies': [
            {'resource': p.resource, 'action': p.action}
                for p in role.policies.all()
        ]
    }

class RolePT(PermissionTarget):
    resource = "/permissions/roles"
    create = PermissionTargetAction()
    read = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()
    copy_from_library = PermissionTargetAction()


class Role(LoginRequiredMixin, View):
    def get(self, request, roleid: int) -> http.HttpResponse:
        r = models.Role.objects.get(id=roleid)
        check_permission_targets(r.collection_id, request.specify_user.id, [RolePT.read])
        return http.JsonResponse(serialize_role(r), safe=False)

    def put(self, request, roleid: int) -> http.HttpResponse:
        data = json.loads(request.body)

        with transaction.atomic():
            r = models.Role.objects.get(id=roleid)
            check_permission_targets(r.collection_id, request.specify_user.id, [RolePT.update])

            r.name = data['name']
            r.description = data['description']
            r.save()

            r.policies.all().delete()
            for p in data['policies']:
                r.policies.create(
                    resource=p['resource'],
                    action=p['action'])

        return http.HttpResponse('', status=204)

    def delete(self, request, roleid: int) -> http.HttpResponse:
        r = models.Role.objects.get(id=roleid)
        check_permission_targets(r.collection_id, request.specify_user.id, [RolePT.delete])
        r.delete()
        return http.HttpResponse('', status=204)


role = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns the name, description and permission policies for the given role.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "The role id." },
                                "name": { "type": "string", "description": "The role name." },
                                "description": { "type": "string", "description": "The role description." },
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
                            'required': ['id', 'name', 'description', 'policies'],
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
            "description": "Sets the name, description and permission policies for the given role.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "The role name." },
                            "description": { "type": "string", "description": "The role description." },
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
                        'required': ['name', 'description', 'policies'],
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

class Query(LoginRequiredMixin, View):
    def post(self, request) -> http.HttpResponse:
        req = json.loads(request.body)

        collectionid = req.get('collectionid', request.specify_collection.id)
        userid = req.get('userid', request.specify_user.id)
        if userid != request.specify_user.id:
            check_permission_targets(collectionid, request.specify_user.id, [PoliciesUserPT.read, RolePT.read, UserRolesPT.read])

        results = [
            {'resource': q['resource'],
             'action': action,
             **query(collectionid, userid, q['resource'], action)._asdict()
            }
            for q in req['queries']
            for action in q['actions']
        ]
        response = {
            'allowed': all(r['allowed'] for r in results),
            'details': results
        }
        return http.JsonResponse(response, safe=False)

query_view = openapi(schema={
    "post": {
        "requestBody": {
            "required": True,
            "description": "Checks whether a set of resources and actions are allowed by permission policies.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "collectionid": { "type": "integer", "description": "Optional. Defaults to logged in collection." },
                            "userid": { "type": "integer", "description": "Optional. Defaults to logged in user." },
                            "queries": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "resource": { "type": "string" },
                                        "actions": {
                                            "type": "array",
                                            "items": { "type": "string" },
                                        },
                                    },
                                    'required': ['resource', 'actions'],
                                    'additionalProperties': False
                                }
                            }
                        },
                        'required': ['queries'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Returns list of roles available in collection.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "allowed": { "type": "boolean", "description": "Whether _all_ of the queried permissions are allowed."},
                                "details": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "resource": { "type": "string" },
                                            "action": { "type": "string" },
                                            "allowed": { "type": "boolean" },
                                            "matching_user_policies": { "type": "array" },
                                            "matching_role_policies": { "type": "array" },
                                            },
                                        'required': ['resource', 'action', 'allowed', 'matching_role_policies', 'matching_user_policies'],
                                        'additionalProperties': False
                                    }
                                },
                            },
                            'required': ['allowed', 'details'],
                            'additionalProperties': False
                        }
                    }
                }
            }
        }
    },
})(Query.as_view())

class Roles(LoginRequiredMixin, View):
    def get(self, request, collectionid: int) -> http.HttpResponse:
        check_permission_targets(collectionid, request.specify_user.id, [RolePT.read])
        rs = models.Role.objects.filter(collection_id=collectionid)
        data = [serialize_role(r) for r in rs]
        return http.JsonResponse(data, safe=False)

    def post(self, request, collectionid: int) -> http.HttpResponse:
        data = json.loads(request.body)
        if 'libraryroleid' in data:
            check_permission_targets(collectionid, request.specify_user.id, [RolePT.copy_from_library])

            lr = models.LibraryRole.objects.get(id=data['libraryroleid'])
            with transaction.atomic():
                r = models.Role.objects.create(
                    collection_id=collectionid,
                    name=lr.name,
                    description=lr.description,
                )

                for lp in lr.policies.all():
                    r.policies.create(resource=lp.resource, action=lp.action)
        else:
            check_permission_targets(collectionid, request.specify_user.id, [RolePT.create])


            with transaction.atomic():
                r = models.Role.objects.create(
                    collection_id=collectionid,
                    name=data['name'],
                    description=data['description'],
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
                                    "description": { "type": "string", "description": "The role description." },
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
                                'required': ['id', 'name', 'description', 'policies'],
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
            "description": "Creates a new role in a collection either explicitly or from a library role.",
            "content": {
                "application/json": {
                    "schema": {
                        "oneOf": [
                            {
                                "type": "object",
                                "description": "Copy a role from the role library.",
                                "properties": {
                                    "libraryroleid": { "type": "integer", "description": "The id of the library role to copy." }
                                },
                                "additionalProperties": False,
                                "required": ["libraryroleid"],
                            },
                            {
                                "type": "object",
                                "description": "Create a role explicitly.",
                                "properties": {
                                    "name": { "type": "string", "description": "The role name." },
                                    "description": { "type": "string", "description": "The role description." },
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
                                'required': ['name', 'description', 'policies'],
                            },
                        ]
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
                                "description": { "type": "string", "description": "The role description." },
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
                            'required': ['id', 'name', 'description', 'policies'],
                            'additionalProperties': False
                        }
                    }
                }
            }
        }
    }
})(Roles.as_view())


class LibraryRolePT(PermissionTarget):
    resource = "/permissions/library/roles"
    create = PermissionTargetAction()
    read = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()


class LibraryRole(LoginRequiredMixin, View):
    def get(self, request, roleid: int) -> http.HttpResponse:
        r = models.LibraryRole.objects.get(id=roleid)
        check_permission_targets(None, request.specify_user.id, [LibraryRolePT.read])
        return http.JsonResponse(serialize_role(r), safe=False)

    def put(self, request, roleid: int) -> http.HttpResponse:
        data = json.loads(request.body)

        with transaction.atomic():
            r = models.LibraryRole.objects.get(id=roleid)
            check_permission_targets(None, request.specify_user.id, [LibraryRolePT.update])

            r.name = data['name']
            r.description = data['description']
            r.save()

            r.policies.all().delete()
            for p in data['policies']:
                r.policies.create(
                    resource=p['resource'],
                    action=p['action'])

        return http.HttpResponse('', status=204)

    def delete(self, request, roleid: int) -> http.HttpResponse:
        r = models.LibraryRole.objects.get(id=roleid)
        check_permission_targets(None, request.specify_user.id, [LibraryRolePT.delete])
        r.delete()
        return http.HttpResponse('', status=204)


library_role = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns the name, description and permission policies for the given library role.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "The library role id." },
                                "name": { "type": "string", "description": "The library role name." },
                                "description": { "type": "string", "description": "The library role description." },
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
                            'required': ['id', 'name', 'description', 'policies'],
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
            "description": "Sets the name, description and permission policies for the given library role.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "The library role name." },
                            "description": { "type": "string", "description": "The library role description." },
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
                        'required': ['name', 'description', 'policies'],
                    }
                }
            }
        },
        "responses": {
            "204": {"description": "The library role was updated."}
        }
    },
    "delete": {
        "responses": {
            "204": {"description": "The library role was deleted.",}
        }
    }
})(LibraryRole.as_view())


class LibraryRoles(LoginRequiredMixin, View):
    def get(self, request) -> http.HttpResponse:
        check_permission_targets(None, request.specify_user.id, [LibraryRolePT.read])
        rs = models.LibraryRole.objects.all()
        data = [serialize_role(r) for r in rs]
        return http.JsonResponse(data, safe=False)

    def post(self, request) -> http.HttpResponse:
        check_permission_targets(None, request.specify_user.id, [LibraryRolePT.create])

        data = json.loads(request.body)

        with transaction.atomic():
            r = models.LibraryRole.objects.create(
                name=data['name'],
                description=data['description'],
            )

            for p in data['policies']:
                r.policies.create(
                    resource=p['resource'],
                    action=p['action'])

        return http.JsonResponse(serialize_role(r), status=201)

library_roles = openapi(schema={
    "get": {
        "responses": {
            "200": {
                "description": "Returns list of library roles available in the database.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": { "type": "integer", "description": "The library role id." },
                                    "name": { "type": "string", "description": "The library role name." },
                                    "description": { "type": "string", "description": "The library role description." },
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
                                'required': ['id', 'name', 'description', 'policies'],
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
            "description": "Creates a new library role in the database.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "The role name." },
                            "description": { "type": "string", "description": "The role description." },
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
                        'required': ['name', 'description', 'policies'],
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "The library role was created.",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "The library role id." },
                                "name": { "type": "string", "description": "The library role name." },
                                "description": { "type": "string", "description": "The library role description." },
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
                            'required': ['id', 'name', 'description', 'policies'],
                            'additionalProperties': False
                        }
                    }
                }
            }
        }
    }
})(LibraryRoles.as_view())
