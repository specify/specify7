from django.db import models

from django.contrib.auth.models import BaseUserManager


class SpecifyUserManager(BaseUserManager):
    def create_user(self, name, password=None):
        raise NotImplementedError()

    def create_superuser(self, name, password=None):
        raise NotImplementedError()


class Specifyuser(models.Model):
    USERNAME_FIELD = 'name'
    REQUIRED_FIELDS = []
    is_active = True
    objects = SpecifyUserManager()

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name

    def is_authenticated(self):
        return True

    def set_password(self, password):
        from encryption import encrypt
        self.password = encrypt(password, password)

    def check_password(self, password):
        from encryption import decrypt
        decrypted = decrypt(self.password, password)
        return decrypted == password

    def save(self, *args, **kwargs):
        # There is a signal handler that updates last_login when
        # a user logs in. Since there is no last_login field in
        # this table, we skip the save.
        try:
            if kwargs['update_fields'] == ['last_login']:
                return
        except KeyError:
            pass

        return super(Specifyuser, self).save(*args, **kwargs)

    class Meta:
        abstract = True
