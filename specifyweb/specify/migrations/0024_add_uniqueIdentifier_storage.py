from django.db import migrations, models
from specifyweb.businessrules.uniqueness_rules import DEFAULT_UNIQUENESS_RULES, create_uniqueness_rule
from specifyweb.specify.migration_utils import update_schema_config as usc

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0023_update_schema_config_text'),
    ]

    def apply_migration(apps, schema_editor):
        usc.update_storage_unique_id_fields(apps)

    def revert_migration(apps, schema_editor):
        usc.revert_storage_unique_id_fields(apps)

    operations = [
        migrations.AddField(
            model_name='storage',
            name='uniqueIdentifier',
            field=models.CharField(blank=True, db_column='UniqueIdentifier', max_length=255, null=True, unique=True),
        ),
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]
