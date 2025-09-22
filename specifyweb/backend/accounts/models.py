from django.db import models
from functools import partialmethod
from specifyweb.specify.models import Specifyuser, datamodel, custom_save

class Spuserexternalid(models.Model):
    """Maps external user identities to Specify user accounts."""
    specify_model = datamodel.get_table('spuserexternalid')

    provider = models.CharField(max_length=256)  # From a key in settings.OAUTH_LOGIN_PROVIDERS
    providerid = models.CharField(max_length=4095) # The user's id in the external system.
    idtoken = models.JSONField(null=True) # Place to store the JWT of the user
    enabled = models.BooleanField(default=True) # Can this id be used to login.
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)

    class Meta:
        db_table = "spuserexternalid"
        #
        # The following doesn't work in mysql because the providerid
        # field is too long. I'd rather not shorten it because some
        # identity providers use pretty long ids. So I'm just going to
        # not enforce this. MySQL strikes again.
        #
        # constraints = [
        #     models.UniqueConstraint(fields=["provider", "providerid"], name="unique_spuser_external_id")
        # ]

    # save = partialmethod(custom_save)
