from django.db import migrations
from django.db.models import Exists, OuterRef

from specifyweb.specify.migration_utils.tectonic_ranks import (
    create_default_tectonic_ranks,
    create_root_tectonic_node
)

def revert_create_root_tectonic_node(apps, schema_editor=None):
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')

    # Technically at this point a user could have more than just the root node
    # in the tree, so only delete the TectonicUnit nodes which were created
    # from create_root_tectonic_node and are alone in the tree
    TectonicUnit.objects.annotate(
        has_children_nodes=Exists(
            TectonicUnit.objects.filter(
                parent=OuterRef("pk")
            )
        )
    ).filter(
        parent__isnull=True,
        has_children_nodes=False,
        name="Root"
    ).delete()

    # Delete the Root TectonicUnit rank if there are no nodes in the tree and
    # no children rank reference the Root rank
    TectonicUnitTreeDefItem.objects.annotate(
        has_nodes=Exists(
            TectonicUnit.objects.filter(
                definitionitem=OuterRef("pk")
            )
        ),
        has_child_rank=Exists(
            TectonicUnitTreeDefItem.objects.filter(
                parent=OuterRef("pk")
            )
        )
    ).filter(
        has_nodes=False,
        has_child_rank=False,
        name="Root"
    ).delete()

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

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0008_ageCitations_fix'),
    ]

    def consolidated_python_django_migration_operations(apps, schema_editor):
        create_default_tectonic_ranks(apps)
        create_root_tectonic_node(apps)

    def revert_cosolidated_python_django_migration_operations(apps, schema_editor):
        revert_create_root_tectonic_node(apps, schema_editor)
        revert_default_tectonic_ranks(apps, schema_editor)

    operations = [
        migrations.RunPython(
            consolidated_python_django_migration_operations,
            revert_cosolidated_python_django_migration_operations,
            atomic=True,
        )
    ]
