from specifyweb.interactions.tests.test_loan_preps_context import TestLoanPrepsContext
from specifyweb.interactions.views import insert_loanreturnpreps

from django.db import connection

from specifyweb.specify.models import Loanreturnpreparation

class TestInsertLoanReturnPreps(TestLoanPrepsContext):
        
    def test_record_set_insert(self):

        record_set = self._record_set_test()

        cursor = connection.cursor()
        
        insert_loanreturnpreps(cursor, '2025-06-24', self.discipline.id, self.agent.id, self.agent.id, record_set_id=record_set.id)

        self._perform_insert_loanreturnprep_check()

    def test_loan_no_insert(self):

        loan_nos = self._loan_no_test()

        # There might be orphaned loan preps before.
        Loanreturnpreparation.objects.all().delete()

        cursor = connection.cursor()
        
        insert_loanreturnpreps(cursor, '2025-06-24', self.discipline.id, self.agent.id, self.agent.id, loan_nos=loan_nos)

        self._perform_insert_loanreturnprep_check()

        


        
