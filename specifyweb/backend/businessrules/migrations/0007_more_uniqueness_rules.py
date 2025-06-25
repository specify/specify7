import logging

from django.db import migrations
from specifyweb.backend.businessrules.uniqueness_rules import DEFAULT_UNIQUENESS_RULES, check_uniqueness, create_uniqueness_rule, remove_uniqueness_rule, join_with_and

logger = logging.getLogger(__name__)

NEW_RULES = {
    "Accessionauthorization": (
        (("permit",), ("accession",)),
        (("permit",), ("repositoryAgreement",))
    ),
    "Collectingeventauthorization": (
        (("permit",), ("collectingEvent",)),
    ),
    "Collectingtripauthorization": (
        (("permit",), ("collectingTrip",)),
    ),
    "Deaccession": (
        (("deaccessionNumber",), tuple()),
    ),
    "Disposal": (
        (("disposalNumber",), tuple()),
    ),
    "Exchangeout": (
        (("exchangeOutNumber",), ("division",)),
    )
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
                    logger.info("Skipping creating rule with existing duplicates: '{table} must have unique {fields}{scopes}'".format(
                        table=table, fields=join_with_and(fields), scopes="" if len(scopes) == 0 else f" in {join_with_and(scopes)}"))
                    continue
                # create the uniqueness rule if there are no violating duplicates
                create_uniqueness_rule(
                    table, discipline, False, fields, scopes, apps)


def revert_migration(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        for table, rules in NEW_RULES.items():
            for rule in rules:
                fields, scopes = rule
                remove_uniqueness_rule(
                    table, discipline, False, fields, scopes, apps)


class Migration(migrations.Migration):

    dependencies = [
        ('businessrules', '0006_storage_uniqueIdentifier'),
    ]

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]
