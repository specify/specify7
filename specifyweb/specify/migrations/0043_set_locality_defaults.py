from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("specify", "0042_discipline_type_picklist"),
    ]

    operations = [
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
    ]