from django.db import migrations

from specifyweb.specify import models as spmodels
from specifyweb.businessrules.uniqueness_rules import apply_default_uniqueness_rules


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
