from specifyweb.backend.interactions.tests.test_loan_preps_context import TestLoanPrepsContext

from django.db import connection

from specifyweb.backend.interactions.views import resolve_loanpreps
from specifyweb.specify.models import Loanpreparation

class TestResolveLoanPreps(TestLoanPrepsContext):

    def test_record_set_resolve(self):

        record_set = self._record_set_test()

        cursor = connection.cursor()
        modified = resolve_loanpreps(cursor, self.agent.id, record_set_id=record_set.id)
        self.assertEqual(modified, 4)

        self._perform_resolve_check()

    def test_loan_no_resolve(self):

        loan_nos = self._loan_no_test()

        cursor = connection.cursor()
        modified = resolve_loanpreps(cursor, self.agent.id, loan_nos=loan_nos)
        self.assertEqual(modified, 4)

        self._perform_resolve_check()





