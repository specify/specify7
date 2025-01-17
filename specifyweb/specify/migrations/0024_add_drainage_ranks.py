from django.db import migrations
from specifyweb.specify.models import protect_with_blockers


def create_default_drainage_ranks(apps): 
    DrainageTreeDefItem = apps.get_model('specify', 'DrainageTreeDefItem')
    DrainageTreeDef = apps.get_model('specify', 'DrainageTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        drainage_tree_def, _ = DrainageTreeDef.objects.get_or_create(name="Drainage", discipline=discipline)

        root, _ = DrainageTreeDefItem.objects.get_or_create(
            name="Root",
            title="Root",
            rankid=0,
            parent=None,
            treedef=drainage_tree_def,
        )
        superstructure, _ = DrainageTreeDefItem.objects.get_or_create(
            name="Watershed",
            title="Watershed",
            rankid=100,
            parent=root,
            treedef=drainage_tree_def,
        )
        drainage_domain, _ = DrainageTreeDefItem.objects.get_or_create(
            name="River Basin",
            title="River Basin",
            rankid=200,
            parent=superstructure,
            treedef=drainage_tree_def,
        )
        drainage_subdomain, _ = DrainageTreeDefItem.objects.get_or_create(
            name="River/Stream",
            title="River/Stream",
            rankid=300,
            parent=drainage_domain,
            treedef=drainage_tree_def,
        )
        drainage_unit, _ = DrainageTreeDefItem.objects.get_or_create(
            name="Tributary",
            title="Tributary",
            rankid=400,
            parent=drainage_subdomain,
            treedef=drainage_tree_def,
        )
        drainage_subunit, _ = DrainageTreeDefItem.objects.get_or_create(
            name="Waterbody",
            title="Waterbody",
            rankid=500,
            parent=drainage_unit,
            treedef=drainage_tree_def,
        )

        discipline.drainagetreedef = drainage_tree_def
        discipline.save()

def revert_default_drainage_ranks(apps, schema_editor):
    Drainage = apps.get_model('specify', 'Drainage')
    DrainageTreeDefItem = apps.get_model('specify', 'DrainageTreeDefItem')
    DrainageTreeDef = apps.get_model('specify', 'DrainageTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        drainage_tree_defs = DrainageTreeDef.objects.filter(name="Drainage Unit", discipline=discipline)

        for drainage_tree_def in drainage_tree_defs:
            drainage_unit_tree_def_items = DrainageTreeDefItem.objects.filter(treedef=drainage_tree_def).order_by('-id')

            for item in drainage_unit_tree_def_items:
                Drainage.objects.filter(definitionitem=item).delete()

                item.delete()

            discipline.drainagetreedef = None
            discipline.save()
            drainage_tree_def.delete()

def create_root_drainage_node(apps): 
    Drainage = apps.get_model('specify', 'Drainage')
    DrainageTreeDefItem = apps.get_model('specify', 'DrainageTreeDefItem')
    DrainageTreeDef = apps.get_model('specify', 'DrainageTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all(): 

        drainage_tree_def, created = DrainageTreeDef.objects.get_or_create(
            name="Drainage",
            discipline=discipline
        )

        drainage_tree_def_item, create = DrainageTreeDefItem.objects.get_or_create(
            name="Root",
            treedef=drainage_tree_def
        )

        root, _ = Drainage.objects.get_or_create(
            name="Root",
            isaccepted=1,
            nodenumber=1,
            rankid=0,
            parent=None,
            definition=drainage_tree_def,
            definitionitem=drainage_tree_def_item
        )

def revert_create_root_drainage_node(apps, schema_editor):
    Drainage = apps.get_model('specify', 'Drainage')
    DrainageTreeDefItem = apps.get_model('specify', 'DrainageTreeDefItem')
    DrainageTreeDef = apps.get_model('specify', 'DrainageTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        drainage_tree_def = DrainageTreeDef.objects.filter(name="Drainage Unit", discipline=discipline).first()
        
        if drainage_tree_def:
            DrainageTreeDefItem.objects.filter(treedef=drainage_tree_def).delete()
            Drainage.objects.filter(
                name="Root"
            ).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0023_add_drainage_tree'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        create_default_drainage_ranks(apps)
        create_root_drainage_node(apps)

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        revert_default_drainage_ranks(apps, schema_editor)
        revert_create_root_drainage_node(apps, schema_editor)
    
    operations = [
        migrations.RunPython(consolidated_python_django_migration_operations, revert_cosolidated_python_django_migration_operations, atomic=True),
    ]