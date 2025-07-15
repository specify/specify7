from specifyweb.backend.interactions.cog_preps import enforce_interaction_sibling_prep_max_count
from specifyweb.backend.interactions.tests.test_cog_consolidated_prep_sibling_context import (
    TestCogConsolidatedPrepSiblingContext,
)
from specifyweb.specify.api import obj_to_data
from specifyweb.specify.models import Loan, Loanpreparation, Collectionobject


def _save_in_file(obj, name, ext=".py"):
    import os

    script_path = os.path.abspath(__file__)
    current_directory = os.path.dirname(script_path)

    with open(current_directory + "/" + name + ext, "w") as f:
        f.write(str(obj))


def _create_interaction_prep(
    context: "TestCogConsolidatedPrepSiblingContext",
    obj,
    prep,
    prep_list,
    **loan_prep_kwargs,
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


class TestEnforceInteractionSiblingPrepMaxCount(TestCogConsolidatedPrepSiblingContext):

    def setUp(self):
        super().setUp()
        self.loan = Loan.objects.create(discipline_id=self.discipline.id)

    def assertNoOp(self, msg):
        initial_data = obj_to_data(self.loan)
        enforce_interaction_sibling_prep_max_count(self.loan)
        new_data = obj_to_data(self.loan)
        self.assertEqual(initial_data, new_data, msg)

    def test_no_op_enforce(self):
        # Need to use obj_to_data in all these tests because the function
        # directly mutates the interaction object.

        self.assertNoOp("no-op no preparation case failed")

        # Now, we add some interactions, but these don't have siblings.
        for co in self.collectionobjects:
            prep = self._create_prep(co, None, countamt=6)
            lp = _create_interaction_prep(
                self, self.loan, prep, [], quantity=2, quantityresolved=0
            )

        self.assertNoOp("no-op no sibling case failed!")

    def _check_prep_not_in_interaction(self, preps):
        # In this case, the sibling preps are not in the interaction.

        lps = []
        for prep in preps:
            self._update(prep, dict(countamt=5))
            lp = _create_interaction_prep(
                self, self.loan, prep, lps, quantity=2, quantityresolved=0
            )

        enforce_interaction_sibling_prep_max_count(self.loan)

        for lp in lps:
            lp.refresh_from_db()
            self.assertEqual(lp.quantity, 5)

    def test_simple_sibling_prep_in_interaction(self):
        self._check_prep_not_in_interaction(self._consolidated_cog_parent_simple()[0])

    def test_indirect_sibling_prep_in_interaction(self):
        self._check_prep_not_in_interaction(self._consolidated_cog_parent_indirect()[0])

    def test_branched_sibling_prep_in_interaction(self):
        branch_1, branch_2 = self._consolidated_cog_parent_branched()
        self._check_prep_not_in_interaction([*branch_1, *branch_2])

    def test_simple_sibling_prep_not_in_interaction(self):
        prep_with_sibling = self._consolidated_cog_parent_simple()[0][0]
        self._update(prep_with_sibling, dict(countamt=5))

        preps_without_sibling = []
        lps = []
        _create_interaction_prep(
            self, self.loan, prep_with_sibling, lps, quantity=2, quantityresolved=0
        )

        cos = [
            Collectionobject.objects.create(collection=self.collection)
            for i in range(5)
        ]
        for co in cos:
            prep = self._create_prep(co, preps_without_sibling, countamt=6)
            _create_interaction_prep(
                self, self.loan, prep, lps, quantity=3, quantityresolved=0
            )

        enforce_interaction_sibling_prep_max_count(self.loan)

        for lp in lps:
            lp.refresh_from_db()

        # Here, only the first loanprep's quantity will change.
        self.assertEqual(lps[0].quantity, 5)

        for lp in lps[1:]:
            self.assertEqual(lp.quantity, 3)
