"""
Sets up Django ORM with the Specify datamodel
"""

from .build_models import build_models
from .check_versions import check_versions
from .datamodel import datamodel

from django.db import models
from django.utils import timezone

models_by_tableid = build_models(__name__, datamodel)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in list(models_by_tableid.values()))

#check_versions(Spversion)

class Spmerging(models.Model):
    name = models.CharField(max_length=256) # type: ignore
    taskid = models.CharField(max_length=256) # type: ignore
    mergingstatus = models.CharField(max_length=256) # type: ignore
    timestampcreated = models.DateTimeField(default=timezone.now) # type: ignore
    timestampmodified = models.DateTimeField(auto_now=True) # type: ignore
    createdbyagent = models.ForeignKey(Agent, null=True, on_delete=models.SET_NULL, related_name="+") # type: ignore
    modifiedbyagent = models.ForeignKey(Agent, null=True, on_delete=models.SET_NULL, related_name="+") # type: ignore

# clean up namespace
del build_models, check_versions
