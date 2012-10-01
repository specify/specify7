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
        except ValueError, Collection.DoesNotExist:
            collection = None

        if collection is not None:
            try:
                agent = filter_by_collection(Agent.objects, collection) \
                    .select_related('specifyuser') \
                    .get(specifyuser__name=request.user.username)
            except Agent.DoesNotExist:
                agent = None
        else:
            agent = None

        if agent is not None:
            user = agent.specifyuser
        else:
            user = None


        request.specify_collection = collection
        request.specify_user_agent = agent
        request.specify_user = user

    def process_template_response(self, request, response):
        collection = getattr(request, 'specify_collection', None)
        if collection:
            response.context_data['collection'] = collection
        return response
