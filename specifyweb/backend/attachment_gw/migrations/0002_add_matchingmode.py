# Generated manually

from django.db import migrations, models
from specifyweb.specify.migration_utils.schema_writer import (
    update_table_field_schema_config_with_defaults,
    revert_table_field_schema_config,
)


def apply_schema_config(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline_id, discipline_type in Discipline.objects.all().order_by('type').values_list('pk', 'type'):
        update_table_field_schema_config_with_defaults(
            table_name='Spattachmentdataset',
            discipline_id=discipline_id,
            discipline_type=discipline_type,
            field_name='matchingmode',
            apps=apps,
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
