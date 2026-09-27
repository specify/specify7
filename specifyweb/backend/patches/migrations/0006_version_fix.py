from django.db import migrations

def set_null_versions_to_zero_and_default(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            cursor.execute("""
                SELECT table_name, column_name
                FROM information_schema.columns
                WHERE lower(column_name) = 'version'
                  AND table_schema = current_schema();
            """)
        else:
            cursor.execute("""
                SELECT table_name, column_name
                FROM information_schema.columns
                WHERE column_name = 'version' AND table_schema = DATABASE()
                AND table_name IN (
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
                );
            """)
        tables = cursor.fetchall()

        for table_name, column_name in tables:
            quoted_table = connection.ops.quote_name(table_name)
            quoted_column = connection.ops.quote_name(column_name)
            # Set all NULL values to 0
            cursor.execute(
                f"UPDATE {quoted_table} SET {quoted_column} = 0 "
                f"WHERE {quoted_column} IS NULL;"
            )
            # Set default to 0 at the DB level
            if connection.vendor == 'postgresql':
                cursor.execute(
                    f"ALTER TABLE {quoted_table} ALTER COLUMN {quoted_column} "
                    "SET DEFAULT 0;"
                )
            else:
                cursor.execute(
                    f"ALTER TABLE {quoted_table} MODIFY {quoted_column} INT DEFAULT 0;"
                )

class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0005_chrono_start_end'),
        ('specify', '0035_version_required'),
    ]

    operations = [
        migrations.RunPython(set_null_versions_to_zero_and_default,
        migrations.RunPython.noop, atomic=True)
    ]
