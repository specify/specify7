import json
from unittest.mock import patch

from django.test import Client

from specifyweb.backend.businessrules import uniqueness_rules
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.businessrules.exceptions import BusinessRuleException


class UniquenessTests(ApiTests):
    def _create_uniqueness_rule(self, model_name, fields, scopes):
        rule = uniqueness_rules.models.UniquenessRule.objects.create(
            discipline=None if uniqueness_rules.rule_is_global(scopes) else self.discipline,
            modelName=model_name,
            isDatabaseConstraint=False,
        )
        for field in fields:
            uniqueness_rules.models.UniquenessRuleField.objects.create(
                uniquenessrule=rule,
                fieldPath=field,
                isScope=False,
            )
        for scope in scopes:
            uniqueness_rules.models.UniquenessRuleField.objects.create(
                uniquenessrule=rule,
                fieldPath=scope,
                isScope=True,
            )
        return rule

    def test_migration_cache_rechecks_until_migration_is_seen(self):
        with (
            uniqueness_rules._uniqueness_migration_cache.activate(),
            patch.object(
                uniqueness_rules,
                "_initial_businessrules_migration_applied",
                side_effect=[False, True],
            ) as migration_applied,
        ):
            self.assertFalse(
                uniqueness_rules._cached_businessrules_migration_applied()
            )
            self.assertTrue(
                uniqueness_rules._cached_businessrules_migration_applied()
            )
            self.assertEqual(migration_applied.call_count, 2)

            self.assertTrue(
                uniqueness_rules._cached_businessrules_migration_applied()
            )
            self.assertEqual(migration_applied.call_count, 2)

    def test_cached_uniqueness_rule_preserves_all_scope_fields(self):
        rule = self._create_uniqueness_rule(
            "Accession",
            ["text1"],
            ["division", "text2"],
        )

        cached_rule = next(
            cached_rule
            for cached_rule in uniqueness_rules._fetch_uniquenessrules_for_cache(
                uniqueness_rules.models.UniquenessRule._meta.apps,
                "Accession",
            )
            if cached_rule.rule.id == rule.id
        )

        self.assertEqual(cached_rule.scope_fields, ("division", "text2"))
        self.assertEqual(cached_rule.all_fields, ("text1", "division", "text2"))

    def test_create_uniqueness_rule_does_not_treat_superset_as_match(self):
        self._create_uniqueness_rule("Accession", ["text1", "text2"], [])

        uniqueness_rules.create_uniqueness_rule(
            "Accession",
            self.discipline,
            False,
            ["text1"],
            [],
        )

        field_sets = {
            frozenset(
                field.fieldPath
                for field in rule.uniquenessrulefield_set.filter(isScope=False)
            )
            for rule in uniqueness_rules.models.UniquenessRule.objects.filter(
                modelName="Accession",
                isDatabaseConstraint=False,
                discipline=None,
            )
        }
        self.assertIn(frozenset(("text1", "text2")), field_sets)
        self.assertIn(frozenset(("text1",)), field_sets)

    def test_remove_uniqueness_rule_does_not_delete_superset_rule(self):
        superset = self._create_uniqueness_rule("Accession", ["text1", "text2"], [])
        subset = self._create_uniqueness_rule("Accession", ["text1"], [])

        uniqueness_rules.remove_uniqueness_rule(
            "Accession",
            self.discipline,
            False,
            ["text1"],
            [],
        )

        self.assertTrue(
            uniqueness_rules.models.UniquenessRule.objects.filter(
                id=superset.id,
            ).exists()
        )
        self.assertFalse(
            uniqueness_rules.models.UniquenessRule.objects.filter(
                id=subset.id,
            ).exists()
        )

    def test_simple_validation(self):
        c = Client()
        c.force_login(self.specifyuser)

        models.Collectionobject.objects.all().update(text1='test')

        response = c.post(
            '/businessrules/uniqueness_rules/validate/',
            data=json.dumps({
                "table": "Collectionobject",
                "rule": {
                    "fields": ["text1"],
                    "scopes": []
                }
            }),
            content_type='application/json'
        )

        expected_response = {"totalDuplicates": 5, "fields": [
            {"duplicates": 5, "fields": {"text1": "test"}}]}

        response_content = json.loads(response.content.decode())

        self.assertEqual(response_content, expected_response)

    def test_pathed_scope_validation(self):
        c = Client()
        c.force_login(self.specifyuser)

        event1 = models.Collectingevent.objects.create(
            discipline=self.discipline
        )
        event1.collectionobjects.add(
            self.collectionobjects[0], self.collectionobjects[1])

        event2 = models.Collectingevent.objects.create(
            discipline=self.discipline
        )

        event2.collectionobjects.add(
            self.collectionobjects[2])

        models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            text2='test',
            yesno1=1,
            number1=10,
        )

        models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            text2='test',
            yesno1=1,
            number1=10,
        )

        models.Determination.objects.create(
            collectionobject=self.collectionobjects[2],
            text2='test',
            yesno1=1,
            number1=10,
        )

        response = c.post(
            '/businessrules/uniqueness_rules/validate/',
            data=json.dumps({
                "table": "Determination",
                "rule": {
                    "fields": ["text2", "yesNo1", "number1"],
                    "scopes": ["collectionObject__collectingEvent"]
                }
            }),
            content_type='application/json'
        )

        expected_response = {'totalDuplicates': 2, 'fields': [{'duplicates': 2, 'fields': {
            'text2': 'test', 'yesno1': True, 'number1': '10.0000000000', 'collectionobject__collectingevent': event1.id}}]}

        response_content = json.loads(response.content.decode())

        self.assertEqual(response_content, expected_response)

    def test_creating_uniqueness_rule(self):
        c = Client()
        c.force_login(self.specifyuser)

        new_accession_rule = {"id": None, "fields": ["text1"], "scopes": [
        ], "isDatabaseConstraint": False, "modelName": "accession"}

        # Also deletes the default accession rule stating accessionNumber must be unique to division
        c.put(
            f'/businessrules/uniqueness_rules/{self.discipline.id}/',
            data=json.dumps({
                "model": "Accession",
                "rules": [new_accession_rule]
            }),
            content_type='application/json'
        )

        models.Accession.objects.create(
            division=self.division,
            accessionnumber="accession1"
        )

        models.Accession.objects.create(
            division=self.division,
            text1="test",
            accessionnumber="accession1"
        )

        with self.assertRaises(BusinessRuleException):
            models.Accession.objects.create(
                division=self.division,
                text1="test",
            )
