from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0003_coordinate_fields_fix'),
    ]

    operations = [
        migrations.RunSQL(
            """
            UPDATE geographytreedefitem
            SET Title = Name
            WHERE Title IS NULL;

            UPDATE taxontreedefitem
            SET Title = Name
            WHERE Title IS NULL;

            UPDATE storagetreedefitem
            SET Title = Name
            WHERE Title IS NULL;

            UPDATE tectonicunittreedefitem
            SET Title = Name
            WHERE Title IS NULL;

            UPDATE lithostrattreedefitem
            SET Title = Name
            WHERE Title IS NULL;

            UPDATE geologictimeperiodtreedefitem
            SET Title = Name
            WHERE Title IS NULL;
            """,
            # No reverse SQL because this change is irreversible
            reverse_sql=''
        )
    ]