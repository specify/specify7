import json
from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.datamodel.models import (Collectionobject)

class TestSeriesAutonumber(ApiTests):

    def test_series_autonumber_ranges(self):
        c = Client()
        c.force_login(self.specifyuser)

        # 000000005 to 000000007
        response = c.post(
            f"/api/specify/series_autonumber_range/",
            data=json.dumps({
                'rangestart': '5',
                'rangeend': '7',
                'tablename': 'collectionobject',
                'fieldname': 'catalognumber',
                'formattername': 'CatalogNumberNumeric',
                'skipstartnumber': False,
            }),
            content_type="application/json",
        )
        content = json.loads(response.content.decode())
        self.assertEqual(content['values'], ["000000005","000000006","000000007"])

        # 000000010 to 000000015, skipping the first value
        response = c.post(
            f"/api/specify/series_autonumber_range/",
            data=json.dumps({
                'rangestart': '10',
                'rangeend': '15',
                'tablename': 'collectionobject',
                'fieldname': 'catalognumber',
                'formattername': 'CatalogNumberNumeric',
                'skipstartnumber': True,
            }),
            content_type="application/json",
        )
        content = json.loads(response.content.decode())
        self.assertEqual(content['values'], ["000000011","000000012","000000013","000000014","000000015"])

        # Range start value must be less than range end value
        response = c.post(
            f"/api/specify/series_autonumber_range/",
            data=json.dumps({
                'rangestart': '10',
                'rangeend': '0',
                'tablename': 'collectionobject',
                'fieldname': 'catalognumber',
                'formattername': 'CatalogNumberNumeric',
                'skipstartnumber': True
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

        # Range cannot include wildcards
        response = c.post(
            f"/api/specify/series_autonumber_range/",
            data=json.dumps({
                'rangestart': '#########',
                'rangeend': '10',
                'tablename': 'collectionobject',
                'fieldname': 'catalognumber',
                'formattername': 'CatalogNumberNumeric',
                'skipstartnumber': True,
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

        # Test range limit
        response = c.post(
            f"/api/specify/series_autonumber_range/",
            data=json.dumps({
                'rangestart': '0',
                'rangeend': '1000',
                'tablename': 'collectionobject',
                'fieldname': 'catalognumber',
                'formattername': 'CatalogNumberNumeric',
                'skipstartnumber': True,
            }),
            content_type="application/json",
        )
        content = json.loads(response.content.decode())
        self.assertEqual(content['error'], "LimitExceeded")

        # Test autonumbering with CatalogNumberAlphaNumByYear format
        response = c.post(
            f"/api/specify/series_autonumber_range/",
            data=json.dumps({
                'rangestart': '2023-000001',
                'rangeend': '2023-000005',
                'tablename': 'collectionobject',
                'fieldname': 'catalognumber',
                'formattername': 'CatalogNumberAlphaNumByYear',
                'skipstartnumber': False,
            }),
            content_type="application/json",
        )
        content = json.loads(response.content.decode())
        self.assertEqual(content['values'], ["2023-000001","2023-000002","2023-000003","2023-000004","2023-000005"])

    def test_series_autonumber_existing(self):
        c = Client()
        c.force_login(self.specifyuser)

        self.collection.catalognumformatname ="CatalogNumberNumeric"
        self.collection.save()

        Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000000012'
        )
        Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000000013'
        )
        Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000000014'
        )

        response = c.post(
            f"/api/specify/series_autonumber_range/",
            data=json.dumps({
                'rangestart': '10',
                'rangeend': '20',
                'tablename': 'collectionobject',
                'fieldname': 'catalognumber',
                'formattername': 'CatalogNumberNumeric',
                'skipstartnumber': True,
            }),
            content_type="application/json",
        )
        content = json.loads(response.content.decode())
        self.assertEqual(content['existing'], ['000000012','000000013','000000014'])

        response = c.post(
            f"/api/specify/series_autonumber_range/",
            data=json.dumps({
                'rangestart': '0',
                'rangeend': '10',
                'tablename': 'collectionobject',
                'fieldname': 'catalognumber',
                'formattername': 'CatalogNumberNumeric',
                'skipstartnumber': True,
            }),
            content_type="application/json",
        )
        content = json.loads(response.content.decode())
        self.assertNotIn('existing', content)