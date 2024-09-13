from django.db import migrations, models
import django.utils.timezone

from specifyweb.specify.models import protect_with_blockers

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('specify', '0004_schem_config_update'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        # Placeholder 
        pass

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        # Placeholder
        pass

    operations = [
        migrations.CreateModel(
            name='Tectonictreedef', 
            fields=[
                ('id', models.AutoField(db_column='TectonicTreeDefID ', primary_key=True, serialize=False)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('fullNameDirection', models.IntegerField(blank=True, db_column='FullNameDirection', null=True)),
                ('name', models.CharField(blank=True, db_column='Name', max_length=255, null=True)),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('discipline', models.ForeignKey(db_column='DisciplineID', on_delete=protect_with_blockers, related_name='TectonicTreeDef', to='specify.discipline'))
            ],
            options={
                'db_table': 'tectonictreedef',
                'ordering': (),
            },
        ),
        migrations.AddField(
            model_name='discipline',
            name='tectonictreedef',
            field=models.ForeignKey(db_column='TectonicTreeDefID', default=None, null=True, on_delete=protect_with_blockers, related_name='disciplines', to='specify.tectonictreedef'),
            preserve_default=False,
        ),
        migrations.CreateModel(
            name='Tectonictreedefitem', 
            fields=[
                ('id', models.AutoField(db_column='TectonicTreeDefItemID ', primary_key=True, serialize=False)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('fullnameseparator', models.CharField(blank=True, db_column='FullNameSeparator', max_length=255, null=True)),
                ('isenforced', models.BooleanField(blank=True, db_column='IsEnforced', null=True)),
                ('isinfullname', models.BooleanField(blank=True, db_column='IsInFullName', null=True)),
                ('name', models.CharField(blank=True, db_column='Name', max_length=255)),
                ('rank', models.IntegerField(blank=True, db_column='RankID')),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('textafter', models.CharField(blank=True, db_column='TextAfter', max_length=255)),
                ('textbefore', models.CharField(blank=True, db_column='TextBefore', max_length=255)),
                ('title', models.CharField(blank=True, db_column='Title', max_length=255)),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('tectonictreedef', models.ForeignKey(db_column='TectonicTreeDefID', on_delete=protect_with_blockers, related_name='TectonicTreeDefItem', to='specify.tectonictreedef')), 
                ('parentitem', models.ForeignKey(db_column='ParentItemID', null=True, on_delete=models.CASCADE, related_name='children', to='specify.tectonictreedefitem')),
            ],
            options={
                'db_table': 'tectonictreedefitem',
                'ordering': (),
            },
        ),
        migrations.CreateModel(
            name='Tectonicunit', 
            fields=[
                ('id', models.AutoField(db_column='TectonicID ', primary_key=True, serialize=False)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('fullname', models.CharField(blank=True, db_column='FullName', max_length=255, null=True)),
                ('guid', models.CharField(blank=True, db_column='GUID', max_length=255, null=True)),
                ('highestchildnodenumber', models.IntegerField(blank=True, db_column='HighestChildNodeNumber', null=True)),
                ('isaccepted', models.BooleanField(blank=True, db_column='IsAccepted', null=True)),
                ('name', models.CharField(blank=True, db_column='Name', max_length=255)),
                ('nodenumber', models.CharField(blank=True, db_column='NodeNumber', max_length=255, null=True)),
                ('integer1', models.IntegerField(blank=True, db_column='Integer1', null=True)),
                ('integer2', models.IntegerField(blank=True, db_column='Integer2', null=True)),
                ('rank', models.IntegerField(blank=True, db_column='RankID')),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('text1', models.CharField(blank=True, db_column='Text1', max_length=255)),
                ('text2', models.CharField(blank=True, db_column='Text2', max_length=255)),
                ('yesno1', models.BooleanField(blank=True, db_column='YesNo1', null=True)),
                ('yesno2', models.BooleanField(blank=True, db_column='YesNo2', null=True)),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('tectonictreedefitem', models.ForeignKey(db_column='TectonicTreeDefItemID', on_delete=protect_with_blockers, related_name='tectonicunit', to='specify.tectonictreedefitem')), 
                ('parent', models.ForeignKey(db_column='ParentID', null=True, on_delete=models.CASCADE, related_name='children', to='specify.tectonicunit')),
                ('tectonictreedef', models.ForeignKey(db_column='TectonicTreeDefID', on_delete=protect_with_blockers, related_name='tectonicunit', to='specify.tectonictreedef')), 
                ('accepted', models.ForeignKey(db_column='AcceptedID', null=True, on_delete=models.CASCADE, related_name='children', to='specify.tectonicunit')),
            ],
            options={
                'db_table': 'tectonicunit',
                'ordering': (),
            },
        ),
        migrations.AddField(
            model_name='paleocontext',
            name='tectonicunit',
            field=models.ForeignKey(db_column='TectonicUnitID', default=None, null=True, on_delete=protect_with_blockers, related_name='paleocontexts', to='specify.tectonicunit'),
            preserve_default=False,
        ),
        migrations.CreateModel(
            name='Absoluteage', 
            fields=[
                ('id', models.AutoField(db_column='AbsoluteAgeID ', primary_key=True, serialize=False)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('text1', models.CharField(blank=True, db_column='Text1', max_length=255)),
                ('text2', models.CharField(blank=True, db_column='Text2', max_length=255)),
                ('yesno1', models.BooleanField(blank=True, db_column='YesNo1', null=True)),
                ('yesno2', models.BooleanField(blank=True, db_column='YesNo2', null=True)),
                ('integer1', models.IntegerField(blank=True, db_column='Integer1', null=True)),
                ('integer2', models.IntegerField(blank=True, db_column='Integer2', null=True)),
                ('date1', models.DateField(blank=True, db_column='Date1', null=True)),
                ('date2', models.DateField(blank=True, db_column='Date2', null=True)),
                ('datingmethod', models.CharField(blank=True, db_column='DatingMethod', max_length=255, null=True)),
                ('datingmethodremarks', models.TextField(blank=True, db_column='DatingMethodRemarks', null=True)),
                ('absoluteage', models.DecimalField(blank=True, db_column='AbsoluteAge', decimal_places=10, max_digits=22, null=True)),
                ('ageuncertainty', models.DecimalField(blank=True, db_column='ageUncertainty', decimal_places=10, max_digits=22, null=True)),
                ('agetype', models.CharField(blank=True, db_column='AgeType', max_length=255, null=False)),
                ('collectiondate', models.DateField(blank=True, db_column='CollectionDate', null=True)),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('agent1', models.ForeignKey(db_column='Agent1', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('collectionobject', models.ForeignKey(db_column='CollectionObjectID', on_delete=protect_with_blockers, related_name='AbsoluteAge', to='specify.collectionobject'))
            ],
            options={
                'db_table': 'absoluteage',
                'ordering': (),
            },
        ),
        migrations.CreateModel(
            name='Relativeage', 
            fields=[
                ('id', models.AutoField(db_column='RelativeAgeID ', primary_key=True, serialize=False)),
                ('agent1', models.ForeignKey(db_column='Agent1', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('agent2', models.ForeignKey(db_column='Agent2', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('agetype', models.CharField(blank=True, db_column='AgeType', max_length=255, null=False)),
                ('verbatimperiod', models.TextField(blank=True, db_column='VerbatimPeriod', null=True)),
                ('verbatimname', models.TextField(blank=True, db_column='VerbatimName', null=True)),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('relativeageperiod', models.DecimalField(blank=True, db_column='RelativeAgePeriod', decimal_places=10, max_digits=22, null=True)),
                ('ageuncertainty', models.DecimalField(blank=True, db_column='ageUncertainty', decimal_places=10, max_digits=22, null=True)),
                ('datingmethod', models.CharField(blank=True, db_column='DatingMethod', max_length=255, null=True)),
                ('datingmethodremarks', models.TextField(blank=True, db_column='DatingMethodRemarks', null=True)),
                ('collectiondate', models.DateField(blank=True, db_column='CollectionDate', null=True)),
                ('date1', models.DateField(blank=True, db_column='Date1', null=True)),
                ('date2', models.DateField(blank=True, db_column='Date2', null=True)),
                ('yesno1', models.BooleanField(blank=True, db_column='YesNo1', null=True)),
                ('yesno2', models.BooleanField(blank=True, db_column='YesNo2', null=True)),
                ('text1', models.CharField(blank=True, db_column='Text1', max_length=255)),
                ('text2', models.CharField(blank=True, db_column='Text2', max_length=255)),
                ('integer1', models.IntegerField(blank=True, db_column='Integer1', null=True)),
                ('integer2', models.IntegerField(blank=True, db_column='Integer2', null=True)),
                ('collectionobject', models.ForeignKey(db_column='CollectionObjectID', on_delete=protect_with_blockers, related_name='AbsoluteAge', to='specify.collectionobject')), 
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('agename', models.ForeignKey(db_column='AgeNameID', on_delete=protect_with_blockers, related_name='RelativeAge', to='specify.geologictimeperiod'))
            ],
            options={
                'db_table': 'relativeage',
                'ordering': (),
            },
        ),
        migrations.CreateModel(
            name='Relativeageattachment', 
            fields=[
                ('id', models.AutoField(db_column='RelativeAgeAttachmentID ', primary_key=True, serialize=False)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('ordinal', models.IntegerField(blank=True, db_column='Integer1', default=0)),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('collection', models.ForeignKey(db_column='CollectionMemberID', on_delete=protect_with_blockers, related_name='RelativeAgeAttachment', to='specify.collection')),
                ('attachment', models.ForeignKey(db_column='AttachmentID', on_delete=protect_with_blockers, related_name='RelativeAgeAttachment', to='specify.attachment')),
                ('relativeage', models.ForeignKey(db_column='RelativeAgeID', on_delete=protect_with_blockers, related_name='RelativeAgeAttachment', to='specify.relativeage'))
            ],
            options={
                'db_table': 'relativeageattachment',
                'ordering': (),
            },
        ),
        migrations.CreateModel(
            name='Absoluteageattachment', 
            fields=[
                ('id', models.AutoField(db_column='AbsoluteAgeAttachmentID ', primary_key=True, serialize=False)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('ordinal', models.IntegerField(blank=True, db_column='Integer1', default=0)),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('collection', models.ForeignKey(db_column='CollectionMemberID', on_delete=protect_with_blockers, related_name='AbsoluteAgeAttachment', to='specify.collection')),
                ('attachment', models.ForeignKey(db_column='AttachmentID', on_delete=protect_with_blockers, related_name='AbsoluteAgeAttachment', to='specify.attachment')),
                ('absoluteage', models.ForeignKey(db_column='AbsoluteAgeID', on_delete=protect_with_blockers, related_name='AbsoluteAgeAttachment', to='specify.absoluteage'))
            ],
            options={
                'db_table': 'absoluteageattachment',
                'ordering': (),
            },
        ),
        migrations.CreateModel(
            name='Relativeagecitation', 
            fields=[
                ('id', models.AutoField(db_column='RelativeAgeCitationID ', primary_key=True, serialize=False)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('isfigured', models.BooleanField(blank=True, db_column='IsFigured', null=True)),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('figurenumber', models.CharField(blank=True, db_column='FigureNumber', default=0, max_length=255)),
                ('pagenumber', models.CharField(blank=True, db_column='PageNumber', default=0, max_length=255)),
                ('platenumber', models.CharField(blank=True, db_column='PlateNumber', default=0, max_length=255)),
                ('relativeage', models.ForeignKey(db_column='RelativeAgeID', on_delete=protect_with_blockers, related_name='RelativeAgeCitation', to='specify.relativeage')),
                ('referencework', models.ForeignKey(db_column='ReferenceWorkID', on_delete=protect_with_blockers, related_name='RelativeAgeCitation', to='specify.referencework')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
            ],
            options={
                'db_table': 'relativeagecitation',
                'ordering': (),
            },
        ),
        migrations.CreateModel(
            name='Absoluteagecitation', 
            fields=[
                ('id', models.AutoField(db_column='AbsoluteAgeCitationID ', primary_key=True, serialize=False)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('isfigured', models.BooleanField(blank=True, db_column='IsFigured', null=True)),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('figurenumber', models.CharField(blank=True, db_column='FigureNumber', default=0, max_length=255)),
                ('pagenumber', models.CharField(blank=True, db_column='PageNumber', default=0, max_length=255)),
                ('platenumber', models.CharField(blank=True, db_column='PlateNumber', default=0, max_length=255)),
                ('absoluteage', models.ForeignKey(db_column='AbsoluteAgeID', on_delete=protect_with_blockers, related_name='AbsoluteAgeCitation', to='specify.absoluteage')),
                ('referencework', models.ForeignKey(db_column='ReferenceWorkID', on_delete=protect_with_blockers, related_name='AbsoluteAgeCitation', to='specify.referencework')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
            ],
            options={
                'db_table': 'absoluteagecitation',
                'ordering': (),
            },
        ),
        migrations.RunPython(consolidated_python_django_migration_operations, revert_cosolidated_python_django_migration_operations, atomic=True),
    ]