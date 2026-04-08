from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('specify', '0047_spqueryfield_dwc_extensions'),
    ]

    operations = [
        migrations.CreateModel(
            name='SchemaMapping',
            fields=[
                ('id', models.AutoField(db_column='SchemaMappingID', primary_key=True, serialize=False)),
                ('mappingtype', models.CharField(
                    choices=[('Core', 'Core'), ('Extension', 'Extension')],
                    db_column='MappingType', max_length=16,
                )),
                ('name', models.CharField(db_column='Name', max_length=256)),
                ('isdefault', models.BooleanField(db_column='IsDefault', default=False)),
                ('timestampcreated', models.DateTimeField(
                    db_column='TimestampCreated', default=django.utils.timezone.now,
                )),
                ('timestampmodified', models.DateTimeField(
                    db_column='TimestampModified', default=django.utils.timezone.now,
                )),
                ('version', models.IntegerField(db_column='Version', default=0)),
                ('query', models.OneToOneField(
                    db_column='SpQueryID',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='schemamapping',
                    to='specify.spquery',
                )),
                ('createdbyagent', models.ForeignKey(
                    db_column='CreatedByAgentID',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to='specify.agent',
                )),
                ('modifiedbyagent', models.ForeignKey(
                    db_column='ModifiedByAgentID',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to='specify.agent',
                )),
            ],
            options={
                'db_table': 'schemamapping',
            },
        ),
    ]
