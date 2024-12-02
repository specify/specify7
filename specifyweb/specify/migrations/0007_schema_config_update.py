"""
This migration updates the data model for COG and Schema Config entries for pre-geo tables and creates picklists for COGTypes.

Data model changes:
Removed COG -> cojo
Added COG -> children

Schema Config changes:
Added StorageTreeDef -> institution
Added COG -> children
Removed CollectionObject -> collectionObjectType (duplicate)
Removed COG -> cojo

Creates a picklist for COGType -> type and updates an existing incorrect picklist for COG -> COGType
"""
from django.db import migrations, models
import django.db.models.deletion
from specifyweb.specify.update_schema_config import revert_table_field_schema_config, update_table_field_schema_config_with_defaults

PICKLIST_NAME = 'COGTypes'
COGTYPE_FIELD_NAME = 'cogType'
SYSTEM_COGTYPE_PICKLIST_NAME = "SystemCOGTypes"

def update_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    # Revert COG -> children before adding to avoid duplicates
    revert_table_field_schema_config('CollectionObjectGroup', 'children', apps)
    # Add StorageTreeDef -> institution and COG -> children
    for discipline in Discipline.objects.all():
        update_table_field_schema_config_with_defaults('StorageTreeDef', discipline.id, 'institution', apps)
        update_table_field_schema_config_with_defaults('CollectionObjectGroup', discipline.id, 'children', apps)

    # Remove COG -> cojo
    revert_table_field_schema_config('CollectionObjectGroup', 'cojo', apps)

    # Remove duplicate CollectionObject -> collectionObjectType
    container_items = Splocalecontaineritem.objects.filter(name='collectionObjectType', picklistname=None, container__name='CollectionObject')
    for container_item in container_items:
        Splocaleitemstr.objects.filter(itemname=container_item).delete()
        Splocaleitemstr.objects.filter(itemdesc=container_item).delete()
    container_items.delete()

# NOTE: The reverse function will not re-add the duplicate CO -> coType or COG -> cojo as its unnecessary
def revert_update_fields(apps):
    # Remove StorageTreeDef -> institution and COG -> children
    revert_table_field_schema_config('StorageTreeDef', 'institution', apps)
    revert_table_field_schema_config('CollectionObjectGroup', 'children', apps)
        
def create_cogtype_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    
    # Create a cogtype picklist for each collection
    for collection in Collection.objects.all():
        Picklist.objects.get_or_create(
            name=PICKLIST_NAME,
            issystem=True,
            readonly=True,
            sizelimit=-1,
            sorttype=1,
            type=1,
            tablename='collectionobjectgrouptype',
            collection=collection,
            formatter='CollectionObjectGroupType'
        )

def revert_cogtype_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name=PICKLIST_NAME).delete()

# Updates COG -> cogtype to use the type 1 picklist created above
def update_cogtype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    Splocalecontaineritem.objects.filter(container__name='collectionobjectgroup', container__schematype=0, name=COGTYPE_FIELD_NAME).update(
        picklistname=PICKLIST_NAME,
        type='ManyToOne',
        isrequired=True
    )

def revert_cogtype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    Splocalecontaineritem.objects.filter(container__name='collectionobjectgroup', container__schematype=0, name=COGTYPE_FIELD_NAME).update(
        picklistname=None,
        type=None,
        isrequired=None
    )

def update_systemcogtypes_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name='Default Collection Object Group Types').update(
        name=SYSTEM_COGTYPE_PICKLIST_NAME,
        type=0,
        issystem=True,
        readonly=True,
        sizelimit=3,
        tablename=None
    )

def revert_systemcogtypes_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    # revert only changes the name and not the other attributes as those were incorrect
    Picklist.objects.filter(name=SYSTEM_COGTYPE_PICKLIST_NAME).update(
        name='Default Collection Object Group Types',
    )

# Updates cogtype -> type to use the Default COGType picklist (Drill Core, Discrete, Consolidated)
def update_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    Splocalecontaineritem.objects.filter(container__name='collectionobjectgrouptype', container__schematype=0, name='type').update(
        picklistname=SYSTEM_COGTYPE_PICKLIST_NAME,
        isrequired=True
    )

def revert_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    Splocalecontaineritem.objects.filter(container__name='collectionobjectgrouptype', container__schematype=0, name='type').update(
        picklistname=None,
        isrequired=None
    )

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0006_fix_tectonic_tree_fields'),
    ]

    def apply_migration(apps, schema_editor):
        update_fields(apps)
        create_cogtype_picklist(apps)
        update_cogtype_splocalecontaineritem(apps)
        update_systemcogtypes_picklist(apps)
        update_cogtype_type_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        revert_update_fields(apps)
        revert_cogtype_picklist(apps)
        revert_cogtype_splocalecontaineritem(apps)
        revert_systemcogtypes_picklist(apps)
        revert_cogtype_type_splocalecontaineritem(apps)

    operations = [
        migrations.AlterField(
            model_name='collectionobjectgroupjoin',
            name='parentcog',
            field=models.ForeignKey(db_column='ParentCOGID', on_delete=django.db.models.deletion.CASCADE, related_name='children', to='specify.collectionobjectgroup'),
        ),
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]