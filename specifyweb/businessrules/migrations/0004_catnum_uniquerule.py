from typing import Tuple

from django.db import migrations

from specifyweb.businessrules.uniqueness_rules import create_uniqueness_rule


def catnum_rule_editable(apps, schema_editor):
    UniquenessRule = apps.get_model('businessrules', 'UniquenessRule')
    UniquenessRuleField = apps.get_model('businessrules', 'UniquenessRuleField')

    candidate_rules_with_field: Tuple[int] = tuple(UniquenessRuleField.objects.filter(uniquenessrule__modelName__iexact='collectionobject', uniquenessrule__isDatabaseConstraint=True, fieldPath__iexact='catalognumber', isScope=False).values_list('uniquenessrule_id', flat=True))

    candidate_rules_with_scope: Tuple[int] = tuple(UniquenessRuleField.objects.filter(uniquenessrule_id__in=candidate_rules_with_field, fieldPath__iexact='collection', isScope=True).values_list('uniquenessrule_id', flat=True))

    candidate_rules = UniquenessRule.objects.filter(id__in=candidate_rules_with_scope)
    candidate_rules.update(isDatabaseConstraint=False)

def catnum_rule_uneditable(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')
    UniquenessRule = apps.get_model('businessrules', 'UniquenessRule')
    UniquenessRuleField = apps.get_model('businessrules', 'UniquenessRuleField')

    for discipline in Discipline.objects.all():
        candidate_rules_with_field: Tuple[int] = tuple(UniquenessRuleField.objects.filter(uniquenessrule__modelName__iexact='collectionobject', uniquenessrule__discipline=discipline.id, uniquenessrule__isDatabaseConstraint=False, fieldPath__iexact='catalognumber', isScope=False).values_list('uniquenessrule_id', flat=True))

        candidate_rules_with_scope: Tuple[int] = tuple(UniquenessRuleField.objects.filter(uniquenessrule_id__in=candidate_rules_with_field, fieldPath__iexact='collection', isScope=True).values_list('uniquenessrule_id', flat=True))

        candidate_rules = UniquenessRule.objects.filter(id__in=candidate_rules_with_scope)
        if len(candidate_rules) == 0: 
            create_uniqueness_rule('Collectionobject', discipline=discipline, is_database_constraint=True, fields=['catalogNumber'], scopes=['collection'], registry=apps)
        else: 
            candidate_rules.update(isDatabaseConstraint=True)

class Migration(migrations.Migration):
    dependencies = [
        ('businessrules', '0003_catnum_constraint')
    ]

    operations = [
        migrations.RunPython(catnum_rule_editable, catnum_rule_uneditable, atomic=True)
    ]
