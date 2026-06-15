"""
This migration updates descriptions, caption and isHidden value for various fields and tables in schema config.
"""

from django.db import migrations
from specifyweb.specify.migration_utils import migration_helpers as usc
from specifyweb.specify.migration_utils.migration_helpers.helper_0023_update_schema_config_text import reverse_update_hidden_prop, reverse_update_schema_config_field_desc, update_hidden_prop, update_schema_config_field_desc

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0022_ensure_default_cots'),
        ('businessrules', '0005_cojo') 
        # Needed for reverting since 0024 has a businessrules dependency.
        # See: https://docs.djangoproject.com/en/dev/topics/migrations/#accessing-models-from-other-apps
    ]

    operations = [
        migrations.RunPython(
            update_schema_config_field_desc, reverse_update_schema_config_field_desc, atomic=True
        ),
        migrations.RunPython(
            update_hidden_prop, reverse_update_hidden_prop, atomic=True
        ),
    ]