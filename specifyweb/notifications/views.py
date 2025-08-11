import json
from datetime import datetime, timedelta

from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.conf import settings

from specifyweb.middleware.general import require_GET
from ..specify.views import login_maybe_required
from ..specify.api import toJson

from .models import Message

@require_GET
@login_maybe_required
def get_messages(request):
    """Returns a list of notification messages for the logged in user,
    optionally restricted to those created after the 'since' GET parameter.
    """
    since = request.GET.get('since', None)
    time_filter = {'timestampcreated__gt': since} if since is not None else {}
    messages = Message.objects.filter(user=request.specify_user, **time_filter).order_by('timestampcreated')

    def serialize(m: Message):
        base = {'message_id': m.id, 'read': m.read, 'timestamp': m.timestampcreated}
        try:
            content = json.loads(m.content) if m.content else {}
            if not isinstance(content, dict):
                content = {'type': 'invalid-notification', 'raw': m.content}
        except Exception:
            content = {'type': 'invalid-notification', 'raw': m.content}
        # Drop any conflicting keys from content
        content.pop('timestamp', None)
        content.pop('message_id', None)
        content.pop('read', None)
        base.update(content)
        return base

    return HttpResponse(toJson([serialize(m) for m in messages]), content_type='application/json')

@require_POST
@login_maybe_required
def mark_read(request):
    """Mark as read all notification messages created before the 'last_seen' POST parameter.
    """
    if 'last_seen' not in request.POST:
        return HttpResponseBadRequest()
    Message.objects.filter(user=request.specify_user, timestampcreated__lte=request.POST['last_seen']).update(read=True)

    delete_before = datetime.now() - timedelta(days=settings.NOTIFICATION_TTL_DAYS)
    Message.objects.filter(user=request.specify_user, timestampcreated__lt=delete_before).delete()
    return HttpResponse('OK', content_type='text/plain')

@require_POST
@login_maybe_required
def delete(request):
    "Delete the notification message indicated by the 'message_id' POST parameter."
    if 'message_id' not in request.POST:
        return HttpResponseBadRequest()
    Message.objects.filter(user=request.specify_user, id=request.POST['message_id']).delete()
    return HttpResponse('OK', content_type='text/plain')

@require_POST
@login_maybe_required
def delete_all(request):
   "Delete the notification messages indicated by the 'message_ids' POST parameter."
   if "message_ids" not in request.POST:
       return HttpResponseBadRequest()

   message_ids = json.loads(request.POST["message_ids"])
   Message.objects.filter(user=request.specify_user, id__in=message_ids).delete()

   return HttpResponse("OK", content_type="text/plain")