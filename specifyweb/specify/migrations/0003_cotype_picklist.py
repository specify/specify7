from django.db import migrations
from specifyweb.specify.migration_utils import update_schema_config as usc

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
            collection=collection,
            formatter=PICKLIST_NAME
        )

def revert_cotype_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')
    Picklist.objects.filter(name=PICKLIST_NAME).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0002_geo'),
    ]

    def apply_migration(apps, schema_editor):
        create_cotype_picklist(apps)
        usc.create_cotype_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        revert_cotype_picklist(apps)
        usc.revert_cotype_splocalecontaineritem(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]