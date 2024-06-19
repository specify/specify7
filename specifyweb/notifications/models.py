from django.db import models
from django.utils import timezone
from functools import partialmethod
from specifyweb.specify.models import Collection, Specifyuser, Agent
from ..specify.models import Specifyuser, datamodel, custom_save

class Message(models.Model):
    specify_model = datamodel.get_table('message')

    user = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    timestampcreated = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    read = models.BooleanField(default=False)

    save = partialmethod(custom_save)

class Spmerging(models.Model):
    specify_model = datamodel.get_table('spmerging')

    name = models.CharField(max_length=256) 
    taskid = models.CharField(max_length=256) 
    mergingstatus = models.CharField(max_length=256)
    response = models.TextField()
    table = models.CharField(max_length=256)
    newrecordid = models.IntegerField(null=True)
    newrecordata = models.JSONField(null=True)
    oldrecordids = models.JSONField(null=True)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    timestampcreated = models.DateTimeField(default=timezone.now) 
    timestampmodified = models.DateTimeField(auto_now=True) 
    createdbyagent = models.ForeignKey(Agent, null=True, on_delete=models.SET_NULL, related_name="+") 
    modifiedbyagent = models.ForeignKey(Agent, null=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        db_table = 'spmerging'
        # managed = False

    save = partialmethod(custom_save)
