from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults

# ##########################################
# Used in 0007_schema_config_update.py
# ##########################################

MIGRATION_0007_FIELDS = {
    'StorageTreeDef': ['institution'],
    'CollectionObjectGroup': ['children']
}

COG_PICKLIST_NAME = 'COGTypes'
COGTYPE_FIELD_NAME = 'cogType'
SYSTEM_COGTYPE_PICKLIST_NAME = "SystemCOGTypes"

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
    )
    for container_item in container_items:
        Splocaleitemstr.objects.filter(itemname=container_item).delete()
        Splocaleitemstr.objects.filter(itemdesc=container_item).delete()
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

    # Create a cogtype picklist for each collection
    for collection in Collection.objects.all():
        Picklist.objects.update_or_create(
            collection=collection,
            name=COG_PICKLIST_NAME,
            defaults={
                "type": 1,
                "tablename": "collectionobjectgrouptype",
                "issystem": True,
                "readonly": True,
                "sizelimit": -1,
                "sorttype": 1,
                "formatter": "CollectionObjectGroupType",
            },
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
        name=SYSTEM_COGTYPE_PICKLIST_NAME,
        type=0,
        issystem=True,
        readonly=True,
        sizelimit=3,
        tablename=None
    )

def revert_systemcogtypes_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    # revert only changes the name and not the other attributes as those were incorrect
    Picklist.objects.filter(name=SYSTEM_COGTYPE_PICKLIST_NAME).update(
        name='Default Collection Object Group Types',
    )


# Updates cogtype -> type to use the Default COGType picklist (Drill Core, Discrete, Consolidated)
def update_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgrouptype",
        container__schematype=0,
        name="type",
    ).update(picklistname=SYSTEM_COGTYPE_PICKLIST_NAME, isrequired=True)


def revert_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgrouptype",
        container__schematype=0,
        name="type",
    ).update(picklistname=None, isrequired=None)