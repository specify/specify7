from typing import Optional, Tuple
from django.db import migrations
from django.db.models import UniqueConstraint


DEFAULT_INDEX_NAME = 'CollectionID'

def get_index_names(connection) -> Tuple[str]:
    db_name = connection.settings_dict['NAME']
    cursor = connection.cursor()
    sql = """
        SELECT stat.INDEX_NAME
        FROM information_schema.statistics stat
        WHERE stat.TABLE_SCHEMA = %s
            AND stat.TABLE_NAME = 'collectionobject'
            AND stat.NON_UNIQUE = 0
        GROUP BY stat.INDEX_NAME
        HAVING MAX(stat.SEQ_IN_INDEX) = 2
            AND SUM(
                stat.COLUMN_NAME IN ('catalognumber', 'collectionid')
            ) = 2;
        """
    args = [db_name]
    cursor.execute(sql, args)
    rows: Tuple[Tuple[str], ...] = cursor.fetchall()
    return [row[0] for row in rows]

def remove_constraint(apps, schema_editor): 
    connection = schema_editor.connection
    index_names = get_index_names(connection)
    CollectionObject = apps.get_model('specify', 'Collectionobject')
    in_atomic_block = connection.in_atomic_block
    connection.in_atomic_block = False
    for index_name in index_names: 
        schema_editor.remove_constraint(CollectionObject, UniqueConstraint(fields=["catalognumber", 'collection'], name=index_name))
    connection.in_atomic_block = in_atomic_block


def add_constraint(apps, schema_editor): 
    connection = schema_editor.connection
    CollectionObject = apps.get_model('specify', 'Collectionobject')
    index_names = get_index_names(connection)
    if len(index_names) == 0:
        in_atomic_block = connection.in_atomic_block
        connection.in_atomic_block = False
        schema_editor.add_constraint(CollectionObject, UniqueConstraint(fields=['catalognumber', 'collection'], name=DEFAULT_INDEX_NAME))
        connection.in_atomic_block = in_atomic_block


class Migration(migrations.Migration): 
    dependencies = [
        ('businessrules', '0002_default_unique_rules')
    ]

    operations = [
        migrations.RunPython(remove_constraint, add_constraint, atomic=True)
    ]