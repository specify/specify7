import traceback
from typing import Optional, Dict
from django import http
from django.conf import settings

from ..permissions.permissions import PermissionsException

class SpecifyExceptionWrapper(Exception):
    http_status = 500
    
    def to_json(self) -> Dict:
        exception = self.args[0]

        has_data = len(self.args) > 1
        data = self.args[1] if has_data else None

        result = {
            'exception' : exception.__class__.__name__,
            'message' : str(exception),
            'data' : data,
            'traceback' : traceback.format_exc()
            }
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
        if not settings.DEBUG:
            if not isinstance(exception, SpecifyExceptionWrapper) and not isinstance(exception, PermissionsException):
                exception = SpecifyExceptionWrapper(exception)
            return http.HttpResponse(exception.to_json(), status=exception.http_status)
