from specifyweb.interactions.cog_preps import modify_prep_update_based_on_sibling_preps
from specifyweb.interactions.tests.test_cog_consolidated_prep_sibling_context import (
    TestCogConsolidatedPrepSiblingContext,
)
from specifyweb.specify.models import Collectionobject


class TestModifyPrepUpdateBasedOnSiblingPreps(TestCogConsolidatedPrepSiblingContext):
    def test_modify_consolidated_cog_parent_simple(self):
        prep_list = self._consolidated_cog_parent_simple()[0]

        new_co = Collectionobject.objects.create(collection=self.collection)
        created_prep = self._create_prep(new_co, None)

        original_prep_ids = {prep.id for prep in prep_list}
        new_prep_id = set([*list(original_prep_ids), created_prep.id])

        self.assertEqual(
            modify_prep_update_based_on_sibling_preps(original_prep_ids, new_prep_id),
            new_prep_id,
            "The new prep created does not exist!",
        )

        self.assertEqual(
            modify_prep_update_based_on_sibling_preps(new_prep_id, original_prep_ids),
            original_prep_ids,
            "The removed prep created still exists!",
        )

        self.assertEqual(
            modify_prep_update_based_on_sibling_preps(new_prep_id, set()),
            set(),
            "The empty modified prep still has preps!",
        )

    def test_modify_consolidated_cog_parent_distant_preps(self):
        prep_list = self._consolidated_cog_parent_indirect()[0]

        orig_preps = {prep.id for prep in prep_list}
        # There are a lot of preps, so this truncates the list a bit.
        for prep in prep_list[:5]:
            self.assertEqual(
                modify_prep_update_based_on_sibling_preps({prep.id}, set()),
                set(),
                "The empty modified prep still has preps!",
            )
            self.assertEqual(
                modify_prep_update_based_on_sibling_preps({prep.id}, orig_preps),
                orig_preps,
                "The returned set does not match originals siblings!",
            )

        max_reach = 8
        for start in range(0, min(len(orig_preps), max_reach), 3):
            prep_set = {prep.id for prep in prep_list[::-1][start : start + 3]}
            if len(prep_list) == 0:
                break
            self.assertEqual(
                modify_prep_update_based_on_sibling_preps(prep_set, orig_preps),
                orig_preps,
                "The returned set does not match originals siblings!",
            )
            self.assertEqual(
                modify_prep_update_based_on_sibling_preps(prep_set, prep_set),
                prep_set,
                "The returned set does not match self!",
            )

    def test_modify_consolidated_cog_parent_branched_preps(self):
        branch_1_preps, branch_2_preps = self._consolidated_cog_parent_branched()
        self.assertEqual(
            modify_prep_update_based_on_sibling_preps(
                {branch_1_preps[0].id, branch_2_preps[0].id}, {branch_1_preps[1].id}
            ),
            {prep.id for prep in branch_1_preps},
            "Addition follows removal, so set should still have all preps for branch 1",
        )

        self.assertEqual(
            modify_prep_update_based_on_sibling_preps(
                {branch_1_preps[0].id, branch_2_preps[0].id},
                {branch_1_preps[0].id, branch_2_preps[0].id},
            ),
            {branch_1_preps[0].id, branch_2_preps[0].id},
            "The returned set does not match self!",
        )

        self.assertEqual(
            modify_prep_update_based_on_sibling_preps(
                {branch_1_preps[0].id} | {prep.id for prep in branch_2_preps},
                {branch_1_preps[0].id},
            ),
            {branch_1_preps[0].id},
            "The returned set should not have preps from branch 2",
        )

        self.assertEqual(
            modify_prep_update_based_on_sibling_preps(
                {branch_1_preps[0].id} | {prep.id for prep in branch_2_preps},
                # Here, the preps from the second branch will still be removed.
                # But, all the preps from the first branch will be added.
                {branch_1_preps[0].id, branch_1_preps[1].id, branch_2_preps[0].id},
            ),
            {prep.id for prep in branch_1_preps},
            "The preps from second branch didn't get removed or preps from first branch didn't get added",
        )
