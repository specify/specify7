import logging
from django.db.models import F

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
        if storage_tree_def.institution_id is None:
            storage_tree_def.institution = institution
            storage_tree_def.save()

def create_cogtype_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    for collection in Collection.objects.all():
        cog_type_picklist, _ = Picklist.objects.get_or_create(
            name='SystemCOGTypes', # Default Collection Object Group Types
            type=0,
            collection=collection,
            defaults={
                "issystem": False,
                "readonly": False,
            }
        )
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

    empty_taxon_treedefs = Taxontreedef.objects.filter(discipline__isnull=True)
    disciplines = Discipline.objects.all()
    for empty_taxon_treedef in empty_taxon_treedefs:
        for discipline in disciplines:
            if discipline.taxontreedef_id == empty_taxon_treedef.id:
                empty_taxon_treedef.discipline = discipline
                empty_taxon_treedef.save()

def fix_tectonic_unit_treedef_discipline_links(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    Tectonicunittreedef = apps.get_model('specify', 'Tectonicunittreedef')

    empty_tectonic_unit_treedefs = Tectonicunittreedef.objects.filter(discipline__isnull=True)
    empty_disciplines = Discipline.objects.filter(tectonicunittreedef__isnull=True)
    for empty_discipline in empty_disciplines:
        if not empty_tectonic_unit_treedefs.exists():
            new_tectonic_unit_treedef = Tectonicunittreedef.objects.create(
                name=f'{empty_discipline.name} Tectonic Unit Tree',
                discipline=empty_discipline
            )
        else:
            empty_discipline.tectonicunittreedef = empty_tectonic_unit_treedefs.first()
            empty_discipline.save()

    for empty_tectonic_unit_treedef in empty_tectonic_unit_treedefs:
        if empty_disciplines.exists():
            empty_tectonic_unit_treedef.discipline = empty_disciplines.first()
            empty_tectonic_unit_treedef.save()
        else:
            empty_tectonic_unit_treedef.discipline = empty_disciplines.last()
            empty_tectonic_unit_treedef.save()
