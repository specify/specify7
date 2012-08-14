from django.http import HttpResponseBadRequest
from specify.models import Collection

class ContextMiddleware(object):
    def process_request(self, request):
        if not request.user.is_authenticated(): return
        try:
            collection = Collection.objects.get(id=int(request.session.get('collection', '')))
        except ValueError:
            return HttpResponseBadRequest('bad collection id in session', content_type='text/plain')
        except Collection.DoesNotExist:
            return HttpResponseBadRequest('collection does not exist', content_type='text/plain')
        request.specify_collection = collection

    def process_template_response(self, request, response):
        collection = getattr(request, 'specify_collection', None)
        if collection:
            response.context_data['collection'] = collection
        return response
