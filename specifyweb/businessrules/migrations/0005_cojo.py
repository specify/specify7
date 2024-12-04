from django.db import migrations

from specifyweb.businessrules.uniqueness_rules import create_uniqueness_rule, DEFAULT_UNIQUENESS_RULES

"""
    Applies the COJO uniqueness rule to the database.
"""
def apply_migration(apps, schema_editor):
    cojo_rules = DEFAULT_UNIQUENESS_RULES["CollectionObjectGroupJoin"]

    for rule in cojo_rules:
        fields, scopes = rule["rule"]
        isDatabaseConstraint = rule["isDatabaseConstraint"]
        create_uniqueness_rule(
            'Collectionobjectgroupjoin', None, isDatabaseConstraint, fields, scopes, apps
        )

"""
    Revert is skipped as this rule should ideally have been applied through the 0002_default_unique_rules migration.
    The rule will be reversed when 0002_default_unique_rules is reversed.
"""
def revert_migration(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0002_geo'),
        ('businessrules', '0004_catnum_uniquerule')
    ]

    operations = [
        migrations.RunPython(apply_migration,
                             revert_migration, atomic=True),
    ]
