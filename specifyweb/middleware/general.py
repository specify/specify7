import traceback
from typing import Optional, Dict
from django import http
from django.conf import settings

class SpecifyExceptionWrapper(Exception):
    def __init__(self, *args: object) -> None:
        super().__init__(*args)
        self.exception = self.args[0]
        self.data = self.args[1] if len(self.args) > 1 else None
        self.status_code = getattr(self.exception, "status_code") if hasattr(self.exception, "status_code") else 500
    
    def to_json(self) -> Dict:
        result = {
            'exception' : self.exception.__class__.__name__,
            'message' : str(self.exception),
            'data' : self.data,
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
