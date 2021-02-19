
from django.db import models
from django.utils import timezone
from django_jsonfield_backport.models import JSONField # type: ignore

from specifyweb.specify import models as spmodels

Collection = getattr(spmodels, 'Collection')
Specifyuser = getattr(spmodels, 'Specifyuser')

class Spdataset(models.Model):
    name = models.CharField(max_length=256)
    columns = JSONField()
    visualorder = JSONField(null=True)
    data = JSONField(default=list)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    uploadplan = models.TextField(null=True)
    uploaderstatus = JSONField(null=True)
    uploadresult = JSONField(null=True)
    rowresults = models.TextField(null=True)
    remarks = models.TextField(null=True)
    importedfilename = models.TextField(null=True)
    timestampcreated = models.DateTimeField(default=timezone.now)
    timestampmodified = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'spdataset'

    def was_uploaded(self) -> bool:
        return self.uploadresult and self.uploadresult['success']
