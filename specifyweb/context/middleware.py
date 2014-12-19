from django.http import HttpResponseBadRequest
from django.conf import settings

from specifyweb.specify.models import Collection, Specifyuser, Agent
from specifyweb.specify.filter_by_col import filter_by_collection

class ContextMiddleware(object):
    """Adds information about the logged in user and collection to requests."""
    def process_request(self, request):
        if request.user.is_authenticated():
            specify_user = request.user
        elif settings.ANONYMOUS_USER:
            specify_user = Specifyuser.objects.get(name=settings.ANONYMOUS_USER)
        else:
            return

        qs = Collection.objects.select_related('discipline',
                                               'discipline__division',
                                               'discipline__division__institution')

        try:
            collection_id = int(request.session.get('collection', ''))
        except ValueError:
            collection = qs.all()[0]
        else:
            collection = qs.get(id=collection_id)

        try:
            agent = filter_by_collection(Agent.objects, collection) \
                .select_related('specifyuser') \
                .get(specifyuser=specify_user)
        except Agent.DoesNotExist:
            agent = None

        request.specify_collection = collection
        request.specify_user_agent = agent
        request.specify_user = specify_user

    def process_template_response(self, request, response):
        collection = getattr(request, 'specify_collection', None)
        if collection:
            response.context_data['collection'] = collection
        return response
