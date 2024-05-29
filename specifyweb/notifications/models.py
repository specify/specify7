from django.db import models
from django.utils import timezone
from specifyweb.specify.models import Specifyuser, Collection, Agent


class Message(models.Model):
    user = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    timestampcreated = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    read = models.BooleanField(default=False)


class AsyncTask(models.Model):
    taskid = models.CharField(max_length=256)
    status = models.CharField(max_length=256)
    timestampcreated = models.DateTimeField(default=timezone.now)
    timestampmodified = models.DateTimeField(auto_now=True)
    specifyuser = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    createdbyagent = models.ForeignKey(
        Agent, null=True, on_delete=models.SET_NULL, related_name="+")
    modifiedbyagent = models.ForeignKey(
        Agent, null=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        abstract = True


class Spmerging(AsyncTask):
    name = models.CharField(max_length=256)
    response = models.TextField()
    table = models.CharField(max_length=256)
    newrecordid = models.IntegerField(null=True)
    newrecordata = models.JSONField(null=True)
    oldrecordids = models.JSONField(null=True)

    class Meta:
        db_table = 'spmerging'
        # managed = False
