import logging

from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.conf import settings
from django.utils import timezone

from .model_timestamp import pre_save_auto_timestamp_field_with_override
from .tree_extras import Tree, TreeRank

if settings.AUTH_LDAP_SERVER_URI is not None:
    from . import ldap_extras

logger = logging.getLogger(__name__)

class SpecifyUserManager(BaseUserManager):
    def create_user(self, name, password=None):
        raise NotImplementedError()

    def create_superuser(self, name, password=None):
        raise NotImplementedError()

class Specifyuser(models.Model):
    USERNAME_FIELD = 'name'
    REQUIRED_FIELDS = []
    is_active = True
    is_anonymous = False
    is_authenticated = True
    objects = SpecifyUserManager()

    def get_username(self):
        return getattr(self, self.USERNAME_FIELD)

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name

    def set_password(self, password):
        from .encryption import encrypt
        self.password = encrypt(password, password)

    def set_unusable_password(self):
        self.password = "unusable"

    def check_password(self, password):
        from .encryption import decrypt
        if password == '': return False
        try:
            decrypted = decrypt(self.password, password)
        except Exception as e:
            logger.error("Password decryption failed: %s", e)
            return False
        return decrypted == password

    def is_admin(self): 
        "Returns true if user is a Specify 7 admin."
        return self.userpolicy_set.filter(
            collection=None, resource="%", action="%"
        ).exists()

    def is_legacy_admin(self):
        "Returns true if user is a Specify 6 admin."
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
        "Make the user a Specify 6 admin."
        from django.db import connection, transaction
        from django.db.utils import IntegrityError

        cursor = connection.cursor()
        try:
            cursor.execute("""
            INSERT INTO specifyuser_spprincipal (SpPrincipalId, SpecifyUserId)
            SELECT SpPrincipalId, %s FROM spprincipal
            WHERE Name = 'Administrator'
            """, [self.id])
        except IntegrityError:
            # It's already in there.
            pass

    def clear_admin(self):
        "Make the user not a Specify 6 admin."
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

        pre_save_auto_timestamp_field_with_override(self)
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
           SUM({GREATEST}(0, COALESCE(Quantity - QuantityResolved, 0))),
           0)
        FROM loanpreparation
        WHERE PreparationID = %s AND NOT IsResolved
        """.format(GREATEST='MAX' if connection.vendor == 'sqlite' else 'GREATEST'), [self.id])

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

class Geographytreedefitem(TreeRank):
    class Meta:
        abstract = True

class Geologictimeperiodtreedefitem(TreeRank):
    class Meta:
        abstract = True

class Lithostrattreedefitem(TreeRank):
    class Meta:
        abstract = True

class Storagetreedefitem(TreeRank):
    class Meta:
        abstract = True

class Taxontreedefitem(TreeRank):
    class Meta:
        abstract = True
