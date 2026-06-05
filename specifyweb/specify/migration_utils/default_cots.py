import logging
from django.db.models import F, OuterRef, Subquery

logger = logging.getLogger(__name__)

DEFAULT_COG_TYPES = [
    'Discrete',
    'Consolidated',
    'Drill Core',
]

def create_default_collection_types(apps):
    Collection = apps.get_model('specify', 'Collection')
    Collectionobject = apps.get_model('specify', 'Collectionobject')
    Collectionobjecttype = apps.get_model('specify', 'Collectionobjecttype')

    # Create default collection types for each collection, named after the discipline
    for collection in Collection.objects.filter(collectionobjecttype__isnull=True):
        discipline = collection.discipline
        discipline_name = discipline.name
        cot, created = Collectionobjecttype.objects.get_or_create(
            name=discipline_name,
            collection=collection,
            taxontreedef_id=discipline.taxontreedef_id
        )

        # Update CollectionObjects' collectionobjecttype for the discipline
        Collectionobject.objects.filter(
            collection=collection).update(collectionobjecttype=cot)
        collection.collectionobjecttype = cot
        collection.save()

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

def create_cogtype_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    for collection in Collection.objects.all():
        cog_type_picklist, picklist_created = Picklist.objects.get_or_create(
            name='SystemCOGTypes', # Default Collection Object Group Types
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

COTYPE_PICKLIST_NAME = 'CollectionObjectType'
FIELD_NAME = 'collectionObjectType'
COTYPE_TEXT = 'Collection Object Type'

def create_cotype_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    # Create a cotype picklist for each collection
    for collection in Collection.objects.all():
        Picklist.objects.get_or_create(
            name=COTYPE_PICKLIST_NAME,
            type=1,
            tablename='collectionobjecttype',
            collection=collection,
            defaults={
                "issystem": True,
                "readonly": True,
                "sizelimit": -1,
                "sorttype": 1,
                "formatter": COTYPE_PICKLIST_NAME,
            }
        )

def set_discipline_for_taxon_treedefs(apps):
    Collectionobjecttype = apps.get_model('specify', 'Collectionobjecttype')
    Taxontreedef = apps.get_model('specify', 'Taxontreedef')

    collection_object_types = Collectionobjecttype.objects.filter(
        taxontreedef__discipline__isnull=True
    ).annotate(
        discipline=F('collection__discipline')
    )

    for cot in collection_object_types:
        Taxontreedef.objects.filter(id=cot.taxontreedef_id).update(discipline=cot.discipline)

def fix_taxon_treedef_discipline_links(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    Taxontreedef = apps.get_model('specify', 'Taxontreedef')

    # If a TaxonTreeDef has a NULL DisciplineID but there's a non-NULL
    # Discipline pointing to the TaxonTreeDef via Discipline -> TaxonTreeDefID,
    # then set the discipline on the TaxonTreeDef to the referencing Discipline
    Taxontreedef.objects.filter(
        discipline__isnull=True
    ).update(
        discipline=Subquery(
            Discipline.objects.filter(
                taxontreedef=OuterRef("pk")
            ).order_by("pk").values("pk")[:1]
        )
    )

    # BUG?: We're not handling the case here when Discipline has a NULL
    # TaxonTreeDefID but there's a TaxonTreeDef pointing to the Discipline via
    # TaxonTreeDef -> discipline
