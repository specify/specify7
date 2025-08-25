from specifyweb.backend.interactions.tests.test_preps_available_context import TestPrepsAvailableContext
from specifyweb.backend.datamodel.models import Collectionobject, Recordset


import json


class TestPrepsAvailableRs(TestPrepsAvailableContext):

    def setUp(self):
        super().setUp()
        self.record_set = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser
        )

        for co in self.collectionobjects:
            self.record_set.recordsetitems.create(recordid=co.id)


    def test_preps_available_simple(self):
        
        expected_response = self._preps_available_simple()

        response = self.client.post(
            f'/interactions/preparations_available_rs/{self.record_set.id}/'
        )

        self.assertEqual(response.status_code, 200)

        returned_counts = json.loads(response.content.decode())

        self.assertEqual(returned_counts, expected_response)
    
    def test_preps_available_simple_isloan(self):
        response = self.client.post(
            f'/interactions/preparations_available_rs/{self.record_set.id}/',
            data = {
                'isLoan': True
            }
        )
        returned_counts = json.loads(response.content.decode())
        self.assertEqual(returned_counts, [])


    def test_preps_available_interacted(self):

        expected_counts = self._preps_available_interacted()

        response = self.client.post(
            f'/interactions/preparations_available_rs/{self.record_set.id}/'
        )

        self.assertEqual(response.status_code, 200)

        returned_counts = json.loads(response.content.decode())
        self.assertEqual(returned_counts, expected_counts)

    def test_preps_available_interacted_isloan(self):
        
        expected_counts = self._preps_available_interacted()

        response = self.client.post(
            f'/interactions/preparations_available_rs/{self.record_set.id}/',
            data = {
                'isLoan': True
            }
        )

        self.assertEqual(response.status_code, 200)

        returned_counts = json.loads(response.content.decode())
        self.assertEqual(returned_counts, [expected_counts[i] for i in range(1, 10, 2)])
