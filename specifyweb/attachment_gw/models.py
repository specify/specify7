from django.db import models
from django.conf import settings
from django.db.models.deletion import CASCADE, SET_NULL
from django.utils import timezone
from model_utils import FieldTracker
from functools import partialmethod
from specifyweb.specify.models import datamodel, custom_save
from ..workbench.models import Dataset

class Spattachmentdataset(Dataset):
    specify_model = datamodel.get_table('spattachmentdataset')

    id = models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')

    class Meta:
        db_table = 'attachmentdataset'

    timestamptracker = FieldTracker(fields=['timestampcreated', 'timestampmodified'])
    save = partialmethod(custom_save)

# from django.apps import apps

# class Spattachmentdataset(models.Model):

#     class Meta:
#         db_table = 'attachmentdataset'

#     def __init__(self, *args, **kwargs):
#         Dataset = apps.get_model('workbench', 'Dataset')
#         super(Spattachmentdataset, self).__init__(*args, **kwargs)

# Create your models here.
