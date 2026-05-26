from django.db import migrations
from django.db.models import UniqueConstraint
from uuid import uuid4


DEFAULT_INDEX_NAME = 'CollectionID'


def name_generator():
    """ Looks like Specify 6 generates unique index names on CollectionObject
    in the following pattern: 
    CollectionID
    CollectionID_2
    CollectionID_3
    ...
    """
    current = 2
    name_generation_limit = 100
    while current <= name_generation_limit:
        yield DEFAULT_INDEX_NAME + "_" + str(current)
        current += 1
    yield DEFAULT_INDEX_NAME + "_" + str(uuid4())


def uniquify_index_name(connection) -> str:
    db_name = connection.settings_dict['NAME']
    cursor = connection.cursor()
    sql = """
        SELECT DISTINCT stat.INDEX_NAME
        FROM information_schema.statistics stat
        WHERE stat.TABLE_SCHEMA = %s
            AND stat.TABLE_NAME = 'collectionobject'
            AND stat.INDEX_NAME LIKE %s
        ORDER BY stat.INDEX_NAME;
        """
    args = [db_name, DEFAULT_INDEX_NAME + "%"]
    cursor.execute(sql, args)
    rows: tuple[tuple[str], ...] = cursor.fetchall()
    index_names = [row[0] for row in rows]
    if DEFAULT_INDEX_NAME not in index_names:
        return DEFAULT_INDEX_NAME
    else:
        index_names.remove(DEFAULT_INDEX_NAME)

    for name in name_generator():
        if name not in index_names:
            return name


def get_index_names(connection) -> tuple[str]:
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
    rows: tuple[tuple[str], ...] = cursor.fetchall()
    return [row[0] for row in rows]


def remove_constraint(apps, schema_editor):
    connection = schema_editor.connection
    index_names = get_index_names(connection)
    CollectionObject = apps.get_model('specify', 'Collectionobject')
    in_atomic_block = connection.in_atomic_block
    connection.in_atomic_block = False
    for index_name in index_names:
        schema_editor.remove_constraint(CollectionObject, UniqueConstraint(
            fields=["catalognumber", 'collection'], name=index_name))
    connection.in_atomic_block = in_atomic_block


def add_constraint(apps, schema_editor):
    connection = schema_editor.connection
    CollectionObject = apps.get_model('specify', 'Collectionobject')
    index_names = get_index_names(connection)
    if len(index_names) == 0:
        in_atomic_block = connection.in_atomic_block
        connection.in_atomic_block = False
        schema_editor.add_constraint(CollectionObject, UniqueConstraint(
            fields=['catalognumber', 'collection'], name=uniquify_index_name(connection)))
        connection.in_atomic_block = in_atomic_block


class Migration(migrations.Migration):
    dependencies = [
        ('businessrules', '0002_default_unique_rules')
    ]

    operations = [
        migrations.RunPython(remove_constraint, add_constraint, atomic=True)
    ]
