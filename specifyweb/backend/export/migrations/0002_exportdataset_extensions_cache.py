from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('export', '0001_schemamapping'),
        ('specify', '0047_spqueryfield_dwc_extensions'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExportDataSet',
            fields=[
                ('id', models.AutoField(db_column='ExportDataSetID', primary_key=True, serialize=False)),
                ('exportname', models.CharField(db_column='ExportName', max_length=256, unique=True)),
                ('filename', models.CharField(db_column='FileName', max_length=256, unique=True)),
                ('isrss', models.BooleanField(db_column='IsRSS', default=False)),
                ('frequency', models.IntegerField(blank=True, db_column='Frequency', null=True)),
                ('lastexported', models.DateTimeField(blank=True, db_column='LastExported', null=True)),
                ('timestampcreated', models.DateTimeField(
                    db_column='TimestampCreated', default=django.utils.timezone.now,
                )),
                ('timestampmodified', models.DateTimeField(
                    db_column='TimestampModified', default=django.utils.timezone.now,
                )),
                ('version', models.IntegerField(db_column='Version', default=0)),
                ('metadata', models.ForeignKey(
                    blank=True, db_column='MetadataID', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+', to='specify.spappresource',
                )),
                ('coremapping', models.ForeignKey(
                    db_column='CoreMappingID',
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='export_datasets', to='export.schemamapping',
                )),
                ('collection', models.ForeignKey(
                    db_column='CollectionID',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='+', to='specify.collection',
                )),
            ],
            options={
                'db_table': 'exportdataset',
            },
        ),
        migrations.CreateModel(
            name='ExportDataSetExtension',
            fields=[
                ('id', models.AutoField(db_column='ExportDataSetExtensionID', primary_key=True, serialize=False)),
                ('sortorder', models.IntegerField(db_column='SortOrder', default=0)),
                ('exportdataset', models.ForeignKey(
                    db_column='ExportDataSetID',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='extensions', to='export.exportdataset',
                )),
                ('schemamapping', models.ForeignKey(
                    db_column='SchemaMappingID',
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='dataset_extensions', to='export.schemamapping',
                )),
            ],
            options={
                'db_table': 'exportdatasetextension',
                'unique_together': {('exportdataset', 'schemamapping')},
            },
        ),
        migrations.CreateModel(
            name='CacheTableMeta',
            fields=[
                ('id', models.AutoField(db_column='CacheTableMetaID', primary_key=True, serialize=False)),
                ('tablename', models.CharField(db_column='TableName', max_length=128, unique=True)),
                ('lastbuilt', models.DateTimeField(blank=True, db_column='LastBuilt', null=True)),
                ('rowcount', models.IntegerField(blank=True, db_column='RowCount', null=True)),
                ('buildstatus', models.CharField(
                    choices=[('idle', 'idle'), ('building', 'building'), ('error', 'error')],
                    db_column='BuildStatus', default='idle', max_length=16,
                )),
                ('schemamapping', models.OneToOneField(
                    db_column='SchemaMappingID',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='cache_meta', to='export.schemamapping',
                )),
            ],
            options={
                'db_table': 'cachetablemeta',
            },
        ),
    ]
