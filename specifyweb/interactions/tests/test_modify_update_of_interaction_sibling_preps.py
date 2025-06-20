from specifyweb.interactions.cog_preps import modify_update_of_interaction_sibling_preps
from specifyweb.interactions.tests.test_cog_consolidated_prep_sibling_context import (
    TestCogConsolidatedPrepSiblingContext,
)
from specifyweb.specify.api import obj_to_data
from specifyweb.specify.models import (
    Borrow,
    Disposal,
    Disposalpreparation,
    Gift,
    Giftpreparation,
    Loan,
    Loanpreparation,
)

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


def _make_normal_interaction_preps(model_name):

    mapped = mapping[model_name.lower()]

    def test(self):

        interaction_obj = getattr(self, model_name.lower())
        # This loan doesn't have any preparations that should be impacted by COG.
        preps = []
        for i in range(5):
            prep = self._create_prep(self.collectionobjects[0], None, countamt=2)
            _create_interaction_prep(
                self, interaction_obj, prep, preps, quantity=1, quantityresolved=0
            )
        data = obj_to_data(interaction_obj)
        self.assertEqual(
            modify_update_of_interaction_sibling_preps(interaction_obj, data), data
        )

        data_prep_limited = {**data, mapped["backref"]: mapped["backref"][:3]}

        self.assertEqual(
            modify_update_of_interaction_sibling_preps(
                interaction_obj, data_prep_limited
            ),
            data_prep_limited,
        )

    return test


def _make_consolidated_preps_simple_no_change(model_name):

    mapped = mapping[model_name.lower()]

    def test(self):

        interaction_obj = getattr(self, model_name.lower())
        prep_list = self._consolidated_cog_parent_simple()[0]
        for prep in prep_list[:3]:
            self._update(prep, {"countamt": 2})
            _create_interaction_prep(
                self, interaction_obj, prep, None, quantity=1, quantityresolved=0
            )

        data = obj_to_data(interaction_obj)
        new_data = modify_update_of_interaction_sibling_preps(interaction_obj, data)
        self.assertEqual(new_data, data, "No change test failed!")

    return test


def _make_consolidated_preps_simple_prep_removal(model_name):

    mapped = mapping[model_name.lower()]

    def test(self):
        interaction_obj = getattr(self, model_name.lower())
        attr = mapped["attr"]
        prep_list = self._consolidated_cog_parent_simple()[0]
        for prep in prep_list[:3]:
            self._update(prep, {"countamt": 2})
            _create_interaction_prep(
                self, interaction_obj, prep, None, quantity=1, quantityresolved=0
            )

        orig_data = obj_to_data(interaction_obj)
        # remove a prep from orig_data
        data_prep_limited = {
            **orig_data,
            attr: orig_data[attr][1:3],
        }

        # this should trigger removal of all the preps (they are part of the same branch)
        new_data = modify_update_of_interaction_sibling_preps(
            interaction_obj, data_prep_limited
        )
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

        new_data = modify_update_of_interaction_sibling_preps(
            interaction_obj, data_prep_unrelated
        )
        self.assertEqual(new_data[attr], unrleated_preps)

    return test


def _make_consolidated_preps_simple_prep_addition(model_name):

    mapped = mapping[model_name.lower()]

    def test(self):
        interaction_obj = getattr(self, model_name.lower())
        attr = mapped["attr"]
        prep_list = self._consolidated_cog_parent_simple()[0]
        loan_preps = []
        for prep in prep_list[:3]:
            self._update(prep, {"countamt": 2})
            _create_interaction_prep(
                self, interaction_obj, prep, loan_preps, quantity=1, quantityresolved=0
            )

        orig_data = obj_to_data(interaction_obj)
        # add a prep to orig_data
        data_prep_extra = {
            **orig_data,
            attr: [
                *orig_data[attr],
                {
                    "preparation": f"/api/specify/preparation/{prep_list[3].id}/",
                    "quantity": 1,
                    "isresolved": True,
                    "discipline": self.discipline_uri,
                },
            ],
        }

        extra_preps = [
            {
                "preparation": f"/api/specify/preparation/{prep_list[3].id}/",
                "quantity": 1,
                "isresolved": True,
                "discipline": self.discipline_uri,
            },
            {
                "preparation": f"/api/specify/preparation/{prep_list[4].id}/",
                "quantity": 1,
                "isresolved": True,
                "discipline": self.discipline_uri,
            },
        ]
        # this should trigger removal of all the preps (they are part of the same branch)
        new_data = modify_update_of_interaction_sibling_preps(
            interaction_obj, data_prep_extra
        )
        self.assertEqual(len(new_data[attr]), len(prep_list))
        self.assertEqual(new_data[attr][3:], extra_preps)

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
        data = modify_update_of_interaction_sibling_preps(None, entry)
        self.assertEqual(data, entry, "No object case failed!")

    def test_borrow_interaction_preps(self):
        borrow = Borrow.objects.create(collectionmemberid=self.collection.id)
        entry = dict(id=5, borrowpreparations=[])
        self.assertEqual(
            modify_update_of_interaction_sibling_preps(borrow, entry), entry
        )


for model_name in mapping:
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_normal_{model_name}_interaction_preps",
        _make_normal_interaction_preps(model_name),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_normal_{model_name}_interaction_preps",
        _make_consolidated_preps_simple_no_change(model_name),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_preps_simple_prep_removal",
        _make_consolidated_preps_simple_prep_removal(model_name),
    )
    setattr(
        TestModifyUpdateInteractionSiblingPreps,
        f"test_consolidated_{model_name}_preps_simple_prep_addition",
        _make_consolidated_preps_simple_prep_addition(model_name),
    )
