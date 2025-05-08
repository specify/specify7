import logging
import hmac
from hashlib import sha256
from time import time

from django.conf import settings
from django.core.exceptions import PermissionDenied

from specifyweb.specify.models import Specifyuser

logger = logging.getLogger(__name__)

TTL = settings.SUPPORT_LOGIN_TTL

def make_digest(msg):
    return hmac.new(settings.SECRET_KEY.encode(), msg.encode(), sha256).hexdigest()

def make_token(user):
    msg = f"{user.id}-{int(time())}"
    return msg + '-' + make_digest(msg)


class SupportLoginBackend:
    def authenticate(self, request, token=None):
        logger.info("attempting support login")
        try:
            userid, timestamp, digest = token.split('-')
        except ValueError:
            return None

        msg = f"{userid}-{timestamp}"
        if digest == make_digest(msg) and int(timestamp) + TTL > time():
            return self.get_user(userid)
        else:
            raise PermissionDenied()

    def get_user(self, user_id):
        try:
            return Specifyuser.objects.get(pk=user_id)
        except Specifyuser.DoesNotExist:
            return None
