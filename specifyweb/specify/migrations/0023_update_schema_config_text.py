"""
This migration updates descriptions, caption and isHidden value for various fields and tables in schema config.
"""

from django.db import migrations
from specifyweb.specify.migration_utils import update_schema_config as usc

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0022_ensure_default_cots'),
        ('businessrules', '0005_cojo') 
        # Needed for reverting since 0024 has a businessrules dependency.
        # See: https://docs.djangoproject.com/en/dev/topics/migrations/#accessing-models-from-other-apps
    ]

    operations = [
        migrations.RunPython(
            usc.update_schema_config_field_desc, usc.reverse_update_schema_config_field_desc, atomic=True
        ),
        migrations.RunPython(
            usc.update_hidden_prop, usc.reverse_update_hidden_prop, atomic=True
        ),
    ]