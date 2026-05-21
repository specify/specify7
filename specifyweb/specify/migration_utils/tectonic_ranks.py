import logging
logger = logging.getLogger(__name__)

def create_default_tectonic_ranks(apps): 
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    disciplines = Discipline.objects.filter(tectonicunittreedef__isnull=True).exclude(
        id__in=TectonicTreeDef.objects.values_list('discipline_id', flat=True)
    )

    for discipline in disciplines:
        tectonic_tree_def = TectonicTreeDef.objects.filter(discipline=discipline).first()
        if not tectonic_tree_def:
            tectonic_tree_def, _ = TectonicTreeDef.objects.get_or_create(name="Tectonic Unit", discipline=discipline)

        root, _ = TectonicUnitTreeDefItem.objects.get_or_create(
            name="Root",
            title="Root",
            rankid=0,
            parent=None,
            treedef=tectonic_tree_def,
            isenforced=True
        )
        superstructure, _ = TectonicUnitTreeDefItem.objects.get_or_create(
            name="Superstructure",
            title="Superstructure",
            rankid=10,
            parent=root,
            treedef=tectonic_tree_def,
        )
        tectonic_domain, _ = TectonicUnitTreeDefItem.objects.get_or_create(
            name="Tectonic Domain",
            title="Tectonic Domain",
            rankid=20,
            parent=superstructure,
            treedef=tectonic_tree_def,
        )
        tectonic_subdomain, _ = TectonicUnitTreeDefItem.objects.get_or_create(
            name="Tectonic Subdomain",
            title="Tectonic Subdomain",
            rankid=30,
            parent=tectonic_domain,
            treedef=tectonic_tree_def,
        )
        tectonic_unit, _ = TectonicUnitTreeDefItem.objects.get_or_create(
            name="Tectonic Unit",
            title="Tectonic Unit",
            rankid=40,
            parent=tectonic_subdomain,
            treedef=tectonic_tree_def,
        )
        tectonic_subunit, _ = TectonicUnitTreeDefItem.objects.get_or_create(
            name="Tectonic Subunit",
            title="Tectonic Subunit",
            rankid=50,
            parent=tectonic_unit,
            treedef=tectonic_tree_def,
        )

        discipline.tectonicunittreedef = tectonic_tree_def
        discipline.save()

def revert_default_tectonic_ranks(apps, schema_editor=None):
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        tectonic_tree_defs = TectonicTreeDef.objects.filter(name="Tectonic Unit", discipline=discipline)

        for tectonic_tree_def in tectonic_tree_defs:
            tectonic_unit_tree_def_items = TectonicUnitTreeDefItem.objects.filter(treedef=tectonic_tree_def).order_by('-id')

            for item in tectonic_unit_tree_def_items:
                TectonicUnit.objects.filter(definitionitem=item).delete()

                item.delete()

            discipline.tectonicunittreedef = None
            discipline.save()
            tectonic_tree_def.delete()

def create_root_tectonic_node(apps): 
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicUnitTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all(): 

        tectonic_tree_def = TectonicUnitTreeDef.objects.filter(name="Tectonic Unit", discipline=discipline).first()
        if not tectonic_tree_def:
            tectonic_tree_def, is_created = TectonicUnitTreeDef.objects.get_or_create(
                name="Tectonic Unit",
                discipline=discipline
            )

        tectonic_tree_def_item = TectonicUnitTreeDefItem.objects.filter(treedef=tectonic_tree_def, name="Root").first()
        if not tectonic_tree_def_item:
            tectonic_tree_def_item, is_created = TectonicUnitTreeDefItem.objects.get_or_create(
                name="Root",
                title="Root",
                treedef=tectonic_tree_def,
                isenforced=True
            )

        root = TectonicUnit.objects.filter(name="Root", definition=tectonic_tree_def).first()
        if not root:
            root, is_created = TectonicUnit.objects.get_or_create(
                name="Root",
                fullname="Root",
                isaccepted=1,
                nodenumber=1,
                rankid=0,
                parent=None,
                definition=tectonic_tree_def,
                definitionitem=tectonic_tree_def_item
            )

            if is_created:
                logger.info(f"Created root tectonic unit for discipline {discipline.name}")

    TectonicUnitTreeDefItem.objects.filter(rankid=0, isenforced__isnull=True).update(isenforced=True)

def revert_create_root_tectonic_node(apps, schema_editor=None):
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        tectonic_tree_def = TectonicTreeDef.objects.filter(name="Tectonic Unit", discipline=discipline).first()
        
        if tectonic_tree_def:
            TectonicUnitTreeDefItem.objects.filter(treedef=tectonic_tree_def).delete()
            TectonicUnit.objects.filter(
                name="Root"
            ).delete()