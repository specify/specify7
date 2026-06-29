"""
Fix index definitions created in 0048:
- DetCurrColMemIDX → DetColMemCurrIDX: reorder columns for better selectivity
- CojoIsPrimaryIDX → CojoParentPrimaryIDX: compound index matching query pattern

For databases that ran the original 0048, this drops the old indexes.
For fresh databases (running revised 0048 directly), the drops are no-ops.
"""

from django.db import migrations


def drop_old_indexes(apps, schema_editor):
    """Drop indexes from the original 0048 if they exist."""
    with schema_editor.connection.cursor() as cursor:
        for index_name, table_name in [
            ('DetCurrColMemIDX', 'determination'),
            ('CojoIsPrimaryIDX', 'collectionobjectgroupjoin'),
        ]:
            cursor.execute(
                "SELECT COUNT(*) FROM information_schema.statistics "
                "WHERE table_schema = DATABASE() AND table_name = %s "
                "AND index_name = %s",
                [table_name, index_name],
            )
            if cursor.fetchone()[0] > 0:
                cursor.execute(f"DROP INDEX `{index_name}` ON `{table_name}`")


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0048_add_tree_performance_indexes'),
    ]

    operations = [
        migrations.RunPython(drop_old_indexes, migrations.RunPython.noop),
    ]
