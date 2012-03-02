from django.contrib.auth.models import User
from encryption import decrypt
from models import Specifyuser

class SpecifyUserBackend:
    def authenticate(self, username=None, password=None):
        try:
            spuser = Specifyuser.objects.get(name=username)
        except Specifyuser.DoesNotExist:
            return None
        decrypted = decrypt(spuser.password, password)
        if decrypted != password:
            return None
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return User.objects.create_user(username, '')

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
