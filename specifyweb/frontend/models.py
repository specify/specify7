from django.db import models

from specifyweb.specify import models as spmodels
Specifyuser = getattr(spmodels, 'Specifyuser')

class Spuserexternalid(models.Model):
    provider = models.CharField(max_length=256)
    providerid = models.CharField(max_length=256)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)

    class Meta:
        db_table = "spuserexternalid"
        constraints = [
            models.UniqueConstraint(fields=["provider", "providerid"], name="unique_spuser_external_id")
        ]
