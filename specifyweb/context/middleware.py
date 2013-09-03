from django.http import HttpResponseBadRequest
from specifyweb.specify.models import Collection, Specifyuser, Agent
from specifyweb.specify.filter_by_col import filter_by_collection

class ContextMiddleware(object):
    """Adds information about the logged in user and collection to requests."""
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
                    .get(specifyuser=request.user)
            except Agent.DoesNotExist:
                agent = None
        else:
            agent = None

        request.specify_collection = collection
        request.specify_user_agent = agent
        request.specify_user = request.user

    def process_template_response(self, request, response):
        collection = getattr(request, 'specify_collection', None)
        if collection:
            response.context_data['collection'] = collection
        return response
