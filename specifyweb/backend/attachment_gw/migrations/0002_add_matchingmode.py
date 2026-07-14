# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attachment_gw', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='spattachmentdataset',
            name='matchingmode',
            field=models.CharField(max_length=32, null=True, default=None),
        ),
    ]
