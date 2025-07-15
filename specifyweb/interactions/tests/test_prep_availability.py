from specifyweb.interactions.tests.test_preps_available_context import TestPrepsAvailableContext
import json

from specifyweb.interactions.tests.utils import _create_interaction_prep_generic
from unittest import skip


class TestPrepsAvailability(TestPrepsAvailableContext):
    
    def test_preps_availability_simple(self):

        self._preps_available_simple()

        for prep in self._prep_list:

            response = self.client.get(
                f'/interactions/prep_availability/{prep.id}/'
            )

            self.assertEqual(response.status_code, 200)

            self.assertEqual(json.loads(response.content), ["5"])

    def test_preps_availability_interacted(self):
        
        interacted_preps = self._preps_available_interacted()

        for prep, result in zip(self._prep_list, interacted_preps):
            response = self.client.get(
                f'/interactions/prep_availability/{prep.id}/'
            )

            self.assertEqual(response.status_code, 200)

            self.assertEqual(json.loads(response.content), [result[-1]])

    def test_preps_availability_interacted_ipreps(self):
        interacted_preps = self._preps_available_interacted()

        response = self.client.get(
            f'/interactions/prep_availability/{self._prep_list[0].id}/{self._iprep_list[0].id}/loanpreparation/'
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(json.loads(response.content), None)

    @skip("The code doesn't handle duplicated rows")
    def test_preps_availability_interacted_dup_multiple(self):
        
        prep = self._create_prep(self.collectionobjects[0], None, countamt=5)
        
        _create_interaction_prep_generic(self, self.loan, prep, None, quantity=2, quantityresolved=0)
        _create_interaction_prep_generic(self, self.gift, prep, None, quantity=1)
        _create_interaction_prep_generic(self, self.gift, prep, None, quantity=1)

        response = self.client.get(
            f'/interactions/prep_availability/{prep.id}/'
        )

        self.assertEqual(response.status_code, 200)
        
        self.assertEqual(json.loads(response.content.decode()), [1])