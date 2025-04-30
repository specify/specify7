"""
This migration updates the geo tables hidden proprety in schema config.
"""

from django.db import migrations
from specifyweb.specify.migration_utils import update_schema_config as usc

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0020_add_tectonicunit_to_pc_in_schema_config'),
    ]

    operations = [
        migrations.RunPython(usc.fix_hidden_geo_prop, usc.reverse_fix_hidden_geo_prop, atomic=True)
    ]