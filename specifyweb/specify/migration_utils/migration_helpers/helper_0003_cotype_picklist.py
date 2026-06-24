
# ##########################################
# Used in 0003_cotype_picklist.py
# ##########################################

COT_PICKLIST_NAME = 'CollectionObjectType'
COT_FIELD_NAME = 'collectionObjectType'
COT_TEXT = 'Collection Object Type'

# REFACTOR: optimize
def create_cotype_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    # Create a cotype picklist for each collection
    for collection in Collection.objects.all():
        Picklist.objects.get_or_create(
            name=COT_PICKLIST_NAME,
            type=1,
            tablename='collectionobjecttype',
            collection=collection,
            defaults={
                "issystem": True,
                "readonly": True,
                "sizelimit": -1,
                "sorttype": 1,
                "formatter": COT_PICKLIST_NAME,
            }
        )

# FEAT: Replace this implementation with
# update_table_field_schema_config_with_defaults
def create_cotype_splocalecontaineritem(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    # Create a Splocalecontaineritem record for each CollectionObject Splocalecontainer
    # NOTE: Each discipline has its own CollectionObject Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='collectionobject', schematype=0):
        container_item_attrs = {
            "name": COT_FIELD_NAME,
            "container": container
        }
        container_item = Splocalecontaineritem.objects.filter(**container_item_attrs).order_by("id").first()
        if container_item is None:
            resolved_item = Splocalecontaineritem.objects.create(
                **container_item_attrs,
                picklistname=COT_PICKLIST_NAME,
                type="ManyToOne",
                isrequired=True
            )
        else:
            resolved_item = container_item

        field_label_attrs = {
            "language": "en",
            "itemname":resolved_item
        }

        field_label = Splocaleitemstr.objects.filter(**field_label_attrs).order_by("id").first()

        if field_label is None:
            Splocaleitemstr.objects.create(**field_label_attrs, text=COT_TEXT)

        field_desc_attrs = {
            "language": "en",
            "itemdesc":resolved_item
        }

        field_desc = Splocaleitemstr.objects.filter(**field_desc_attrs).order_by("id").first()

        if field_desc is None:
            Splocaleitemstr.objects.create(**field_desc_attrs, text=COT_TEXT)
