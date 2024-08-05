from django.db import migrations
from specifyweb.specify.models import (
    Collection,
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
    Picklist
)

PICKLIST_NAME = 'CollectionObjectType'
FIELD_NAME = 'collectionObjectType'

def create_cotype_picklist():
    # Create a cotype picklist for each collection
    for collection in Collection.objects.all():
        Picklist.objects.get_or_create(
            name=PICKLIST_NAME,
            issystem=True,
            readonly=True,
            sizelimit=-1,
            sorttype=1,
            type=1,
            tablename='collectionobjecttype',
            collection=collection
        )

def revert_cotype_picklist():
    Picklist.objects.filter(name=PICKLIST_NAME).delete()


def create_cotype_splocalecontaineritem():
    # Create a Splocalecontaineritem record for each CollectionObject Splocalecontainer
    # NOTE: Each discipline has its own CollectionObject Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='collectionobject'):
        Splocalecontaineritem.objects.get_or_create(
            name=FIELD_NAME,
            picklistname=PICKLIST_NAME,
            type='ManyToOne',
            container=container
        )

def revert_cotype_splocalecontaineritem():
    Splocalecontaineritem.objects.filter(name=FIELD_NAME).delete()


def create_cotype_splocaleitemstr():
    # Create caption & description records for collectionObjectType in Schema Config
    for container_item in Splocalecontaineritem.objects.filter(name=FIELD_NAME):
        Splocaleitemstr.objects.create(
            language='en',
            text='Collection Object Type',
            itemname=container_item
        )
        Splocaleitemstr.objects.create(
            language='en',
            text=FIELD_NAME,
            itemdesc=container_item
        )

def revert_cotype_splocaleitemstr():
    Splocaleitemstr.objects.filter(text=FIELD_NAME).delete()
    Splocaleitemstr.objects.filter(text='Collection Object Type').delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('specify', '0002_geo'),
    ]

    def apply_migration(apps, schema_editor):
        create_cotype_picklist()
        create_cotype_splocalecontaineritem()
        create_cotype_splocaleitemstr()

    def revert_migration(apps, schema_editor):
        revert_cotype_picklist()
        revert_cotype_splocaleitemstr()
        revert_cotype_splocalecontaineritem()

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]