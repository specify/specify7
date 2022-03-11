from typing import Optional

from django import http

from .permissions import PermissionsException, NoMatchingRuleException

class PermissionsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception) -> Optional[http.HttpResponse]:
        if isinstance(exception, PermissionsException):
            return http.JsonResponse(exception.to_json(), status=403, safe=False)
        else:
            return None
