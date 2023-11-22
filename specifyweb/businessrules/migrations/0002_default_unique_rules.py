import json

from typing import Dict, List, Union

from django.db import migrations
from django.core.exceptions import MultipleObjectsReturned

from specifyweb.specify import models as spmodels
from specifyweb.businessrules.models import UniquenessRule


DEFAULT_UNIQUENESS_RULES: Dict[str, List[Dict[str, Union[List[List[str]], bool]]]] = json.load(
    open('specifyweb/businessrules/uniqueness_rules.json'))


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

            new_rule = UniquenessRule(
                scope=scope_container_item, isDatabaseConstraint=is_db_constraint, discipline=discipline)
            new_rule.save()

            new_rule.splocalecontaineritems.add(*items)


def apply_rules_to_discipline(apps, schema_editor):
    for disp in spmodels.Discipline.objects.all():
        apply_default_uniqueness_rules(disp)


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('specify', '__first__'),
        ('businessrules', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(apply_rules_to_discipline),
    ]
