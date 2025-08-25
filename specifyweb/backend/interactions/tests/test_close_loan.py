from specifyweb.backend.interactions.tests.test_loan_preps_context import TestLoanPrepsContext
from specifyweb.backend.interactions.views import close_loan
from specifyweb.backend.datamodel.models import Loan

from django.db import connection

class TestCloseLoan(TestLoanPrepsContext):

    def _pre_checks(self):
        self.assertEqual(Loan.objects.all().count(), 2)
        self.assertEqual(Loan.objects.filter(isclosed=True).count(), 0)

    def test_close_record_set(self):
        self._pre_checks()

        record_set = self._record_set_test()
        cursor = connection.cursor()

        closed = close_loan(cursor, self.agent.id, '2025-06-24', record_set_id=record_set.id)
        self.assertEqual(closed, 2)

        self.assertEqual(Loan.objects.filter(isclosed=True).count(), 2)

    def test_close_loan_nos(self):
        self._pre_checks()

        loan_nos = self._loan_no_test()
        cursor = connection.cursor()

        closed = close_loan(cursor, self.agent.id, '2025-06-24', loan_nos=loan_nos)
        self.assertEqual(closed, 2)

        self.assertEqual(Loan.objects.filter(isclosed=True).count(), 2)