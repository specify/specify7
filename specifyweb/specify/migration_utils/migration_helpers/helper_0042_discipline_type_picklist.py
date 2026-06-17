
# ##########################################
# Used in 0042_discipline_type_picklist.py
# ##########################################

from specifyweb.backend.context.app_resource import DISCIPLINE_NAMES

DISCIPLINE_TYPE_PICKLIST_NAME = 'DisciplineType'

def create_discipline_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    def batch_iterable[T](iterable: Iterable[T], batch_size: int):
        """
        A generator that takes any Iterable and yields tuples containing up to
        batch_size elements until the iterable is exhausted.

        This is useful when you want to perform some operation over all
        elements in the iterable, but the operation is memory intensive and can
        be batched.

        Example:
        ```py
        example = [1, 2, 3]
        for batched in batch_iterable(example, 2):
            print(batched)
        # prints (1, 2) then (3,)
        ```
        """
        iterator = iter(iterable)
        while batch := tuple(islice(iterator, batch_size)):
            yield batch

    collections_missing_picklist = Collection.objects.annotate(
        has_existing_picklist=Exists(
            Picklist.objects.filter(
                collection=OuterRef("pk"),
                name=DISCIPLINE_TYPE_PICKLIST_NAME,
                type=0
            )
        )
    ).filter(
        has_existing_picklist=False
    ).values_list("pk", flat=True).iterator(chunk_size=1000)

    COLLECTION_BATCH_SIZE=200

    for collection_ids in batch_iterable(collections_missing_picklist, COLLECTION_BATCH_SIZE):
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
            ],
            batch_size=COLLECTION_BATCH_SIZE
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
    ).update(picklistname=DISCIPLINE_TYPE_PICKLIST_NAME, isrequired=True)

def revert_discipline_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="discipline",
        picklistname=DISCIPLINE_TYPE_PICKLIST_NAME,
        container__schematype=0,
        name="type",
    ).update(picklistname=None)