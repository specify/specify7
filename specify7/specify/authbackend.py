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
        else:
            return spuser

    def get_user(self, user_id):
        try:
            return Specifyuser.objects.get(pk=user_id)
        except Specifyuser.DoesNotExist:
            return None
