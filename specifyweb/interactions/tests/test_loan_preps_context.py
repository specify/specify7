from specifyweb.interactions.tests.utils import _create_interaction_prep_generic
from specifyweb.specify.models import Loan, Recordset, Loanreturnpreparation, Loanpreparation
from specifyweb.specify.tests.test_api import DefaultsSetup

class TestLoanPrepsContext(DefaultsSetup):

    def setUp(self):
        super().setUp()
        self._create_prep_type() # need to call this to create preptype.
        self.loan_1 = Loan.objects.create(
            loannumber="test_1",
            discipline=self.discipline,
            isclosed=False
        )
        self.loan_2 = Loan.objects.create(
            loannumber="test_2",
            discipline=self.discipline,
            isclosed=False
        )
        prep_1 = self._create_prep(
            self.collectionobjects[0],
            None,
            countamt=5
        )
        prep_2 = self._create_prep(
            self.collectionobjects[1],
            None,
            countamt=6
        )
        prep_3 = self._create_prep(
            self.collectionobjects[2],
            None,
            countamt=7
        )
        prep_4 = self._create_prep(
            self.collectionobjects[3],
            None,
            countamt=4
        )
        self.loan_preps = []
        self.all_loan_preps = []

        Loanpreparation.objects.all().delete()
        
        self.all_loan_preps.append(_create_interaction_prep_generic(self, self.loan_1, prep_1, self.loan_preps, quantity=3, quantityresolved=2, quantityreturned=2))
        # this prep will not be included 
        self.all_loan_preps.append(_create_interaction_prep_generic(self, self.loan_1, prep_2, None, quantity=4, quantityresolved=4, isresolved=True, quantityreturned=4))
        self.all_loan_preps.append(_create_interaction_prep_generic(self, self.loan_1, prep_2, self.loan_preps, quantity=2, quantityresolved=0, quantityreturned=0))

        self.all_loan_preps.append(_create_interaction_prep_generic(self, self.loan_2, prep_3, self.loan_preps, quantity=4, quantityresolved=3, quantityreturned=3))
        # this prep will not be included, even though isresolved is false
        self.all_loan_preps.append(_create_interaction_prep_generic(self, self.loan_2, prep_4, None, quantity=4, quantityresolved=4, isresolved=False, quantityreturned=4))
    
    def _record_set_test(self):
        record_set = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Loan.specify_model.tableId,
            name="Test Loan Recordset",
            type=0,
            specifyuser=self.specifyuser
        )
        record_set.recordsetitems.create(
            recordid=self.loan_1.id
        )
        record_set.recordsetitems.create(
            recordid=self.loan_2.id
        )
        return record_set
    
    def _loan_no_test(self):
        loan_nos = [self.loan_1.loannumber, self.loan_2.loannumber]
        return loan_nos
    
    def _perform_resolve_check(self):
        
        self.assertEqual(
            Loanpreparation.objects.filter(isresolved=True).count(),
            5
        )

        for loan_prep in self.all_loan_preps:
            if loan_prep.isresolved: # Ugh
                continue
            q_returned = loan_prep.quantityreturned + loan_prep.quantity - loan_prep.quantityresolved
            q_resolved = loan_prep.quantity
            version = loan_prep.version

            # Get the new object. This is done because these tests can run with _perform_insert_loanreturnprep_check
            # which assume cached objects haven't been sinced.
            loan_prep = Loanpreparation.objects.get(id=loan_prep.id)

            self.assertEqual(loan_prep.version, version + 1)
            self.assertEqual(loan_prep.quantityreturned, q_returned)
            self.assertEqual(loan_prep.quantityresolved, q_resolved)
    
    def _perform_insert_loanreturnprep_check(self, date=None):
        self.assertEqual(Loanreturnpreparation.objects.all().count(), 3)
        self.assertEqual(len(self.loan_preps), 3)

        for loan_prep in self.loan_preps:
            loan_return_prep = Loanreturnpreparation.objects.filter(loanpreparation_id=loan_prep.id).first()
            self.assertIsNotNone(loan_return_prep)
            self.assertEqual(loan_return_prep.quantityresolved, loan_prep.quantity-loan_prep.quantityresolved)
            self.assertEqual(loan_return_prep.quantityreturned, loan_prep.quantity-loan_prep.quantityresolved)
            if date:
                self.assertEqual(str(loan_return_prep.returneddate.date()), date)