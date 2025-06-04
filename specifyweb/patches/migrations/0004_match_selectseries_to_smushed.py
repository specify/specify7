from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0003_coordinate_fields_fix'),
    ]

    operations = [
        migrations.RunSQL(
            """
            UPDATE spquery
            SET SelectSeries = 1
            WHERE Smushed = 1;
            """,
            reverse_sql=''
        )
    ]
