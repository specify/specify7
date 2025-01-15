from django.db import migrations
from specifyweb.specify.utils import create_default_collection_types

class Migration(migrations.Migration):

    def handle_default_collection_types(apps, schema_editor):
        create_default_collection_types(apps)

    dependencies = [
        ('specify', '0021_update_hidden_geo_tables'),
    ]

    operations = [
        migrations.RunPython(handle_default_collection_types, atomic=True),
    ]

