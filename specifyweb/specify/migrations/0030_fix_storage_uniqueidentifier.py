# Generated by Django 4.2.18 on 2025-05-16 10:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0029_remove_collectionobject_parentco'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='storage',
            name='uniqueIdentifier',
        ),
        migrations.AddField(
            model_name='storage',
            name='uniqueidentifier',
            field=models.CharField(blank=True, db_column='UniqueIdentifier', max_length=128, null=True, unique=True),
        ),
    ]
