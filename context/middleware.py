from django.http import HttpResponseBadRequest
from specify.models import Collection, Specifyuser, Agent
from specify.filter_by_col import filter_by_collection

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

        request.specify_user_agent = filter_by_collection(Agent.objects, collection) \
            .select_related('specifyuser') \
            .get(specifyuser__name=request.user.username)

        request.specify_user = request.specify_user_agent.specifyuser

    def process_template_response(self, request, response):
        collection = getattr(request, 'specify_collection', None)
        if collection:
            response.context_data['collection'] = collection
        return response
