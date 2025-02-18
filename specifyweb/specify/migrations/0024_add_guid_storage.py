from django.db import migrations, models
import specifyweb.specify.models

from specifyweb.specify.migration_utils.update_schema_config import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
from specifyweb.specify.migration_utils.sp7_schemaconfig import MIGRATION_0024_FIELDS as SCHEMA_CONFIG_MOD_TABLE_FIELDS

def update_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')

    # Add guid -> storage
    for discipline in Discipline.objects.all():
        for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items(): 
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def revert_update_fields(apps):
    # Remove guid -> storage
    for table, fields in SCHEMA_CONFIG_MOD_TABLE_FIELDS.items(): 
        for field in fields: 
            revert_table_field_schema_config(table, field, apps)

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0023_update_schema_config_text'),
    ]

    def apply_migration(apps, schema_editor):
        update_fields(apps)

    def revert_migration(apps, schema_editor):
        revert_update_fields(apps)

    operations = [
        migrations.AddField(
            model_name='storage',
            name='guid',
            field=models.CharField(blank=True, db_column='GUID', max_length=255, null=True, unique=True),
        ),
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]
