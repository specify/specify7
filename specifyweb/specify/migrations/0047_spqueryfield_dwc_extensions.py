from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0046_add_tectonicunit_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='spqueryfield',
            name='term',
            field=models.CharField(
                blank=True, db_column='Term', db_index=False,
                max_length=500, null=True,
            ),
        ),
        migrations.AddField(
            model_name='spqueryfield',
            name='isstatic',
            field=models.BooleanField(
                blank=True, db_column='IsStatic', default=False, null=True,
            ),
        ),
        migrations.AddField(
            model_name='spqueryfield',
            name='staticvalue',
            field=models.TextField(
                blank=True, db_column='StaticValue', null=True,
            ),
        ),
    ]
