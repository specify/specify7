from specifyweb.backend.interactions.cog_preps import get_cogs_from_co_ids
from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions
from specifyweb.backend.datamodel.models import Collectionobjectgroupjoin


class TestGetCogsCoIds(TestCogInteractions):

    def test_cogs_from_co_ids(self):

        TestGetCogsCoIds._link_co_cog(
            self.collectionobjects[0], self.test_cog_consolidated
        )
        TestGetCogsCoIds._link_co_cog(
            self.collectionobjects[1], self.test_cog_consolidated
        )
        TestGetCogsCoIds._link_co_cog(self.collectionobjects[2], self.test_cog_discrete)
        TestGetCogsCoIds._link_co_cog(self.collectionobjects[3], self.test_cog_discrete)

        cogs_found = get_cogs_from_co_ids([co.id for co in self.collectionobjects])
        # Previously, there used to be conversion into a set.
        # Below was done for more strictness.
        self.assertCountEqual(
            [cog.id for cog in cogs_found],
            [self.test_cog_consolidated.id, self.test_cog_discrete.id],
        )

    def test_cogs_from_co_ids_no_cogs(self):
        Collectionobjectgroupjoin.objects.all().delete()

        cogs_found = get_cogs_from_co_ids([co.id for co in self.collectionobjects])
        # Previously, there used to be conversion into a set.
        # Below was done for more strictness.
        self.assertEqual(
            [cog.id for cog in cogs_found],
            [],
        )
