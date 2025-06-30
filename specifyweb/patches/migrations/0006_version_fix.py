from django.db import migrations, connection

def set_null_versions_to_zero_and_default(apps, schema_editor):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name
            FROM information_schema.columns
            WHERE column_name = 'version' AND table_schema = DATABASE();
        """)
        tables = cursor.fetchall()

        for (table_name,) in tables:
            # Set all NULL values to 0
            cursor.execute(f"UPDATE `{table_name}` SET `version` = 0 WHERE `version` IS NULL;")
            # Set default to 0 at the DB level
            cursor.execute(f"ALTER TABLE `{table_name}` MODIFY `version` INT DEFAULT 0;")

class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0005_chrono_start_end'),
    ]

    operations = [
        migrations.RunPython(set_null_versions_to_zero_and_default),
    ]
