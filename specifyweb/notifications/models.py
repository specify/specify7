from django.db import models
from django.utils import timezone
from functools import partialmethod
from specifyweb.specify.models import Collection, Specifyuser, Agent, Recordset, datamodel, custom_save

class Message(models.Model):
    specify_model = datamodel.get_table('message')

    user = models.ForeignKey(Specifyuser, on_delete=models.CASCADE)
    timestampcreated = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    read = models.BooleanField(default=False)

    save = partialmethod(custom_save)


class AsyncTask(models.Model):
    taskid = models.CharField(max_length=256)
    status = models.CharField(max_length=256)
    timestampcreated = models.DateTimeField(default=timezone.now)
    timestampmodified = models.DateTimeField(auto_now=True)
    specifyuser = models.ForeignKey(
        Specifyuser, db_column='SpecifyUserID', on_delete=models.CASCADE)
    collection = models.ForeignKey(
        Collection, db_column="CollectionID", on_delete=models.CASCADE)
    createdbyagent = models.ForeignKey(
        Agent, null=True, db_column="CreatedByAgentID", on_delete=models.SET_NULL, related_name="+")
    modifiedbyagent = models.ForeignKey(
        Agent, null=True, db_column="ModifiedByAgentID", on_delete=models.SET_NULL, related_name="+")

    class Meta:
        abstract = True


class Spmerging(AsyncTask):
    specify_model = datamodel.get_table('spmerging')

    name = models.CharField(max_length=256)
    response = models.TextField()
    table = models.CharField(max_length=256)
    newrecordid = models.IntegerField(null=True)
    newrecordata = models.JSONField(null=True)
    oldrecordids = models.JSONField(null=True)

    save = partialmethod(custom_save)

    class Meta:
        db_table = 'spmerging'
        # managed = False


class LocalityUpdate(AsyncTask):
    specify_model = datamodel.get_table('localityupdate')

    id = models.AutoField('localityupdateid',
                          primary_key=True, db_column='LocalityUpdateID')
    recordset = models.ForeignKey(
        Recordset, null=True, blank=True, db_column="RecordSetID", on_delete=models.SET_NULL)

    class Meta:
        db_table = 'localityupdate'


class LocalityUpdateRowResult(models.Model):
    specify_model = datamodel.get_table('localityupdaterowresult')


    id = models.AutoField('localityupdaterowresultid',
                          primary_key=True, db_column='LocalityUpdateRowResultID')
    rownumber = models.IntegerField()
    result = models.JSONField()
    localityupdate = models.ForeignKey(
        LocalityUpdate, on_delete=models.CASCADE, related_name="results", db_column='LocalityUpdateID')

    class Meta:
        db_table = 'localityupdaterowresult'
