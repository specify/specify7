import json

from django.test import Client

from specifyweb.specify.models import (
    Collectionobject,
    Collectionobjecttype,
    Determination,
    Taxontreedef,
)
from specifyweb.specify.tests.test_api import ApiTests

class TestBatchIdentify(ApiTests):
    def setUp(self):
        super().setUp()
        self.c = Client()
        self.c.force_login(self.specifyuser)
        self.c.cookies['collection'] = str(self.collection.id)

    def _post_json(self, url: str, payload: dict):
        return self.c.post(url, json.dumps(payload), content_type='application/json')

    def test_batch_identify_resolve_parses_numeric_and_year_catalog_numbers(self):
        numeric_one = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000271806',
            collectionobjecttype=self.collectionobjecttype,
        )
        numeric_two = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000687972',
            collectionobjecttype=self.collectionobjecttype,
        )
        year_based = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='2025-000001',
            collectionobjecttype=self.collectionobjecttype,
        )

        response = self._post_json(
            '/api/specify/batch_identify/resolve/',
            {
                'catalogNumbers': [
                    'SEMC000271806,000687972',
                    '2025-000001',
                    '2025-000002',
                ],
                'validateOnly': True,
            },
        )
        self._assertStatusCodeEqual(response, 200)

        data = json.loads(response.content.decode())
        self.assertEqual(
            set(data['collectionObjectIds']),
            {numeric_one.id, numeric_two.id, year_based.id},
        )
        self.assertEqual(data['currentDeterminationIds'], [])
        self.assertEqual(data['unmatchedCatalogNumbers'], ['2025-000002'])
        self.assertEqual(data['hasMixedTaxonTrees'], False)
        self.assertEqual(len(data['taxonTreeGroups']), 1)
        self.assertEqual(
            data['taxonTreeGroups'][0]['collectionObjectIds'],
            sorted([numeric_one.id, numeric_two.id, year_based.id]),
        )

    def test_validate_record_set_reports_counts_for_mixed_trees(self):
        other_tree = Taxontreedef.objects.create(name='Other Taxon Tree')
        other_type = Collectionobjecttype.objects.create(
            name='Other CO Type',
            collection=self.collection,
            taxontreedef=other_tree,
        )

        first_tree_object = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000000001',
            collectionobjecttype=self.collectionobjecttype,
        )
        second_tree_object = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000000002',
            collectionobjecttype=other_type,
        )

        response = self._post_json(
            '/api/specify/batch_identify/validate_record_set/',
            {
                'collectionObjectIds': [
                    first_tree_object.id,
                    second_tree_object.id,
                ]
            },
        )
        self._assertStatusCodeEqual(response, 200)

        data = json.loads(response.content.decode())
        self.assertEqual(data['hasMixedTaxonTrees'], True)
        self.assertEqual(
            sorted(len(group['collectionObjectIds']) for group in data['taxonTreeGroups']),
            [1, 1],
        )
        self.assertEqual(
            sorted(group['taxonTreeName'] for group in data['taxonTreeGroups']),
            sorted([self.taxontreedef.name, other_tree.name]),
        )

    def test_validate_record_set_rejects_missing_collection_object_ids(self):
        response = self._post_json(
            '/api/specify/batch_identify/validate_record_set/',
            {'collectionObjectIds': [999999]},
        )
        self._assertStatusCodeEqual(response, 400)

        data = json.loads(response.content.decode())
        self.assertIn('do not exist', data['error'])

    def test_batch_identify_keeps_existing_current_when_new_determination_not_current(self):
        collection_object = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000000003',
            collectionobjecttype=self.collectionobjecttype,
        )
        existing = Determination.objects.create(
            collectionobject=collection_object,
            collectionmemberid=self.collection.id,
            iscurrent=True,
        )

        response = self._post_json(
            '/api/specify/batch_identify/',
            {
                'collectionObjectIds': [collection_object.id],
                'determination': {'isCurrent': False, 'remarks': 'batch identify'},
            },
        )
        self._assertStatusCodeEqual(response, 200)

        data = json.loads(response.content.decode())
        self.assertEqual(data['createdCount'], 1)
        created = Determination.objects.get(id=data['determinationIds'][0])
        existing.refresh_from_db()

        self.assertEqual(existing.iscurrent, True)
        self.assertEqual(created.iscurrent, False)
        self.assertEqual(created.collectionobject_id, collection_object.id)

    def test_batch_identify_sets_new_determination_current_when_requested(self):
        collection_object = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber='000000004',
            collectionobjecttype=self.collectionobjecttype,
        )
        existing = Determination.objects.create(
            collectionobject=collection_object,
            collectionmemberid=self.collection.id,
            iscurrent=True,
        )

        response = self._post_json(
            '/api/specify/batch_identify/',
            {
                'collectionObjectIds': [collection_object.id],
                'determination': {'isCurrent': True, 'remarks': 'new current'},
            },
        )
        self._assertStatusCodeEqual(response, 200)

        data = json.loads(response.content.decode())
        created = Determination.objects.get(id=data['determinationIds'][0])
        existing.refresh_from_db()

        self.assertEqual(existing.iscurrent, False)
        self.assertEqual(created.iscurrent, True)
        self.assertEqual(
            Determination.objects.filter(
                collectionobject=collection_object,
                iscurrent=True,
            ).count(),
            1,
        )
