from django.apps import apps as specify_apps
from django.db import migrations, models
from specifyweb.specify.models import protect_with_blockers


def create_default_tectonic_ranks(apps): 
    TectonicUnit = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        tectonic_tree_def = TectonicTreeDef.objects.create(name="Tectonic Unit", discipline=discipline)

        root = TectonicUnit.objects.create(
            name="Root",
            title="Root",
            rankid=0,
            parent=None,
            treedef=tectonic_tree_def,
        )
        superstructure = TectonicUnit.objects.create(
            name="Superstructure",
            title="Superstructure",
            rankid=10,
            parent=root,
            treedef=tectonic_tree_def,
        )
        tectonic_domain = TectonicUnit.objects.create(
            name="Tectonic Domain",
            title="Tectonic Domain",
            rankid=20,
            parent=superstructure,
            treedef=tectonic_tree_def,
        )
        tectonic_subdomain = TectonicUnit.objects.create(
            name="Tectonic Subdomain",
            title="Tectonic Subdomain",
            rankid=30,
            parent=tectonic_domain,
            treedef=tectonic_tree_def,
        )
        tectonic_unit = TectonicUnit.objects.create(
            name="Tectonic Unit",
            title="Tectonic Unit",
            rankid=40,
            parent=tectonic_subdomain,
            treedef=tectonic_tree_def,
        )
        tectonic_subunit = TectonicUnit.objects.create(
            name="Tectonic Subunit",
            title="Tectonic Subunit",
            rankid=50,
            parent=tectonic_unit,
            treedef=tectonic_tree_def,
        )

def revert_default_tectonic_ranks(apps, schema_editor):
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        tectonic_tree_def = TectonicTreeDef.objects.filter(name="Tectonic Unit", discipline=discipline)
        if tectonic_tree_def:
            tectonic_tree_def.delete()

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0006_fix_tectonic_tree_fields'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        create_default_tectonic_ranks(apps)

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        revert_default_tectonic_ranks(apps, schema_editor)
    
    operations = [
                migrations.RunPython(consolidated_python_django_migration_operations, revert_cosolidated_python_django_migration_operations, atomic=True),
    ]