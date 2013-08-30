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

    def is_admin(self):
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("""
        SELECT 1
        FROM specifyuser_spprincipal, spprincipal
        WHERE %s = specifyuser_spprincipal.SpecifyUserId
        AND specifyuser_spprincipal.SpPrincipalId = spprincipal.SpPrincipalId
        AND spprincipal.Name = 'Administrator'
        LIMIT 1
        """, [self.id])
        return cursor.fetchone() is not None

    def set_admin(self):
        from django.db import connection, transaction
        from django.db.utils import IntegrityError

        cursor = connection.cursor()
        try:
            cursor.execute("""
            INSERT INTO specifyuser_spprincipal (SpPrincipalId, SpecifyUserId)
            SELECT SpPrincipalId, %s FROM spprincipal
            WHERE Name = 'Administrator'
            """, [self.id])
            transaction.commit_unless_managed()
        except IntegrityError:
            pass

    def clear_admin(self):
        from django.db import connection, transaction

        cursor = connection.cursor()
        cursor.execute("""
        DELETE FROM specifyuser_spprincipal
        WHERE SpecifyUserId = %s
        AND SpPrincipalId IN (
          SELECT SpPrincipalId FROM spprincipal
          WHERE Name = 'Administrator'
        )
        """, [self.id])
        transaction.commit_unless_managed()

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
