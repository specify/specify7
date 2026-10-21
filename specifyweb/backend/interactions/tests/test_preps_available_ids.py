from specifyweb.backend.interactions.tests.test_preps_available_context import TestPrepsAvailableContext
from specifyweb.backend.interactions.tests.utils import _create_interaction_prep_generic
from specifyweb.specify import models

import json

class TestPrepsAvailableIds(TestPrepsAvailableContext):
    def test_preps_available_simple(self):
        
        expected_response = self._preps_available_simple()

        response = self.client.post(
            f'/interactions/preparations_available_ids/',
            data={
                'id_fld': 'CatalogNumber',
                'co_ids': json.dumps([co.catalognumber for co in self.collectionobjects])
            }
        )

        returned_counts = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
    
        self.assertEqual(returned_counts, expected_response)

    def test_preps_available_simple_isloan(self):
        response = self.client.post(
            f'/interactions/preparations_available_ids/',
            data={
                'id_fld': 'CatalogNumber',
                'co_ids': json.dumps([co.catalognumber for co in self.collectionobjects]),
                'isLoan': True
            }
        )
        returned_counts = json.loads(response.content.decode())
        self.assertEqual(returned_counts, [])

    def test_preps_available_interacted(self):

        expected_response = self._preps_available_interacted()

        response = self.client.post(
            f'/interactions/preparations_available_ids/',
            data={
                'id_fld': 'CatalogNumber',
                'co_ids': json.dumps([co.catalognumber for co in self.collectionobjects])
            }
        )

        returned_counts = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
    
        self.assertEqual(returned_counts, expected_response)

    def test_preps_available_interacted_isloan(self):
        
        expected_counts = self._preps_available_interacted()
        response = self.client.post(
            f'/interactions/preparations_available_ids/',
            data={
                'id_fld': 'CatalogNumber',
                'co_ids': json.dumps([co.catalognumber for co in self.collectionobjects]),
                'isLoan': True
            }
        )

        self.assertEqual(response.status_code, 200)

        returned_counts = json.loads(response.content.decode())
        self.assertEqual(returned_counts, [expected_counts[i] for i in range(1, 10, 2)])

    def test_preps_available_mixed_catalog_numbers(self):
        expected_response = self._preps_available_simple()

        # Loan out the first prep completely so it becomes unavailable.
        _create_interaction_prep_generic(
            self,
            self.loan,
            self._prep_list[0],
            None,
            quantity=5,
            quantityresolved=0,
            quantityreturned=0,
        )
        expected_response[0][7] = "5"
        expected_response[0][10] = "0"

        # A collection object with no preparations at all.
        models.Collectionobject.objects.create(
            collection=self.collection,
            catalognumber="no-preps-1",
            collectionobjecttype=self.collectionobjecttype,
        )

        response = self.client.post(
            f'/interactions/preparations_available_ids/',
            data={
                'id_fld': 'CatalogNumber',
                'co_ids': json.dumps(
                    [co.catalognumber for co in self.collectionobjects]
                    + ["no-preps-1", "does-not-exist-999"]
                ),
            }
        )

        self.assertEqual(response.status_code, 200)

        returned_counts = json.loads(response.content.decode())
        self.assertEqual(returned_counts, expected_response)
