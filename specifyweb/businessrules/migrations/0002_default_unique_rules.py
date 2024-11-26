from django.db import migrations

from specifyweb.specify.datamodel import datamodel
from specifyweb.businessrules.uniqueness_rules import apply_default_uniqueness_rules, rule_is_global, DEFAULT_UNIQUENESS_RULES


def apply_default_rules(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')
    for disp in Discipline.objects.all():
        apply_default_uniqueness_rules(disp, registry=apps)


def remove_default_rules(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')
    UniquenessRule = apps.get_model('businessrules', 'UniquenessRule')
    UniquenessRuleFields = apps.get_model(
        'businessrules', 'UniquenessRuleField')

    for discipline in Discipline.objects.all():
        remove_rules_from_discipline(
            discipline, UniquenessRule, UniquenessRuleFields)


def remove_rules_from_discipline(discipline, uniqueness_rule, uniquenessrule_fields):
    for table, rules in DEFAULT_UNIQUENESS_RULES.items():
        model_name = datamodel.get_table_strict(table).django_name
        for rule in rules:
            to_remove = set()
            fields, scopes = rule["rule"]
            isDatabaseConstraint = rule["isDatabaseConstraint"]

            is_global = rule_is_global(scopes)

            for field in fields:
                found_fields = uniquenessrule_fields.objects.filter(uniquenessrule__modelName=model_name, uniquenessrule__isDatabaseConstraint=isDatabaseConstraint,
                                                                    uniquenessrule__discipline_id=None if is_global else discipline.id, fieldPath=field, isScope=False)

                to_remove.update(
                    tuple(found_fields.values_list('uniquenessrule_id', flat=True)))
                found_fields.delete()
            for scope in scopes:
                found_scopes = uniquenessrule_fields.objects.filter(uniquenessrule__modelName=model_name, uniquenessrule__isDatabaseConstraint=isDatabaseConstraint,
                                                                    uniquenessrule__discipline_id=None if is_global else discipline.id, fieldPath=scope, isScope=True)

                to_remove.update(
                    tuple(found_scopes.values_list('uniquenessrule_id', flat=True)))
                found_scopes.delete()
            uniqueness_rule.objects.filter(id__in=tuple(to_remove)).delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('specify', '__first__'),
        ('businessrules', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(apply_default_rules,
                             remove_default_rules, atomic=True),
    ]
