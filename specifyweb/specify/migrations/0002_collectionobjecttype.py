# Generated by Django 3.2.15 on 2024-06-14 20:42

from django.db import migrations, models
import django.utils.timezone
import specifyweb.specify.models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CollectionObjectType',
            fields=[
                ('id', models.AutoField(db_column='CollectionObjectTypeID', primary_key=True, serialize=False)),
                ('name', models.CharField(db_column='Name', max_length=255)),
                ('isloanable', models.BooleanField(blank=True, db_column='IsLoanable', null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('text1', models.TextField(blank=True, db_column='Text1', null=True)),
                ('text2', models.TextField(blank=True, db_column='Text2', null=True)),
                ('text3', models.TextField(blank=True, db_column='Text3', null=True)),
                ('collection', models.ForeignKey(db_column='CollectionID', on_delete=specifyweb.specify.models.protect_with_blockers, related_name='collectionobjecttypes', to='specify.collection')),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.agent')),
                ('taxontreedef', models.ForeignKey(db_column='TaxonTreeDefID', on_delete=specifyweb.specify.models.protect_with_blockers, related_name='collectionobjecttypes', to='specify.taxontreedef')),
            ],
            options={
                'db_table': 'collectionobjecttype',
                'ordering': (),
            },
        ),
    ]