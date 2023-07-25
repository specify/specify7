from django.db import models
from django.utils import timezone

from specifyweb.specify import models as spmodels

Agent = getattr(spmodels, 'Agent')

class Spmerging(models.Model):
    name = models.CharField(max_length=256) 
    taskid = models.CharField(max_length=256) 
    mergingstatus = models.CharField(max_length=256) 
    timestampcreated = models.DateTimeField(default=timezone.now) 
    timestampmodified = models.DateTimeField(auto_now=True) 
    createdbyagent = models.ForeignKey(Agent, null=True, on_delete=models.SET_NULL, related_name="+") 
    modifiedbyagent = models.ForeignKey(Agent, null=True, on_delete=models.SET_NULL, related_name="+")
