# specifyweb/specify/migrations/XXXX_locality_srclatlongunit_default.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("specify", "0042_discipline_type_picklist"),
    ]

    operations = [
        # Backfill any bad existing rows (should be rare, but safe)
        migrations.RunSQL(
            """
            UPDATE locality
            SET SrcLatLongUnit = 0
            WHERE SrcLatLongUnit IS NULL;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Make Django reflect the default going forward
        migrations.AlterField(
            model_name="locality",
            name="srclatlongunit",
            field=models.SmallIntegerField(
                blank=False,
                null=False,
                default=0,
                unique=False,
                db_column="SrcLatLongUnit",
                db_index=False,
            ),
        ),

        # Make MySQL enforce the same default
        migrations.RunSQL(
            """
            ALTER TABLE locality
            MODIFY SrcLatLongUnit SMALLINT NOT NULL DEFAULT 0;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]