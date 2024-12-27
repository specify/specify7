from django.db import models
from django.utils import timezone
from functools import partialmethod
from specifyweb.specify.models import custom_save, protect_with_blockers, Collection, Collectionobject

class Issue5451Test(models.Model): 
    id = models.AutoField(primary_key=True, db_column='issue5451testID')

    name = models.CharField(max_length=255, null=True, blank=True)
    text1 = models.CharField(max_length=255, null=True, blank=True)

    collectionobject = models.OneToOneField(Collectionobject, db_column='CollectionObjectID', related_name='issue5451', null=False, on_delete=models.CASCADE)

    timestampmodified = models.DateTimeField(blank=True, null=True, unique=False, db_column='TimestampModified', db_index=False, default=timezone.now)
    timestampcreated = models.DateTimeField(blank=False, null=False, unique=False, db_column='TimestampCreated', db_index=False, default=timezone.now)

    save = partialmethod(custom_save)
    class Meta: 
        db_table = 'issue5451test'