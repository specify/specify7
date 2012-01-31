from ajax_select import LookupChannel
from django.db.models import Q
from models import Collectingevent

class CollectingEventLookup(LookupChannel):
    model = Collectingevent

    def get_query(self, q, request):
        return Collectingevent.objects\
            .filter(Q(locality__localityname__icontains=q) |
                    Q(verbatimlocality__icontains=q))\
            .order_by('locality.localityname', 'verbatimlocality')

    def get_result(self, obj):
        return obj.locality and obj.locality.localityname or obj.verbatimlocaity

