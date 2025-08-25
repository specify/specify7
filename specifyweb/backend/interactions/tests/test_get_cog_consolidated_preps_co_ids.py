from specifyweb.backend.interactions.cog_preps import get_cog_consolidated_preps_co_ids
from specifyweb.backend.interactions.tests.test_cog_consolidated_prep_context import (
    TestCogConsolidatedPrepContext,
    CoAndPreps,
)
from specifyweb.backend.datamodel.models import Collectionobjectgroupjoin, Preparation


class TestGetCogConsolidatedPrepsCoIds(TestCogConsolidatedPrepContext):

    @staticmethod
    def _get_co_ids(co_and_preps: CoAndPreps):
        return {co.id for co in co_and_preps.cos}

    def test_co_ids_preparations_on_none_consolidated(self):
        co_and_preps = self._no_preparation_on_none_consolidated()
        self.assertEqual(
            get_cog_consolidated_preps_co_ids(self.test_cog_discrete),
            set(co_and_preps.cos),
        )

    def test_co_ids_immediate_co_children_preparations(self):
        Collectionobjectgroupjoin.objects.all().delete()
        Preparation.objects.all().delete()
        co_and_preps = self._immediate_co_children_preparations()
        self.assertEqual(
            get_cog_consolidated_preps_co_ids(self.test_cog_consolidated),
            TestGetCogConsolidatedPrepsCoIds._get_co_ids(co_and_preps),
        )

    def test_co_ids_distant_co_preps_included(self):
        Collectionobjectgroupjoin.objects.all().delete()
        Preparation.objects.all().delete()

        co_and_preps = self._distant_co_preps_included()
        self.assertEqual(
            get_cog_consolidated_preps_co_ids(self.test_cog_consolidated),
            TestGetCogConsolidatedPrepsCoIds._get_co_ids(co_and_preps),
        )
