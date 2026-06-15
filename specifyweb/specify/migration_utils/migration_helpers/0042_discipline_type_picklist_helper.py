
# ##########################################
# Used in 0042_discipline_type_picklist.py
# ##########################################

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
            type=0,
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

def update_discipline_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="discipline",
        container__schematype=0,
        name="type",
    ).update(picklistname=DISCIPLINE_TYPE_PICKLIST_NAME, isrequired=True)

def revert_discipline_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="discipline",
        container__schematype=0,
        name="type",
    ).update(picklistname=None, isrequired=None)