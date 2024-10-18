"""
This migration updates the Schema Config entries for pre-geo tables and creates picklists for COGTypes.

Fields added:
Collection -> collectionObjectType
GeographyTreeDef -> discipline
GeologicTimePeriodTreeDef -> discipline
LithostratTreeDef -> discipline
StorageTreeDef -> institution
TaxonTreeDef -> discipline

Creates a picklist for COGType -> type and updates an existing incorrect picklist for COG -> COGType
"""
from django.db import migrations

FIELD_DATA = [
    {
        "table": "Collection",
        "field": "collectionObjectType",
        "isrequired": False,
    },
    {
        "table": "GeographyTreeDef",
        "field": "discipline",
        "isrequired": False,
    },
    {
        "table": "GeologicTimePeriodTreeDef",
        "field": "discipline",
        "isrequired": False,
    },
    {
        "table": "LithostratTreeDef",
        "field": "discipline",
        "isrequired": True,
    },
    {
        "table": "StorageTreeDef",
        "field": "institution",
        "isrequired": True,
    },
    {
        "table": "TaxonTreeDef",
        "field": "discipline",
        "isrequired": True,
    },
]

PICKLIST_NAME = 'COGTypes'
COGTYPE_FIELD_NAME = 'cogType'
SYSTEM_COGTYPE_PICKLIST_NAME = "SystemCOGTypes"

def add_fields(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for data in FIELD_DATA:
        for container in Splocalecontainer.objects.filter(name=data['table'], schematype=0):
            container_item, _ = Splocalecontaineritem.objects.get_or_create(
                name=data["field"],
                type='ManyToOne',
                container=container,
                isrequired=data["isrequired"]
            )
            Splocaleitemstr.objects.get_or_create(
                language='en',
                text=data["field"],
                itemname=container_item
            )
            Splocaleitemstr.objects.get_or_create(
                language='en',
                text=data["field"],
                itemdesc=container_item
            )

def remove_fields(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for data in FIELD_DATA:
        Splocaleitemstr.objects.filter(
            itemname__name=data["field"],
            itemname__container__name=data["table"], 
            itemname__container__schematype=0
        ).delete()
        Splocaleitemstr.objects.filter(
            itemdesc__name=data["field"],
            itemdesc__container__name=data["table"], 
            itemdesc__container__schematype=0
        ).delete()
        Splocalecontaineritem.objects.filter(
            name=data["field"],
            container__name=data["table"],
            container__schematype=0,
        ).delete()
        
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
            formatter=PICKLIST_NAME
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
        # add_fields(apps)
        create_cogtype_picklist(apps)
        update_cogtype_splocalecontaineritem(apps)
        update_systemcogtypes_picklist(apps)
        update_cogtype_type_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        # remove_fields(apps)
        revert_cogtype_picklist(apps)
        revert_cogtype_splocalecontaineritem(apps)
        revert_systemcogtypes_picklist(apps)
        revert_cogtype_type_splocalecontaineritem(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]