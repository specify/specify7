from django.db import migrations

PICKLIST_NAME = 'CollectionObjectGroupType'
FIELD_NAME = 'Cogtype'
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
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name=PICKLIST_NAME).delete()


def update_cogtype_splocalecontaineritem(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    # Update a Splocalecontaineritem record for each CollectionObjectGroup Splocalecontainer
    # NOTE: Each discipline has its own CollectionObjectGroup Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='collectionobjectgroup', schematype=0):
        Splocalecontaineritem.objects.filter(container=container, name='cogtype').update(
            name=FIELD_NAME,
            picklistname=PICKLIST_NAME,
            type='ManyToOne',
            container=container,
            isrequired=True
        )

def update_cogtype_type_splocalecontaineritem(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    # Update the type in Splocalecontaineritem record for each CollectionObjectGroupType Splocalecontainer
    # NOTE: Each discipline has its own CollectionObjectGroupType Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='collectionobjectgrouptype', schematype=0):
        Splocalecontaineritem.objects.filter(container=container, name='type').update(
            type=0
        )


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0003_cotype_picklist'),
    ]

    def apply_migration(apps, schema_editor):
        create_cogtype_picklist(apps)
        update_cogtype_splocalecontaineritem(apps)
        update_cogtype_type_splocalecontaineritem

    def revert_migration(apps, schema_editor):
        revert_cogtype_picklist(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]