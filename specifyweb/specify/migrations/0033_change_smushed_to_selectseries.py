from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0032_remove_spquery_selectseries'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE spquery CHANGE COLUMN Smushed SelectSeries BIT(1);
            """,
            reverse_sql="""
                ALTER TABLE spquery CHANGE COLUMN SelectSeries Smushed BIT(1);
            """
        ),
    ]