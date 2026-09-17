import json

from django.test import Client

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class SchemaLocalizationImportTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.container = models.Splocalecontainer.objects.create(
            discipline=self.discipline, name='Accession', schematype=0
        )
        self.item = models.Splocalecontaineritem.objects.create(
            container=self.container, name='accessionnumber'
        )
        self.client = Client()
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)

    def test_imports_schema_values_and_skips_unknown_entries(self):
        response = self.client.post(
            '/context/schema_localization_import.json',
            data=json.dumps({
                'language': 'en',
                'schema': {
                    'accession': {
                        'format': 'Accession',
                        'name': 'Imported Accession',
                        'items': {
                            'accessionnumber': {
                                'isHidden': True,
                                'name': 'Imported Number',
                                'pickListName': 'Unavailable Picklist',
                                'webLinkName': 'Unavailable Web Link',
                            },
                            'removedfield': {'isHidden': True},
                        },
                    },
                    'removedtable': {'isHidden': True},
                },
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.container.refresh_from_db()
        self.item.refresh_from_db()
        self.assertEqual(self.container.format, 'Accession')
        self.assertTrue(self.item.ishidden)
        self.assertIsNone(self.item.picklistname)
        self.assertIsNone(self.item.weblinkname)
        self.assertEqual(
            models.Splocaleitemstr.objects.get(
                containername=self.container, language='en'
            ).text,
            'Imported Accession',
        )
        self.assertEqual(
            models.Splocaleitemstr.objects.get(
                itemname=self.item, language='en'
            ).text,
            'Imported Number',
        )

    def test_import_updates_existing_countryless_string(self):
        string = models.Splocaleitemstr.objects.create(
            containername=self.container,
            language='en',
            country='',
            text='Existing Accession',
        )

        response = self.client.post(
            '/context/schema_localization_import.json',
            data=json.dumps({
                'language': 'en',
                'schema': {'accession': {'name': 'Updated Accession'}},
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.Splocaleitemstr.objects.filter(
                containername=self.container, language='en'
            ).count(),
            1,
        )
        string.refresh_from_db()
        self.assertEqual(string.text, 'Updated Accession')

    def test_import_updates_existing_case_insensitive_country_string(self):
        string = models.Splocaleitemstr.objects.create(
            containername=self.container,
            language='en',
            country='US',
            text='Existing US Accession',
        )

        response = self.client.post(
            '/context/schema_localization_import.json',
            data=json.dumps({
                'language': 'en-US',
                'schema': {'accession': {'name': 'Updated US Accession'}},
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.Splocaleitemstr.objects.filter(
                containername=self.container, language='en'
            ).count(),
            1,
        )
        string.refresh_from_db()
        self.assertEqual(string.text, 'Updated US Accession')

    def test_invalid_values_do_not_write(self):
        response = self.client.post(
            '/context/schema_localization_import.json',
            data=json.dumps({
                'schema': {'accession': {'isHidden': 'yes'}},
                'language': 'en',
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.container.refresh_from_db()
        self.assertIsNone(self.container.format)

    def test_rejects_non_schema_json(self):
        response = self.client.post(
            '/context/schema_localization_import.json',
            data=json.dumps({'not': 'a schema'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.container.refresh_from_db()
        self.assertIsNone(self.container.format)

    def test_rejects_invalid_language(self):
        for language in ('en-us-extra', '@@', 'en-$%'):
            with self.subTest(language=language):
                response = self.client.post(
                    '/context/schema_localization_import.json',
                    data=json.dumps({
                        'language': language,
                        'schema': {'accession': {'name': 'Should Not Import'}},
                    }),
                    content_type='application/json',
                )

                self.assertEqual(response.status_code, 400)
        self.assertFalse(
            models.Splocaleitemstr.objects.filter(
                containername=self.container, text='Should Not Import'
            ).exists()
        )

    def test_rejects_non_object_data_for_known_table(self):
        response = self.client.post(
            '/context/schema_localization_import.json',
            data=json.dumps({
                'language': 'en',
                'schema': {'accession': 'invalid'},
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
