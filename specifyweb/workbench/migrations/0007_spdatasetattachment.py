# Generated by Django 3.2.15 on 2025-02-25 16:43
'''
    This migration creates the spdatasetattachment table and adds it to the schema config.
'''

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import specifyweb.specify.models
from specifyweb.specify.migration_utils.update_schema_config import update_table_field_schema_config_with_defaults, update_table_schema_config_with_defaults, revert_table_field_schema_config, revert_table_schema_config 

MIGRATION_0007_TABLES = [
    ('SpDataSetAttachment', 'An attachment temporarily associated with a Specify Data Set for use in a WorkBench upload.')
]

MIGRATION_0007_FIELDS = {
    'Spdataset': ['spDataSetAttachments']
}

def apply_migration(apps, schema_editor):
    # Update Schema config
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all(): # New SpDataSetAttachment table
        for table, desc in MIGRATION_0007_TABLES:
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)
    for discipline in Discipline.objects.all(): # New relationship Spdataset -> SpDataSetAttachment
        for table, fields in MIGRATION_0007_FIELDS.items():
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def revert_migration(apps, schema_editor):
    # Revert Schema config changes
    for table, _ in MIGRATION_0007_TABLES: # Remove SpDataSetAttachment table
        revert_table_schema_config(table, apps)
    for table, fields in MIGRATION_0007_FIELDS.items(): # Remove relationship Spdataset -> SpDataSetAttachment
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0023_update_schema_config_text'),
        ('workbench', '0006_batch_edit'),
    ]

    operations = [
        migrations.CreateModel(
            name='SpDataSetAttachment',
            fields=[
                ('id', models.AutoField(db_column='SpDataSetAttachmentID', primary_key=True, serialize=False)),
                ('collectionmemberid', models.IntegerField(db_column='CollectionMemberID')),
                ('ordinal', models.IntegerField(db_column='Ordinal')),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('attachment', models.ForeignKey(db_column='AttachmentID', on_delete=specifyweb.specify.models.protect_with_blockers, related_name='spdatasetattachments', to='specify.attachment')),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.agent')),
                ('spdataset', models.ForeignKey(db_column='SpDataSetID', on_delete=django.db.models.deletion.CASCADE, related_name='spdatasetattachments', to='workbench.spdataset')),
            ],
            options={
                'db_table': 'spdatasetattachment',
                'ordering': (),
            },
        ),
        migrations.AddIndex(
            model_name='spdatasetattachment',
            index=models.Index(fields=['collectionmemberid'], name='SpDataSetAttColMemIDX'),
        ),
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]
