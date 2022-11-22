
from django.db import models
from django.utils import timezone

from specifyweb.specify import models as spmodels

Collection = getattr(spmodels, 'Collection')
Specifyuser = getattr(spmodels, 'Specifyuser')
Agent = getattr(spmodels, 'Agent')

class Spdataset(models.Model):
    name = models.CharField(max_length=256)
    columns = models.JSONField()
    visualorder = models.JSONField(null=True)
    data = models.JSONField(default=list)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    uploadplan = models.TextField(null=True)
    uploaderstatus = models.JSONField(null=True)
    uploadresult = models.JSONField(null=True)
    rowresults = models.TextField(null=True)
    remarks = models.TextField(null=True)
    importedfilename = models.TextField(null=True)
    timestampcreated = models.DateTimeField(default=timezone.now)
    timestampmodified = models.DateTimeField(auto_now=True)
    createdbyagent = models.ForeignKey(Agent, null=True, on_delete=models.SET_NULL, related_name="+")
    modifiedbyagent = models.ForeignKey(Agent, null=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        db_table = 'spdataset'

    def was_uploaded(self) -> bool:
        return self.uploadresult and self.uploadresult['success']
