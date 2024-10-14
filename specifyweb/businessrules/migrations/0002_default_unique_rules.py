from django.db import migrations

from specifyweb.businessrules.uniqueness_rules import apply_default_uniqueness_rules


def apply_rules_to_discipline(apps, schema_editor):
    Discipline = apps.get_model('specify', 'Discipline')
    for disp in Discipline.objects.all():
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
