from django.http import HttpResponseBadRequest
from specify.models import Collection, Specifyuser

class ContextMiddleware(object):
    def process_request(self, request):
        if not request.user.is_authenticated(): return
        qs = Collection.objects.select_related('discipline',
                                               'discipline__division',
                                               'discipline__division__institution')
        try:
            collection = qs.get(id=int(request.session.get('collection', '')))
        except ValueError:
            return HttpResponseBadRequest('bad collection id in session', content_type='text/plain')
        except Collection.DoesNotExist:
            return HttpResponseBadRequest('collection does not exist', content_type='text/plain')
        request.specify_collection = collection
        request.specify_user = Specifyuser.objects.get(name=request.user.username)

    def process_template_response(self, request, response):
        collection = getattr(request, 'specify_collection', None)
        if collection:
            response.context_data['collection'] = collection
        return response
