from django.db import migrations

PICKLIST_NAME = 'CollectionObjectGroupType'
COGTYPE_FIELD_NAME = 'cogType'
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

# Updates cogtype -> type to use the Default COGType picklist (Drill Core, Discrete, Consolidated)
def update_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    Splocalecontaineritem.objects.filter(container__name='collectionobjectgrouptype', container__schematype=0, name='type').update(
        picklistname='Default Collection Object Group Types',
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
        ('specify', '0003_cotype_picklist'),
    ]

    def apply_migration(apps, schema_editor):
        create_cogtype_picklist(apps)
        update_cogtype_splocalecontaineritem(apps)
        update_cogtype_type_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        revert_cogtype_picklist(apps)
        revert_cogtype_splocalecontaineritem(apps)
        revert_cogtype_type_splocalecontaineritem(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]