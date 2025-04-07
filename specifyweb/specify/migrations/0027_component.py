from django.apps import apps as specify_apps
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
from specifyweb.specify.models import protect_with_blockers
from specifyweb.specify.migration_utils.update_schema_config import revert_table_field_schema_config, revert_table_schema_config, update_table_field_schema_config_with_defaults, update_table_schema_config_with_defaults

from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0027_TABLES as SCHEMA_CONFIG_TABLES, MIGRATION_0027_FIELDS as SCHEMA_CONFIG_TABLE_FIELDS, MIGRATION_0027_UPDATE_FIELDS as SCHEMA_CONFIG_COMPONENT_TABLE_FIELDS

def create_table_schema_config_with_defaults(apps):
    Discipline = specify_apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, desc in SCHEMA_CONFIG_TABLES:
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)

        for table, fields in SCHEMA_CONFIG_TABLE_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def update_schema_config_field_desc(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in SCHEMA_CONFIG_COMPONENT_TABLE_FIELDS.items():
        #i.e: Collection Object
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )

        for container in containers:
            for field_name, new_name, new_desc in fields:
                #i.e: COType
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )

                for item in items:
                    localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                    localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                    if localized_items_desc is None or localized_items_name is None:
                        continue

                    localized_items_desc.text = new_desc
                    localized_items_desc.save() 

                    localized_items_name.text = new_name
                    localized_items_name.save() 

def revert_table_schema_config_with_defaults(apps):
    for table, _ in SCHEMA_CONFIG_TABLES:
        revert_table_schema_config(table, apps)
    for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)

def revert_update_hidden_prop(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in SCHEMA_CONFIG_COMPONENT_TABLE_FIELDS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )
        for container in containers:
            for field_name in fields:
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )

                for item in items:
                    item.ishidden = False
                    item.save()

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0026_taxontreedef_alter_delete'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        pass
        create_table_schema_config_with_defaults(apps)
        update_schema_config_field_desc(apps)

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        pass
        revert_table_schema_config_with_defaults(apps)
        revert_update_hidden_prop(apps)

    operation = [
        migrations.CreateModel(
            name='Component',
            fields=[
                ('id', models.AutoField(db_column='componentid', primary_key=True, serialize=False)),
                ('verbatimname', models.TextField(blank=True, db_column='VerbatimName', null=True)),
                ('role', models.CharField(db_column='Role', max_length=50)),
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
                ('createdbyagent', models.ForeignKey(db_column='CreatedByAgentID', null=True, on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(db_column='ModifiedByAgentID', null=True, on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.agent')),
                ('name', models.ForeignKey(db_column='TaxonID', null=True, on_delete=specifyweb.specify.models.protect_with_blockers, related_name='components', to='specify.taxon')),
                ('parentcomponent', models.ForeignKey(db_column='ParentComponentID', null=True, on_delete=specifyweb.specify.models.protect_with_blockers, related_name='children', to='specify.component')),
                ('type', models.ForeignKey(db_column='CollectionObjectTypeID', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='components', to='specify.collectionobjecttype')),
            ],
        ),
        migrations.AddField(
            model_name='absoluteage',
            name='component',
            field=models.ForeignKey(db_column='ComponentID', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='absoluteages', to='specify.component'),
        ),
        migrations.AddField(
            model_name='collectionobject',
            name='component',
            field=models.ForeignKey(db_column='ComponentID', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='components', to='specify.component'),
        ),
        migrations.AddField(
            model_name='relativeage',
            name='component',
            field=models.ForeignKey(db_column='ComponentID', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='relativeages', to='specify.component'),
        ),
     migrations.RunPython(consolidated_python_django_migration_operations, revert_cosolidated_python_django_migration_operations, atomic=True),
    ]