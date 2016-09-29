from django.db import models
from django.contrib.auth.base_user import BaseUserManager

from .tree_extras import Tree

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
        from .encryption import encrypt
        self.password = encrypt(password, password)

    def check_password(self, password):
        from .encryption import decrypt
        if password == '': return False
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
            # It's already in there.
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

        if self.id and self.usertype != 'Manager':
            self.clear_admin()

        return super(Specifyuser, self).save(*args, **kwargs)

    class Meta:
        abstract = True



class Preparation(models.Model):
    def isonloan(self):
        # TODO: needs unit tests
        from django.db import connection
        cursor = connection.cursor()

        cursor.execute("""
        SELECT COALESCE(
           SUM(GREATEST(0, COALESCE(Quantity - QuantityResolved, 0))),
           0)
        FROM loanpreparation
        WHERE PreparationID = %s AND NOT IsResolved
        """, [self.id])

        result = cursor.fetchone()
        return result[0] > 0

    class Meta:
        abstract = True



class Taxon(Tree):
    class Meta:
        abstract = True

class Storage(Tree):
    class Meta:
        abstract = True

class Geography(Tree):
    class Meta:
        abstract = True

class Geologictimeperiod(Tree):
    class Meta:
        abstract = True

class Lithostrat(Tree):
    class Meta:
        abstract = True
