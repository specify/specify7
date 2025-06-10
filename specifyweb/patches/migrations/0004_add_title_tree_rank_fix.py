from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0003_coordinate_fields_fix'),
    ]

    operations = [
        migrations.RunSQL(
            """
            UPDATE taxontreedefitem
            SET Title = Name
            WHERE Title IS NULL;
            """,
            # No reverse SQL because this change is irreversible
            reverse_sql=''
        )
    ]