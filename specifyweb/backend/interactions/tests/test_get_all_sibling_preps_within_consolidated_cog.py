from specifyweb.backend.interactions.cog_preps import (
    get_all_sibling_preps_within_consolidated_cog,
)

from specifyweb.backend.interactions.tests.test_cog_consolidated_prep_sibling_context import (
    TestCogConsolidatedPrepSiblingContext,
)
from specifyweb.specify.models import (
    Collectionobjectgroupjoin,
    Preparation,
    Collectionobjectgroup,
)


class TestGetSiblingPrepsWithinConsolidatedCog(TestCogConsolidatedPrepSiblingContext):

    def setUp(self):
        super().setUp()
        Collectionobjectgroupjoin.objects.all().delete()
        Preparation.objects.all().delete()

    def test_none_preparation(self):
        self.assertEqual(get_all_sibling_preps_within_consolidated_cog(None), [])

    def test_discrete_cog_parent(self):
        prep_list = []
        for num_preps, co in enumerate(self.collectionobjects):
            self._create_prep(co, prep_list)
            TestGetSiblingPrepsWithinConsolidatedCog._link_co_cog(
                co, self.test_cog_discrete
            )
        for prep in prep_list:
            self.assertEqual(get_all_sibling_preps_within_consolidated_cog(prep), [])

    def test_consolidated_cog_parent_simple(self):

        prep_list = self._consolidated_cog_parent_simple()[0]

        for prep in prep_list:
            # It should always return the same list.
            self._preps_match(
                prep_list, get_all_sibling_preps_within_consolidated_cog(prep)
            )

    def test_consolidated_cog_parent_indirect(self):
        prep_list = self._consolidated_cog_parent_indirect()[0]

        for prep in prep_list:
            # It should always return the same list.
            self._preps_match(
                prep_list, get_all_sibling_preps_within_consolidated_cog(prep)
            )

    def test_consolidated_cog_parent_branched(self):

        branches = self._consolidated_cog_parent_branched()
        branch_1_prep_list = branches[0]
        branch_2_prep_list = branches[1]

        for prep in branch_2_prep_list:
            # It should always return the same list.
            self._preps_match(
                branch_2_prep_list, get_all_sibling_preps_within_consolidated_cog(prep)
            )

        for prep in branch_1_prep_list:
            # It should always return the same list.
            self._preps_match(
                branch_1_prep_list, get_all_sibling_preps_within_consolidated_cog(prep)
            )
