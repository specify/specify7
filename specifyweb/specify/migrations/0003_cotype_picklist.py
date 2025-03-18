from django.db import migrations
from specifyweb.specify.migration_utils import update_schema_config as usc
from specifyweb.specify.migration_utils.default_cots import create_cotype_picklist, revert_cotype_picklist

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0002_geo'),
    ]

    def apply_migration(apps, schema_editor):
        create_cotype_picklist(apps)
        usc.create_cotype_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        revert_cotype_picklist(apps)
        usc.revert_cotype_splocalecontaineritem(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]