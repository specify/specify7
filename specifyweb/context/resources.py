import json

from django import http
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.views import View
from specifyweb.specify import models, api

Spappresource = getattr(models, 'Spappresource')
Spappresourcedir = getattr(models, 'Spappresourcedir')

class Resources(View):
    _spappresourcefilter = None
    _spappresourcedirfilter = None
    _spappresourcefilterpost = None
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
        with transaction.atomic():
            directory, _ = Spappresourcedir.objects.get_or_create(
                collection=request.specify_collection,
                discipline=request.specify_collection.discipline,
                **self._spappresourcedirfilter(request)
            )
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
            return http.HttpResponse(api.toJson(response_data),
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
        return http.HttpResponse(api.toJson(response_data),
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



