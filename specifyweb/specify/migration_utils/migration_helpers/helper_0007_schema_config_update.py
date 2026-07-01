from django.db.models import Q, Exists, OuterRef

from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
from specifyweb.specify.migration_utils.utils import batch_query
from specifyweb.specify.migration_utils.migration_helpers.helper_0002_schema_config_update import HISTORICAL_COGTYPES_PICKLIST

# ##########################################
# Used in 0007_schema_config_update.py
# ##########################################

MIGRATION_0007_FIELDS = {
    'StorageTreeDef': ['institution'],
    'CollectionObjectGroup': ['children']
}

COG_PICKLIST_NAME = 'COGTypes'
COGTYPE_FIELD_NAME = 'cogType'

def update_cog_type_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    # Revert COG -> children before adding to avoid duplicates
    revert_table_field_schema_config('CollectionObjectGroup', 'children', apps)
    # Add StorageTreeDef -> institution and COG -> children
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0007_FIELDS.items():
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

    # Remove COG -> cojo
    revert_table_field_schema_config('CollectionObjectGroup', 'cojo', apps)

    # Remove duplicate CollectionObject -> collectionObjectType
    container_items = Splocalecontaineritem.objects.filter(
        name="collectionObjectType",
        picklistname=None,
        container__name="collectionobject",
        container__schematype=0
    )
    Splocaleitemstr.objects.filter(
        Q(itemname__in=container_items) | Q(itemdesc__in=container_items),
        language="en"
    ).delete()
    container_items.delete()

# NOTE: The reverse function will not re-add the duplicate CO -> coType or COG -> cojo as its unnecessary
def revert_cog_type_fields(apps):
    # Remove StorageTreeDef -> institution and COG -> children
    for table, fields in MIGRATION_0007_FIELDS.items():
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)


def create_cogtype_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')

    collections_without_picklists = Collection.objects.annotate(
        has_existing_picklist=Exists(
            Picklist.objects.filter(
                collection_id=OuterRef("pk"),
                name=COG_PICKLIST_NAME,
                type=1
            )
        )
    ).filter(has_existing_picklist=False).values_list("pk", flat=True)

    # Create a cogtype picklist for each collection
    for collection_ids in batch_query(collections_without_picklists):
        Picklist.objects.bulk_create(
            [
                Picklist(
                    name=COG_PICKLIST_NAME,
                    collection_id=collection_id,
                    type=1,
                    tablename="collectionobjectgrouptype",
                    formatter="CollectionObjectGroupType",
                    issystem=True,
                    readonly=True,
                    sizelimit=-1,
                    sorttype=1
                )
                for collection_id in collection_ids
            ]
        )

def revert_cogtype_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name=COG_PICKLIST_NAME).delete()


# Updates COG -> cogtype to use the type 1 picklist created above
def update_cogtype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgroup",
        container__schematype=0,
        name=COGTYPE_FIELD_NAME,
    ).update(picklistname=COG_PICKLIST_NAME, type="ManyToOne", isrequired=True)


def revert_cogtype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgroup",
        container__schematype=0,
        name=COGTYPE_FIELD_NAME,
    ).update(picklistname=None, type=None, isrequired=None)


def update_systemcogtypes_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name='Default Collection Object Group Types').update(
        name=HISTORICAL_COGTYPES_PICKLIST,
        type=0,
        issystem=True,
        readonly=True,
        sizelimit=3,
        tablename=None
    )

def revert_systemcogtypes_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    # revert only changes the name and not the other attributes as those were incorrect
    Picklist.objects.filter(name=HISTORICAL_COGTYPES_PICKLIST).update(
        name='Default Collection Object Group Types',
    )


# Updates cogtype -> type to use the Default COGType picklist (Drill Core, Discrete, Consolidated)
def update_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgrouptype",
        container__schematype=0,
        name="type",
    ).update(picklistname=HISTORICAL_COGTYPES_PICKLIST, isrequired=True)


def revert_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgrouptype",
        container__schematype=0,
        name="type",
    ).update(picklistname=None, isrequired=None)

