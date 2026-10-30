import json
import threading
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from django.db import close_old_connections
from django.test import Client

from specifyweb.backend.context.views import _schema_import_string
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests, ApiTransactionTests


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

    def test_export_includes_source_language(self):
        response = self.client.get(
            '/context/schema_localization.json?lang=en-US&export=true'
        )

        self.assertEqual(response.status_code, 200)
        export = response.json()
        self.assertEqual(export['language'], 'en-us')
        self.assertIn('accession', export['schema'])

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

    def test_imports_export_when_source_language_matches(self):
        response = self.client.post(
            '/context/schema_localization_import.json',
            data=json.dumps({
                'language': 'en-US',
                'schema': {
                    'language': 'en-us',
                    'schema': {'accession': {'name': 'Imported Accession'}},
                },
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.Splocaleitemstr.objects.get(
                containername=self.container,
                language='en',
                country='us',
            ).text,
            'Imported Accession',
        )

    def test_rejects_export_when_source_language_differs(self):
        response = self.client.post(
            '/context/schema_localization_import.json',
            data=json.dumps({
                'language': 'fr',
                'schema': {
                    'language': 'en',
                    'schema': {'accession': {'name': 'Should Not Import'}},
                },
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            models.Splocaleitemstr.objects.filter(
                containername=self.container,
                text='Should Not Import',
            ).exists()
        )

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


class ConcurrentSchemaLocalizationImportTests(ApiTransactionTests):
    def setUp(self):
        super().setUp()
        self.container = models.Splocalecontainer.objects.create(
            discipline=self.discipline, name='Accession', schematype=0
        )
        self.clients = [self._make_client(), self._make_client()]

    def _make_client(self):
        client = Client()
        client.force_login(self.specifyuser)
        client.cookies['collection'] = str(self.collection.id)
        return client

    def test_concurrent_imports_do_not_create_duplicate_strings(self):
        payload = json.dumps({
            'language': 'en-US',
            'schema': {'accession': {'name': 'Imported Accession'}},
        })
        barrier = threading.Barrier(2)

        def synchronize_import(*args):
            _schema_import_string(*args)
            if args[3] is not None:
                try:
                    barrier.wait(timeout=1)
                except threading.BrokenBarrierError:
                    # Best-effort synchronization for concurrency overlap in this test;
                    # if one worker times out or exits early, continue without failing here.
                    pass

        def import_schema(client):
            close_old_connections()
            try:
                return client.post(
                    '/context/schema_localization_import.json',
                    data=payload,
                    content_type='application/json',
                )
            finally:
                close_old_connections()

        with patch(
            'specifyweb.backend.context.views._schema_import_string',
            side_effect=synchronize_import,
        ), ThreadPoolExecutor(max_workers=2) as executor:
            responses = list(executor.map(import_schema, self.clients))

        self.assertEqual([response.status_code for response in responses], [200, 200])
        strings = models.Splocaleitemstr.objects.filter(
            containername=self.container,
            language='en',
            country__iexact='us',
        ).filter(variant__isnull=True)
        self.assertEqual(strings.count(), 1)
        self.assertEqual(strings.get().text, 'Imported Accession')
