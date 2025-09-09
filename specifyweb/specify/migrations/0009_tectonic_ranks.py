from django.db import migrations
from specifyweb.specify.models import protect_with_blockers


def create_default_tectonic_ranks(apps): 
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        tectonic_tree_def, _ = TectonicTreeDef.objects.get_or_create(name="Tectonic Unit", discipline=discipline)

        root, _ = TectonicUnitTreeDefItem.objects.get_or_create(
            name="Root",
            title="Root",
            rankid=0,
            parent=None,
            treedef=tectonic_tree_def,
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

        Discipline.objects.filter(id=discipline.id).update(tectonicunittreedef=tectonic_tree_def)

def revert_default_tectonic_ranks(apps, schema_editor):
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

            Discipline.objects.filter(id=discipline.id).update(tectonicunittreedef=None)
            tectonic_tree_def.delete()

def create_root_tectonic_node(apps): 
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicUnitTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all(): 

        tectonic_tree_def, created = TectonicUnitTreeDef.objects.get_or_create(
            name="Tectonic Unit",
            discipline=discipline
        )

        tectonic_tree_def_item, create = TectonicUnitTreeDefItem.objects.get_or_create(
            name="Root",
            treedef=tectonic_tree_def
        )

        root, _ = TectonicUnit.objects.get_or_create(
            name="Root",
            fullname="Root",
            isaccepted=1,
            nodenumber=1,
            rankid=0,
            parent=None,
            definition=tectonic_tree_def,
            definitionitem=tectonic_tree_def_item
        )

def revert_create_root_tectonic_node(apps, schema_editor):
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

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0008_ageCitations_fix'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        create_default_tectonic_ranks(apps)
        create_root_tectonic_node(apps)

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        revert_default_tectonic_ranks(apps, schema_editor)
        revert_create_root_tectonic_node(apps, schema_editor)
    
    operations = [
        migrations.RunPython(consolidated_python_django_migration_operations, revert_cosolidated_python_django_migration_operations, atomic=True),
    ]
