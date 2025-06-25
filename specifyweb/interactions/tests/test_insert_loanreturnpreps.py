
from specifyweb.interactions.tests.utils import _create_interaction_prep_generic
from specifyweb.interactions.views import insert_loanreturnpreps
from specifyweb.specify.models import Loan, Recordset, Loanreturnpreparation, Loanpreparation
from specifyweb.specify.tests.test_api import DefaultsSetup

from django.db import connection

class TestInsertLoanReturnPreps(DefaultsSetup):

    def setUp(self):
        super().setUp()
        self._create_prep_type() # need to call this to create preptype.
        self.loan_1 = Loan.objects.create(
            loannumber="test_1",
            discipline=self.discipline
        )
        self.loan_2 = Loan.objects.create(
            loannumber="test_2",
            discipline=self.discipline
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

        Loanpreparation.objects.all().delete()
        
        _create_interaction_prep_generic(self, self.loan_1, prep_1, self.loan_preps, quantity=3, quantityresolved=2)
        # this prep will not be included 
        _create_interaction_prep_generic(self, self.loan_1, prep_2, None, quantity=4, quantityresolved=4, isresolved=True)
        _create_interaction_prep_generic(self, self.loan_1, prep_2, self.loan_preps, quantity=2, quantityresolved=0)

        _create_interaction_prep_generic(self, self.loan_2, prep_3, self.loan_preps, quantity=4, quantityresolved=3)
        # this prep will not be included, even though isresolved is false
        _create_interaction_prep_generic(self, self.loan_2, prep_4, None, quantity=4, quantityresolved=4, isresolved=False)
        
    def test_record_set_insert(self):

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

        # There might be orphaned loan preps before.
        Loanreturnpreparation.objects.all().delete()

        cursor = connection.cursor()
        
        insert_loanreturnpreps(cursor, '2025-06-24', self.discipline.id, self.agent.id, self.agent.id, record_set_id=record_set.id)

        self.assertEqual(Loanreturnpreparation.objects.all().count(), 3)
        self.assertEqual(len(self.loan_preps), 3)

        for loan_prep in self.loan_preps:
            loan_return_prep = Loanreturnpreparation.objects.filter(loanpreparation_id=loan_prep.id).first()
            self.assertIsNotNone(loan_return_prep)
            self.assertEqual(loan_return_prep.quantityresolved, loan_prep.quantity-loan_prep.quantityresolved)
            self.assertEqual(loan_return_prep.quantityreturned, loan_prep.quantity-loan_prep.quantityresolved)

    def test_loan_no_insert(self):

        loan_nos = [self.loan_1.loannumber, self.loan_2.loannumber]

        # There might be orphaned loan preps before.
        Loanreturnpreparation.objects.all().delete()

        cursor = connection.cursor()
        
        insert_loanreturnpreps(cursor, '2025-06-24', self.discipline.id, self.agent.id, self.agent.id, loan_nos=loan_nos)

        self.assertEqual(Loanreturnpreparation.objects.all().count(), 3)
        self.assertEqual(len(self.loan_preps), 3)

        for loan_prep in self.loan_preps:
            loan_return_prep = Loanreturnpreparation.objects.filter(loanpreparation_id=loan_prep.id).first()
            self.assertIsNotNone(loan_return_prep)
            self.assertEqual(loan_return_prep.quantityresolved, loan_prep.quantity-loan_prep.quantityresolved)
            self.assertEqual(loan_return_prep.quantityreturned, loan_prep.quantity-loan_prep.quantityresolved)
        


        
