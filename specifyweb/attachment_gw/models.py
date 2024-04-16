from django.db import models
# from specifyweb.specify import models as spmodels
from ..workbench.models import Dataset

class Spattachmentdataset(Dataset):

    class Meta:
        db_table = 'attachmentdataset'

# from django.apps import apps

# class Spattachmentdataset(models.Model):

#     class Meta:
#         db_table = 'attachmentdataset'

#     def __init__(self, *args, **kwargs):
#         Dataset = apps.get_model('workbench', 'Dataset')
#         super(Spattachmentdataset, self).__init__(*args, **kwargs)

# Create your models here.
