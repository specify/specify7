
from django.apps import apps as specify_apps
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import specifyweb.specify.models
from specifyweb.specify.models import protect_with_blockers
from specifyweb.specify.migration_utils.update_schema_config import revert_table_field_schema_config, revert_table_schema_config, update_table_field_schema_config_with_defaults, update_table_schema_config_with_defaults

from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0037_TABLES as SCHEMA_CONFIG_TABLES, MIGRATION_0037_FIELDS as SCHEMA_CONFIG_TABLE_FIELDS, MIGRATION_0037_UPDATE_FIELDS as SCHEMA_CONFIG_COMPONENT_TABLE_FIELDS, MIGRATION_0037_HIDDEN_FIELDS as SCHEMA_CONFIG_HIDDEN_FIELDS

PICKLIST_NAME = 'CollectionObjectType'
FIELD_NAME = 'type'

def create_table_schema_config_with_defaults(apps, schema_editor):
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

def update_hidden_prop(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in SCHEMA_CONFIG_TABLE_FIELDS.items():
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
                    item.ishidden = True
                    item.save()

def create_cotype_splocalecontaineritem(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    # Create a Splocalecontaineritem record for each Component Splocalecontainer
    # NOTE: Each discipline has its own Component Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='component', schematype=0):
        container_item = Splocalecontaineritem.objects.get(
            name=FIELD_NAME,
            container=container,
        )
        container_item.picklistname = PICKLIST_NAME
        container_item.isrequired = True
        container_item.type = 'ManyToOne'
        container_item.save()

def hide_component_fields(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        for table, fields in SCHEMA_CONFIG_HIDDEN_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )
                    items.update(ishidden=True)

def revert_table_schema_config_with_defaults(apps, schema_editor):
    for table, _ in SCHEMA_CONFIG_TABLES:
        revert_table_schema_config(table, apps)
    for table, fields in SCHEMA_CONFIG_TABLE_FIELDS.items():
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

def reverse_update_hidden_prop(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in SCHEMA_CONFIG_TABLE_FIELDS.items():
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

def revert_cotype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    Splocalecontaineritem.objects.filter(name=FIELD_NAME, container__name='component', container__schematype=0).delete()

def reverse_hide_component_fields(apps, schema_editor):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        for table, fields in SCHEMA_CONFIG_HIDDEN_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )
                    items.update(ishidden=True)
class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0036_remove_spquery_selectseries'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        create_table_schema_config_with_defaults(apps, schema_editor)
        update_schema_config_field_desc(apps, schema_editor)
        update_hidden_prop(apps, schema_editor)
        create_cotype_splocalecontaineritem(apps)
        hide_component_fields(apps, schema_editor)

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        revert_table_schema_config_with_defaults(apps, schema_editor)
        revert_update_hidden_prop(apps, schema_editor)
        reverse_update_hidden_prop(apps, schema_editor)
        revert_cotype_splocalecontaineritem(apps)
        reverse_hide_component_fields(apps, schema_editor)

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