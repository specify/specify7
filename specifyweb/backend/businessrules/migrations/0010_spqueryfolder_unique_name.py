import logging

from django.db import migrations
from specifyweb.backend.businessrules.uniqueness_rules import check_uniqueness, create_uniqueness_rule, remove_uniqueness_rule

logger = logging.getLogger(__name__)

NEW_RULES = {
    "Spqueryfolder": (
        (("name",), ("specifyUser",)),
    ),
}


def apply_migration(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        for table, rules in NEW_RULES.items():
            for rule in rules:
                fields, scopes = rule
                check_results = check_uniqueness(table, fields, scopes, apps)
                if check_results is None:
                    logger.info(
                        f"Skipping creating uniqueness rule for invalid model: {table}")
                    continue
                if check_results["totalDuplicates"] > 0:
                    logger.info(
                        f"Skipping creating rule with existing duplicates: "
                        f"'{table} must have unique {fields} in {scopes}'")
                    continue
                create_uniqueness_rule(
                    model_name=table,
                    discipline=discipline,
                    is_database_constraint=False,
                    fields=fields,
                    scopes=scopes,
                    registry=apps
                )


def revert_migration(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        for table, rules in NEW_RULES.items():
            for rule in rules:
                fields, scopes = rule
                remove_uniqueness_rule(
                    model_name=table,
                    discipline=discipline,
                    is_database_constraint=False,
                    fields=fields,
                    scopes=scopes,
                    registry=apps
                )


class Migration(migrations.Migration):

    dependencies = [
        ('businessrules', '0009_alter_uniquenessrule_discipline'),
        ('specify', '0050_query_folder_feature'),
    ]

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]
