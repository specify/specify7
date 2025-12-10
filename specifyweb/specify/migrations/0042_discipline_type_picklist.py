from django.db import migrations
from specifyweb.backend.context.app_resource import DISCIPLINE_NAMES

DISCIPLINE_TYPE_PICKLIST_NAME = 'DisciplineType'

def create_discipline_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    # Create a discipline type picklist for each collection
    for collection in Collection.objects.all():
        picklist, created = Picklist.objects.get_or_create(
            name=DISCIPLINE_TYPE_PICKLIST_NAME,
            type=1,
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
            for value, title in DISCIPLINE_NAMES.items():
                items.append(
                    Picklistitem(
                        picklist=picklist,
                        ordinal=ordinal,
                        value=value,
                        title=title,
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
        
    operations = [
        migrations.RunPython(
            apply_migration,
            revert_migration,
            atomic=True,
        ),
    ]
