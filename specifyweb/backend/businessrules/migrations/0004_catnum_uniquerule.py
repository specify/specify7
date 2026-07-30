from django.db import migrations
from django.db.models.functions import Lower

from specifyweb.backend.businessrules.migration_utils import catnum_rule_editable
from specifyweb.backend.businessrules.uniqueness_rules import create_uniqueness_rule


def catnum_rule_uneditable(apps, schema_editor):
    """
    Find any CollectionObject catalogNumber must be unique to Collection
    rules which are editable on the frontend (have isDatabaseConstraint=False)
    and set their isDatabaseConstraint=True.

    Generally should be run when migration businessrules/0003 is being reverted
    """
    Discipline = apps.get_model("specify", "Discipline")
    UniquenessRule = apps.get_model("businessrules", "UniquenessRule")

    for discipline in Discipline.objects.all():
        # REFACTOR: Some of these queries should be able to be combined to
        # improve performance and limit how often we need to hit the database
        model_rules = UniquenessRule.objects.filter(
            modelName__iexact="Collectionobject",
            discipline_id=discipline.id,
            isDatabaseConstraint=False
        )

        has_catalognumber_rule = False
        matching_rule_ids: list[int] = []
        for rule in model_rules:
            rule_fields = (rule
                            .uniquenessrulefield_set
                            .all()
                            .values_list(Lower("fieldPath"), "isScope"))

            fields = []
            scopes = []
            for field_path, is_scope in rule_fields:
                if is_scope:
                    scopes.append(field_path)
                else:
                    fields.append(field_path)

            # We're only interested in the rule "CollectionObject catalogNumber
            # must be unique to Collection"
            # There can be other rules which include Catalog Number and Collection
            # with other fields: ignore these
            if (len(fields) == 1 and len(scopes) == 1) and (fields[0] == "catalognumber" and scopes[0] == "collection"):
                has_catalognumber_rule = True
                matching_rule_ids.append(rule.id)

        if has_catalognumber_rule:
            UniquenessRule.objects.filter(
                id__in=matching_rule_ids).update(isDatabaseConstraint=True)
        else:
            create_uniqueness_rule(
                model_name="Collectionobject",
                discipline=discipline,
                is_database_constraint=True,
                fields=["catalogNumber"],
                scopes=["collection"],
                registry=apps,
            )


class Migration(migrations.Migration):
    dependencies = [
        ('businessrules', '0003_catnum_constraint')
    ]

    operations = [
        migrations.RunPython(catnum_rule_editable,
                             catnum_rule_uneditable, atomic=True)
    ]
