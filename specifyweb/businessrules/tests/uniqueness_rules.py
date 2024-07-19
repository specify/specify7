import json

from django.test import Client

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.businessrules.exceptions import BusinessRuleException


class UniquenessTests(ApiTests):
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

        self.assertEquals(response_content, expected_response)

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

        self.assertEquals(response_content, expected_response)

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
