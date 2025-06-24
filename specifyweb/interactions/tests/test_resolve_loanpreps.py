from specifyweb.interactions.tests.test_loan_preps_context import TestLoanPrepsContext

from django.db import connection

from specifyweb.interactions.views import resolve_loanpreps
from specifyweb.specify.models import Loanpreparation

class TestResolveLoanPreps(TestLoanPrepsContext):
    

    def _perform_check(self):
        for loan_prep in self.all_loan_preps:
            if loan_prep.isresolved: # Ugh
                continue
            q_returned = loan_prep.quantityreturned + loan_prep.quantity - loan_prep.quantityresolved
            q_resolved = loan_prep.quantity
            version = loan_prep.version

            # Sync the object.
            loan_prep.refresh_from_db()

            self.assertEqual(loan_prep.version, version + 1)
            self.assertEqual(loan_prep.quantityreturned, q_returned)
            self.assertEqual(loan_prep.quantityresolved, q_resolved)

    def test_record_set_resolve(self):

        record_set = self._record_set_test()

        cursor = connection.cursor()
        modified = resolve_loanpreps(cursor, self.agent.id, record_set_id=record_set.id)
        self.assertEqual(modified, 4)

        self.assertEqual(
            Loanpreparation.objects.filter(isresolved=True).count(),
            5
        )

        self._perform_check()

    def test_loan_no_resolve(self):

        loan_nos = self._loan_no_test()

        cursor = connection.cursor()
        modified = resolve_loanpreps(cursor, self.agent.id, loan_nos=loan_nos)
        self.assertEqual(modified, 4)

        self.assertEqual(
            Loanpreparation.objects.filter(isresolved=True).count(),
            5
        )

        self._perform_check()





