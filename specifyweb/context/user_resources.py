import json

from django import http
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.views import View

from specifyweb.context.app_resource import get_usertype
from specifyweb.specify import models, api
from specifyweb.specify.views import openapi

Spappresource = getattr(models, 'Spappresource')
Spappresourcedir = getattr(models, 'Spappresourcedir')

class Resources(View):
    def get(self, request) -> http.HttpResponse:
        resources = Spappresource.objects.filter(
            spappresourcedir__specifyuser=request.specify_user,
            spappresourcedir__ispersonal=True,
            spappresourcedir__collection=request.specify_collection
        )

        return http.JsonResponse([
            {
                'id': r.id,
                'name': r.name,
                'mimetype': r.mimetype,
                'metadata': r.metadata,
            }
            for r in resources
        ], safe=False)

    def post(self, request) -> http.HttpResponse:
        post_data = json.loads(request.body)

        with transaction.atomic():
            directory, _ = Spappresourcedir.objects.get_or_create(
                specifyuser=request.specify_user,
                ispersonal=True,
                collection=request.specify_collection,
                discipline=request.specify_collection.discipline,
                usertype=get_usertype(request.specify_user),
            )
            resource = Spappresource.objects.create(
                spappresourcedir=directory,
                level=0,
                specifyuser=request.specify_user,
                name=post_data['name'],
                mimetype=post_data['mimetype'],
                metadata=post_data['metadata'],
            )
            data = resource.spappresourcedatas.create(
                data=post_data['data'],
            )

            response_data = {
                'id': resource.id,
                'name': resource.name,
                'mimetype': resource.mimetype,
                'metadata': resource.metadata,
                'data': data.data,
            }
            return http.HttpResponse(api.toJson(response_data), content_type="application/json", status=201)

resources = openapi(schema={
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
})(Resources.as_view())

class Resource(View):
    def get(self, request, resourceid: int) -> http.HttpResponse:
        resource = get_object_or_404(
            Spappresource,
            pk=resourceid,
            spappresourcedir__specifyuser=request.specify_user,
            spappresourcedir__ispersonal=True,
            spappresourcedir__collection=request.specify_collection,
        )

        data = resource.spappresourcedatas.get()
        response_data = {
            'id': resource.id,
            'name': resource.name,
            'mimetype': resource.mimetype,
            'metadata': resource.metadata,
            'data': data.data,
        }
        return http.HttpResponse(api.toJson(response_data), content_type="application/json")

    def put(self, request, resourceid: int) -> http.HttpResponse:
        put_data = json.loads(request.body)

        with transaction.atomic():
            resource = get_object_or_404(
                Spappresource,
                pk=resourceid,
                spappresourcedir__specifyuser=request.specify_user,
                spappresourcedir__ispersonal=True,
                spappresourcedir__collection=request.specify_collection,
            )

            resource.name = put_data['name']
            resource.mimetype = put_data['mimetype']
            resource.metadata = put_data['metadata']
            resource.save()

            data = resource.spappresourcedatas.get()
            data.data = put_data['data']
            data.save()

        return http.HttpResponse('', status=204)

    def delete(self, request, resourceid: int) -> http.HttpResponse:
        with transaction.atomic():
            resource = get_object_or_404(
                Spappresource,
                pk=resourceid,
                spappresourcedir__specifyuser=request.specify_user,
                spappresourcedir__ispersonal=True,
                spappresourcedir__collection=request.specify_collection,
            )
            resource.delete()

        return http.HttpResponse('', status=204)

resource = openapi(schema={
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
})(Resource.as_view())
