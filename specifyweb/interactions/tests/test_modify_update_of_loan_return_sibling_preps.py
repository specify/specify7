from specifyweb.interactions.cog_preps import modify_update_of_loan_return_sibling_preps
from specifyweb.interactions.tests.test_cog_consolidated_prep_sibling_context import (
    TestCogConsolidatedPrepSiblingContext,
)
from specifyweb.specify.api import obj_to_data
from specifyweb.specify.models import Loan, Loanpreparation, Loanreturnpreparation


def _create_interaction_prep(
    context: "TestCogConsolidatedPrepSiblingContext",
    obj,
    prep,
    prep_list,
    **loan_prep_kwargs
):

    loan_prep_kwargs["discipline_id"] = context.collection.discipline.id

    lp = Loanpreparation.objects.create(
        preparation=prep,
        loan=obj,
        **loan_prep_kwargs,
    )
    if prep_list is not None:
        prep_list.append(lp)

    return lp


class TestModifyUpdateLoanReturnSiblingPreps(TestCogConsolidatedPrepSiblingContext):

    def setUp(self):
        super().setUp()
        self.loan = Loan.objects.create(discipline=self.discipline)

    def test_no_loanpreparation(self):
        # at the very least, code should handle cases of loan preparations being empty.

        loan_obj_data = obj_to_data(self.loan)
        new_data = modify_update_of_loan_return_sibling_preps(self.loan, loan_obj_data)
        self.assertEqual(new_data, loan_obj_data)

        del loan_obj_data["loanpreparations"]

        new_data = modify_update_of_loan_return_sibling_preps(self.loan, loan_obj_data)
        self.assertEqual(new_data, loan_obj_data)

    def test_no_op_loanpreparations(self):

        prep_list = []
        for num_prep, co in enumerate(self.collectionobjects, start=1):
            for _ in range(num_prep):
                prep = self._create_prep(co, prep_list, countamt=5)
                lp = _create_interaction_prep(
                    self, self.loan, prep, None, quantity=3, quantityresolved=0
                )
                Loanreturnpreparation.objects.create(
                    quantityresolved=1,
                    quantityreturned=1,
                    loanpreparation=lp,
                    discipline=self.collection.discipline,
                )

        loan_obj_data = obj_to_data(self.loan)
        new_data = modify_update_of_loan_return_sibling_preps(self.loan, loan_obj_data)
        self.assertEqual(new_data, loan_obj_data)

        # The code should also not do anything in the case where collection object does
        # not belong to consolidated COG. Test that.

        for co in self.collectionobjects:
            TestModifyUpdateLoanReturnSiblingPreps._link_co_cog(
                co, self.test_cog_discrete
            )

        new_data = modify_update_of_loan_return_sibling_preps(self.loan, loan_obj_data)
        self.assertEqual(
            new_data,
            loan_obj_data,
            "no-op condition failed when CO is not consolidated",
        )
