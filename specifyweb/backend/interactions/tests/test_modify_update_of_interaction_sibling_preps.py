from typing import Any, List
from collections.abc import Callable
from specifyweb.backend.interactions.cog_preps import modify_update_of_interaction_sibling_preps
from specifyweb.backend.interactions.tests.test_cog_consolidated_prep_sibling_context import (
    TestCogConsolidatedPrepSiblingContext,
)
from specifyweb.specify import api
from specifyweb.specify.api import obj_to_data
from specifyweb.specify.api_utils import strict_uri_to_model
from specifyweb.specify.models import (
    Borrow,
    Disposal,
    Disposalpreparation,
    Gift,
    Giftpreparation,
    Loan,
    Loanpreparation,
)
import copy

PrepGetter = Callable[["TestModifyUpdateInteractionSiblingPreps"], list[Any]]
PrepGetterFromPreps = Callable[[list[Any]], list[Any]]


# A wrap that makes it so that the data gets deep-copied.
def _wrap_function_copy(obj, data):
    old_data = copy.deepcopy(data)
    return modify_update_of_interaction_sibling_preps(obj, old_data)


mapping = {
    "loan": dict(model=Loanpreparation, attr="loanpreparations", backref="loan"),
    "gift": dict(model=Giftpreparation, attr="giftpreparations", backref="gift"),
    # below is skipped because the code cannot handle disposal
    # "disposal": dict(
    #     model=Disposalpreparation, attr="disposalpreparations", backref="disposal"
    # ),
}


def _create_interaction_prep(context, obj, prep, prep_list, **loan_prep_kwargs):
    mapped = mapping[obj._meta.model_name.lower()]
    loan_prep_kwargs[mapped["backref"]] = obj
    if obj._meta.model_name.lower() != "disposal":
        loan_prep_kwargs["discipline_id"] = context.collection.discipline.id
    else:
        del loan_prep_kwargs["quantityresolved"]

    lp = mapped["model"].objects.create(
        preparation=prep,
        **loan_prep_kwargs,
    )
    if prep_list is not None:
        prep_list.append(lp)


def _make_normal_interaction_preps(model_name: str):

    mapped = mapping[model_name.lower()]

    def test(self: "TestModifyUpdateInteractionSiblingPreps"):

        interaction_obj = getattr(self, model_name.lower())
        # This loan doesn't have any preparations that should be impacted by COG.
        preps = []
        for i in range(5):
            prep = self._create_prep(self.collectionobjects[0], None, countamt=2)
            _create_interaction_prep(
                self, interaction_obj, prep, preps, quantity=1, quantityresolved=0
            )
        data = obj_to_data(interaction_obj)
        self.assertEqual(_wrap_function_copy(interaction_obj, data), data)

        data_prep_limited = {**data, mapped["backref"]: mapped["backref"][:3]}

        self.assertEqual(
            _wrap_function_copy(interaction_obj, data_prep_limited),
            data_prep_limited,
        )

    return test


def _make_consolidated_preps_no_change(
    model_name: str,
    getter: PrepGetter,
):

    mapped = mapping[model_name.lower()]

    def test(self: "TestModifyUpdateInteractionSiblingPreps"):

        interaction_obj = getattr(self, model_name.lower())
        prep_list = getter(self)
        # prep_list = self._consolidated_cog_parent_simple()[0]
        for prep in prep_list[:3]:
            self._update(prep, {"countamt": 2})
            _create_interaction_prep(
                self, interaction_obj, prep, None, quantity=1, quantityresolved=0
            )

        data = obj_to_data(interaction_obj)
        new_data = _wrap_function_copy(interaction_obj, data)
        self.assertEqual(new_data, data, "No change test failed!")

    return test


def _make_consolidated_preps_removal(
    model_name: str, get_all_preps: PrepGetter, get_preps_to_remove: PrepGetter
):

    mapped = mapping[model_name.lower()]

    def test(self: "TestModifyUpdateInteractionSiblingPreps"):
        interaction_obj = getattr(self, model_name.lower())
        attr = mapped["attr"]
        prep_list = get_all_preps(self)
        for prep in prep_list:
            self._update(prep, {"countamt": 2})
            _create_interaction_prep(
                self, interaction_obj, prep, None, quantity=1, quantityresolved=0
            )

        orig_data = obj_to_data(interaction_obj)
        # remove a prep from orig_data
        data_prep_limited = {
            **orig_data,
            attr: get_preps_to_remove(orig_data[attr]),
        }

        # this should trigger removal of all the preps (they are part of the same branch)
        new_data = _wrap_function_copy(interaction_obj, data_prep_limited)
        self.assertEqual(new_data[attr], [])

        # Run the same test, but this time, add some unrelated loanpreps without a preparation.

        unrleated_preps = [
            {
                "preparation": None,
                "quantity": 1,
                "isresolved": True,
                "discipline": self.discipline_uri,
                "text1": "This prep should be preserved",
            },
            {
                "preparation": None,
                "quantity": 8,
                "isresolved": True,
                "discipline": self.discipline_uri,
                "text1": "This prep should be preserved too",
            },
        ]

        data_prep_unrelated = {
            **orig_data,
            attr: [
                *data_prep_limited[attr],
                *unrleated_preps,
            ],
        }

        new_data = _wrap_function_copy(interaction_obj, data_prep_unrelated)
        self.assertEqual(new_data[attr], unrleated_preps)

    return test


# This test is same as "_make_consolidated_preps_removal", but it was easier to write it as a separate test.
def _make_consolidated_preps_removal_branched(model_name):

    mapped = mapping[model_name.lower()]

    def test(self: "TestModifyUpdateInteractionSiblingPreps"):
        interaction_obj = getattr(self, model_name.lower())
        attr = mapped["attr"]
        branch_1_preps, branch_2_preps = self._consolidated_cog_parent_branched()

        branch_1_prep_ids = [prep.id for prep in branch_1_preps]
        branch_2_prep_ids = [prep.id for prep in branch_2_preps]

        for prep in [*branch_1_preps, *branch_2_preps]:
            self._update(prep, {"countamt": 2})
            _create_interaction_prep(
                self, interaction_obj, prep, None, quantity=1, quantityresolved=0
            )
        orig_data = obj_to_data(interaction_obj)
        new_preps = []

        did_remove = False
        branch_2_inter_preps = []
        for interaction_prep in orig_data[attr]:
            prep_id = strict_uri_to_model(
                interaction_prep["preparation"], "preparation"
            )[1]
            # Basically, remove all of the first branch's preps
            if prep_id in branch_2_prep_ids:
                branch_2_inter_preps.append(interaction_prep)
            if (prep_id in branch_1_prep_ids) and (not did_remove):
                did_remove = True
                continue
            new_preps.append(interaction_prep)

        data_prep_limited = {**orig_data, attr: new_preps}

        new_data = _wrap_function_copy(interaction_obj, data_prep_limited)
        self.assertCountEqual(new_data[attr], branch_2_inter_preps)

    return test


def _make_consolidated_prep_addition(
    model_name: str, get_all_preps: PrepGetter, get_preps_to_add: PrepGetter
):

    mapped = mapping[model_name.lower()]

    def test(self: "TestModifyUpdateInteractionSiblingPreps"):
        interaction_obj = getattr(self, model_name.lower())
        attr = mapped["attr"]
        prep_list = get_all_preps(self)
        for prep in prep_list[:3]:
            self._update(prep, {"countamt": 2})
            _create_interaction_prep(
                self, interaction_obj, prep, None, quantity=1, quantityresolved=0
            )

        orig_data = obj_to_data(interaction_obj)

        preps_to_add = get_preps_to_add(self)

        # add a prep to orig_data
        data_prep_extra = {
            **orig_data,
            attr: [
                *orig_data[attr],
                *[
                    {
                        "preparation": f"/api/specify/preparation/{prep_list[prep_to_add].id}/",
                        "quantity": 1,
                        "isresolved": True,
                        "discipline": self.discipline_uri,
                    }
                    for prep_to_add in preps_to_add
                ],
            ],
        }

        extra_preps = [
            {
                "preparation": f"/api/specify/preparation/{prep.id}/",
                "quantity": 1,
                "isresolved": True,
                "discipline": self.discipline_uri,
            }
            for prep in prep_list[3:]
        ]
        # this should trigger removal of all the preps (they are part of the same branch)
        new_data = _wrap_function_copy(interaction_obj, data_prep_extra)
        self.assertEqual(len(new_data[attr]), len(prep_list))
        self.assertCountEqual(new_data[attr][3:], extra_preps)

    return test


class TestModifyUpdateInteractionSiblingPreps(TestCogConsolidatedPrepSiblingContext):

    # FEAT: Make this part of regular test environment
    @property
    def discipline_uri(self):
        return f"/api/specify/discipline/{self.collection.discipline.id}/"

    def setUp(self):
        super().setUp()
        self.loan = Loan.objects.create(discipline_id=self.discipline.id)
        self.gift = Gift.objects.create(discipline_id=self.discipline.id)
        self.disposal = Disposal.objects.create()

    def test_interaction_preps_no_object(self):
        entry = dict(id=5, loanpreparations=[])
        data = _wrap_function_copy(None, entry)
        self.assertEqual(data, entry, "No object case failed!")

    def test_borrow_interaction_preps(self):
        borrow = Borrow.objects.create(collectionmemberid=self.collection.id)
        entry = dict(id=5, borrowpreparations=[])
        self.assertEqual(_wrap_function_copy(borrow, entry), entry)


def _simple_prep_getter(self: TestModifyUpdateInteractionSiblingPreps):
    return self._consolidated_cog_parent_simple()[0]


def _indirect_prep_getter(self: TestModifyUpdateInteractionSiblingPreps):
    return self._consolidated_cog_parent_indirect()[0]


def _branched_prep_getter(self: TestModifyUpdateInteractionSiblingPreps):
    branch_1_preps, branch_2_preps = self._consolidated_cog_parent_branched()
    return [*branch_1_preps[:2], *branch_2_preps[:2]]


def _branched_prep_getter_all(self: TestModifyUpdateInteractionSiblingPreps):
    branch_1_preps, branch_2_preps = self._consolidated_cog_parent_branched()
    return [*branch_1_preps, *branch_2_preps]


def _simple_prep_new_getter(self: TestModifyUpdateInteractionSiblingPreps):
    return [3]


def _indirect_prep_new_getter(self: TestModifyUpdateInteractionSiblingPreps):
    return [3, -1, -2]


def _branched_prep_new_getter(self: TestModifyUpdateInteractionSiblingPreps):
    return [3, -1, -2]


def _simple_preps_remover(preps: list[Any]):
    return preps[1:3]


def _indirect_preps_remover(preps: list[Any]):
    return preps[5:8]


# This is done by setattrs to avoid code duplication between interaction types.
# Also, makes adding tests less time consuming :)
for model_name in mapping:
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_normal_{model_name}_interaction_preps",
        _make_normal_interaction_preps(model_name),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_interaction_preps_no_change",
        _make_consolidated_preps_no_change(model_name, _simple_prep_getter),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_preps_simple_removal",
        _make_consolidated_preps_removal(
            model_name, _simple_prep_getter, _simple_preps_remover
        ),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_preps_indirect_removal",
        _make_consolidated_preps_removal(
            model_name, _indirect_prep_getter, _indirect_preps_remover
        ),
    )
    # setattr(
    #     TestModifyUpdateInteractionSiblingPreps,
    #     f"test_consolidated_{model_name}_preps_indirect_removal",
    #     _make_consolidated_preps_removal(
    #         model_name, _indirect_prep_getter, _indirect_preps_remover
    #     ),
    # )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_preps_simple_addition",
        _make_consolidated_prep_addition(
            model_name, _simple_prep_getter, _simple_prep_new_getter
        ),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_indirect_consolidated_{model_name}_interaction_preps_no_change",
        _make_consolidated_preps_no_change(model_name, _indirect_prep_getter),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_branched_consolidated_{model_name}_interaction_preps_no_change",
        _make_consolidated_preps_no_change(model_name, _branched_prep_getter),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_preps_indirect_addition",
        _make_consolidated_prep_addition(
            model_name, _indirect_prep_getter, _indirect_prep_new_getter
        ),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_preps_branched_addition",
        _make_consolidated_prep_addition(
            model_name, _branched_prep_getter_all, _branched_prep_new_getter
        ),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_preps_branced_removal",
        _make_consolidated_preps_removal_branched(model_name),
    )
