from django.db import migrations

PICKLIST_NAME = 'CollectionObjectGroupType'
FIELD_NAME = 'collectionObjectGroupType'
PICKLIST_TEXT = 'Collection Object Group Type'

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
    Picklist = apps.get_model('specifyweb', 'Picklist')

    Picklist.objects.filter(name=PICKLIST_NAME).delete()


def create_cogtype_splocalecontaineritem(apps):
    Splocalecontainer = apps.get_model('specifyweb', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specifyweb', 'Splocalecontaineritem')

    # Create a Splocalecontaineritem record for each CollectionObjectGroup Splocalecontainer
    # NOTE: Each discipline has its own CollectionObjectGroup Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='collectionobjectgroup', schematype=0):
        Splocalecontaineritem.objects.get_or_create(
            name=FIELD_NAME,
            picklistname=PICKLIST_NAME,
            type='ManyToOne',
            container=container,
            isrequired=False
        )

def revert_cogtype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specifyweb', 'Splocalecontaineritem')

    Splocalecontaineritem.objects.filter(name=FIELD_NAME).delete()


def create_cogtype_splocaleitemstr(apps):
    Splocaleitemstr = apps.get_model('specifyweb', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specifyweb', 'Splocalecontaineritem')
    # Create caption & description records for collectionObjectGroupType in Schema Config
    for container_item in Splocalecontaineritem.objects.filter(name=FIELD_NAME):
        Splocaleitemstr.objects.create(
            language='en',
            text=PICKLIST_TEXT,
            itemname=container_item
        )
        Splocaleitemstr.objects.create(
            language='en',
            text=FIELD_NAME,
            itemdesc=container_item
        )

def revert_cogtype_splocaleitemstr(apps):
    Splocaleitemstr = apps.get_model('specifyweb', 'Splocaleitemstr')

    Splocaleitemstr.objects.filter(text=FIELD_NAME).delete()
    Splocaleitemstr.objects.filter(text=PICKLIST_TEXT).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0003_cotype_picklist'),
    ]

    def apply_migration(apps, schema_editor):
        create_cogtype_picklist(apps)
        create_cogtype_splocalecontaineritem(apps)
        create_cogtype_splocaleitemstr(apps)

    def revert_migration(apps, schema_editor):
        revert_cogtype_picklist(apps)
        revert_cogtype_splocaleitemstr(apps)
        revert_cogtype_splocalecontaineritem(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]