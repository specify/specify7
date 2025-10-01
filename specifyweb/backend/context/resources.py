import json

from django import http
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.views import View
from specifyweb.specify.models import Spappresource, Spappresourcedir
from specifyweb.specify.api.serializers import toJson

class Resources(View):
    _spappresourcefilter = None
    _spappresourcedirfilter = None
    _spappresourcefilterpost = None
    _spappresourcedircreate = None
    def get(self, request) -> http.HttpResponse:
        resources = Spappresource.objects.filter(
            spappresourcedir__collection=request.specify_collection,
            **self._spappresourcefilter(request)
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
        _spappresourcedir_base = {
            'collection': request.specify_collection,
            'discipline': request.specify_collection.discipline,
        }
        _spappresourcedir_filter = {
            **_spappresourcedir_base,
            **self._spappresourcedirfilter(request)
        }

        with transaction.atomic():
            directories_matched = Spappresourcedir.objects.filter(
                **_spappresourcedir_filter
            )

            if len(directories_matched) == 0:
                _spappresourcedir_create = {
                    **_spappresourcedir_base,
                    **self._spappresourcedircreate(request)
                }
                directory = Spappresourcedir.objects.create(
                **_spappresourcedir_create
                )
            else:
                directory = directories_matched[0]

            resource = Spappresource.objects.create(
                spappresourcedir=directory,
                level=0,
                name=post_data['name'],
                mimetype=post_data['mimetype'],
                metadata=post_data['metadata'],
                **self._spappresourcefilterpost(request)
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
            return http.HttpResponse(toJson(response_data),
                                     content_type="application/json",
                                     status=201)


class Resource(View):
    _spappresourcefilter = None
    def get(self, request, resourceid: int) -> http.HttpResponse:
        resource = get_object_or_404(
            Spappresource,
            pk=resourceid,
            spappresourcedir__collection=request.specify_collection,
            **self._spappresourcefilter(request)
        )

        data = resource.spappresourcedatas.get()
        response_data = {
            'id': resource.id,
            'name': resource.name,
            'mimetype': resource.mimetype,
            'metadata': resource.metadata,
            'data': data.data,

            
        }
        return http.HttpResponse(toJson(response_data),
                                 content_type="application/json")

    def put(self, request, resourceid: int) -> http.HttpResponse:
        put_data = json.loads(request.body)

        with transaction.atomic():
            resource = get_object_or_404(
                Spappresource,
                pk=resourceid,
                spappresourcedir__collection=request.specify_collection,
                **self._spappresourcefilter(request),
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
                spappresourcedir__collection=request.specify_collection,
                **self._spappresourcefilter(request)
            )
            resource.delete()

        return http.HttpResponse('', status=204)



