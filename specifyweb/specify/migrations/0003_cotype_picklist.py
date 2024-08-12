from django.db import migrations

PICKLIST_NAME = 'CollectionObjectType'
FIELD_NAME = 'collectionObjectType'
COTYPE_TEXT = 'Collection Object Type'

def create_cotype_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
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

def revert_cotype_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')
    Picklist.objects.filter(name=PICKLIST_NAME).delete()


def create_cotype_splocalecontaineritem(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    # Create a Splocalecontaineritem record for each CollectionObject Splocalecontainer
    # NOTE: Each discipline has its own CollectionObject Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='collectionobject', schematype=0):
        Splocalecontaineritem.objects.get_or_create(
            name=FIELD_NAME,
            picklistname=PICKLIST_NAME,
            type='ManyToOne',
            container=container,
            isrequired=True
        )

def revert_cotype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocalecontaineritem.objects.filter(name=FIELD_NAME).delete()


def create_cotype_splocaleitemstr(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    # Create caption & description records for collectionObjectType in Schema Config
    for container_item in Splocalecontaineritem.objects.filter(name=FIELD_NAME):
        Splocaleitemstr.objects.create(
            language='en',
            text=COTYPE_TEXT,
            itemname=container_item
        )
        Splocaleitemstr.objects.create(
            language='en',
            text=COTYPE_TEXT,
            itemdesc=container_item
        )

def revert_cotype_splocaleitemstr(apps):
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocaleitemstr.objects.filter(text=COTYPE_TEXT).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0002_geo'),
    ]

    def apply_migration(apps, schema_editor):
        create_cotype_picklist(apps)
        create_cotype_splocalecontaineritem(apps)
        create_cotype_splocaleitemstr(apps)

    def revert_migration(apps, schema_editor):
        revert_cotype_picklist(apps)
        revert_cotype_splocaleitemstr(apps)
        revert_cotype_splocalecontaineritem(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]