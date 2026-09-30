import json

from django import http
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.views import View

from specifyweb.backend.permissions.permissions import (
    PermissionTarget,
    PermissionTargetAction,
    check_permission_targets,
)
from specifyweb.specify.api.serializers import toJson
from specifyweb.specify.models import Spappresource, Spappresourcedir
from specifyweb.specify.views import openapi

REQUIRED_RESOURCE_FIELDS = ('name', 'mimetype', 'metadata', 'data')


def parse_resource_data(request):
    try:
        resource_data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
    if not isinstance(resource_data, dict):
        return None
    if not all(field in resource_data for field in REQUIRED_RESOURCE_FIELDS):
        return None
    return resource_data


class GlobalPreferencesPT(PermissionTarget):
    resource = '/preferences/global'
    read = PermissionTargetAction()
    update = PermissionTargetAction()


def check_global_permission(request, action: PermissionTargetAction) -> None:
    check_permission_targets(None, request.specify_user.id, [action])


def global_directory():
    return Spappresourcedir.objects.filter(
        collection__isnull=True,
        discipline__isnull=True,
        usertype='Global Prefs',
        ispersonal=False,
    )


def global_resources():
    return Spappresource.objects.filter(spappresourcedir__in=global_directory())


class GlobalResources(View):
    def get(self, request):
        return http.JsonResponse([
            {
                'id': resource.id,
                'name': resource.name,
                'mimetype': resource.mimetype,
                'metadata': resource.metadata,
            }
            for resource in global_resources()
        ], safe=False)

    def post(self, request):
        check_global_permission(request, GlobalPreferencesPT.update)
        post_data = parse_resource_data(request)
        if post_data is None:
            return http.HttpResponseBadRequest('Invalid global resource payload')
        with transaction.atomic():
            directory, _ = Spappresourcedir.objects.get_or_create(
                collection=None,
                discipline=None,
                usertype='Global Prefs',
                ispersonal=False,
                defaults={'specifyuser': request.specify_user},
            )
            resource, _ = Spappresource.objects.get_or_create(
                spappresourcedir=directory,
                name=post_data['name'],
                defaults={
                    'level': 0,
                    'mimetype': post_data['mimetype'],
                    'metadata': post_data['metadata'],
                    'specifyuser': request.specify_user,
                },
            )
            data = resource.spappresourcedatas.first()
            if data is None:
                data = resource.spappresourcedatas.create(data=post_data['data'])
            response_data = {
                'id': resource.id,
                'name': resource.name,
                'mimetype': resource.mimetype,
                'metadata': resource.metadata,
                'data': data.data,
            }
        return http.HttpResponse(
            toJson(response_data), content_type='application/json', status=201
        )


class GlobalResource(View):
    def get(self, request, resourceid: int):
        resource = get_object_or_404(global_resources(), pk=resourceid)
        data = resource.spappresourcedatas.get()
        return http.HttpResponse(
            toJson({
                'id': resource.id,
                'name': resource.name,
                'mimetype': resource.mimetype,
                'metadata': resource.metadata,
                'data': data.data,
            }),
            content_type='application/json',
        )

    def put(self, request, resourceid: int):
        check_global_permission(request, GlobalPreferencesPT.update)
        put_data = parse_resource_data(request)
        if put_data is None:
            return http.HttpResponseBadRequest('Invalid global resource payload')
        with transaction.atomic():
            resource = get_object_or_404(global_resources(), pk=resourceid)
            resource.name = put_data['name']
            resource.mimetype = put_data['mimetype']
            resource.metadata = put_data['metadata']
            resource.save()
            data = resource.spappresourcedatas.get()
            data.data = put_data['data']
            data.save()
        return http.HttpResponse('', status=204)

    def delete(self, request, resourceid: int):
        check_global_permission(request, GlobalPreferencesPT.update)
        with transaction.atomic():
            resource = get_object_or_404(global_resources(), pk=resourceid)
            resource.delete()
        return http.HttpResponse('', status=204)


global_resources_view = openapi(schema={})(GlobalResources.as_view())
global_resource_view = openapi(schema={})(GlobalResource.as_view())
