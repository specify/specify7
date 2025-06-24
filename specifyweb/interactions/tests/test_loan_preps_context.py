
from specifyweb.interactions.tests.utils import _create_interaction_prep_generic
from specifyweb.specify.models import Loan, Recordset, Loanreturnpreparation, Loanpreparation
from specifyweb.specify.tests.test_api import DefaultsSetup

class TestLoanPrepsContext(DefaultsSetup):

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