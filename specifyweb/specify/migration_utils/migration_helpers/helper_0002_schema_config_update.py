from django.db.models import OuterRef, Subquery

from specifyweb.specify.migration_utils.schema_writer import update_table_schema_config_with_defaults


# ##########################################
# Used in 0002_schema_config_update.py
# ##########################################

MIGRATION_0002_TABLES = [
    ('CollectionObjectType', None),
    ('CollectionObjectGroupType', None),
    ('CollectionObjectGroup', None),
    ('CollectionObjectGroupJoin', None),
    ('SpUserExternalId', 'Stores provider identifiers and tokens for users who sign in using Single Sign On (SSO).'),
    ('SpAttachmentDataSet', 'Holds attachment data sets.'),
    ('UniquenessRule', 'Stores table names in the data model that have uniqueness rules configured for each discipline.'),
    ('UniquenessRuleField', 'Stores field names in the data model that have uniqueness rules configured for each discipline, linked to UniquenessRule records.'),
    ('Message', 'Stores user notifications.'),
    ('SpMerging', 'Tracks record and task IDs of records being merged.'),
    ('UserPolicy', 'Records permissions for a user within a collection.'),
    ('UserRole', 'Records roles associated with Specify users.'),
    ('Role', 'Stores names, descriptions, and collection information for user-created roles.'),
    ('RolePolicy', 'Stores resource and action permissions for user-created roles within a collection.'),
    ('LibraryRole', 'Stores names and descriptions of default roles that can be added to any collection.'),
    ('LibraryRolePolicy', 'Stores resource and action permissions for library roles within a collection.'),
    ('SpDataSet', 'Stores Specify Data Sets created during bulk import using the WorkBench, typically through spreadsheet uploads.')
]

DEFAULT_COG_TYPES = [
    'Discrete',
    'Consolidated',
    'Drill Core',
]

# We could use SYSTEM_COGTYPES_PICKLIST from cogtype_rules, but keeping this
# separate for now just in case the PickList name changes
HISTORICAL_COGTYPES_PICKLIST = "SystemCOGTypes"

# BUG: Do the same for TectonicUnit?
def create_default_discipline_for_tree_defs(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    Institution = apps.get_model('specify', 'Institution')

    # Use the specified DB alias for all queries
    for discipline in Discipline.objects.all():
        geography_tree_def = discipline.geographytreedef
        if geography_tree_def and geography_tree_def.discipline_id is None:
            geography_tree_def.discipline = discipline
            geography_tree_def.save()

        geologic_time_period_tree_def = discipline.geologictimeperiodtreedef
        if geologic_time_period_tree_def and geologic_time_period_tree_def.discipline_id is None:
            geologic_time_period_tree_def.discipline = discipline
            geologic_time_period_tree_def.save()

        lithostrat_tree_def = discipline.lithostrattreedef
        if lithostrat_tree_def and lithostrat_tree_def.discipline_id is None:
            lithostrat_tree_def.discipline = discipline
            lithostrat_tree_def.save()

        taxon_tree_def = discipline.taxontreedef
        if taxon_tree_def and taxon_tree_def.discipline_id is None:
            taxon_tree_def.discipline = discipline
            taxon_tree_def.save()

    for institution in Institution.objects.all():
        storage_tree_def = institution.storagetreedef
        if storage_tree_def and storage_tree_def.institution_id is None:
            storage_tree_def.institution = institution
            storage_tree_def.save()


# REFACTOR: Optimize
def create_cogtype_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    for collection in Collection.objects.all():
        cog_type_picklist, picklist_created = Picklist.objects.get_or_create(
            # the name used to be "Default Collection Object Group Types"
            name=HISTORICAL_COGTYPES_PICKLIST,
            type=0,
            collection=collection,
            defaults={
                "issystem": False,
                "readonly": False,
            }
        )
        if picklist_created:
            for cog_type in DEFAULT_COG_TYPES:
                Picklistitem.objects.get_or_create(
                    title=cog_type,
                    value=cog_type,
                    picklist=cog_type_picklist
                )

def set_discipline_for_taxon_treedefs(apps):
    Collectionobjecttype = apps.get_model('specify', 'Collectionobjecttype')
    Taxontreedef = apps.get_model('specify', 'Taxontreedef')

    Taxontreedef.objects.filter(
        discipline__isnull=True
    ).update(
        discipline=Subquery(
            Collectionobjecttype.objects.filter(
                taxontreedef=OuterRef("pk")
            ).order_by("pk").values("collection__discipline")[:1]
        )
    )

def create_geo_table_schema_config_with_defaults(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, desc in MIGRATION_0002_TABLES:
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)
