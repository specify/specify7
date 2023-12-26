from django.db import models
from ..workbench.models import Dataset

class Spattachmentdataset(Dataset):

    class Meta:
        db_table = 'attachmentdataset'


# Create your models here.
