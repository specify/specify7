from django.db import migrations

from specifyweb.specify.migration_utils.restore_schema_constraints import restore_missing_constraints


def restore(apps, schema_editor):
    restore_missing_constraints(apps, schema_editor)


class Migration(migrations.Migration):
    """
    Repairs databases where specify.0001_initial failed part way on MySQL 8 and was
    then recorded as applied, leaving most indexes, unique constraints and foreign
    keys uncreated. A no-op on databases that are not affected.
    """

    dependencies = [
        ('specify', '0049_determination_current_taxon_index'),
    ]

    operations = [
        migrations.RunPython(restore, migrations.RunPython.noop, atomic=False),
    ]
