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
    code_set = set(Collection.objects.all().values_list('code', flat=True))

    # Create default collection types for each collection, named after the discipline
    for collection in Collection.objects.all():
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
        try:
            collection.save()
        except BusinessRuleException as e:
            if 'Collection must have unique code in discipline' in str(e):
                # May want to do something besides numbering, but users can edit if after the migrqation if they want.
                i = 1
                while True:
                    collection.code = f'{collection.code}-{i}'
                    i += 1
                    if collection.code not in code_set:
                        code_set.add(collection.code)
                        break
                try:
                    collection.save()
                except BusinessRuleException as e:
                    logger.warning(
                        f'Problem saving collection {collection}: {e}')
            continue

        # Verify the taxon tree def for the cot points, remove later for other solution

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

def revert_default_discipline_for_tree_defs(apps):
    # Reverse handeled by table deletion
    pass

def create_default_collection_object_group_types(apps):
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

def revert_default_collection_object_types(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    for collection in Collection.objects.all():
        cog_type_picklist_qs = Picklist.objects.filter(
            name='Default Collection Object Group Types',
            collection=collection
        )
        if cog_type_picklist_qs.exists():
            cog_type_picklist = cog_type_picklist_qs.first()
            Picklistitem.objects.filter(picklist=cog_type_picklist).delete()
            cog_type_picklist.delete()

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
