"""
This migration updates the Schema Config entries for pre-geo tables. 
Geo migration added new fields to already existing tables. This migration updates the Schema Config to reflect those changes.

Fields added:
Collection -> collectionObjectType
GeographyTreeDef -> discipline
GeologicTimePeriodTreeDef -> discipline
LithostratTreeDef -> discipline
StorageTreeDef -> institution
TaxonTreeDef -> discipline
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
        "isrequired": True,
    },
    {
        "table": "GeologicTimePeriodTreeDef",
        "field": "discipline",
        "isrequired": True,
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
            text=data["field"].title(),
            itemname__name=data["field"],
            itemname__container__name=data["table"], 
            itemname__container__schematype=0
        ).delete()
        Splocaleitemstr.objects.filter(
            text=data["field"],
            itemdesc__name=data["field"],
            itemdesc__container__name=data["table"], 
            itemdesc__container__schematype=0
        ).delete()
        Splocalecontaineritem.objects.filter(
            name=data["field"],
            container__name=data["table"],
            container__schematype=0,
        ).delete()
        

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0004_cogtype_picklist'),
    ]

    def apply_migration(apps, schema_editor):
        add_fields(apps)

    def revert_migration(apps, schema_editor):
        remove_fields(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]