# Generated by Django 3.2.15 on 2025-04-17 15:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workbench', '0007_spdatasetattachment'),
    ]

    operations = [
        migrations.AddField(
            model_name='spdataset',
            name='rolledback',
            field=models.BooleanField(default=False, null=True),
        ),
    ]
