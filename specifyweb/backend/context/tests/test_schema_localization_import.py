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
                        'format': 'Imported Format',
                        'name': 'Imported Accession',
                        'items': {
                            'accessionnumber': {
                                'isHidden': True,
                                'name': 'Imported Number',
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
        self.assertEqual(self.container.format, 'Imported Format')
        self.assertTrue(self.item.ishidden)
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
