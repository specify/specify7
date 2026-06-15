from django.db import migrations

from specifyweb.specify.migration_utils.tectonic_ranks import (
    create_default_tectonic_ranks,
    create_root_tectonic_node,
)

def delete_tectonicunit_trees(apps, schema_editor=None):
    TectonicUnit = apps.get_model('specify', 'TectonicUnit')
    TectonicUnitTreeDefItem = apps.get_model('specify', 'TectonicUnitTreeDefItem')
    TectonicTreeDef = apps.get_model('specify', 'TectonicUnitTreeDef')
    Discipline = apps.get_model('specify', 'Discipline')

    TectonicUnit.objects.all().update(parent=None, acceptedtectonicunit=None)
    TectonicUnit.objects.delete()

    TectonicUnitTreeDefItem.objects.all().update(parent=None)
    TectonicUnitTreeDefItem.objects.all().delete()

    Discipline.objects.all().update(tectonicunittreedef=None)
    TectonicTreeDef.objects.all().delete()

def consolidated_python_django_migration_operations(apps, schema_editor):
    create_default_tectonic_ranks(apps)
    create_root_tectonic_node(apps)

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0008_ageCitations_fix'),
    ]

    operations = [
        migrations.RunPython(
            consolidated_python_django_migration_operations,
            delete_tectonicunit_trees,
            atomic=True,
        )
    ]
