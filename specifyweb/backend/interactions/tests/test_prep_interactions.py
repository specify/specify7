from specifyweb.backend.interactions.tests.test_preps_available_context import TestPrepsAvailableContext

import json

import time

class TestPrepInteractions(TestPrepsAvailableContext):
    
    def test_prep_interactions(self):
        
        interacted_preps = self._preps_available_interacted()

            # for iprep in self._iprep_list:
            #     print("Updating: ", iprep)
            #     self._update(iprep, {'isresolved': False})

        self._update(
            self.loan,
            dict(loannumber="loan-1")
        )

        self._update(
            self.gift,
            dict(giftnumber="gift-1")
        )

        self._update(
            self.exchangeout,
            dict(exchangeoutnumber="exchangeout-1")
        )

        response = self.client.post(
            f'/interactions/prep_interactions/',
            {"prepIds": ','.join([str(prep.id) for prep in self._prep_list])}
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            json.loads(response.content.decode()), 
            [[self._prep_list[0].id, f"{self.loan.id}>|<{self.loan.loannumber}", None, None]]
        )

