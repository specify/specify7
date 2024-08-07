from django.db import migrations
from specifyweb.specify.models import (
    Collection,
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
    Picklist
)

PICKLIST_NAME = 'CollectionObjectGroupType'
FIELD_NAME = 'collectionObjectGroupType'

def create_cogtype_picklist():
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
            collection=collection
        )

def revert_cogtype_picklist():
    Picklist.objects.filter(name=PICKLIST_NAME).delete()


def create_cogtype_splocalecontaineritem():
    # Create a Splocalecontaineritem record for each CollectionObjectGroup Splocalecontainer
    # NOTE: Each discipline has its own CollectionObjectGroup Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='collectionobjectgroup'):
        Splocalecontaineritem.objects.get_or_create(
            name=FIELD_NAME,
            picklistname=PICKLIST_NAME,
            type='ManyToOne',
            container=container
        )

def revert_cogtype_splocalecontaineritem():
    Splocalecontaineritem.objects.filter(name=FIELD_NAME).delete()


def create_cogtype_splocaleitemstr():
    # Create caption & description records for collectionObjectGroupType in Schema Config
    for container_item in Splocalecontaineritem.objects.filter(name=FIELD_NAME):
        Splocaleitemstr.objects.create(
            language='en',
            text='Collection Object Group Type',
            itemname=container_item
        )
        Splocaleitemstr.objects.create(
            language='en',
            text=FIELD_NAME,
            itemdesc=container_item
        )

def revert_cogtype_splocaleitemstr():
    Splocaleitemstr.objects.filter(text=FIELD_NAME).delete()
    Splocaleitemstr.objects.filter(text='Collection Object Group Type').delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('specify', '0003_cotype_picklist'),
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