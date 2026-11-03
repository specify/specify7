import json

from specifyweb.backend.businessrules import uniqueness_rules
from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class UniquenessConfigurationTests(ApiTests):
    def _configure_rule(self, fields, scopes, model='Collectionobject', rule_id=None):
        self.client.force_login(self.specifyuser)
        response = self.client.put(
            f'/businessrules/uniqueness_rules/{self.discipline.id}/',
            data=json.dumps({'model': model, 'rules': [{
                'id': rule_id, 'modelName': model, 'fields': fields,
                'scopes': scopes, 'isDatabaseConstraint': False,
            }]}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201, response.content)
        response = self.client.get(
            f'/businessrules/uniqueness_rules/{self.discipline.id}/',
            {'model': model},
        )
        self.assertEqual(response.status_code, 200)
        saved, = response.json()[model]
        rule = saved['rule']
        self.assertEqual(rule['fields'], fields)
        self.assertEqual(rule['scopes'], scopes)
        self.assertFalse(rule['isDatabaseConstraint'])
        if rule_id is not None:
            self.assertEqual(rule['id'], rule_id)
        stored = uniqueness_rules.models.UniquenessRule.objects.get(pk=rule['id'])
        self.assertEqual(
            set(stored.uniquenessrulefield_set.values_list('fieldPath', 'isScope')),
            {(field, False) for field in fields} | {(scope, True) for scope in scopes},
        )
        self.assertEqual(
            stored.discipline_id,
            None if uniqueness_rules.rule_is_global(scopes) else self.discipline.id,
        )
        return rule

    def _other_collection(self):
        return models.Collection.objects.create(
            catalognumformatname='test', collectionname='Other collection',
            isembeddedcollectingevent=False, discipline=self.discipline,
        )

    def test_new_scoped_rule_persists_and_allows_duplicates_across_collections(self):
        self._configure_rule(['text1'], ['collection'])
        other = self._other_collection()
        for collection in (self.collection, other):
            record = models.Collectionobject.objects.create(collection=collection, text1='shared')
            self.assertEqual(models.Collectionobject.objects.get(pk=record.pk).text1, 'shared')
            with self.assertRaises(BusinessRuleException):
                models.Collectionobject.objects.create(collection=collection, text1='shared')
        models.Collectionobject.objects.create(collection=self.collection, text1='distinct')

    def test_edit_scope_releases_records_outside_new_scope(self):
        rule = self._configure_rule(['text1'], ['collection__discipline'])
        other = self._other_collection()
        models.Collectionobject.objects.create(collection=self.collection, text1='shared')
        with self.assertRaises(BusinessRuleException):
            models.Collectionobject.objects.create(collection=other, text1='shared')
        self._configure_rule(['text1'], ['collection'], rule_id=rule['id'])
        models.Collectionobject.objects.create(collection=other, text1='shared')
        for collection in (self.collection, other):
            with self.assertRaises(BusinessRuleException):
                models.Collectionobject.objects.create(collection=collection, text1='shared')

    def test_configured_grouped_fields_enforce_combinations_not_individual_fields(self):
        self._configure_rule(['text1', 'text2'], ['collection'])
        for left, right in [('Value 1', 'Value 1'), ('Value 1', 'Value 2'),
                            ('Value 2', 'Value 1'), ('Value 2', 'Value 2')]:
            with self.subTest(left=left, right=right):
                record = models.Collectionobject.objects.create(
                    collection=self.collection, text1=left, text2=right)
                with self.assertRaises(BusinessRuleException):
                    models.Collectionobject.objects.create(
                        collection=self.collection, text1=left, text2=right)
                record.save()  # An unchanged record must not conflict with itself.
        self.assertEqual(models.Collectionobject.objects.filter(text1__startswith='Value ').count(), 4)

    def test_configured_boolean_field_preserves_and_enforces_both_values(self):
        self._configure_rule(['text1', 'yesno1'], ['collection'])
        for value in (True, False):
            with self.subTest(value=value):
                record = models.Collectionobject.objects.create(
                    collection=self.collection, text1='shared', yesno1=value)
                self.assertIs(models.Collectionobject.objects.get(pk=record.pk).yesno1, value)
                with self.assertRaises(BusinessRuleException):
                    models.Collectionobject.objects.create(
                        collection=self.collection, text1='shared', yesno1=value)
                models.Collectionobject.objects.create(
                    collection=self.collection, text1='different', yesno1=value)

    def test_configured_text_rule_is_case_sensitive(self):
        self._configure_rule(['text1'], ['collection'])
        for value in ('abc', 'ABC'):
            models.Collectionobject.objects.create(collection=self.collection, text1=value)
            with self.assertRaises(BusinessRuleException):
                models.Collectionobject.objects.create(collection=self.collection, text1=value)
        self.assertEqual(models.Collectionobject.objects.exclude(text1=None).count(), 2)

    def test_duplicate_validation_keeps_case_distinct_groups_separate(self):
        # Existing duplicates must be inspected before enabling a rule. Updates
        # deliberately bypass pre-save enforcement to represent that data.
        for record, value in zip(self.collectionobjects, ('abc', 'abc', 'ABC', 'ABC', 'ABC'), strict=True):
            models.Collectionobject.objects.filter(pk=record.pk).update(text1=value)
        self.client.force_login(self.specifyuser)
        response = self.client.post(
            '/businessrules/uniqueness_rules/validate/',
            data=json.dumps({'table': 'Collectionobject', 'rule': {
                'fields': ['text1'], 'scopes': ['collection'],
            }}), content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            'totalDuplicates': 5,
            'fields': [
                {'duplicates': 3, 'fields': {'text1': 'ABC', 'collection': self.collection.pk}},
                {'duplicates': 2, 'fields': {'text1': 'abc', 'collection': self.collection.pk}},
            ],
        })

    def test_edit_existing_catalog_number_rule(self):
        rule = uniqueness_rules.models.UniquenessRule.objects.get(
            modelName='Collectionobject',
            uniquenessrulefield__fieldPath='catalogNumber',
            uniquenessrulefield__isScope=False)
        self._configure_rule(['catalognumber'], ['collection__discipline'], rule_id=rule.id)
        other = self._other_collection()
        with self.assertRaises(BusinessRuleException):
            models.Collectionobject.objects.create(
                collection=other, catalognumber=self.collectionobjects[0].catalognumber)
        models.Collectionobject.objects.create(collection=other, catalognumber='new-number')
        with self.assertRaises(BusinessRuleException):
            models.Collectionobject.objects.create(collection=self.collection, catalognumber='new-number')

    def test_non_admin_cannot_create_edit_or_delete_rules_even_with_table_permissions(self):
        rule = self._configure_rule(['text1'], ['collection'])
        UserPolicy.objects.filter(specifyuser=self.specifyuser).delete()
        UserPolicy.objects.create(
            specifyuser=self.specifyuser, collection=None, resource='/table/%', action='%')
        # API requests also require collection access before reaching table checks.
        UserPolicy.objects.create(
            specifyuser=self.specifyuser, collection=self.collection,
            resource='/system/sp7/collection', action='access')
        self.assertFalse(self.specifyuser.is_admin())
        url = f'/businessrules/uniqueness_rules/{self.discipline.id}/'
        before = self.client.get(url, {'model': 'Collectionobject'}).json()
        for rules in (
            [{**rule, 'id': None, 'fields': ['text2']}],
            [{**rule, 'scopes': []}],
            [],
        ):
            with self.subTest(rules=rules):
                response = self.client.put(url, data=json.dumps({
                    'model': 'Collectionobject', 'rules': rules,
                }), content_type='application/json')
                self.assertEqual(response.status_code, 403)
                self.assertEqual(self.client.get(url, {'model': 'Collectionobject'}).json(), before)

        for model in ('UniquenessRule', 'UniquenessRuleField'):
            collection_url = f'/api/specify/{model.lower()}/'
            resource_url = f'{collection_url}1/'
            with self.subTest(model=model, method='GET'):
                self.assertEqual(self.client.get(collection_url).status_code, 200)
            for method, url, data in (
                ('post', collection_url, '{}'),
                ('put', resource_url, '{}'),
                ('delete', resource_url, None),
            ):
                with self.subTest(model=model, method=method):
                    response = getattr(self.client, method)(
                        url, data=data, content_type='application/json',
                    )
                    self.assertEqual(response.status_code, 403)
                    self.assertEqual(
                        response.content,
                        b'Specifyuser must be an institution admin',
                    )
