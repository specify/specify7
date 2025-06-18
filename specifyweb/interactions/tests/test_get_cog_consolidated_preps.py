from specifyweb.interactions.tests.test_cog import TestCogInteractions
from specifyweb.specify.tests.test_api import DefaultsSetup
from specifyweb.interactions.cog_preps import get_cog_consolidated_preps
from specifyweb.specify.models import (
    Collectionobjectgroup,
    Collectionobjectgroupjoin,
    Preparation,
)


class TestGetCogConsolidatedPreps(TestCogInteractions):

    def test_no_preparations_on_none_consolidated(self):
        self.assertEqual(get_cog_consolidated_preps(self.test_cog_discrete), [])

    def test_immediate_co_children_preparations(self):
        Collectionobjectgroupjoin.objects.all().delete()

        preparations = []

        for num_preps, co in enumerate(self.collectionobjects, start=1):
            TestGetCogConsolidatedPreps._link_co_cog(co, self.test_cog_consolidated)
            for _prep in range(num_preps):
                self._create_prep(co, preparations)

        self.assertEqual(
            Collectionobjectgroupjoin.objects.all().count(), len(self.collectionobjects)
        )

        consolidated_preps = get_cog_consolidated_preps(self.test_cog_consolidated)

        self._preps_match(consolidated_preps, preparations)

    def test_distant_co_preps_included(self):
        Collectionobjectgroupjoin.objects.all().delete()
        Preparation.objects.all().delete()
        preparations = []
        TestGetCogConsolidatedPreps._link_cog_cog(
            self.test_cog_discrete, self.test_cog_consolidated
        )
        TestGetCogConsolidatedPreps._link_co_cog(
            self.collectionobjects[0], self.test_cog_discrete
        )
        TestGetCogConsolidatedPreps._link_co_cog(
            self.collectionobjects[1], self.test_cog_discrete
        )
        # Don't add these preps to make things simpler
        self._create_prep(self.collectionobjects[0], None)
        self._create_prep(self.collectionobjects[1], None)

        child_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        TestGetCogConsolidatedPreps._link_cog_cog(
            child_cog_consolidated, self.test_cog_consolidated
        )

        TestGetCogConsolidatedPreps._link_co_cog(
            self.collectionobjects[2], child_cog_consolidated
        )
        for _ in range(2):
            self._create_prep(self.collectionobjects[2], preparations)

        grandchild_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        TestGetCogConsolidatedPreps._link_cog_cog(
            grandchild_cog_consolidated, self.test_cog_discrete
        )
        TestGetCogConsolidatedPreps._link_co_cog(
            self.collectionobjects[3], grandchild_cog_consolidated
        )

        for _ in range(2):
            self._create_prep(self.collectionobjects[3], None)

        # This CO doesn't have any preparations
        TestGetCogConsolidatedPreps._link_co_cog(
            self.collectionobjects[4], self.test_cog_consolidated
        )

        great_grandchild_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        # This doesn't have any collection objects
        TestGetCogConsolidatedPreps._link_cog_cog(
            great_grandchild_cog_consolidated, self.test_cog_discrete
        )

        consolidated_preps = get_cog_consolidated_preps(self.test_cog_consolidated)

        self._preps_match(consolidated_preps, preparations)
