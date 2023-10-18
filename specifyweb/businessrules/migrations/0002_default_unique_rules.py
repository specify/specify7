from django.db import migrations
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from specifyweb.specify import models as spmodels
from specifyweb.businessrules.models import UniquenessRule

DEFAULT_UNIQUENESS_RULES = {
    "Accession": [
        {
            "rule": [['accessionNumber'], ['division']],
            "isDatabaseConstraint": False,
        },
    ],
    "Accessionagent": [
        {
            "rule": [['role', 'agent'], ['accession']],
            "isDatabaseConstraint": True,
        },
    ],
    "Appraisal": [
        {
            "rule": [['appraisalNumber'], ['accession']],
            "isDatabaseConstraint": True,
        },
    ],
    "Author": [
        {
            "rule": [['agent'], ['referenceWork']],
            "isDatabaseConstraint": True,
        },
        {
            "rule": [['orderNumber'], ['referenceWork']],
            "isDatabaseConstraint": False,
        },
    ],
    "Borrowagent": [
        {
            "rule": [['role', 'agent'], ['borrow']],
            "isDatabaseConstraint": True,
        },
    ],
    "Collection": [
        {
            "rule": [['collectionName'], ['discipline']],
            "isDatabaseConstraint": False,
        },
        {
            "rule": [['code'], ['discipline']],
            "isDatabaseConstraint": False,
        },
    ],
    "Collectingevent": [
        {
            "rule": [['uniqueIdentifier'], []],
            "isDatabaseConstraint": True,
        },
    ],
    "Collectionobject": [
        {
            "rule": [['catalogNumber'], ['collection']],
            "isDatabaseConstraint": True,
        },
        {
            "rule": [['uniqueIdentifier'], []],
            "isDatabaseConstraint": True,
        },
        {
            "rule": [['guid'], []],
            "isDatabaseConstraint": False,
        },
    ],
    "Collector": [
        {
            "rule": [['agent'], ['collectingEvent']],
            "isDatabaseConstraint": True,
        },
    ],
    "Determiner": [
        {
            "rule": [['agent'], ['determination']],
            "isDatabaseConstraint": True,
        },
    ],
    "Discipline": [
        {
            "rule": [['name'], ['division']],
            "isDatabaseConstraint": False,
        },
    ],
    "Disposalagent": [
        {
            "rule": [['role', 'agent'], ['disposal']],
            "isDatabaseConstraint": True,
        },
    ],
    "Division": [
        {
            "rule": [['name'], ['institution']],
            "isDatabaseConstraint": False,
        },
    ],
    "Extractor": [
        {
            "rule": [['agent'], ['dnaSequence']],
            "isDatabaseConstraint": True,
        },
    ],
    "Fundingagent": [
        {
            "rule": [['agent'], ['collectingTrip']],
            "isDatabaseConstraint": True,
        },
    ],
    "Gift": [
        {
            "rule": [['giftNumber'], ['discipline']],
            "isDatabaseConstraint": False,
        },
    ],
    "Giftagent": [
        {
            "rule": [['role', 'agent'], ['gift']],
            "isDatabaseConstraint": True,
        },
    ],
    "Groupperson": [
        {
            "rule": [['member'], ['group']],
            "isDatabaseConstraint": True,
        },
    ],
    "Institution": [
        {
            "rule": [['name'], []],
            "isDatabaseConstraint": False,
        },
    ],
    "Loan": [
        {
            "rule": [['loanNumber'], ['discipline']],
            "isDatabaseConstraint": False,
        },
    ],
    "Loanagent": [
        {
            "rule": [['role', 'agent'], ['loan']],
            "isDatabaseConstraint": True,
        },
    ],
    "Locality": [
        {
            "rule": [['uniqueIdentifier'], []],
            "isDatabaseConstraint": True,
        },
    ],
    "Localitycitation": [
        {
            "rule": [['referenceWork'], ['locality']],
            "isDatabaseConstraint": True,
        },
    ],
    "Pcrperson": [
        {
            "rule": [['agent'], ['dnaSequence']],
            "isDatabaseConstraint": True,
        },
    ],
    "Permit": [
        {
            "rule": [['permitNumber'], []],
            "isDatabaseConstraint": False,
        },
    ],
    "Picklist": [
        {
            "rule": [['name'], ['collection']],
            "isDatabaseConstraint": False,
        },
    ],
    "Preparation": [
        {
            "rule": [['barCode'], ['Collection']],
            "isDatabaseConstraint": True,
        },
    ],
    "Preptype": [
        {
            "rule": [['name'], ['collection']],
            "isDatabaseConstraint": False,
        },
    ],
    "Repositoryagreement": [
        {
            "rule": [['repositoryAgreementNumber'], ['division']],
            "isDatabaseConstraint": False,
        },
    ],
    "Spappresourcedata": [
        {
            "rule": [['spAppResource'], []],
            "isDatabaseConstraint": False,
        },
    ],
    "Specifyuser": [
        {
            "rule": [['name'], []],
            "isDatabaseConstraint": True,
        },
    ],
    "Taxontreedef": [
        {
            "rule": [['name'], ['discipline']],
            "isDatabaseConstraint": False,
        },
    ],
    "Taxontreedefitem": [
        {
            "rule": [['name'], ['treeDef']],
            "isDatabaseConstraint": False,
        },
        {
            "rule": [['title'], ['treeDef']],
            "isDatabaseConstraint": False,
        },
    ],
}


def apply_default_uniqueness_rules(discipline: spmodels.Discipline):
    containers = discipline.splocalecontainers.get_queryset()
    for container in containers:
        if not container.name.lower().capitalize() in DEFAULT_UNIQUENESS_RULES.keys() \
            or container.schematype != 0:
            continue

        rules = DEFAULT_UNIQUENESS_RULES[container.name.lower().capitalize()]
        for rule in rules:
            unique_fields, scope = rule["rule"]
            is_db_constraint = rule["isDatabaseConstraint"]

            items = container.items.get_queryset().filter(name__in=unique_fields)
            if len(items) == 0:
                continue

            try:
                scope_container_item = container.items.get_queryset().get(
                    name=scope[0]) if len(scope) > 0 else None
            except MultipleObjectsReturned:
                continue
            except ObjectDoesNotExist:
                continue

            new_rule = UniquenessRule(
                scope=scope_container_item, isdatabaseconstraint=is_db_constraint, discipline=discipline)
            new_rule.save()

            new_rule.splocalecontaineritems.add(*items)


def migration_func(apps, schema_editor):
    for disp in spmodels.Discipline.objects.all():
        apply_default_uniqueness_rules(disp)


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('specify', '__first__'),
        ('businessrules', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migration_func),
    ]
