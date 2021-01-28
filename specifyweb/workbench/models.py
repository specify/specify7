
from django.db import models
from django_jsonfield_backport.models import JSONField # type: ignore

from specifyweb.specify import models as spmodels

Collection = getattr(spmodels, 'Collection')
Specifyuser = getattr(spmodels, 'Specifyuser')

class Spdataset(models.Model):
    name = models.CharField(max_length=256)
    columns = JSONField()
    data = JSONField(default=list)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    uploadplan = JSONField(null=True)
    uploaderstatus = JSONField(null=True)
    uploadresult = JSONField(null=True)
    rowresults = JSONField(null=True)

    class Meta:
        db_table = 'spdataset'
