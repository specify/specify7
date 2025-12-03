from specifyweb.backend.interactions.cog_preps import modify_update_of_loan_return_sibling_preps
from specifyweb.backend.interactions.tests.test_cog_consolidated_prep_sibling_context import (
    TestCogConsolidatedPrepSiblingContext,
)
from specifyweb.specify.api.serializers import obj_to_data
from specifyweb.specify.models import Loan, Loanpreparation, Loanreturnpreparation
import copy


# Make this static function of main text context?
# Useful for dumping values, because diff is sometimes hard to see.
def _save_in_file(obj, name, ext=".py"):
    import os

    script_path = os.path.abspath(__file__)
    current_directory = os.path.dirname(script_path)

    with open(current_directory + "/" + name + ext, "w") as f:
        f.write(str(obj))


non_loan_prep_data = lambda _data: {
    key: value for (key, value) in _data.items() if key != "loanpreparations"
}

add_extras = lambda _data, _extras: {**_data, **_extras}


# The modify_update_of_loan_return_sibling_preps function modifies object in-place.
# this makes testing hard. So this is a wrapper that performs a deep-copy
# this way, original data is left untouched for test checks.
def _deep_copy_wrap(loan_obj, data):
    old_data = copy.deepcopy(data)
    return modify_update_of_loan_return_sibling_preps(loan_obj, old_data)


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


class TestModifyUpdateLoanReturnSiblingPreps(TestCogConsolidatedPrepSiblingContext):

    def setUp(self):
        super().setUp()
        self.loan = Loan.objects.create(discipline=self.discipline)

    def applyFuncCheck(self, attr: str, func, param1, param2):
        getattr(self, attr)(func(param1), func(param2))

    def test_no_loanpreparation(self):
        # at the very least, code should handle cases of loan preparations being empty.

        loan_obj_data = obj_to_data(self.loan)
        new_data = _deep_copy_wrap(self.loan, loan_obj_data)
        self.assertEqual(new_data, loan_obj_data)

        del loan_obj_data["loanpreparations"]

        new_data = _deep_copy_wrap(self.loan, loan_obj_data)
        self.assertEqual(new_data, loan_obj_data)

    def test_simple_loanpreparations(self):
        self.maxDiff = None

        prep_list = []
        for num_prep, co in list(enumerate(self.collectionobjects, start=1)):
            for _ in list(range(num_prep))[:1]:
                prep = self._create_prep(co, prep_list, countamt=5)
                lp = _create_interaction_prep(
                    self, self.loan, prep, None, quantity=3, quantityresolved=0
                )
                Loanreturnpreparation.objects.create(
                    quantityresolved=2,
                    quantityreturned=2,
                    loanpreparation=lp,
                    discipline=self.collection.discipline,
                )

        # because of the business rules, some changes are asynchronously applied...
        self.loan.refresh_from_db()

        loan_obj_data = obj_to_data(self.loan)
        new_data = _deep_copy_wrap(self.loan, loan_obj_data)

        self.applyFuncCheck("assertEqual", non_loan_prep_data, new_data, loan_obj_data)

        for old_loan_preps, new_loan_preps in zip(
            loan_obj_data["loanpreparations"], new_data["loanpreparations"]
        ):
            self.assertEqual(
                add_extras(
                    old_loan_preps, {"quantityresolved": 2, "quantityreturned": 2}
                ),
                new_loan_preps,
            )

        # # The code should also not do anything in the case where collection object does
        # # not belong to consolidated COG. Test that.

        for co in self.collectionobjects:
            TestModifyUpdateLoanReturnSiblingPreps._link_co_cog(
                co, self.test_cog_discrete
            )

        new_data = _deep_copy_wrap(self.loan, loan_obj_data)

        self.assertEqual(
            non_loan_prep_data(new_data), non_loan_prep_data(loan_obj_data)
        )

        for old_loan_preps, new_loan_preps in zip(
            loan_obj_data["loanpreparations"], new_data["loanpreparations"]
        ):
            self.assertEqual(
                add_extras(
                    old_loan_preps, {"quantityresolved": 2, "quantityreturned": 2}
                ),
                new_loan_preps,
            )

    def test_no_op_loanpreparation_no_siblings(self):

        # In this case, the preparation doesn't have any siblings, even though CO is consolidated.
        # That'll only happen if it is a single preparation, though. So, not sure how useful this test is.

        for co in self.collectionobjects:
            TestModifyUpdateLoanReturnSiblingPreps._link_co_cog(
                co, self.test_cog_consolidated
            )

        co = self.collectionobjects[0]

        prep = self._create_prep(co, None, countamt=5)
        lp = _create_interaction_prep(
            self, self.loan, prep, None, quantity=3, quantityresolved=0
        )

        loan_obj_data = obj_to_data(self.loan)

        lrps = loan_obj_data["loanpreparations"][0]["loanreturnpreparations"]

        assert lrps == []

        lrps.append(
            {
                "quantityreturned": 1,
                "quantityresolved": 1,
                "discipline": self.discipline_uri,
                "loanpreparation": f"/api/specify/loanpreparation/{lp.id}/",
                "_tableName": "LoanReturnPreparation",
            }
        )

        assert len(loan_obj_data["loanpreparations"][0]["loanreturnpreparations"]) == 1

        new_data = _deep_copy_wrap(self.loan, loan_obj_data)

        self.applyFuncCheck("assertEqual", non_loan_prep_data, new_data, loan_obj_data)

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][0],
                {
                    "quantityresolved": 3,
                    "quantityreturned": 3,
                    "isresolved": True,
                    "loanreturnpreparations": [
                        add_extras(
                            loan_obj_data["loanpreparations"][0][
                                "loanreturnpreparations"
                            ][0],
                            {
                                "quantityreturned": 3,
                                "quantityresolved": 3,
                            },
                        )
                    ],
                },
            ),
            new_data["loanpreparations"][0],
        )

        self.applyFuncCheck(
            "assertEqual",
            len,
            new_data["loanpreparations"],
            loan_obj_data["loanpreparations"],
        )

        self.assertEqual(
            len(new_data["loanpreparations"][0]["loanreturnpreparations"]), 1
        )

    def test_addition_simple_loanpreparation_siblings(self):

        for co in self.collectionobjects:
            TestModifyUpdateLoanReturnSiblingPreps._link_co_cog(
                co, self.test_cog_consolidated
            )

        preps = []

        self._create_prep(self.collectionobjects[0], preps, countamt=5)
        self._create_prep(self.collectionobjects[0], preps, countamt=6)

        lps = []

        _create_interaction_prep(
            self, self.loan, preps[0], lps, quantity=3, quantityresolved=0
        )
        _create_interaction_prep(
            self, self.loan, preps[1], lps, quantity=4, quantityresolved=0
        )

        loan_obj_data = obj_to_data(self.loan)

        lrps = loan_obj_data["loanpreparations"][0]["loanreturnpreparations"]

        lrps.append(
            {
                "quantityreturned": 1,
                "quantityresolved": 1,
                "discipline": self.discipline_uri,
                "loanpreparation": f"/api/specify/loanpreparation/{lps[0].id}/",
                "_tableName": "LoanReturnPreparation",
            }
        )

        new_data = _deep_copy_wrap(self.loan, loan_obj_data)

        self.applyFuncCheck("assertEqual", non_loan_prep_data, new_data, loan_obj_data)

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][0],
                {
                    "quantityresolved": 3,
                    "quantityreturned": 3,
                    "isresolved": True,
                    "loanreturnpreparations": [
                        add_extras(
                            loan_obj_data["loanpreparations"][0][
                                "loanreturnpreparations"
                            ][0],
                            {
                                "quantityresolved": 3,
                                "quantityreturned": 3,
                            },
                        )
                    ],
                },
            ),
            new_data["loanpreparations"][0],
        )

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][1],
                {
                    "quantityresolved": 4,
                    "quantityreturned": 4,
                    "isresolved": True,
                    "loanreturnpreparations": [
                        {
                            "quantityreturned": 4,
                            "quantityresolved": 4,
                            "discipline": self.discipline_uri,
                            "loanpreparation": f"/api/specify/loanpreparation/{loan_obj_data['loanpreparations'][1]['id']}/",
                            "remarks": "",
                            "receivedby": None,
                            "returneddate": None,
                            "_tableName": "LoanReturnPreparation",
                        }
                    ],
                },
            ),
            new_data["loanpreparations"][1],
        )

    def test_addition_indirect_loanpreparation_siblings(self):
        preps = self._consolidated_cog_parent_indirect()[0]

        for prep in preps:
            self._update(prep, {"countamt": 5})

        lps = []
        _create_interaction_prep(
            self, self.loan, preps[0], lps, quantity=2, quantityresolved=0
        )
        _create_interaction_prep(
            self, self.loan, preps[2], lps, quantity=3, quantityresolved=0
        )
        _create_interaction_prep(
            self, self.loan, preps[-1], lps, quantity=4, quantityresolved=0
        )

        loan_obj_data = obj_to_data(self.loan)

        loan_obj_data["loanpreparations"][1]["loanreturnpreparations"].append(
            {
                "quantityreturned": 1,
                "quantityresolved": 1,
                "discipline": self.discipline_uri,
                "loanpreparation": f"/api/specify/loanpreparation/{lps[1].id}/",
                "_tableName": "LoanReturnPreparation",
            }
        )

        new_data = _deep_copy_wrap(self.loan, loan_obj_data)

        self.applyFuncCheck("assertEqual", non_loan_prep_data, new_data, loan_obj_data)

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][0],
                {
                    "isresolved": True,
                    "quantityresolved": 2,
                    "quantityreturned": 2,
                    "loanreturnpreparations": [
                        {
                            "quantityreturned": 2,
                            "quantityresolved": 2,
                            "discipline": self.discipline_uri,
                            "loanpreparation": f"/api/specify/loanpreparation/{loan_obj_data['loanpreparations'][0]['id']}/",
                            "remarks": "",
                            "receivedby": None,
                            "returneddate": None,
                            "_tableName": "LoanReturnPreparation",
                        }
                    ],
                },
            ),
            new_data["loanpreparations"][0],
        )

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][1],
                {
                    "isresolved": True,
                    "quantityresolved": 3,
                    "quantityreturned": 3,
                    "loanreturnpreparations": [
                        add_extras(
                            loan_obj_data["loanpreparations"][1][
                                "loanreturnpreparations"
                            ][0],
                            {
                                "quantityresolved": 3,
                                "quantityreturned": 3,
                            },
                        )
                    ],
                },
            ),
            new_data["loanpreparations"][1],
        )

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][2],
                {
                    "isresolved": True,
                    "quantityresolved": 4,
                    "quantityreturned": 4,
                    "loanreturnpreparations": [
                        {
                            "quantityreturned": 4,
                            "quantityresolved": 4,
                            "discipline": self.discipline_uri,
                            "loanpreparation": f"/api/specify/loanpreparation/{loan_obj_data['loanpreparations'][2]['id']}/",
                            "remarks": "",
                            "receivedby": None,
                            "returneddate": None,
                            "_tableName": "LoanReturnPreparation",
                        }
                    ],
                },
            ),
            new_data["loanpreparations"][2],
        )

        self.applyFuncCheck(
            "assertEqual",
            len,
            new_data["loanpreparations"],
            loan_obj_data["loanpreparations"],
        )

    def test_addition_branched_loanpreparation_siblings(self):
        branch_1_preps, branch_2_preps = self._consolidated_cog_parent_branched()

        for prep in [*branch_1_preps, *branch_2_preps]:
            self._update(prep, {"countamt": 5})

        lps = []
        _create_interaction_prep(
            self, self.loan, branch_1_preps[0], lps, quantity=2, quantityresolved=0
        )
        _create_interaction_prep(
            self, self.loan, branch_2_preps[0], lps, quantity=3, quantityresolved=0
        )
        _create_interaction_prep(
            self, self.loan, branch_2_preps[1], lps, quantity=4, quantityresolved=0
        )

        loan_obj_data = obj_to_data(self.loan)

        loan_obj_data["loanpreparations"][1]["loanreturnpreparations"].append(
            {
                "quantityreturned": 1,
                "quantityresolved": 1,
                "discipline": self.discipline_uri,
                "loanpreparation": f"/api/specify/loanpreparation/{lps[1].id}/",
                "_tableName": "LoanReturnPreparation",
            }
        )

        new_data = _deep_copy_wrap(self.loan, loan_obj_data)

        self.applyFuncCheck("assertEqual", non_loan_prep_data, new_data, loan_obj_data)

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][0],
                {
                    "quantityreturned": 0,
                },
            ),
            new_data["loanpreparations"][0],
        )

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][1],
                {
                    "isresolved": True,
                    "quantityresolved": 3,
                    "quantityreturned": 3,
                    "loanreturnpreparations": [
                        add_extras(
                            loan_obj_data["loanpreparations"][1][
                                "loanreturnpreparations"
                            ][0],
                            {
                                "quantityresolved": 3,
                                "quantityreturned": 3,
                            },
                        )
                    ],
                },
            ),
            new_data["loanpreparations"][1],
        )

        self.assertEqual(
            add_extras(
                loan_obj_data["loanpreparations"][2],
                {
                    "isresolved": True,
                    "quantityresolved": 4,
                    "quantityreturned": 4,
                    "loanreturnpreparations": [
                        {
                            "quantityreturned": 4,
                            "quantityresolved": 4,
                            "discipline": self.discipline_uri,
                            "loanpreparation": f"/api/specify/loanpreparation/{loan_obj_data['loanpreparations'][2]['id']}/",
                            "remarks": "",
                            "receivedby": None,
                            "returneddate": None,
                            "_tableName": "LoanReturnPreparation",
                        }
                    ],
                },
            ),
            new_data["loanpreparations"][2],
        )
