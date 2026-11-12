from django.test import Client
from django.utils import timezone
from datetime import timedelta

from specifyweb.backend.interactions.tests.test_loan_preps_context import TestLoanPrepsContext

import json

from specifyweb.specify.models import Loan

class TestLoanReturnAllItems(TestLoanPrepsContext):
    

    def test_return_record_set(self):
        c = Client()
        c.force_login(self.specifyuser)

        record_set = self._record_set_test()

        response = c.post("/interactions/loan_return_all/", {
            'recordSetId': record_set.id,
            'returnedDate': '2025-06-20'
        })

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            json.loads(response.content.decode()),
            [4, 2]
        )

        self._perform_resolve_check()
        self._perform_insert_loanreturnprep_check('2025-06-20')
        self.assertEqual(Loan.objects.filter(isclosed=True).count(), 2)

    def test_return_loan_nos(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post("/interactions/loan_return_all/", {
            'loanNumbers': json.dumps(self._loan_no_test()),
            'returnedDate': '2025-06-20'
        })

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            json.loads(response.content.decode()),
            [4, 2]
        )

        self._perform_resolve_check()
        self._perform_insert_loanreturnprep_check('2025-06-20')
        self.assertEqual(Loan.objects.filter(isclosed=True).count(), 2)

    def test_return_loan_created_in_previous_version(self):
        old_timestamp = timezone.now() - timedelta(days=365)
        for loan in (self.loan_1, self.loan_2):
            loan.version = 1
            loan.save()
            Loan.objects.filter(id=loan.id).update(
                timestampcreated=old_timestamp
            )

        self.loan_1.refresh_from_db()
        self.assertEqual(self.loan_1.version, 1)
        self.assertEqual(self.loan_1.timestampcreated, old_timestamp)

        c = Client()
        c.force_login(self.specifyuser)

        response = c.post("/interactions/loan_return_all/", {
            'loanNumbers': json.dumps(self._loan_no_test()),
            'returnedDate': '2025-06-20'
        })

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            json.loads(response.content.decode()),
            [4, 2]
        )

        self.loan_1.refresh_from_db()
        self.assertGreater(self.loan_1.version, 1)
        self.assertTrue(self.loan_1.isclosed)
        self.assertIsNotNone(self.loan_1.dateclosed)

        self._perform_resolve_check()
        self._perform_insert_loanreturnprep_check('2025-06-20')
        self.assertEqual(Loan.objects.filter(isclosed=True).count(), 2)


