from django.db import migrations

from specifyweb.businessrules.migration_utils import catnum_rule_editable, catnum_rule_uneditable

class Migration(migrations.Migration):
    dependencies = [
        ('businessrules', '0003_catnum_constraint')
    ]

    operations = [
        migrations.RunPython(catnum_rule_editable, catnum_rule_uneditable, atomic=True)
    ]
