import hmac
from hashlib import sha256
from time import time

from django.conf import settings

from specifyweb.specify.models import Specifyuser


def make_digest(msg):
    return hmac.new(settings.SECRET_KEY, msg, sha256).hexdigest()

def make_token(user):
    msg = "%s-%s" % (user.id, int(time()))
    return msg + '-' + make_digest(msg)


class SupportLoginBackend(object):
    def authenticate(self, token=None):
        try:
            userid, timestamp, digest = token.split('-')
        except ValueError:
            return None

        msg = "%s-%s" % (userid, timestamp)
        if digest == make_digest(msg) and int(timestamp) + 300 > time():
            return self.get_user(userid)

    def get_user(self, user_id):
        try:
            return Specifyuser.objects.get(pk=user_id)
        except Specifyuser.DoesNotExist:
            return None
