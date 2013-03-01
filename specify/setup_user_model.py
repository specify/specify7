
def setup_user_model(UserModel):
    for attr, val in dict(
        USERNAME_FIELD = 'name',
        REQUIRED_FIELDS = [],
        is_active = True,
        get_full_name = lambda self: self.name,
        get_short_name = lambda self: self.name,
        is_authenticated = lambda self: True,
        ).items():
        setattr(UserModel, attr, val)

    from django.contrib.auth.signals import user_logged_in
    from django.contrib.auth.models import update_last_login
    user_logged_in.disconnect(update_last_login)
