from build_models import build_models
from check_versions import check_versions

models_by_tableid = build_models(__name__)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in models_by_tableid.values())

check_versions(Spversion)

def setup_specify_user():
    def get_full_name(self): return self.name
    def get_short_name(self): return self.name
    def is_authenticated(self): return True

    Specifyuser.USERNAME_FIELD = 'name'
    Specifyuser.REQUIRED_FIELDS = []
    Specifyuser.is_active = True
    Specifyuser.get_full_name = get_full_name
    Specifyuser.get_short_name = get_short_name
    Specifyuser.is_authenticated = is_authenticated

    from django.contrib.auth.signals import user_logged_in
    from django.contrib.auth.models import update_last_login
    user_logged_in.disconnect(update_last_login)

setup_specify_user()

