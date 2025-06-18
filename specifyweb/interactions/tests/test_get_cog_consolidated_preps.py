from specifyweb.interactions.tests.test_cog_consolidated_prep_context import (
    TestCogConsolidatedPrepContext,
)
from specifyweb.interactions.cog_preps import get_cog_consolidated_preps
from specifyweb.specify.models import (
    Collectionobjectgroupjoin,
    Preparation,
)


class TestGetCogConsolidatedPreps(TestCogConsolidatedPrepContext):

    def test_no_preparations_on_none_consolidated(self):
        co_and_preps = self._no_preparation_on_none_consolidated()
        self.assertEqual(
            get_cog_consolidated_preps(self.test_cog_discrete), co_and_preps.preps
        )

    def test_immediate_co_children_preparations(self):
        # Move below in setup?
        Collectionobjectgroupjoin.objects.all().delete()
        Preparation.objects.all().delete()
        co_and_preps = self._immediate_co_children_preparations()
        consolidated_preps = get_cog_consolidated_preps(self.test_cog_consolidated)
        self._preps_match(consolidated_preps, co_and_preps.preps)

    def test_distant_co_preps_included(self):
        Collectionobjectgroupjoin.objects.all().delete()
        Preparation.objects.all().delete()

        co_and_preps = self._distant_co_preps_included()

        consolidated_preps = get_cog_consolidated_preps(self.test_cog_consolidated)

        self._preps_match(consolidated_preps, co_and_preps.preps)
