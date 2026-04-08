from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils import timezone


class SchemaMapping(models.Model):
    # ID Field
    id = models.AutoField(primary_key=True, db_column='SchemaMappingID')

    # Fields
    mappingtype = models.CharField(
        max_length=16, db_column='MappingType',
        choices=[('Core', 'Core'), ('Extension', 'Extension')],
    )
    name = models.CharField(max_length=256, db_column='Name')
    isdefault = models.BooleanField(default=False, db_column='IsDefault')
    vocabulary = models.CharField(
        max_length=32, db_column='Vocabulary', null=True, blank=True,
        help_text='Vocabulary key (e.g. dwc, ac) — locked after creation',
    )
    timestampcreated = models.DateTimeField(db_column='TimestampCreated', default=timezone.now)
    timestampmodified = models.DateTimeField(db_column='TimestampModified', default=timezone.now)
    version = models.IntegerField(default=0, db_column='Version')

    # Relationships
    query = models.OneToOneField(
        'specify.Spquery', db_column='SpQueryID',
        on_delete=models.CASCADE, related_name='+',
    )
    createdbyagent = models.ForeignKey(
        'specify.Agent', db_column='CreatedByAgentID',
        related_name='+', null=True, on_delete=models.SET_NULL,
    )
    modifiedbyagent = models.ForeignKey(
        'specify.Agent', db_column='ModifiedByAgentID',
        related_name='+', null=True, on_delete=models.SET_NULL,
    )

    class Meta:
        db_table = 'schemamapping'


class ExportDataSet(models.Model):
    id = models.AutoField(primary_key=True, db_column='ExportDataSetID')
    exportname = models.CharField(max_length=255, unique=True, db_column='ExportName')
    filename = models.CharField(max_length=255, unique=True, db_column='FileName')
    isrss = models.BooleanField(default=False, db_column='IsRSS')
    frequency = models.IntegerField(blank=True, null=True, db_column='Frequency')
    metadata = models.ForeignKey(
        'specify.Spappresource', db_column='MetadataID',
        related_name='+', null=True, blank=True, on_delete=models.SET_NULL,
    )
    coremapping = models.ForeignKey(
        'SchemaMapping', db_column='CoreMappingID',
        related_name='export_datasets', on_delete=models.PROTECT,
    )
    collection = models.ForeignKey(
        'specify.Collection', db_column='CollectionID',
        related_name='+', on_delete=models.CASCADE,
    )
    lastexported = models.DateTimeField(blank=True, null=True, db_column='LastExported')
    timestampcreated = models.DateTimeField(default=timezone.now, db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(default=timezone.now, db_column='TimestampModified')
    version = models.IntegerField(default=0, db_column='Version')

    class Meta:
        db_table = 'exportdataset'


class ExportDataSetExtension(models.Model):
    id = models.AutoField(primary_key=True, db_column='ExportDataSetExtensionID')
    exportdataset = models.ForeignKey(
        'ExportDataSet', db_column='ExportDataSetID',
        related_name='extensions', on_delete=models.CASCADE,
    )
    schemamapping = models.ForeignKey(
        'SchemaMapping', db_column='SchemaMappingID',
        related_name='dataset_extensions', on_delete=models.PROTECT,
    )
    sortorder = models.IntegerField(default=0, db_column='SortOrder')

    class Meta:
        db_table = 'exportdatasetextension'
        unique_together = [('exportdataset', 'schemamapping')]


class CacheTableMeta(models.Model):
    id = models.AutoField(primary_key=True, db_column='CacheTableMetaID')
    schemamapping = models.OneToOneField(
        'SchemaMapping', db_column='SchemaMappingID',
        related_name='cache_meta', on_delete=models.CASCADE,
    )
    tablename = models.CharField(max_length=128, unique=True, db_column='TableName')
    lastbuilt = models.DateTimeField(blank=True, null=True, db_column='LastBuilt')
    rowcount = models.IntegerField(blank=True, null=True, db_column='RowCount')
    buildstatus = models.CharField(
        max_length=16, default='idle', db_column='BuildStatus',
        choices=[('idle', 'idle'), ('building', 'building'), ('error', 'error')],
    )

    class Meta:
        db_table = 'cachetablemeta'


@receiver(pre_delete, sender=SchemaMapping)
def delete_schema_mapping_cache(sender, instance, **kwargs):
    """Drop cache table before a SchemaMapping is deleted (before CASCADE removes CacheTableMeta)."""
    from .cache import drop_cache_table
    for meta in CacheTableMeta.objects.filter(schemamapping=instance):
        try:
            drop_cache_table(meta.tablename)
        except Exception:
            pass
