from django.db import migrations, connection

def reverse_faulty_end_start_period(apps, schema_editor):
    from django.db import connection

    with connection.cursor() as cursor:
        # Check if the table geologictimeperiod exists
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_name = 'geologictimeperiod' AND table_schema = DATABASE();
        """)
        if cursor.fetchone()[0] != 1:
            raise RuntimeError("Expected table 'geologictimeperiod' does not exist. Migration cannot proceed.")

        # Perform the update if the table exists
        cursor.execute("""
            UPDATE geologictimeperiod AS gtp
            JOIN (
                SELECT GeologicTimePeriodID, StartPeriod AS orig_start
                FROM geologictimeperiod
                WHERE StartPeriod < EndPeriod
            ) AS sub ON gtp.GeologicTimePeriodID = sub.GeologicTimePeriodID
            SET 
                gtp.StartPeriod = gtp.EndPeriod,
                gtp.EndPeriod = sub.orig_start;
        """)
class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0004_add_title_tree_rank_fix'),
    ]

    operations = [
        migrations.RunPython(reverse_faulty_end_start_period),
    ]