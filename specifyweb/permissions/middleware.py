from typing import Optional

from django import http

from .permissions import PermissionsException, NoMatchingRuleException, \
    CollectionAccessPT, check_permission_targets

class PermissionsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        skip_collection_access_check = getattr(view_func, '__skip_sp_collection_access_check', False)
        user = request.specify_user
        col = request.specify_collection
        if not skip_collection_access_check and user != None and col != None:
            check_permission_targets(col.id, user.id, [CollectionAccessPT.access])

    def process_exception(self, request, exception) -> Optional[http.HttpResponse]:
        if isinstance(exception, PermissionsException):
            return http.JsonResponse(exception.to_json(), status=403, safe=False)
        else:
            return None
