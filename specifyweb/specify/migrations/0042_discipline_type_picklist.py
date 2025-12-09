from django.db import migrations

DISCIPLINE_TYPE_PICKLIST_NAME = 'COGTypes'
# TODO: Build this from backend/context/app_resource.py
DISCIPLINE_TYPES = [
  { 'value': 'fish', 'label': 'Fish' },
  { 'value': 'herpetology', 'label': 'Herpetology' },
  { 'value': 'paleobotany', 'label': 'Paleobotany' },
  { 'value': 'invertpaleo', 'label': 'Invertebrate Paleontology' },
  { 'value': 'vertpaleo', 'label': 'Vertebrate Paleontology' },
  { 'value': 'bird', 'label': 'Bird' },
  { 'value': 'mammal', 'label': 'Mammal' },
  { 'value': 'insect', 'label': 'Insect' },
  { 'value': 'botany', 'label': 'Botany' },
  { 'value': 'invertebrate', 'label': 'Invertebrate' },
  { 'value': 'geology', 'label': 'Geology' },
];

def create_discipline_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    # Create a discipline type picklist for each collection
    for collection in Collection.objects.all():
        picklist, created = Picklist.objects.get_or_create(
            name=DISCIPLINE_TYPE_PICKLIST_NAME,
            type=1,
            tablename='discipline',
            collection=collection,
            defaults={
                "issystem": True,
                "readonly": True,
                "sizelimit": -1,
                "sorttype": 1,
            }
        )
        # If the picklist doesn't exist, create a new one
        if created:
            ordinal = 1
            items = []
            for type in DISCIPLINE_TYPES:
                items.append(
                    Picklistitem(
                        picklist=picklist,
                        ordinal=ordinal,
                        value=type['value'],
                        title=type['label'],
                    )
                )
                ordinal += 1
            Picklistitem.objects.bulk_create(items)

def revert_discipline_type_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name=DISCIPLINE_TYPE_PICKLIST_NAME).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0041_add_missing_schema_after_reorganization'),
    ]

    def apply_migration(apps, schema_editor):
        create_discipline_type_picklist(apps)

    def revert_migration(apps, schema_editor):
        revert_discipline_type_picklist(apps)
        
    operations = []
