# Generated manually: adds Spquery.isdataview used to distinguish Data View queries

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0048_taxontreedefitem_parent_context_delete'),
    ]

    operations = [
        migrations.AddField(
            model_name='spquery',
            name='isdataview',
            field=models.BooleanField(blank=True, db_column='IsDataView', default=False, null=True),
        ),
    ]
