from django.db import migrations

from specifyweb.specify.migration_utils.tectonic_ranks import (
    create_default_tectonic_ranks,
    create_root_tectonic_node,
    revert_create_root_tectonic_node,
    revert_default_tectonic_ranks,
)

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
        migrations.RunPython(
            consolidated_python_django_migration_operations,
            revert_cosolidated_python_django_migration_operations,
            atomic=True,
        )
    ]
