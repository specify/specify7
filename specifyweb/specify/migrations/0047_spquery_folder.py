from django.apps import apps as specify_apps
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import specifyweb.specify.models
from specifyweb.specify.migration_utils.migration_helpers import helper_0047_spquery_folder as h
from specifyweb.specify.models import protect_with_blockers

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0046_alter_specifyuser_spprincipals'),
    ]

    def consolidated_ops(apps, schema_editor):
        h.create_table_schema_config_with_defaults(apps, schema_editor)
        h.update_schema_config_field_desc(apps, schema_editor)
        h.unhide_isfavorite_field(apps, schema_editor)
        h.hide_new_fields(apps, schema_editor)

    def revert_consolidated_ops(apps, schema_editor):
        h.revert_table_schema_config_with_defaults(apps, schema_editor)
        h.reverse_unhide_isfavorite_field(apps, schema_editor)
        h.reverse_hide_new_fields(apps, schema_editor)

    operations = [
        migrations.CreateModel(
            name='Spqueryfolder',
            fields=[
                ('id', models.AutoField(db_column='SpQueryFolderID', primary_key=True, serialize=False)),
                ('isarchived', models.BooleanField(blank=True, db_column='IsArchived', default=False, null=True)),
                ('name', models.CharField(db_column='Name', max_length=256)),
                ('ordinal', models.SmallIntegerField(blank=True, db_column='Ordinal', null=True)),
                ('remarks', models.TextField(blank=True, db_column='Remarks', null=True)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('parent', models.ForeignKey(db_column='ParentFolderID', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='specify.spqueryfolder')),
                ('specifyuser', models.ForeignKey(db_column='SpecifyUserID', on_delete=protect_with_blockers, related_name='spqueryfolders', to='specify.specifyuser')),
            ],
            options={
                'db_table': 'spqueryfolder',
                'ordering': (),
            },
        ),
        migrations.AddField(
            model_name='spquery',
            name='isarchived',
            field=models.BooleanField(blank=True, db_column='IsArchived', default=False, null=True),
        ),
        migrations.AddField(
            model_name='spquery',
            name='spqueryfolder',
            field=models.ForeignKey(db_column='SpQueryFolderID', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='spquerys', to='specify.spqueryfolder'),
        ),
        migrations.RunPython(consolidated_ops, revert_consolidated_ops, atomic=True),
    ]
