from django.db import models

from specifyweb.specify import models as spmodels
Specifyuser = getattr(spmodels, 'Specifyuser')

class Spuserexternalid(models.Model):
    """Maps external user identities to Specify user accounts."""
    provider = models.CharField(max_length=256)  # From a key in settings.OAUTH_LOGIN_PROVIDERS
    providerid = models.CharField(max_length=256) # The user's id in the external system.
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)

    class Meta:
        db_table = "spuserexternalid"
        constraints = [
            models.UniqueConstraint(fields=["provider", "providerid"], name="unique_spuser_external_id")
        ]
