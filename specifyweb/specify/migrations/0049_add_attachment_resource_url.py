from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0048_taxontreedefitem_parent_context_delete'),
    ]

    operations = [
        migrations.AddField(
            model_name='attachment',
            name='resourceurl',
            field=models.CharField(
                blank=True,
                db_column='ResourceURL',
                max_length=1024,
                null=True,
            ),
        ),
    ]
