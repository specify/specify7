from unittest.mock import patch
from types import SimpleNamespace

from django.apps import apps as django_apps
from django.test import TestCase

from specifyweb.backend.businessrules.models import UniquenessRule, UniquenessRuleField
from specifyweb.specify.models import Discipline
from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.management.commands.tests.test_migration_base import MigrationCommandTestCase


class BusinessRulesMigrationTests(MigrationCommandTestCase):
    def test_fix_business_rules_runs_migrations_in_order(self):
        names = [
            "apply_default_uniqueness_rules_to_disciplines",
            "catnum_rule_editable", 
            "fix_global_default_rules",
        ]
        self._assert_section_calls(
            rkm.fix_business_rules,
            [(rkm, name) for name in names],
            names,
        )

    def test_apply_default_uniqueness_rules_skips_existing_db_constraints(self):
        discipline_without_constraint = SimpleNamespace(id=1)
        discipline_with_constraint = SimpleNamespace(id=2)

        class FakeDiscipline:
            objects = SimpleNamespace(
                all=lambda: [discipline_without_constraint, discipline_with_constraint]
            )

        class FakeUniquenessRuleManager:
            def filter(self, discipline, isDatabaseConstraint):
                self.last_is_database_constraint = isDatabaseConstraint
                return SimpleNamespace(
                    exists=lambda: discipline is discipline_with_constraint
                )

        fake_uniqueness_rule_manager = FakeUniquenessRuleManager()

        class FakeUniquenessRule:
            objects = fake_uniqueness_rule_manager

        class FakeApps:
            def get_model(self, app_label, model_name):
                return {
                    ("specify", "Discipline"): FakeDiscipline,
                    ("businessrules", "UniquenessRule"): FakeUniquenessRule,
                }[(app_label, model_name)]

        fake_apps = FakeApps()

        with patch.object(rkm, "apply_default_uniqueness_rules") as apply_rules:
            rkm.apply_default_uniqueness_rules_to_disciplines(fake_apps)

        apply_rules.assert_called_once_with(
            discipline_without_constraint,
            registry=fake_apps,
        )
        self.assertIs(fake_uniqueness_rule_manager.last_is_database_constraint, True)


class BusinessRulesDatabaseTests(TestCase):
    def test_catnum_rule_editable_only_updates_matching_catalog_number_rule(self):
        discipline = Discipline.objects.create(name="Test Discipline")
        matching_rule = UniquenessRule.objects.create(
            modelName="Collectionobject",
            discipline=discipline,
            isDatabaseConstraint=True,
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=matching_rule,
            fieldPath="catalogNumber",
            isScope=False,
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=matching_rule,
            fieldPath="collection",
            isScope=True,
        )
        nonmatching_rule = UniquenessRule.objects.create(
            modelName="Collectionobject",
            discipline=discipline,
            isDatabaseConstraint=True,
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=nonmatching_rule,
            fieldPath="catalogNumber",
            isScope=False,
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=nonmatching_rule,
            fieldPath="discipline",
            isScope=True,
        )

        rkm.catnum_rule_editable(django_apps)

        matching_rule.refresh_from_db()
        nonmatching_rule.refresh_from_db()
        self.assertFalse(matching_rule.isDatabaseConstraint)
        self.assertTrue(nonmatching_rule.isDatabaseConstraint)