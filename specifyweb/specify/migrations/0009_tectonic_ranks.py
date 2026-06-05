from django.db import migrations
from django.db.models import Exists, OuterRef, Subquery

from specifyweb.specify.migration_utils.tectonic_ranks import (
    create_default_tectonic_ranks,
    create_root_tectonic_node,
    DEFAULT_RANKS
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

# REFACTOR: Optimize this
def revert_default_tectonic_ranks(apps, schema_editor=None):
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    for default_rank in reversed(DEFAULT_RANKS):
        tree_def_items = TectonicUnitTreeDefItem.objects.annotate(
            has_child_rank=Exists(
                TectonicUnitTreeDefItem.objects.filter(
                    parent=OuterRef("pk")
                )
            )
        ).filter(
            has_child_rank=False,
            name=default_rank["name"],
            # rankid=default_rank["rankid"]
        )

        units_to_delete = TectonicUnit.objects.annotate(
            has_children_nodes=Exists(
                TectonicUnit.objects.filter(
                    parent=OuterRef("pk")
                )
            )
        ).filter(
            has_children_nodes=False,
            definitionitem__in=tree_def_items
        )
        TectonicUnit.objects.filter(
            acceptedtectonicunit_id__in=units_to_delete.values_list('pk', flat=True)
        ).update(
            acceptedtectonicunit=None,
            isaccepted=True
        )

        units_to_delete.delete()
        tree_def_items.delete()

    empty_tree_defs = TectonicTreeDef.objects.annotate(
        has_ranks=Exists(
            TectonicUnitTreeDefItem.objects.filter(
                treedef=OuterRef("pk")
            )
        )
    ).filter(
        has_ranks=False
    )

    Discipline.objects.filter(
        tectonicunittreedef_id__in=empty_tree_defs.values_list('pk', flat=True)
    ).update(
        tectonicunittreedef=None
    )
    empty_tree_defs.delete()

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
