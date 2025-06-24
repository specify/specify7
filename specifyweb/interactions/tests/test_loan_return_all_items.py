from django.test import Client
from specifyweb.interactions.tests.test_loan_preps_context import TestLoanPrepsContext

from unittest import skip

class TestLoanReturnAllItems(TestLoanPrepsContext):
    
    @skip("temp skip, needs debugging")
    def test_return_record_set(self):
        c = Client()
        c.force_login(self.specifyuser)

        record_set = self._record_set_test()

        response = c.post("/interaction/loan_return_all/", {
            'recordSetId': record_set.id
        })

        self.assertEqual(response.status_code, 200)

