from django.db import models
from django_jsonfield_backport.models import JSONField # type: ignore

from specifyweb.specify import models as spmodels
Specifyuser = getattr(spmodels, 'Specifyuser')

class Spuserexternalid(models.Model):
    """Maps external user identities to Specify user accounts."""
    provider = models.CharField(max_length=256)  # From a key in settings.OAUTH_LOGIN_PROVIDERS
    providerid = models.CharField(max_length=4095) # The user's id in the external system.
    idtoken = JSONField(null=True) # Place to store the JWT of the user
    enabled = models.BooleanField(default=True) # Can this id be used to login.
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)

    class Meta:
        db_table = "spuserexternalid"
        constraints = [
            models.UniqueConstraint(fields=["provider", "providerid"], name="unique_spuser_external_id")
        ]
