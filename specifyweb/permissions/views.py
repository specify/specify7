import json

from django.shortcuts import render
from django import http
from django.views import View

from . import models

def serialize_user_policy(p: models.UserPolicy):
    return {
        'id': p.id,
        'collection': p.collection_id,
        'specifyuser': p.specifyuser_id,
        'resource': p.resource,
        'action': p.action,
    }


class UserPolicyCollection(View):
    def get(self, request) -> http.HttpResponse:
        data = [
            serialize_user_policy(p)
            for p in models.UserPolicy.objects.all()
        ]
        return http.JsonResponse(data, safe=False)

    def post(self, request) -> http.HttpResponse:
        data = json.loads(request.body)

        p = models.UserPolicy.objects.create(
            collection_id=data['collection'],
            specifyuser_id=data['specifyuser'],
            resource=data['resource'],
            action=data['action'],
        )

        return http.JsonResponse(serialize_user_policy(p))
