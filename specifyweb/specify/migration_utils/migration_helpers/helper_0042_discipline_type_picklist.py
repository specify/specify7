
# ##########################################
# Used in 0042_discipline_type_picklist.py
# ##########################################

from django.db.models import Exists, OuterRef

from specifyweb.specify.migration_utils.utils import batch_query
from specifyweb.backend.context.app_resource import DISCIPLINE_NAMES

DISCIPLINE_TYPE_PICKLIST_NAME = 'DisciplineType'

def create_discipline_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    collections_missing_picklist = Collection.objects.annotate(
        has_existing_picklist=Exists(
            Picklist.objects.filter(
                collection_id=OuterRef("pk"),
                name=DISCIPLINE_TYPE_PICKLIST_NAME,
                type=0
            )
        )
    ).filter(
        has_existing_picklist=False
    ).values_list("pk", flat=True)

    for collection_ids in batch_query(collections_missing_picklist):
        created_picklists = Picklist.objects.bulk_create(
            [
                Picklist(
                    collection_id=collection_id,
                    name=DISCIPLINE_TYPE_PICKLIST_NAME,
                    type=0,
                    issystem=True,
                    readonly=True,
                    sizelimit=-1,
                    sorttype=1
                )
                for collection_id in collection_ids
            ]
        )

        Picklistitem.objects.bulk_create(
            [
                Picklistitem(
                    picklist=picklist,
                    value=value,
                    title=title,
                    ordinal=ordinal
                )
                for ordinal, (value, title) in enumerate(DISCIPLINE_NAMES.items(), start=1)
                for picklist in created_picklists
            ]
        )

def revert_discipline_type_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name=DISCIPLINE_TYPE_PICKLIST_NAME).delete()

def update_discipline_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="discipline",
        container__schematype=0,
        name="type",
    ).update(
        picklistname=DISCIPLINE_TYPE_PICKLIST_NAME,
        isrequired=True
    )

def revert_discipline_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="discipline",
        picklistname=DISCIPLINE_TYPE_PICKLIST_NAME,
        container__schematype=0,
        name="type",
    ).update(
        picklistname=None
    )
