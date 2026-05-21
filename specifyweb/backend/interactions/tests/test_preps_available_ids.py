from specifyweb.backend.interactions.tests.test_preps_available_context import TestPrepsAvailableContext

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
