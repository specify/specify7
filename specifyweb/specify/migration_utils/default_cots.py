import logging
from django.db.models import OuterRef, Subquery

logger = logging.getLogger(__name__)

# REFACTOR: Combine this with create_default_collection_types in
# specifyweb.specify.api.utils.py:
# https://github.com/specify/specify7/blob/3d13255b21afcd27fa891a38858661ad6e1914e7/specifyweb/specify/api/utils.py#L32-L75
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
