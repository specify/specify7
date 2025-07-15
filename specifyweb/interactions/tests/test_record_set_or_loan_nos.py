# Technically DefaultsSetup is too much for this
from specifyweb.interactions.views import record_set_or_loan_nos
from specifyweb.specify.tests.test_api import DefaultsSetup


class TestRecordSetOrLoanNos(DefaultsSetup):
    
    def test_record_set_id(self):
        id_clause, id_params = record_set_or_loan_nos(10)
        self.assertEqual(id_clause, "select RecordId from recordsetitem where RecordSetId = %s")
        self.assertEqual(id_params, [10])

    def test_loan_nos_by_id_false(self):
        id_clause, id_params = record_set_or_loan_nos(loan_nos=[2, 3, 4], by_id=False)
        self.assertEqual(id_clause, "LoanNumber in (%s,%s,%s)")
        self.assertEqual(id_params, [2, 3, 4])

    def test_loan_nos_by_id_true(self):
        id_clause, id_params = record_set_or_loan_nos(loan_nos=[2, 3, 4], by_id=True)
        self.assertEqual(id_clause, "select LoanId from loan where LoanNumber in (%s,%s,%s)")
        self.assertEqual(id_params, [2, 3, 4])