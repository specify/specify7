from django.db import migrations, models
import django.db.models.deletion
import specifyweb.specify.models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0047_spqueryfield_dwc_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='schemamapping',
            name='vocabulary',
            field=models.CharField(blank=True, db_column='Vocabulary', max_length=32, null=True),
        ),
        migrations.CreateModel(
            name='Exportdatasetextension',
            fields=[
                ('id', models.AutoField(db_column='ExportDataSetExtensionID', primary_key=True, serialize=False)),
                ('sortorder', models.IntegerField(db_column='SortOrder', default=0)),
                ('exportdataset', models.ForeignKey(db_column='ExportDataSetID', on_delete=django.db.models.deletion.CASCADE, related_name='extensions', to='specify.exportdataset')),
                ('schemamapping', models.ForeignKey(db_column='SchemaMappingID', on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.schemamapping')),
            ],
            options={
                'db_table': 'exportdatasetextension',
                'ordering': ('sortorder',),
                'indexes': [models.Index(fields=['exportdataset'], name='ExtensionDatasetIDX')],
                'unique_together': {('exportdataset', 'schemamapping')},
            },
        ),
    ]
