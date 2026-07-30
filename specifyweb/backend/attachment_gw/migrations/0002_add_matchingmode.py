# Generated manually

from django.db import migrations, models
from specifyweb.specify.migration_utils.update_schema_config import (
    update_table_field_schema_config_with_defaults,
    revert_table_field_schema_config,
)


def apply_schema_config(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        update_table_field_schema_config_with_defaults(
            'Spattachmentdataset', discipline.id, 'matchingmode', apps,
            defaults={'name': 'Matching Mode', 'desc': 'Determines which method to use when matching records', 'ishidden': True}
        )


def revert_schema_config(apps, schema_editor):
    revert_table_field_schema_config('spattachmentdataset', 'matchingmode', apps)


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
        migrations.RunPython(apply_schema_config, revert_schema_config, atomic=True),
    ]
