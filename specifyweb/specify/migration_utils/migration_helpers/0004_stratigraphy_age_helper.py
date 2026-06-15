from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, revert_table_schema_config, update_table_field_schema_config_with_defaults, update_table_schema_config_with_defaults

# ##########################################
# Used in 0004_stratigraphy_age.py
# ##########################################


MIGRATION_0004_TABLES = [
    ('AbsoluteAge', None),
    ('RelativeAge', None),
    ('TectonicUnitTreeDef', None),
    ('TectonicUnitTreeDefItem', None),
    ('TectonicUnit', None),
    ('RelativeAgeCitation', None),
    ('RelativeAgeAttachment', None),
    ('AbsoluteAgeCitation', None),
    ('AbsoluteAgeAttachment', None),
]

MIGRATION_0004_FIELDS = {
    'CollectionObject': ['relativeAges', 'absoluteAges', 'collectionObjectType'],
    'Collection': ['collectionObjectType'],
    'GeographyTreeDef': ['discipline'],
    'GeologicTimePeriodTreeDef': ['discipline'],
    'LithoStratTreeDef': ['discipline'],
}

AGETYPE_PICKLIST_NAME = 'AgeType'
DEFAULT_AGE_TYPES = [
    'Sedimentation', 
    'Metamorphism', 
    'Erosion', 
    'Diagenetic', 
]

def create_agetype_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    PicklistItem = apps.get_model('specify', 'Picklistitem')

    for collection in Collection.objects.all():
        age_type_picklist, created = Picklist.objects.get_or_create(
            name=AGETYPE_PICKLIST_NAME,
            type=0,
            collection_id=collection.id,
            defaults={
                "issystem": False,
                "readonly": False,
                "sizelimit": -1,
                "sorttype": 1,
            }
        )
        if created: 
            for age_type in DEFAULT_AGE_TYPES:
                PicklistItem.objects.get_or_create(
                    title=age_type,
                    value=age_type,
                    picklist=age_type_picklist
                )

def create_strat_table_schema_config_with_defaults(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, desc in MIGRATION_0004_TABLES: # NOTE: lots of Nones, getting skips
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)

        for table, fields in MIGRATION_0004_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def revert_strat_table_schema_config_with_defaults(apps):
    for table, _ in MIGRATION_0004_TABLES:
        revert_table_schema_config(table, apps)
    for table, fields in MIGRATION_0004_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)