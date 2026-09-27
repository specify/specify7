from django.db import migrations
from django.db.models import F


def add_titles(apps, schema_editor):
    for model_name in (
        'Geographytreedefitem',
        'Taxontreedefitem',
        'Storagetreedefitem',
        'Tectonicunittreedefitem',
        'Lithostrattreedefitem',
        'Geologictimeperiodtreedefitem',
    ):
        model = apps.get_model('specify', model_name)
        model.objects.filter(title__isnull=True).update(title=F('name'))

class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0003_coordinate_fields_fix'),
    ]

    operations = [
        migrations.RunPython(add_titles, migrations.RunPython.noop)
    ]
