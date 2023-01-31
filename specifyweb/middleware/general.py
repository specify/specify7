import traceback
import json
from typing import Any, Optional, Dict, List
from django import http
from django.core import serializers
from django.db import models
from django.conf import settings
from django.forms.models import model_to_dict

class SpecifyExceptionWrapper():
    def __init__(self, exception : Exception) -> None:
        self.exception = exception
        self.message = exception.args[0] if len(exception.args) > 0 else None
        self.data = exception.args[1]  if len(exception.args) > 1 else None
        self.status_code = getattr(self.exception, "status_code") if hasattr(self.exception, "status_code") else 500
    
    def to_json(self) -> Dict:
        result = {
            'exception' : self.exception.__class__.__name__,
            'message' : str(self.message),
            'data' : str(self.data),
            'traceback' : traceback.format_exc()
            }

        if isinstance(self.data, models.QuerySet):
            result['data'] = serialize_django_obj(self.data)

        from ..specify import api
        return api.toJson(result)


class GeneralMiddleware:
    def __init__(self, get_response) -> None:
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        pass

    def process_exception(self, request, exception) -> Optional[http.HttpResponse]:
        from ..permissions.permissions import PermissionsException
        if not settings.DEBUG:
            if isinstance(exception, PermissionsException):
                return http.JsonResponse(exception.to_json(), status=exception.status_code, safe=False)
        
            # If Http404, defer this exception to Django
            if isinstance(exception, http.Http404):
                return None
                
            if not isinstance(exception, SpecifyExceptionWrapper):
                exception = SpecifyExceptionWrapper(exception)
            try:
                return http.HttpResponse(exception.to_json(), status=exception.status_code)

            # If something in the base exception is not JSON serializable, use and wrap the raised TypeError instead 
            except TypeError as e:
                exception = SpecifyExceptionWrapper(e)
                return http.HttpResponse(exception.to_json(), status=exception.status_code)


def serialize_django_obj(django_obj: models.QuerySet or models.Model) -> List[Dict[str, Any]] or Dict[str, Any]:
    """Attempt to serialize two common objects in Django, a Queryset or a Model. 
    If the object is a Queryset, return a list of dictonaries containing the important (non-null) fields
    Similarly, if the object is a single Model, return a dictonary containing every field
    Otherwise, return a string version of <django_obj>
    """

    if isinstance(django_obj, models.QuerySet):
        # We use a django serializer to convert the queryset to a string and then convert 
        # the string to a json object.
        # The loaded json object is a list of dictonaries which all have the keys 'model', 'pk', and 'fields'
        # See the Django documentation for more information
        #   https://docs.djangoproject.com/en/2.2/topics/serialization/#json-1

        raw_queryset = json.loads(serializers.serialize('json', django_obj))
        parsed_data = [
            {
                "Model" : resource['model'].split(".")[1].capitalize(),
                "Id" : resource['pk'],
                "Non-Null Fields" : [f"{field} : {value}" for field, value in resource['fields'].items() if value is not None]
            }
            for resource in raw_queryset
        ]
    
    # We can not directly check if the object is a model with isinstance(). However, every model object
    # contains a '_state' attribute which is of type ModelState.
    
    # Both cases for Querysets and Models do not include to-many relationship data for fields
    elif hasattr(django_obj, "_state") and isinstance(django_obj.__dict__['_state'], models.base.ModelState):
        parsed_data = model_to_dict(django_obj)
    else: 
        # If the passed-in object is unknown, return the object as a string
        return str(django_obj)
    return parsed_data
