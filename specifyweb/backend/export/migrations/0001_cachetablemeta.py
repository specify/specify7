from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('specify', '0048_extensions_and_vocabulary'),
    ]

    operations = [
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
                ('builderror', models.TextField(blank=True, db_column='BuildError', null=True)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(db_column='TimestampModified', default=django.utils.timezone.now)),
                ('collection', models.ForeignKey(
                    db_column='CollectionID',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='+', to='specify.collection',
                )),
                ('schemamapping', models.ForeignKey(
                    db_column='SchemaMappingID',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='cachetablemetas', to='specify.schemamapping',
                )),
            ],
            options={
                'db_table': 'cachetablemeta',
                'indexes': [models.Index(fields=['schemamapping', 'collection'], name='CacheMetaMappingColIDX')],
            },
        ),
    ]
