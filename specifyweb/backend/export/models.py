"""Models for the export app.

The core DwC mapping/dataset/extension tables live on the main `specify`
app (added in upstream PRs #7873/#7874/#7877 and #7746). This module
re-exports them under PascalCase aliases for use throughout this package
and adds the cache-tracking model that's specific to the cache engine.
"""
from django.db import models
from django.utils import timezone

from specifyweb.specify.models import (
    Schemamapping as SchemaMapping,
    Exportdataset as ExportDataSet,
    Exportdatasetextension as ExportDataSetExtension,
)

__all__ = ['SchemaMapping', 'ExportDataSet', 'ExportDataSetExtension', 'CacheTableMeta']


class CacheTableMeta(models.Model):
    """Tracks build state and metadata for cache tables backing DwC exports."""

    id = models.AutoField(primary_key=True, db_column='CacheTableMetaID')

    schemamapping = models.ForeignKey(
        'specify.Schemamapping', db_column='SchemaMappingID',
        related_name='cachetablemetas', null=False, on_delete=models.CASCADE,
    )
    collection = models.ForeignKey(
        'specify.Collection', db_column='CollectionID',
        related_name='+', null=False, on_delete=models.CASCADE,
    )
    tablename = models.CharField(max_length=128, unique=True, db_column='TableName')
    lastbuilt = models.DateTimeField(blank=True, null=True, db_column='LastBuilt')
    rowcount = models.IntegerField(blank=True, null=True, db_column='RowCount')
    buildstatus = models.CharField(
        max_length=16, default='idle', db_column='BuildStatus',
        choices=[('idle', 'idle'), ('building', 'building'), ('error', 'error')],
    )
    builderror = models.TextField(blank=True, null=True, db_column='BuildError')
    timestampcreated = models.DateTimeField(default=timezone.now, db_column='TimestampCreated')
    timestampmodified = models.DateTimeField(default=timezone.now, db_column='TimestampModified')

    class Meta:
        db_table = 'cachetablemeta'
        indexes = [
            models.Index(fields=['schemamapping', 'collection'], name='CacheMetaMappingColIDX'),
        ]
