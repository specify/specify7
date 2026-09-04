from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException


class LoanPreparationTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.preptype = models.Preptype.objects.create(
            name='testPrepType',
            isloanable=True,
            collection=self.collection,
        )
        self.preparation = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[0],
            preptype=self.preptype,
            countamt=1,
        )
        self.loan_a = models.Loan.objects.create(
            loannumber='1',
            discipline=self.discipline)
        self.loan_b = models.Loan.objects.create(
            loannumber='2',
            discipline=self.discipline)

    def test_insert_cannot_exceed_availability(self):
        models.Loanpreparation.objects.create(
            loan=self.loan_a,
            discipline=self.discipline,
            preparation=self.preparation,
            quantity=1,
            quantityresolved=0)

        with self.assertRaises(BusinessRuleException):
            models.Loanpreparation.objects.create(
                loan=self.loan_b,
                discipline=self.discipline,
                preparation=self.preparation,
                quantity=1,
                quantityresolved=0)

    def test_insert_within_availability(self):
        self.preparation.countamt = 2
        self.preparation.save()

        models.Loanpreparation.objects.create(
            loan=self.loan_a,
            discipline=self.discipline,
            preparation=self.preparation,
            quantity=1,
            quantityresolved=0)

        models.Loanpreparation.objects.create(
            loan=self.loan_b,
            discipline=self.discipline,
            preparation=self.preparation,
            quantity=1,
            quantityresolved=0)

    def test_resolved_loan_frees_availability(self):
        models.Loanpreparation.objects.create(
            loan=self.loan_a,
            discipline=self.discipline,
            preparation=self.preparation,
            quantity=1,
            quantityresolved=1,
            isresolved=True)

        models.Loanpreparation.objects.create(
            loan=self.loan_b,
            discipline=self.discipline,
            preparation=self.preparation,
            quantity=1,
            quantityresolved=0)

    def test_null_quantityresolved_treated_as_zero(self):
        # A null Quantity Resolved must not crash the rule (#7665)...
        models.Loanpreparation.objects.create(
            loan=self.loan_a,
            discipline=self.discipline,
            preparation=self.preparation,
            quantity=1,
            quantityresolved=None)

        # ...and the loan still counts as fully unresolved.
        with self.assertRaises(BusinessRuleException):
            models.Loanpreparation.objects.create(
                loan=self.loan_b,
                discipline=self.discipline,
                preparation=self.preparation,
                quantity=1,
                quantityresolved=None)

    def test_update_cannot_exceed_availability(self):
        lp = models.Loanpreparation.objects.create(
            loan=self.loan_a,
            discipline=self.discipline,
            preparation=self.preparation,
            quantity=1,
            quantityresolved=0)

        lp.quantity = 2
        with self.assertRaises(BusinessRuleException):
            lp.save()
