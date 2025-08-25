from specifyweb.backend.datamodel.models import Loan, Loanpreparation
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.interactions.tests.utils import _create_interaction_prep_generic

class TestPreparationIsOnLoan(ApiTests):
    def setUp(self):
        super().setUp()
        self._create_prep_type()
        self.loan_1 = Loan.objects.create(
            loannumber="test_1",
            discipline=self.discipline,
            isclosed=False
        )


    def test_not_loan_simple(self):
        prep = self._create_prep(self.collectionobjects[0], None)
        self.assertFalse(prep.isonloan())

    def test_not_loan_isresolved_true(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=3)
        _create_interaction_prep_generic(self, self.loan_1, prep, None, quantity=3, quantityresolved=3, isresolved=True)
        self.assertFalse(prep.isonloan())

    def test_loan_isresolved_false(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=3)
        _create_interaction_prep_generic(self, self.loan_1, prep, None, quantity=3, quantityresolved=3, isresolved=True)
        _create_interaction_prep_generic(self, self.loan_1, prep, None, quantity=3, quantityresolved=2, isresolved=False)

        self.assertTrue(prep.isonloan())

    def test_loan_isresolved_false_coalesce(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=3)
        _create_interaction_prep_generic(self, self.loan_1, prep, None, quantity=3, quantityresolved=3, isresolved=True)
        loanprep  = _create_interaction_prep_generic(self, self.loan_1, prep, None, quantity=3, quantityresolved=2, isresolved=False)
        Loanpreparation.objects.filter(id=loanprep.id).update(
            quantity=2,
            quantityresolved=0
        )
        self.assertTrue(prep.isonloan())

    def test_not_loan_isresolved_negative(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=3)
        _create_interaction_prep_generic(self, self.loan_1, prep, None, quantity=3, quantityresolved=3, isresolved=True)
        loanprep  = _create_interaction_prep_generic(self, self.loan_1, prep, None, quantity=3, quantityresolved=2, isresolved=False)
        Loanpreparation.objects.filter(id=loanprep.id).update(
            quantity=2,
            # This will force the the expression to be negative
            quantityresolved=5
        )
        self.assertFalse(prep.isonloan())