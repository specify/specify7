from django.db import migrations, models
from specifyweb.businessrules.uniqueness_rules import DEFAULT_UNIQUENESS_RULES, create_uniqueness_rule
import specifyweb.specify.models

def apply_migration(apps, schema_editor):
    storage_rules = DEFAULT_UNIQUENESS_RULES["Storage"]
    Discipline = apps.get_model('specify', 'Discipline')

    for rule in storage_rules:
        fields, scopes = rule["rule"]
        isDatabaseConstraint = rule["isDatabaseConstraint"]

        for discipline in Discipline.objects.all():
            create_uniqueness_rule(
                'Storage', discipline, isDatabaseConstraint, fields, scopes, apps
            )

def revert_migration(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')
    uniqueness_rule = apps.get_model('businessrules', 'UniquenessRule')
    uniquenessrule_fields = apps.get_model(
        'businessrules', 'UniquenessRuleField')

    for discipline in Discipline.objects.all():
        model_name = 'Storage'
        to_remove = set()
        found_fields = uniquenessrule_fields.objects.filter(
            uniquenessrule__modelName=model_name,
            uniquenessrule__isDatabaseConstraint=True,
            uniquenessrule__discipline_id=discipline.id,
            fieldPath="GUID",
            isScope=False
        )

        to_remove.update(found_fields.values_list('uniquenessrule_id', flat=True))
        found_fields.delete()

        uniqueness_rule.objects.filter(id__in=to_remove).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0024_add_guid_storage'),
        ('businessrules', '0005_cojo'),
    ]

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]
