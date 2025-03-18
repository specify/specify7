import logging
from django.db.models import F
from specifyweb.businessrules.exceptions import BusinessRuleException

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
        geography_tree_def.discipline = discipline
        geography_tree_def.save()

        geologic_time_period_tree_def = discipline.geologictimeperiodtreedef
        geologic_time_period_tree_def.discipline = discipline
        geologic_time_period_tree_def.save()

        lithostrat_tree_def = discipline.lithostrattreedef
        lithostrat_tree_def.discipline = discipline
        lithostrat_tree_def.save()

        taxon_tree_def = discipline.taxontreedef
        taxon_tree_def.discipline = discipline
        taxon_tree_def.save()

    for institution in Institution.objects.all():
        storage_tree_def = institution.storagetreedef
        storage_tree_def.institution = institution
        storage_tree_def.save()

def create_cogtype_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    for collection in Collection.objects.all():
        cog_type_picklist, _ = Picklist.objects.get_or_create(
            name='Default Collection Object Group Types',
            issystem=False,
            type=0,
            readonly=False,
            collection=collection
        )
        for cog_type in DEFAULT_COG_TYPES:
            Picklistitem.objects.get_or_create(
                title=cog_type,
                value=cog_type,
                picklist=cog_type_picklist
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
