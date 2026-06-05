import logging

from django.db.models import OuterRef, Subquery, Exists

logger = logging.getLogger(__name__)

DEFAULT_RANKS = (
    {"rankid": 0, "name": "Root", "attrs": {"isenforced": True}},
    {"rankid": 10, "name": "Superstructure"},
    {"rankid": 20, "name": "Tectonic Domain"},
    {"rankid": 30, "name": "Tectonic Subdomain"},
    {"rankid": 40, "name": "Tectonic Unit"},
    {"rankid": 50, "name": "Tectonic Subunit"}
)

def create_default_tectonic_ranks(apps): 
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    # Create empty TectonicUnit trees for Disciplines which don't have already them
    _create_tectonic_unit_for_discipline(
        Discipline_Model=Discipline,
        Tectonicunittreedef_Model=TectonicTreeDef
    )

    trees_missing_ranks = TectonicTreeDef.objects.filter(treedefitems__isnull=True)

    for tectonic_tree_def in trees_missing_ranks:

        current_parent = None
        for default_rank in DEFAULT_RANKS:
            # At this point, these get_or_create calls should always be the
            # equivalent of create (as we know these nodes didn't exist).
            # But keeping the get_or_create here just because
            current_parent, _ = TectonicUnitTreeDefItem.objects.get_or_create(
                rankid=default_rank["rankid"],
                parent=current_parent,
                treedef=tectonic_tree_def,
                defaults={
                    "name": default_rank["name"],
                    "title": default_rank["name"],
                    **default_rank.get('attrs', {})
                }
            )

def create_root_tectonic_node(apps): 
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicUnitTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')

    trees_missing_root_node = TectonicUnitTreeDef.objects.annotate(
        root_node_exists=Exists(
            TectonicUnit.objects.filter(
                parent=None,
                definition=OuterRef("pk")
            )
        )
    ).filter(
        root_node_exists=False
    )

    for tree in trees_missing_root_node:
        root_rank, _ = TectonicUnitTreeDefItem.objects.get_or_create(
            rankid=0,
            parent=None,
            treedef=tree,
            defaults={
                "name": "Root",
                "title": "Root",
                "isenforced": True
            }
        )
        TectonicUnit.objects.create(
            name="Root",
            fullname="Root",
            isaccepted=1,
            nodenumber=1,
            rankid=0,
            parent=None,
            definition=tree,
            definitionitem=root_rank
        )
        logger.info(f"Created root tectonic unit for discipline {tree.discipline_id}")

    TectonicUnitTreeDefItem.objects.filter(parent=None,rankid=0, isenforced__isnull=True).update(isenforced=True)

def _create_tectonic_unit_for_discipline(Discipline_Model, Tectonicunittreedef_Model):
    # Fetches Discipline objects with an empty TectonicUnitTreeDef relationship
    # and no TectonicUnitTreeDef objects with a set discipline
    # Most commonly, this would be in the case of creating a Discipline in
    # Specify 6 after the TectonicUnitTreeDef migrations have been run in
    # Specify 7
    disciplines_missing_tectonicunit = Discipline_Model.objects.filter(
        tectonicunittreedef__isnull=True,
        tectonicunittreedefs__isnull=True
    ).values_list("pk", flat=True)

    Tectonicunittreedef_Model.objects.bulk_create(
        [
            Tectonicunittreedef_Model(
                name="Tectonic Unit",
                discipline_id=disciplineid
            ) for disciplineid in disciplines_missing_tectonicunit
        ],
        batch_size=1000
    )

    # If there are cases where Discipline -> tectonicunittreedef is not set,
    # but there is at least one TectonicUnitTreeDef pointing to the Discipline,
    # then set the Discipline -> tectonicunittreedef relationship to the "first"
    # TectonicUnitTreeDef -> discipline
    Discipline_Model.objects.filter(
        tectonicunittreedef__isnull=True,
        tectonicunittreedefs__isnull=False
    ).update(
        tectonicunittreedef=Subquery(
            Tectonicunittreedef_Model.objects.filter(
                discipline=OuterRef("pk")
            ).order_by("pk").values("pk")[:1]
        )
    )

def fix_tectonic_unit_treedef_discipline_links(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    Tectonicunittreedef = apps.get_model('specify', 'Tectonicunittreedef')

    _create_tectonic_unit_for_discipline(
        Discipline_Model=Discipline,
        Tectonicunittreedef_Model=Tectonicunittreedef
    )

    # If there's any TectonicUnitTreeDef objects with a NULL
    # discipline, set the discipline relationship to the
    # Discipline -> tectonicunittreedef
    Tectonicunittreedef.objects.filter(
        discipline__isnull=True,
        disciplines__isnull=False
    ).update(
        discipline=Subquery(
            Discipline.objects.filter(
                tectonicunittreedef=OuterRef("pk")
            ).order_by("pk").values("pk")[:1]
        )
    )
