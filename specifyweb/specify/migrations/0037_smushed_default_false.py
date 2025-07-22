from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0036_remove_spquery_selectseries'),
    ]

    operations = [
        migrations.AlterField(
            model_name='spquery',
            name='smushed',
            field=models.BooleanField(blank=True, null=True, default=False, db_column='Smushed'),
        )
    ]
