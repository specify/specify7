from django.db import migrations, models
from specifyweb.backend.businessrules.uniqueness_rules import create_uniqueness_rule, remove_uniqueness_rule

def apply_migration(apps, schema_editor):
    create_uniqueness_rule(
        model_name="Storage",
        discipline=None,
        is_database_constraint=True,
        fields=["uniqueIdentifier"],
        scopes=[],
        registry=apps
    )

def revert_migration(apps, schema_editor):
    remove_uniqueness_rule(
        model_name="Storage",
        discipline=None,
        is_database_constraint=True,
        fields=["uniqueIdentifier"],
        scopes=[],
        registry=apps
    )

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0024_add_uniqueIdentifier_storage'),
        ('businessrules', '0005_cojo'),
    ]

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]
