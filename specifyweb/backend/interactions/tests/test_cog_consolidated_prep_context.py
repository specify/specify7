from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions
from typing import List, NamedTuple, Any

from specifyweb.backend.datamodel.models import Collectionobjectgroup, Collectionobjectgroupjoin


class CoAndPreps(NamedTuple):
    # TODO: Stricten this?
    cos: list[Any] = []
    preps: list[Any] = []


# This sets up the enviornment for cog consolidated related tests.
# Most of the code gets reused when doing get_cog_consolidated_preps_co_ids and get_cog_consolidated_preps
class TestCogConsolidatedPrepContext(TestCogInteractions):

    def _no_preparation_on_none_consolidated(self) -> CoAndPreps:
        return CoAndPreps()

    def _immediate_co_children_preparations(self) -> CoAndPreps:
        preparations = []

        for num_preps, co in enumerate(self.collectionobjects, start=1):
            TestCogConsolidatedPrepContext._link_co_cog(co, self.test_cog_consolidated)
            for _prep in range(num_preps):
                self._create_prep(co, preparations)

        self.assertEqual(
            Collectionobjectgroupjoin.objects.all().count(),
            len(self.collectionobjects),
        )

        return CoAndPreps(list(self.collectionobjects), preparations)

    def _distant_co_preps_included(self) -> CoAndPreps:
        preparations = []
        TestCogConsolidatedPrepContext._link_cog_cog(
            self.test_cog_discrete, self.test_cog_consolidated
        )
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[0], self.test_cog_discrete
        )
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[1], self.test_cog_discrete
        )
        # Don't add these preps to make things simpler
        self._create_prep(self.collectionobjects[0], None)
        self._create_prep(self.collectionobjects[1], None)

        child_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        TestCogConsolidatedPrepContext._link_cog_cog(
            child_cog_consolidated, self.test_cog_consolidated
        )

        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[2], child_cog_consolidated
        )
        for _ in range(2):
            self._create_prep(self.collectionobjects[2], preparations)

        grandchild_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        TestCogConsolidatedPrepContext._link_cog_cog(
            grandchild_cog_consolidated, self.test_cog_discrete
        )
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[3], grandchild_cog_consolidated
        )

        for _ in range(2):
            self._create_prep(self.collectionobjects[3], None)

        # This CO doesn't have any preparations
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[4], self.test_cog_consolidated
        )

        great_grandchild_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        # This doesn't have any collection objects
        TestCogConsolidatedPrepContext._link_cog_cog(
            great_grandchild_cog_consolidated, self.test_cog_discrete
        )
        return CoAndPreps([self.collectionobjects[2]], preparations)
