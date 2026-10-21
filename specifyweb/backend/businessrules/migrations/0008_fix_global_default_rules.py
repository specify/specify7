import logging
from django.db import migrations
from specifyweb.backend.businessrules.uniqueness_rules import fix_global_default_rules

logger = logging.getLogger(__name__)

def apply_migration(apps, schema_editor):
    fix_global_default_rules(apps)

class Migration(migrations.Migration):

    dependencies = [
        ('businessrules', '0007_more_uniqueness_rules'),
    ]

    operations = [
        migrations.RunPython(apply_migration, migrations.RunPython.noop, atomic=True)
    ]
