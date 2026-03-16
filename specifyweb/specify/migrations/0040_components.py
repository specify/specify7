
from django.apps import apps as specify_apps
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import specifyweb.specify.models
from specifyweb.specify.migration_utils import update_schema_config as usc
from specifyweb.specify.models import protect_with_blockers

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0039_agent_fields_for_loan_and_gift'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        usc.remove_0029_schema_config_fields(apps, schema_editor)
        usc.create_table_schema_config_with_defaults(apps, schema_editor)
        usc.update_schema_config_field_desc_for_components(apps, schema_editor)
        usc.update_hidden_prop_for_compoenents(apps, schema_editor)
        usc.create_cotype_splocalecontaineritem_for_components(apps)
        usc.hide_component_fields(apps, schema_editor)

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        usc.restore_0029_schema_config_fields(apps, schema_editor)
        usc.revert_table_schema_config_with_defaults(apps, schema_editor)
        usc.reverse_hide_component_fields(apps, schema_editor)

    operations = [
        migrations.CreateModel(
            name='Component',
            fields=[
                ('id', models.AutoField(db_column='ComponentID', primary_key=True, serialize=False)),
                ('catalognumber', models.CharField(blank=True, db_column='CatalogNumber', max_length=32, null=True)),
                ('verbatimname', models.TextField(blank=True, db_column='VerbatimName', null=True)),
                ('role', models.CharField(db_column='Role', max_length=50, null=True)),
                ('proportion', models.IntegerField(blank=True, db_column='Proportion', null=True)),
                ('uniqueidentifier', models.CharField(blank=True, db_column='UniqueIdentifier', max_length=128, null=True)),
                ('text1', models.TextField(blank=True, db_column='Text1', null=True)),
                ('text2', models.TextField(blank=True, db_column='Text2', null=True)),
                ('text3', models.TextField(blank=True, db_column='Text3', null=True)),
                ('text4', models.TextField(blank=True, db_column='Text4', null=True)),
                ('text5', models.TextField(blank=True, db_column='Text5', null=True)),
                ('text6', models.TextField(blank=True, db_column='Text6', null=True)),
                ('yesno1', models.BooleanField(blank=True, db_column='YesNo1', null=True)),
                ('yesno2', models.BooleanField(blank=True, db_column='YesNo2', null=True)),
                ('yesno3', models.BooleanField(blank=True, db_column='YesNo3', null=True)),
                ('yesno4', models.BooleanField(blank=True, db_column='YesNo4', null=True)),
                ('yesno5', models.BooleanField(blank=True, db_column='YesNo5', null=True)),
                ('yesno6', models.BooleanField(blank=True, db_column='YesNo6', null=True)),
                ('integer1', models.IntegerField(blank=True, db_column='Integer1', null=True)),
                ('integer2', models.IntegerField(blank=True, db_column='Integer2', null=True)),
                ('integer3', models.IntegerField(blank=True, db_column='Integer3', null=True)),
                ('integer4', models.IntegerField(blank=True, db_column='Integer4', null=True)),
                ('integer5', models.IntegerField(blank=True, db_column='Integer5', null=True)),
                ('integer6', models.IntegerField(blank=True, db_column='Integer6', null=True)),
                ('number1', models.DecimalField(blank=True, db_column='Number1', decimal_places=10, max_digits=22, null=True)),
                ('number2', models.DecimalField(blank=True, db_column='Number2', decimal_places=10, max_digits=22, null=True)),
                ('number3', models.DecimalField(blank=True, db_column='Number3', decimal_places=10, max_digits=22, null=True)),
                ('number4', models.DecimalField(blank=True, db_column='Number4', decimal_places=10, max_digits=22, null=True)),
                ('number5', models.DecimalField(blank=True, db_column='Number5', decimal_places=10, max_digits=22, null=True)),
                ('number6', models.DecimalField(blank=True, db_column='Number6', decimal_places=10, max_digits=22, null=True)),
                ('timestampcreated', models.DateTimeField(db_column='TimestampCreated', default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(blank=True, db_column='TimestampModified', default=django.utils.timezone.now, null=True)),
                ('version', models.IntegerField(blank=True, db_column='Version', default=0, null=True)),
                ('collectionobject', models.ForeignKey(db_column='CollectionObjectID', on_delete=django.db.models.deletion.CASCADE, related_name='components', to='specify.collectionobject')),
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=protect_with_blockers, related_name='+', to='specify.agent')),
                ('name', models.ForeignKey(db_column='TaxonID', null=True, on_delete=protect_with_blockers, related_name='components', to='specify.taxon')),
                ('type', models.ForeignKey(db_column='CollectionObjectTypeID', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='components', to='specify.collectionobjecttype')),
                ('identifiedby', models.ForeignKey(db_column='AgentID', null=True, on_delete=protect_with_blockers, related_name='components', to='specify.agent')),
                ('identifieddate', models.DateTimeField(blank=True, db_column='IdentifiedDate', default=django.utils.timezone.now, null=True)),
            ],
            options={
                'db_table': 'component',
                'ordering': (),
            },
        ),
        migrations.RemoveField(
            model_name='collectionobject',
            name='componentParent',
        ),
        migrations.AddField(
            model_name='absoluteage',
            name='component',
            field=models.ForeignKey(db_column='ComponentID', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='absoluteages', to='specify.component'),
        ),
        migrations.AddField(
            model_name='relativeage',
            name='component',
            field=models.ForeignKey(db_column='ComponentID', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='relativeages', to='specify.component'),
        ),
        migrations.RunPython(consolidated_python_django_migration_operations, revert_cosolidated_python_django_migration_operations, atomic=True),
    ]